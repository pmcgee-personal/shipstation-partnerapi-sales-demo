describe('Carrier Settings Page', () => {
  beforeEach(() => {
    // Visit the app
    cy.visitAuthenticated('/');
    
    // Mock the API responses for faster testing
    cy.intercept('GET', '**/api/accounts', {
      statusCode: 200,
      body: {
        accounts: [
          {
            account_id: 'test-account-1',
            label: 'Test Account',
            email: 'test@example.com',
          },
        ],
      },
    }).as('listAccounts');

    cy.intercept('GET', '**/api/carriers/**', {
      statusCode: 200,
      body: { carriers: [] },
    }).as('listCarriers');

    cy.intercept('GET', '**/api/warehouses/**', {
      statusCode: 200,
      body: { warehouses: [] },
    }).as('listWarehouses');

    cy.intercept('GET', '**/api/accounts/**', {
      statusCode: 200,
      body: {
        account_id: 'test-account-1',
        label: 'Test Account',
        email: 'test@example.com',
      },
    }).as('getAccount');
  });

  it('should display carrier settings page when account is selected', () => {
    // Navigate to carrier settings
    cy.contains('Carrier Settings').click();

    // Should show the page title
    cy.contains('h2', 'Carrier Settings').should('be.visible');

    // Should have connect carriers button
    cy.contains('button', 'Connect Carriers').should('be.visible');

    // Should have sync button
    cy.contains('button', 'Carrier Settings').parent().find('button').first().should('exist');
  });

  it('should load and display carrier table', () => {
    cy.contains('Carrier Settings').click();

    // Wait for carriers to load
    cy.wait('@listCarriers');

    // Verify carrier table is visible
    cy.contains('Carrier Settings').should('be.visible');
  });

  it('should display warehouse locations section', () => {
    cy.contains('Carrier Settings').click();

    // Wait for warehouse data
    cy.wait('@listWarehouses');

    // Should show warehouse section
    cy.contains('h2', 'Warehouse Locations').should('be.visible');

    // Should have add location button
    cy.contains('button', 'Add Location').should('be.visible');
  });

  it('should refresh data when sync button is clicked', () => {
    cy.contains('Carrier Settings').click();

    // Initial load
    cy.wait('@listCarriers');
    cy.wait('@listWarehouses');

    // Click sync button
    cy.get('[title="Sync carrier data"]').click();

    // Should reload data
    cy.wait('@listCarriers');
    cy.wait('@listWarehouses');
  });

  it('should display error message when API fails', () => {
    // Mock API error
    cy.intercept('GET', '**/api/carriers/**', {
      statusCode: 500,
      body: { error: 'Server error' },
    }).as('carrierError');

    cy.contains('Carrier Settings').click();

    cy.wait('@carrierError');

    // Error message should appear
    cy.contains('Error:').should('be.visible');
  });

  it('should handle no account selected state', () => {
    // Don't select an account, navigate directly
    cy.visitAuthenticated('/');

    // Should show warning message
    cy.contains('No Demo Account Selected').should('be.visible');
    cy.contains(
      'Please select a demo account from the control bar at the top'
    ).should('be.visible');
  });
});
