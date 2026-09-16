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
  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  return {
    isValid: true,
    validated: { label: labelResult.trimmed, email: emailResult.trimmed },
    error: null,
  };
}

/**
 * Validate all required fields for addShipVia
 * @param {string} accountId - Account ID from path
 * @param {object} bodyData - Request body
 * @returns {object} { isValid: boolean, validated: object, error: string }
 */
function validateAddShipViaInput(accountId, bodyData) {
  if (!bodyData || typeof bodyData !== "object") {
    return {
      isValid: false,
      validated: null,
      error: "Request body must be a valid JSON object",
    };
  }

  const accountIdResult = validateAccountId(accountId);
  if (!accountIdResult.isValid) {
    return { isValid: false, validated: null, error: accountIdResult.error };
  }

  const shipViaCodeResult = validateCarrierCode(bodyData.ship_via_code);
  if (!shipViaCodeResult.isValid) {
    return { isValid: false, validated: null, error: shipViaCodeResult.error };
  }

  const carrierIdResult = validateString(bodyData.carrier_id, "Carrier ID");
  if (!carrierIdResult.isValid) {
    return { isValid: false, validated: null, error: carrierIdResult.error };
  }

  const serviceCodeResult = validateCarrierCode(bodyData.service_code);
  if (!serviceCodeResult.isValid) {
    return {
      isValid: false,
      validated: null,
      error: "Service code " + serviceCodeResult.error.toLowerCase(),
    };
  }

  const packageTypeResult = validateString(bodyData.package_type, "Package type");
  if (!packageTypeResult.isValid) {
    return { isValid: false, validated: null, error: packageTypeResult.error };
  }

  return {
    isValid: true,
    validated: {
      accountId: accountIdResult.trimmed,
      ship_via_code: shipViaCodeResult.trimmed,
      carrier_id: carrierIdResult.trimmed,
      service_code: serviceCodeResult.trimmed,
      package_type: packageTypeResult.trimmed,
    },
    error: null,
  };
}

/**
 * Validate path parameters for ship via delete
 * @param {string} accountId - Account ID from path
 * @param {string} shipViaCode - Ship via code from path
 * @returns {object} { isValid: boolean, validated: object, error: string }
 */
function validateDeleteShipViaInput(accountId, shipViaCode) {
  const accountIdResult = validateAccountId(accountId);
  if (!accountIdResult.isValid) {
    return { isValid: false, validated: null, error: accountIdResult.error };
  }

  const shipViaCodeResult = validateCarrierCode(shipViaCode);
  if (!shipViaCodeResult.isValid) {
    return { isValid: false, validated: null, error: shipViaCodeResult.error };
  }

  return {
    isValid: true,
    validated: {
      accountId: accountIdResult.trimmed,
      shipViaCode: shipViaCodeResult.trimmed,
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
  validateCreateAccountInput,
  validateAddShipViaInput,
  validateDeleteShipViaInput,
  validateAccountIdPath,
  validateDirectLoginInput,
};
