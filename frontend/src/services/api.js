// Load the API Base URL from the environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Fail-fast validation check
if (!API_BASE_URL) {
  throw new Error(
    "VITE_API_BASE_URL is not set. Please check your .env or .env.local file.",
  );
}

export const api = {
  /**
   * POST /api/accounts
   * Provisions a live ShipStation API child account and saves it to DynamoDB
   */
  async createAccount(label, email) {
    const response = await fetch(`${API_BASE_URL}/api/accounts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ label, email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.details || errorData.error || "Failed to create account",
      );
    }
    return await response.json();
  },

  /**
   * GET /api/accounts
   * Fetches all registered demo accounts from DynamoDB
   */
  async listAccounts() {
    const response = await fetch(`${API_BASE_URL}/api/accounts`);

    if (!response.ok) {
      throw new Error("Failed to fetch demo accounts");
    }

    const data = await response.json();
    return data.accounts || [];
  },

  /**
   * POST /api/direct-login
   * Generates a live ephemeral token and returns the ShipStation Carrier Portal redirect URL
   */
  async getDirectLoginUrl(accountId) {
    const response = await fetch(`${API_BASE_URL}/api/direct-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accountId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.details ||
          errorData.error ||
          "Failed to generate direct login link",
      );
    }

    return await response.json(); // Returns { token, redirect_url }
  },

  /**
   * GET /api/carriers/:accountId
   * Fetches the connected carriers for the active demo account from ShipStation
   */
  async listCarriers(accountId) {
    const response = await fetch(`${API_BASE_URL}/api/carriers/${accountId}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.details || errorData.error || "Failed to fetch carriers",
      );
    }

    const data = await response.json();
    // ShipEngine returns { "carriers": [...] }
    return data.carriers || [];
  },
};
