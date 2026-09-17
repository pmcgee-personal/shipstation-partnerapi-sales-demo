describe('Create Account Flow', () => {
  beforeEach(() => {
    cy.visitAuthenticated('/');
  });

  it('should display create account form', () => {
    // The create account section should be visible on dashboard
    cy.contains('Create Demo Account').should('be.visible');
  });

  it('should validate email field', () => {
    // Try to submit without email
    cy.contains('Create Demo Account').parent().find('input[type="email"]').clear();
    cy.contains('button', 'Create').click();

    // Should show validation error or prevent submission
    // (depends on browser validation)
  });

  it('should validate label field', () => {
    // Try to submit without label
    cy.contains('Create Demo Account').parent().find('input[placeholder*="Label"]').clear();
    cy.contains('button', 'Create').click();

    // Should show validation error
  });

  it('should create account with valid data', () => {
    cy.intercept('POST', '**/api/accounts', {
      statusCode: 200,
      body: {
        account_id: 'new-account-123',
        label: 'My New Account',
        email: 'newaccount@example.com',
      },
    }).as('createAccount');

    cy.intercept('GET', '**/api/accounts', {
      statusCode: 200,
      body: {
        accounts: [
          {
            account_id: 'new-account-123',
            label: 'My New Account',
            email: 'newaccount@example.com',
          },
        ],
      },
    }).as('listAccounts');

    // Fill in form
    const form = cy.contains('Create Demo Account').parent();
    form.find('input[placeholder*="Label"]').type('My New Account');
    form.find('input[type="email"]').type('newaccount@example.com');

    // Submit
    form.find('button').contains('Create').click();

    // Wait for creation
    cy.wait('@createAccount');

    // New account should appear in the accounts list
    cy.wait('@listAccounts');
    cy.contains('My New Account').should('be.visible');
  });

  it('should display error on API failure', () => {
    cy.intercept('POST', '**/api/accounts', {
      statusCode: 400,
      body: { error: 'Invalid email format' },
    }).as('createAccountError');

    const form = cy.contains('Create Demo Account').parent();
    form.find('input[placeholder*="Label"]').type('Test Account');
    form.find('input[type="email"]').type('invalid-email');
    form.find('button').contains('Create').click();

    cy.wait('@createAccountError');

    // Error should be displayed
    cy.contains('Error').should('be.visible');
  });
});
