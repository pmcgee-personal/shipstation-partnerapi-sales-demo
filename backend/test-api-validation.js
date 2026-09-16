/**
 * Integration test for API handlers with validation
 * Simulates API Gateway events and validates error responses
 * Run with: node test-api-validation.js
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

// Simulate API Gateway event for createAccount
function createCreateAccountEvent(label, email) {
  return {
    body: JSON.stringify({ label, email }),
    isBase64Encoded: false,
  };
}

// Simulate API Gateway event for addShipVia
function createAddShipViaEvent(accountId, shipViaData) {
  return {
    pathParameters: { accountId },
    body: JSON.stringify(shipViaData),
    isBase64Encoded: false,
  };
}

// Simulate API Gateway event for deleteShipVia
function createDeleteShipViaEvent(accountId, shipViaCode) {
  return {
    pathParameters: { accountId, shipViaCode },
  };
}

// Simulate API Gateway event for directLogin
function createDirectLoginEvent(accountId) {
  return {
    body: JSON.stringify({ accountId }),
    isBase64Encoded: false,
  };
}

// Simulate API Gateway event for path-based handlers
function createPathBasedEvent(accountId) {
  return {
    pathParameters: { accountId },
  };
}

console.log("=== CreateAccount Validation Scenarios ===");

passed += testCase("Valid createAccount event", () => {
  const event = createCreateAccountEvent("Acme Corp", "test@example.com");
  let bodyData = {};
  if (event.body) {
    bodyData = event.isBase64Encoded
      ? JSON.parse(Buffer.from(event.body, "base64").toString("utf-8"))
      : JSON.parse(event.body);
  }
  const result = validation.validateCreateAccountInput(bodyData);
  assert(result.isValid === true, "Should validate valid event");
  assert(result.validated.label === "Acme Corp", "Should have label");
  assert(result.validated.email === "test@example.com", "Should have email");
});

passed += testCase("Missing email in createAccount", () => {
  const event = createCreateAccountEvent("Acme Corp", "");
  let bodyData = JSON.parse(event.body);
  const result = validation.validateCreateAccountInput(bodyData);
  assert(result.isValid === false, "Should reject missing email");
  assert(
    result.error.includes("cannot be empty"),
    "Should have descriptive error"
  );
});

passed += testCase("Invalid email format in createAccount", () => {
  const event = createCreateAccountEvent("Acme Corp", "not-an-email");
  let bodyData = JSON.parse(event.body);
  const result = validation.validateCreateAccountInput(bodyData);
  assert(result.isValid === false, "Should reject invalid email");
  assert(
    result.error.includes("valid format"),
    "Should mention email format"
  );
});

passed += testCase("Invalid label format in createAccount", () => {
  const event = createCreateAccountEvent("Corp@#$%", "test@example.com");
  let bodyData = JSON.parse(event.body);
  const result = validation.validateCreateAccountInput(bodyData);
  assert(result.isValid === false, "Should reject invalid label");
  assert(
    result.error.includes("invalid characters"),
    "Should mention characters"
  );
});

passed += testCase("Whitespace trimming in createAccount", () => {
  const event = createCreateAccountEvent("  Test Corp  ", "  test@test.com  ");
  let bodyData = JSON.parse(event.body);
  const result = validation.validateCreateAccountInput(bodyData);
  assert(result.isValid === true, "Should accept trimmed values");
  assert(result.validated.label === "Test Corp", "Label should be trimmed");
  assert(result.validated.email === "test@test.com", "Email should be trimmed");
});

console.log("\n=== AddShipVia Validation Scenarios ===");

passed += testCase("Valid addShipVia event", () => {
  const event = createAddShipViaEvent("acc_12345", {
    ship_via_code: "USPS",
    carrier_id: "carrier_123",
    service_code: "usps_ground",
    package_type: "package",
  });
  let bodyData = JSON.parse(event.body);
  const result = validation.validateAddShipViaInput(
    event.pathParameters.accountId,
    bodyData
  );
  assert(result.isValid === true, "Should validate valid event");
});

passed += testCase("Invalid accountId in addShipVia", () => {
  const event = createAddShipViaEvent("", {
    ship_via_code: "USPS",
    carrier_id: "carrier_123",
    service_code: "usps_ground",
    package_type: "package",
  });
  let bodyData = JSON.parse(event.body);
  const result = validation.validateAddShipViaInput(
    event.pathParameters.accountId,
    bodyData
  );
  assert(result.isValid === false, "Should reject empty accountId");
});

passed += testCase("Missing carrier_id in addShipVia", () => {
  const event = createAddShipViaEvent("acc_12345", {
    ship_via_code: "USPS",
    service_code: "usps_ground",
    package_type: "package",
  });
  let bodyData = JSON.parse(event.body);
  const result = validation.validateAddShipViaInput(
    event.pathParameters.accountId,
    bodyData
  );
  assert(result.isValid === false, "Should reject missing carrier_id");
});

console.log("\n=== DeleteShipVia Validation Scenarios ===");

passed += testCase("Valid deleteShipVia event", () => {
  const event = createDeleteShipViaEvent("acc_12345", "USPS");
  const result = validation.validateDeleteShipViaInput(
    event.pathParameters.accountId,
    event.pathParameters.shipViaCode
  );
  assert(result.isValid === true, "Should validate valid event");
});

passed += testCase("Invalid shipViaCode in deleteShipVia", () => {
  const event = createDeleteShipViaEvent("acc_12345", "");
  const result = validation.validateDeleteShipViaInput(
    event.pathParameters.accountId,
    event.pathParameters.shipViaCode
  );
  assert(result.isValid === false, "Should reject empty shipViaCode");
});

console.log("\n=== DirectLogin Validation Scenarios ===");

passed += testCase("Valid directLogin event", () => {
  const event = createDirectLoginEvent("acc_12345");
  let bodyData = JSON.parse(event.body);
  const result = validation.validateDirectLoginInput(bodyData);
  assert(result.isValid === true, "Should validate valid event");
});

passed += testCase("Missing accountId in directLogin", () => {
  const event = createDirectLoginEvent("");
  let bodyData = JSON.parse(event.body);
  const result = validation.validateDirectLoginInput(bodyData);
  assert(result.isValid === false, "Should reject empty accountId");
});

console.log("\n=== Path-Based Handler Validation Scenarios ===");

passed += testCase("Valid getAccount event", () => {
  const event = createPathBasedEvent("acc_12345");
  const result = validation.validateAccountIdPath(
    event.pathParameters?.accountId
  );
  assert(result.isValid === true, "Should validate valid event");
});

passed += testCase("Invalid accountId in getAccount", () => {
  const event = createPathBasedEvent("acc 12345");
  const result = validation.validateAccountIdPath(
    event.pathParameters?.accountId
  );
  assert(result.isValid === false, "Should reject account ID with spaces");
});

passed += testCase("Missing accountId in listCarriers", () => {
  const result = validation.validateAccountIdPath(undefined);
  assert(result.isValid === false, "Should reject undefined accountId");
});

// Error response simulation
console.log("\n=== Error Response Format ===");

passed += testCase("Error responses include field name", () => {
  const event = createCreateAccountEvent("", "test@test.com");
  let bodyData = JSON.parse(event.body);
  const result = validation.validateCreateAccountInput(bodyData);
  assert(result.error.includes("Label"), "Error should mention field name");
});

passed += testCase("Error messages are user-friendly", () => {
  const event = createCreateAccountEvent("Test", "not-email");
  let bodyData = JSON.parse(event.body);
  const result = validation.validateCreateAccountInput(bodyData);
  assert(
    !result.error.includes("undefined"),
    "Should not have undefined in error"
  );
  assert(result.error.length > 10, "Should have descriptive message");
});

console.log(`\n=== Test Summary ===`);
console.log(`✓ Passed: ${passed}`);
console.log(`Total: ${passed}`);

process.exit(passed === 20 ? 0 : 1);
