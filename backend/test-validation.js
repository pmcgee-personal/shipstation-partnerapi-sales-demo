/**
 * Test suite for input validation
 * Run with: node test-validation.js
 */

const validation = require("./utils/validation");

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
let failed = 0;

// Test validateEmail
console.log("\n=== Email Validation ===");
passed += testCase("Valid email", () => {
  const result = validation.validateEmail("user@example.com");
  assert(result.isValid === true, "Should validate valid email");
  assert(result.trimmed === "user@example.com", "Should trim correctly");
});

passed += testCase("Empty email", () => {
  const result = validation.validateEmail("");
  assert(result.isValid === false, "Should reject empty email");
  assert(result.error === "Email cannot be empty", "Should have error message");
});

passed += testCase("Invalid email format", () => {
  const result = validation.validateEmail("invalid-email");
  assert(result.isValid === false, "Should reject invalid format");
});

passed += testCase("Email with whitespace", () => {
  const result = validation.validateEmail("  user@example.com  ");
  assert(result.isValid === true, "Should trim whitespace");
  assert(result.trimmed === "user@example.com", "Should be trimmed");
});

passed += testCase("Null email", () => {
  const result = validation.validateEmail(null);
  assert(result.isValid === false, "Should reject null");
});

// Test validateLabel
console.log("\n=== Label Validation ===");
passed += testCase("Valid label", () => {
  const result = validation.validateLabel("Acme Corp");
  assert(result.isValid === true, "Should validate valid label");
});

passed += testCase("Label with special chars", () => {
  const result = validation.validateLabel("Smith & Sons, Inc.");
  assert(result.isValid === true, "Should allow business special chars");
});

passed += testCase("Empty label", () => {
  const result = validation.validateLabel("");
  assert(result.isValid === false, "Should reject empty label");
});

passed += testCase("Label with invalid chars", () => {
  const result = validation.validateLabel("Company@#$%");
  assert(result.isValid === false, "Should reject invalid characters");
});

passed += testCase("Label exceeds 256 chars", () => {
  const longLabel = "A".repeat(257);
  const result = validation.validateLabel(longLabel);
  assert(result.isValid === false, "Should reject too long label");
  assert(result.error.includes("256"), "Should mention length limit");
});

// Test validateAccountId
console.log("\n=== Account ID Validation ===");
passed += testCase("Valid account ID", () => {
  const result = validation.validateAccountId("acc_123456");
  assert(result.isValid === true, "Should validate alphanumeric with underscore");
});

passed += testCase("Account ID with hyphens", () => {
  const result = validation.validateAccountId("acc-123-456");
  assert(result.isValid === true, "Should allow hyphens");
});

passed += testCase("Account ID with spaces", () => {
  const result = validation.validateAccountId("acc 123");
  assert(result.isValid === false, "Should reject spaces");
});

passed += testCase("Empty account ID", () => {
  const result = validation.validateAccountId("");
  assert(result.isValid === false, "Should reject empty");
});

// Test validateCreateAccountInput
console.log("\n=== Create Account Validation ===");
passed += testCase("Valid create account input", () => {
  const result = validation.validateCreateAccountInput({
    label: "Test Company",
    email: "test@example.com",
  });
  assert(result.isValid === true, "Should validate valid inputs");
  assert(result.validated.label === "Test Company", "Should have label");
  assert(result.validated.email === "test@example.com", "Should have email");
});

passed += testCase("Missing email", () => {
  const result = validation.validateCreateAccountInput({
    label: "Test Company",
  });
  assert(result.isValid === false, "Should reject missing email");
  assert(result.error.includes("Email"), "Should mention Email field");
});

passed += testCase("Missing label", () => {
  const result = validation.validateCreateAccountInput({
    email: "test@example.com",
  });
  assert(result.isValid === false, "Should reject missing label");
  assert(result.error.includes("Label"), "Should mention Label field");
});

passed += testCase("Invalid body object", () => {
  const result = validation.validateCreateAccountInput(null);
  assert(result.isValid === false, "Should reject null body");
});

// Test validateAddShipViaInput
console.log("\n=== Add Ship Via Validation ===");
passed += testCase("Valid add ship via input", () => {
  const result = validation.validateAddShipViaInput("acc_123", {
    ship_via_code: "USPS",
    carrier_id: "carrier_123",
    service_code: "usps_ground",
    package_type: "package",
  });
  assert(result.isValid === true, "Should validate valid inputs");
  assert(result.validated.accountId === "acc_123", "Should have accountId");
});

passed += testCase("Missing ship_via_code", () => {
  const result = validation.validateAddShipViaInput("acc_123", {
    carrier_id: "carrier_123",
    service_code: "usps_ground",
    package_type: "package",
  });
  assert(result.isValid === false, "Should reject missing ship_via_code");
});

passed += testCase("Invalid account ID in addShipVia", () => {
  const result = validation.validateAddShipViaInput("", {
    ship_via_code: "USPS",
    carrier_id: "carrier_123",
    service_code: "usps_ground",
    package_type: "package",
  });
  assert(result.isValid === false, "Should reject empty account ID");
});

// Test validateDeleteShipViaInput
console.log("\n=== Delete Ship Via Validation ===");
passed += testCase("Valid delete ship via input", () => {
  const result = validation.validateDeleteShipViaInput("acc_123", "USPS");
  assert(result.isValid === true, "Should validate valid inputs");
  assert(result.validated.accountId === "acc_123", "Should have accountId");
  assert(result.validated.shipViaCode === "USPS", "Should have shipViaCode");
});

passed += testCase("Empty ship via code", () => {
  const result = validation.validateDeleteShipViaInput("acc_123", "");
  assert(result.isValid === false, "Should reject empty ship via code");
});

// Test validateDirectLoginInput
console.log("\n=== Direct Login Validation ===");
passed += testCase("Valid direct login input", () => {
  const result = validation.validateDirectLoginInput({
    accountId: "acc_123",
  });
  assert(result.isValid === true, "Should validate valid input");
  assert(result.validated.accountId === "acc_123", "Should have accountId");
});

passed += testCase("Missing accountId", () => {
  const result = validation.validateDirectLoginInput({});
  assert(result.isValid === false, "Should reject missing accountId");
});

// Test validateAccountIdPath
console.log("\n=== Account ID Path Validation ===");
passed += testCase("Valid account ID path", () => {
  const result = validation.validateAccountIdPath("acc_123");
  assert(result.isValid === true, "Should validate valid path param");
  assert(result.validated.accountId === "acc_123", "Should have accountId");
});

passed += testCase("Undefined account ID path", () => {
  const result = validation.validateAccountIdPath(undefined);
  assert(result.isValid === false, "Should reject undefined");
});

// Summary
console.log("\n=== Test Summary ===");
console.log(`✓ Passed: ${passed}`);
console.log(`✗ Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}
