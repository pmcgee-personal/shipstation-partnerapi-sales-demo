// Cypress E2E support file
// Import commands and setup for all tests

// Custom command to select account from dropdown
Cypress.Commands.add('selectAccount', (email) => {
  cy.get('[data-cy="account-selector"]').click();
  cy.contains(email).click();
});

// Visit the app with a pre-seeded, non-expired auth session so specs that
// exercise the dashboard don't have to drive the OTP login flow first.
Cypress.Commands.add('visitAuthenticated', (url = '/') => {
  cy.visit(url, {
    onBeforeLoad(win) {
      win.localStorage.setItem(
        'ss_auth_session',
        JSON.stringify({
          idToken: 'test-id-token',
          accessToken: 'test-access-token',
          refreshToken: 'test-refresh-token',
          email: 'test@shipstation.com',
          expiresAt: Date.now() + 60 * 60 * 1000,
        }),
      );
    },
  });
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
