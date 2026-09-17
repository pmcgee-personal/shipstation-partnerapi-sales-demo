describe('Warehouse Locations', () => {
  beforeEach(() => {
    cy.visit('/');

    // Mock account selection
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

    cy.intercept('GET', '**/api/warehouses/**', {
      statusCode: 200,
      body: {
        warehouses: [
          {
            warehouse_id: '1',
            name: 'Main Warehouse',
            origin_address: {
              address_line1: '123 Main St',
              city_locality: 'Dallas',
              state_province: 'TX',
              postal_code: '75201',
              country_code: 'US',
            },
          },
        ],
      },
    }).as('listWarehouses');

    cy.intercept('GET', '**/api/carriers/**', {
      statusCode: 200,
      body: { carriers: [] },
    }).as('listCarriers');

    cy.intercept('GET', '**/api/accounts/**', {
      statusCode: 200,
      body: {
        account_id: 'test-account-1',
        label: 'Test Account',
        email: 'test@example.com',
      },
    }).as('getAccount');
  });

  it('should display warehouse locations table', () => {
    cy.contains('Carrier Settings').click();

    cy.wait('@listWarehouses');

    // Should display warehouse table
    cy.contains('h2', 'Warehouse Locations').should('be.visible');

    // Should display warehouse data
    cy.contains('Main Warehouse').should('be.visible');
    cy.contains('123 Main St').should('be.visible');
  });

  it('should have add location button', () => {
    cy.contains('Carrier Settings').click();

    cy.wait('@listWarehouses');

    // Add location button should be visible
    cy.contains('button', 'Add Location').should('be.visible');
  });

  it('should add new warehouse location', () => {
    cy.intercept('POST', '**/api/warehouses/**', {
      statusCode: 200,
      body: { success: true },
    }).as('addWarehouse');

    cy.contains('Carrier Settings').click();

    cy.wait('@listWarehouses');

    // Click add location
    cy.contains('button', 'Add Location').click();

    // Should show loading state
    cy.contains('Adding...').should('be.visible');

    cy.wait('@addWarehouse');

    // Should reload warehouses after adding
    cy.wait('@listWarehouses');
  });

  it('should display error when adding warehouse fails', () => {
    cy.intercept('POST', '**/api/warehouses/**', {
      statusCode: 500,
      body: { error: 'Failed to create warehouse' },
    }).as('addWarehouseError');

    cy.contains('Carrier Settings').click();

    cy.wait('@listWarehouses');

    cy.contains('button', 'Add Location').click();

    cy.wait('@addWarehouseError');

    // Error message should appear
    cy.contains('Error:').should('be.visible');
  });

  it('should display warehouse address information', () => {
    cy.contains('Carrier Settings').click();

    cy.wait('@listWarehouses');

    // Verify complete warehouse information is displayed
    cy.contains('Dallas').should('be.visible');
    cy.contains('TX').should('be.visible');
    cy.contains('75201').should('be.visible');
    cy.contains('US').should('be.visible');
  });
});
