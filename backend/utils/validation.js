/**
 * Input validation utilities for all backend handlers
 * Provides consistent validation rules and error responses
 */

/**
 * Validate a string is non-empty after trimming
 * @param {string} value - Input value
 * @param {string} fieldName - Field name for error message
 * @returns {object} { isValid: boolean, trimmed: string, error: string }
 */
function validateString(value, fieldName) {
  if (typeof value !== "string") {
    return {
      isValid: false,
      trimmed: null,
      error: `${fieldName} must be a string`,
    };
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return {
      isValid: false,
      trimmed: null,
      error: `${fieldName} cannot be empty`,
    };
  }

  return { isValid: true, trimmed, error: null };
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {object} { isValid: boolean, trimmed: string, error: string }
 */
function validateEmail(email) {
  const result = validateString(email, "Email");
  if (!result.isValid) return result;

  // Simple but effective email regex (RFC 5322 simplified)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(result.trimmed)) {
    return {
      isValid: false,
      trimmed: null,
      error: "Email must be in valid format (e.g., user@example.com)",
    };
  }

  return { isValid: true, trimmed: result.trimmed, error: null };
}

/**
 * Validate account ID format
 * @param {string} accountId - Account ID to validate
 * @returns {object} { isValid: boolean, trimmed: string, error: string }
 */
function validateAccountId(accountId) {
  const result = validateString(accountId, "Account ID");
  if (!result.isValid) return result;

  // Account IDs should be alphanumeric, allowing common separators
  if (!/^[a-zA-Z0-9_-]+$/.test(result.trimmed)) {
    return {
      isValid: false,
      trimmed: null,
      error: "Account ID contains invalid characters",
    };
  }

  return { isValid: true, trimmed: result.trimmed, error: null };
}

/**
 * Validate carrier code format
 * @param {string} code - Carrier code to validate
 * @returns {object} { isValid: boolean, trimmed: string, error: string }
 */
function validateCarrierCode(code) {
  const result = validateString(code, "Carrier code");
  if (!result.isValid) return result;

  // Carrier codes: letters, numbers, underscores, hyphens
  if (!/^[a-zA-Z0-9_-]+$/.test(result.trimmed)) {
    return {
      isValid: false,
      trimmed: null,
      error: "Carrier code contains invalid characters",
    };
  }

  return { isValid: true, trimmed: result.trimmed, error: null };
}

/**
 * Validate label (company name)
 * @param {string} label - Label to validate
 * @returns {object} { isValid: boolean, trimmed: string, error: string }
 */
function validateLabel(label) {
  const result = validateString(label, "Label");
  if (!result.isValid) return result;

  // Label: alphanumeric, spaces, common business symbols
  if (!/^[a-zA-Z0-9\s\-.,&'()]+$/.test(result.trimmed)) {
    return {
      isValid: false,
      trimmed: null,
      error: "Label contains invalid characters",
    };
  }

  if (result.trimmed.length > 256) {
    return {
      isValid: false,
      trimmed: null,
      error: "Label must not exceed 256 characters",
    };
  }

  return { isValid: true, trimmed: result.trimmed, error: null };
}

/**
 * Country codes selectable when creating a demo account. Add entries here
 * to support more origin countries. Note: the auto-created demo warehouse
 * (WAREHOUSE_LOCATIONS in handler.js) intentionally stays US-only regardless
 * of this list -- ShipEngine doesn't block a mismatched warehouse address,
 * and this demo doesn't exercise label/rate creation, which is where that
 * would matter.
 */
const SUPPORTED_ORIGIN_COUNTRIES = ["US", "CA", "GB", "AU", "FR"];

/**
 * Validate an origin country code against the supported list.
 * @param {string} countryCode - Country code to validate
 * @returns {object} { isValid: boolean, trimmed: string, error: string }
 */
function validateCountryCode(countryCode) {
  const result = validateString(countryCode, "Country code");
  if (!result.isValid) return result;

  const normalized = result.trimmed.toUpperCase();
  if (!SUPPORTED_ORIGIN_COUNTRIES.includes(normalized)) {
    return {
      isValid: false,
      trimmed: null,
      error: `Unsupported country code. Must be one of: ${SUPPORTED_ORIGIN_COUNTRIES.join(", ")}`,
    };
  }

  return { isValid: true, trimmed: normalized, error: null };
}

/**
 * Validate all required fields for createAccount
 * @param {object} bodyData - Request body
 * @returns {object} { isValid: boolean, validated: object, error: string }
 */
function validateCreateAccountInput(bodyData) {
  if (!bodyData || typeof bodyData !== "object") {
    return {
      isValid: false,
      validated: null,
      error: "Request body must be a valid JSON object",
    };
  }

  const labelResult = validateLabel(bodyData.label);
  if (!labelResult.isValid) {
    return { isValid: false, validated: null, error: labelResult.error };
  }

  const emailResult = validateEmail(bodyData.email);
  if (!emailResult.isValid) {
    return { isValid: false, validated: null, error: emailResult.error };
  }

  const countryResult = validateCountryCode(bodyData.countryCode);
  if (!countryResult.isValid) {
    return { isValid: false, validated: null, error: countryResult.error };
  }

  return {
    isValid: true,
    validated: {
      label: labelResult.trimmed,
      email: emailResult.trimmed,
      countryCode: countryResult.trimmed,
    },
    error: null,
  };
}

/**
 * Validate path parameters for handlers that need accountId
 * @param {string} accountId - Account ID from path
 * @returns {object} { isValid: boolean, validated: object, error: string }
 */
function validateAccountIdPath(accountId) {
  const result = validateAccountId(accountId);
  if (!result.isValid) {
    return { isValid: false, validated: null, error: result.error };
  }

  return {
    isValid: true,
    validated: { accountId: result.trimmed },
    error: null,
  };
}

/**
 * Validate direct login input
 * @param {object} bodyData - Request body
 * @returns {object} { isValid: boolean, validated: object, error: string }
 */
function validateDirectLoginInput(bodyData) {
  if (!bodyData || typeof bodyData !== "object") {
    return {
      isValid: false,
      validated: null,
      error: "Request body must be a valid JSON object",
    };
  }

  const accountIdResult = validateAccountId(bodyData.accountId);
  if (!accountIdResult.isValid) {
    return { isValid: false, validated: null, error: accountIdResult.error };
  }

  return {
    isValid: true,
    validated: { accountId: accountIdResult.trimmed },
    error: null,
  };
}

module.exports = {
  validateString,
  validateEmail,
  validateAccountId,
  validateCarrierCode,
  validateLabel,
  validateCountryCode,
  SUPPORTED_ORIGIN_COUNTRIES,
  validateCreateAccountInput,

  validateAccountIdPath,
  validateDirectLoginInput,
};
