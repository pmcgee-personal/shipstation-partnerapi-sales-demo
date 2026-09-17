// Cypress E2E support file
// Import commands and setup for all tests

// Custom command to select account from dropdown
Cypress.Commands.add('selectAccount', (email) => {
  cy.get('[data-cy="account-selector"]').click();
  cy.contains(email).click();
});

// Custom command to wait for API response
Cypress.Commands.add('waitForAPI', (method, path) => {
  cy.intercept(method, `**/api/**${path}`).as('api');
  cy.wait('@api');
});

// Suppress specific console errors if needed
const app = window.top;

if (!app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML =
    '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');
  app.document.head.appendChild(style);
}
