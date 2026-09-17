describe('OTP Login Gate', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('shows the email step and blocks the dashboard when signed out', () => {
    cy.contains('ShipStation Partner API Demo').should('be.visible');
    cy.get('input[type="email"]').should('be.visible');
    cy.contains('SALES DEMO').should('not.exist');
  });

  it('rejects an email outside the allow-list', () => {
    cy.intercept('POST', '**/api/auth/request-code', {
      statusCode: 403,
      body: { error: 'Access is restricted to ShipStation team emails.' },
    }).as('requestCode');

    cy.get('input[type="email"]').type('outsider@example.com');
    cy.contains('button', 'Send code').click();

    cy.wait('@requestCode');
    cy.contains('Access is restricted to ShipStation team emails.').should('be.visible');
  });

  it('sends a code, verifies it, and unlocks the dashboard', () => {
    cy.intercept('POST', '**/api/auth/request-code', {
      statusCode: 200,
      body: { session: 'mock-session-token' },
    }).as('requestCode');

    cy.intercept('POST', '**/api/auth/verify-code', {
      statusCode: 200,
      body: {
        idToken: 'mock-id-token',
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 3600,
        email: 'demo@shipstation.com',
      },
    }).as('verifyCode');

    cy.intercept('GET', '**/api/accounts', { statusCode: 200, body: { accounts: [] } }).as('listAccounts');

    cy.get('input[type="email"]').type('demo@shipstation.com');
    cy.contains('button', 'Send code').click();
    cy.wait('@requestCode');

    cy.contains('Enter the code sent to demo@shipstation.com').should('be.visible');
    cy.get('input[inputmode="numeric"]').type('123456');
    cy.contains('button', 'Verify code').click();
    cy.wait('@verifyCode');

    cy.contains('SALES DEMO').should('be.visible');
  });

  it('shows an error and lets the user retry on an incorrect code', () => {
    cy.intercept('POST', '**/api/auth/request-code', {
      statusCode: 200,
      body: { session: 'mock-session-token' },
    }).as('requestCode');

    cy.intercept('POST', '**/api/auth/verify-code', {
      statusCode: 400,
      body: { error: 'Incorrect code. Please try again.' },
    }).as('verifyCode');

    cy.get('input[type="email"]').type('demo@shipstation.com');
    cy.contains('button', 'Send code').click();
    cy.wait('@requestCode');

    cy.get('input[inputmode="numeric"]').type('000000');
    cy.contains('button', 'Verify code').click();
    cy.wait('@verifyCode');

    cy.contains('Incorrect code. Please try again.').should('be.visible');
  });
});
