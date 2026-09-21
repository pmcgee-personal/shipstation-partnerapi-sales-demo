// frontend/src/services/api.js
import { getIdToken, clearSession } from "./auth";

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

// Attach the signed-in user's ID token to authenticated requests.
const authHeaders = () => {
  const token = getIdToken();
  return token ? { Authorization: token } : {};
};

// The Cognito authorizer rejects missing/expired tokens with 401; drop the
// stale session and reload so the login page reappears.
const handleUnauthorized = (response) => {
  if (response.status === 401) {
    clearSession();
    window.location.reload();
  }
};

export const api = {
  requestOtp: async (email) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/request-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Failed to send code");
    }
    return data;
  },

  verifyOtp: async (email, code, session) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code, session }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error || "Invalid code");
    }
    return data;
  },

  // Notice we are accepting (label, email) as two separate parameters!
  createAccount: async (label, email) => {
    const response = await fetch(`${API_BASE_URL}/api/accounts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      // Combine the two arguments into the JSON object the backend expects
      body: JSON.stringify({ label, email }),
    });

    if (!response.ok) {
      handleUnauthorized(response);
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to create account");
    }
    return response.json();
  },
  listAccounts: async () => {
    try {
      const response = await retryFetch(`${API_BASE_URL}/api/accounts`, {
        headers: authHeaders(),
      });
      if (!response.ok) {
        handleUnauthorized(response);
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
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ accountId }),
    });
    if (!response.ok) {
      handleUnauthorized(response);
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to generate direct login URL");
    }
    return response.json();
  },

  listCarriers: async (accountId) => {
    const response = await fetch(`${API_BASE_URL}/api/carriers/${accountId}`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      handleUnauthorized(response);
      throw new Error("Failed to load carriers.");
    }
    const data = await response.json();
    return data.carriers || [];
  },

  getAccount: async (accountId) => {
    const response = await fetch(`${API_BASE_URL}/api/accounts/${accountId}`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      handleUnauthorized(response);
      throw new Error("Failed to fetch account details");
    }
    return response.json();
  },

  listWarehouses: async (accountId) => {
    try {
      const response = await retryFetch(`${API_BASE_URL}/api/warehouses/${accountId}`, {
        headers: authHeaders(),
      });
      if (!response.ok) {
        handleUnauthorized(response);
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      const data = await response.json();
      return data.warehouses || [];
    } catch (error) {
      handleApiError(error, "listWarehouses");
    }
  },
  // Fetches a short-lived ShipEngine Elements Platform JWT (RS256), signed
  // server-side, scoped to the given seller account (the Elements "tenant").
  // ElementsProvider's getToken callback expects a raw JWT string back.
  getElementsToken: async (accountId) => {
    const response = await fetch(`${API_BASE_URL}/api/elements-token/${accountId}`, {
      headers: authHeaders(),
    });
    if (!response.ok) {
      handleUnauthorized(response);
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to fetch Elements token");
    }
    const data = await response.json();
    return data.token;
  },
};
