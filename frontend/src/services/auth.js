// frontend/src/services/auth.js
// Local session storage for the Cognito-backed OTP login. Only an ID token
// (used as the API Gateway Authorization header) and its expiry live here;
// there's no client-side Cognito SDK involved.
const SESSION_KEY = "ss_auth_session";

/**
 * Persist a session after a successful OTP verification.
 * @param {object} params
 * @param {string} params.idToken
 * @param {string} params.accessToken
 * @param {string} params.refreshToken
 * @param {number} params.expiresIn - Seconds until the ID token expires
 * @param {string} params.email
 * @returns {object} The stored session
 */
export function saveSession({ idToken, accessToken, refreshToken, expiresIn, email }) {
  const session = {
    idToken,
    accessToken,
    refreshToken,
    email,
    expiresAt: Date.now() + Number(expiresIn || 0) * 1000,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

/**
 * Read the current session, clearing and returning null if missing/expired.
 * @returns {object|null}
 */
export function getSession() {
  let raw;
  try {
    raw = localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  let session;
  try {
    session = JSON.parse(raw);
  } catch {
    clearSession();
    return null;
  }

  if (!session?.idToken || !session?.expiresAt || Date.now() >= session.expiresAt) {
    clearSession();
    return null;
  }
  return session;
}

export function getIdToken() {
  return getSession()?.idToken || null;
}

export function isAuthenticated() {
  return Boolean(getSession());
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
