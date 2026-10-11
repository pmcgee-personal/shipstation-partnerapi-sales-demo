describe('Create Account Flow', () => {
  beforeEach(() => {
    cy.visitAuthenticated('/');

    cy.intercept('GET', '**/api/accounts', {
      statusCode: 200,
      body: { accounts: [] },
    }).as('listAccounts');

    cy.wait('@listAccounts');
  });

  it('should show a country dropdown when New is clicked', () => {
    cy.contains('button', 'New').click();

    cy.contains('Select Country').should('be.visible');
    cy.contains('United States (US)').should('be.visible');
    cy.contains('Canada (CA)').should('be.visible');
  });

  it('should close the dropdown without creating an account on outside click', () => {
    cy.contains('button', 'New').click();
    cy.contains('United States (US)').should('be.visible');

    cy.get('body').click(0, 0);

    cy.contains('United States (US)').should('not.exist');
  });

  it('should create an account with the selected country', () => {
    cy.intercept('POST', '**/api/accounts', (req) => {
      expect(req.body.countryCode).to.eq('CA');
      expect(req.body.label).to.be.a('string').and.not.be.empty;
      expect(req.body.email).to.be.a('string').and.not.be.empty;
      req.reply({
        statusCode: 201,
        body: {
          account_id: 'new-account-123',
          label: req.body.label,
          email: req.body.email,
          country_code: 'CA',
        },
      });
    }).as('createAccount');

    cy.intercept('GET', '**/api/accounts', {
      statusCode: 200,
      body: {
        accounts: [
          { account_id: 'new-account-123', label: 'My New Account', email: 'newaccount@example.com' },
        ],
      },
    }).as('listAccountsAfterCreate');

    cy.contains('button', 'New').click();
    cy.contains('Canada (CA)').click();

    cy.wait('@createAccount');
    cy.wait('@listAccountsAfterCreate');

    // New account should appear in the accounts list
    cy.contains('My New Account').should('be.visible');
  });

  it('should display error on API failure', () => {
    cy.intercept('POST', '**/api/accounts', {
      statusCode: 400,
      body: { error: 'Unsupported country code' },
    }).as('createAccountError');

    cy.contains('button', 'New').click();
    cy.contains('United States (US)').click();

    cy.wait('@createAccountError');

    // Error should be displayed
    cy.contains('Creation failed').should('be.visible');
  });
});
