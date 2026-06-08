// frontend/src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api = {
  // Notice we are accepting (label, email) as two separate parameters!
  createAccount: async (label, email) => {
    const response = await fetch(`${API_BASE_URL}/api/accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Combine the two arguments into the JSON object the backend expects
      body: JSON.stringify({ label, email }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to create account");
    }
    return response.json();
  },

  listAccounts: async () => {
    const response = await fetch(`${API_BASE_URL}/api/accounts`);
    if (!response.ok) {
      throw new Error("Failed to fetch accounts");
    }
    const data = await response.json();
    return data.accounts || []; // <-- Now we safely extract and return just the array!
  },

  getDirectLoginUrl: async (accountId) => {
    const response = await fetch(`${API_BASE_URL}/api/direct-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to generate direct login URL");
    }
    return response.json();
  },

  listCarriers: async (accountId) => {
    const response = await fetch(`${API_BASE_URL}/api/carriers/${accountId}`);
    if (!response.ok) {
      throw new Error("Failed to load carriers.");
    }
    const data = await response.json();
    return data.carriers || [];
  },

  // --- NEW SHIP VIA ENDPOINTS ---

  getAccount: async (accountId) => {
    const response = await fetch(`${API_BASE_URL}/api/accounts/${accountId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch account details");
    }
    return response.json();
  },

  addShipVia: async (accountId, shipViaData) => {
    const response = await fetch(
      `${API_BASE_URL}/api/accounts/${accountId}/shipvia`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shipViaData),
      },
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to add Ship Via");
    }
    return response.json();
  },

  deleteShipVia: async (accountId, shipViaCode) => {
    const response = await fetch(
      `${API_BASE_URL}/api/accounts/${accountId}/shipvia/${shipViaCode}`,
      {
        method: "DELETE",
      },
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to delete Ship Via");
    }
    return response.json();
  },
};
