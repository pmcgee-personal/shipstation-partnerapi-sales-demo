/**
 * Frontend input validation utilities
 * Provides client-side validation before API calls
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {object} { isValid: boolean, error: string | null }
 */
export function validateEmail(email) {
  if (!email || typeof email !== "string") {
    return { isValid: false, error: "Email is required" };
  }

  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: "Email cannot be empty" };
  }

  // Simple but effective email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return {
      isValid: false,
      error: "Email must be in valid format (e.g., user@example.com)",
    };
  }

  return { isValid: true, error: null };
}

/**
 * Validate label (company name)
 * @param {string} label - Label to validate
 * @returns {object} { isValid: boolean, error: string | null }
 */
export function validateLabel(label) {
  if (!label || typeof label !== "string") {
    return { isValid: false, error: "Label is required" };
  }

  const trimmed = label.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: "Label cannot be empty" };
  }

  if (trimmed.length > 256) {
    return {
      isValid: false,
      error: "Label must not exceed 256 characters",
    };
  }

  // Allow alphanumeric, spaces, common business symbols
  if (!/^[a-zA-Z0-9\s\-.,&'()]+$/.test(trimmed)) {
    return {
      isValid: false,
      error: "Label contains invalid characters",
    };
  }

  return { isValid: true, error: null };
}

/**
 * Validate account creation inputs
 * @param {string} label - Company label
 * @param {string} email - Email address
 * @returns {object} { isValid: boolean, error: string | null }
 */
export function validateCreateAccount(label, email) {
  const labelValidation = validateLabel(label);
  if (!labelValidation.isValid) {
    return { isValid: false, error: labelValidation.error };
  }

  const emailValidation = validateEmail(email);
  if (!emailValidation.isValid) {
    return { isValid: false, error: emailValidation.error };
  }

  return { isValid: true, error: null };
}
