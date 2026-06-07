// Your live AWS API Gateway base URL
const API_BASE_URL = "https://4jaiexribf.execute-api.us-west-2.amazonaws.com/dev";

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
      throw new Error(errorData.details || errorData.error || "Failed to create account");
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
      throw new Error(errorData.details || errorData.error || "Failed to generate direct login link");
    }

    return await response.json(); // Returns { token, redirect_url }
  }
};

