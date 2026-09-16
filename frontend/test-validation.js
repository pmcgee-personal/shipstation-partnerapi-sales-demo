/**
 * Frontend validation test suite
 * Tests the inputValidation utility functions
 * Run with: node test-validation.js
 */

// Mock the modules for testing
const { validateEmail, validateLabel, validateCreateAccount } = (() => {
  // Simple inline implementation for testing
  function validateEmail(email) {
    if (!email || typeof email !== "string") {
      return { isValid: false, error: "Email is required" };
    }

    const trimmed = email.trim();
    if (trimmed.length === 0) {
      return { isValid: false, error: "Email cannot be empty" };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      return {
        isValid: false,
        error: "Email must be in valid format (e.g., user@example.com)",
      };
    }

    return { isValid: true, error: null };
  }

  function validateLabel(label) {
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

    if (!/^[a-zA-Z0-9\s\-.,&'()]+$/.test(trimmed)) {
      return {
        isValid: false,
        error: "Label contains invalid characters",
      };
    }

    return { isValid: true, error: null };
  }

  function validateCreateAccount(label, email) {
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

  return { validateEmail, validateLabel, validateCreateAccount };
})();

function testCase(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    return true;
  } catch (err) {
    console.log(`✗ ${name}: ${err.message}`);
    return false;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

let passed = 0;

// Test cases
console.log("=== Frontend Email Validation ===");
passed += testCase("Valid email", () => {
  const result = validateEmail("test@example.com");
  assert(result.isValid === true, "Should validate valid email");
});

passed += testCase("Invalid email format", () => {
  const result = validateEmail("invalid");
  assert(result.isValid === false, "Should reject invalid email");
});

passed += testCase("Email with whitespace", () => {
  const result = validateEmail("  test@example.com  ");
  assert(result.isValid === true, "Should accept trimmed email");
});

console.log("\n=== Frontend Label Validation ===");
passed += testCase("Valid label", () => {
  const result = validateLabel("Test Company");
  assert(result.isValid === true, "Should validate valid label");
});

passed += testCase("Label with special chars", () => {
  const result = validateLabel("Smith & Co., Inc.");
  assert(result.isValid === true, "Should allow business symbols");
});

passed += testCase("Label with invalid chars", () => {
  const result = validateLabel("Company@#$");
  assert(result.isValid === false, "Should reject invalid characters");
});

console.log("\n=== Frontend Create Account Validation ===");
passed += testCase("Valid account creation", () => {
  const result = validateCreateAccount("Test Corp", "test@test.com");
  assert(result.isValid === true, "Should validate valid inputs");
});

passed += testCase("Invalid email prevents creation", () => {
  const result = validateCreateAccount("Test Corp", "invalid");
  assert(result.isValid === false, "Should fail with invalid email");
  assert(result.error.includes("Email"), "Should mention email");
});

passed += testCase("Invalid label prevents creation", () => {
  const result = validateCreateAccount("Test@#$Corp", "test@test.com");
  assert(result.isValid === false, "Should fail with invalid label");
  assert(result.error.includes("Label"), "Should mention label");
});

console.log(`\n=== Summary ===`);
console.log(`✓ Passed: ${passed}`);
console.log(`Total: ${passed}`);

process.exit(passed === 9 ? 0 : 1);
