// frontend/src/services/api.js
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// API timeout and retry utilities
const API_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 2;

const fetchWithTimeout = (url, options = {}, timeout = API_TIMEOUT) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timeout")), timeout)
    ),
  ]);
};

const retryFetch = async (url, options = {}, retries = MAX_RETRIES) => {
  try {
    return await fetchWithTimeout(url, options);
  } catch (error) {
    if (retries > 0 && (error.message === "Request timeout" || error.name === "TypeError")) {
      console.warn(`Retry attempt ${MAX_RETRIES - retries + 1}:`, error.message);
      await new Promise(resolve => setTimeout(resolve, 1000 * (MAX_RETRIES - retries + 1))); // Exponential backoff
      return retryFetch(url, options, retries - 1);
    }
    throw error;
  }
};

const handleApiError = (error, endpoint) => {
  const message = error.message === "Request timeout"
    ? `Request timeout: ${endpoint} took too long to respond`
    : error.message || `Failed to connect to ${endpoint}`;
  console.error(`[API Error] ${endpoint}:`, error);
  throw new Error(message);
};

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
    try {
      const response = await retryFetch(`${API_BASE_URL}/api/accounts`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      const data = await response.json();
      return data.accounts || [];
    } catch (error) {
      handleApiError(error, "listAccounts");
    }
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
