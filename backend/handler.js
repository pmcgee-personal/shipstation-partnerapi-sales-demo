const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  GetCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const validation = require("./utils/validation");
const auth = require("./utils/auth");

const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const ssmClient = new SSMClient({});

// Environment configuration
const TABLE_NAME = process.env.TABLE_NAME || 'shipstation-partnerapi-demo-accounts';
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const SSM_PARAM_API_KEY = process.env.SSM_PARAM_API_KEY || '/shipstation-demo/partner-api-key';
const SSM_PARAM_THEME_ID = process.env.SSM_PARAM_THEME_ID || '/shipstation-demo/theme-id';
// Logging utility that respects LOG_LEVEL and includes request tracking
const logger = {
  debug: (msg, data, requestId) => {
    if (LOG_LEVEL === 'debug') {
      console.log(`[DEBUG] ${requestId ? `[${requestId}] ` : ''}${msg}`, data || '');
    }
  },
  info: (msg, data, requestId) => {
    if (['debug', 'info'].includes(LOG_LEVEL)) {
      console.log(`[INFO] ${requestId ? `[${requestId}] ` : ''}${msg}`, data || '');
    }
  },
  error: (msg, data, requestId) => {
    console.error(`[ERROR] ${requestId ? `[${requestId}] ` : ''}${msg}`, data || '');
  },
};

// Helper to get/generate request ID from Lambda context
const getRequestId = (context) => {
  return context?.requestId || context?.awsRequestId || 'no-request-id';
};

// Error handling utilities
const handleError = (error, context = "") => {
  console.error(`[ERROR] ${context}:`, {
    message: error.message,
    code: error.code,
    stack: error.stack,
  });

  // Specific error responses
  if (error.code === "ResourceNotFoundException") {
    return { statusCode: 404, body: JSON.stringify({ error: "Resource not found" }) };
  }
  if (error.code === "ValidationException") {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request" }) };
  }
  if (error.code === "ConditionalCheckFailedException") {
    return { statusCode: 409, body: JSON.stringify({ error: "Conflict: resource already exists" }) };
  }
  
  // Generic server error
  return { statusCode: 500, body: JSON.stringify({ error: "Internal server error" }) };
};

const successResponse = (data) => ({
  statusCode: 200,
  headers: CORS_HEADERS,
  body: JSON.stringify(data),
});

const WAREHOUSE_LOCATIONS = [
  {
    name: "Worldwide Express",
    address_line1: "2021 McKinney Avenue, Suite 1600",
    city_locality: "Dallas",
    state_province: "TX",
    postal_code: "75201",
    country_code: "US",
  },
  {
    name: "Unishippers",
    address_line1: "2323 Victory Avenue",
    city_locality: "Dallas",
    state_province: "TX",
    postal_code: "75219",
    country_code: "US",
  },
  {
    name: "GlobalTranz",
    address_line1: "2700 Commerce Street, Suite 1500",
    city_locality: "Dallas",
    state_province: "TX",
    postal_code: "75226",
    country_code: "US",
  },
  {
    name: "Jear Logistics",
    address_line1: "Tempe Office",
    city_locality: "Tempe",
    state_province: "AZ",
    postal_code: "85281",
    country_code: "US",
  },
  {
    name: "BLX Logistics",
    address_line1: "Culver City Office",
    city_locality: "Culver City",
    state_province: "CA",
    postal_code: "90232",
    country_code: "US",
  },
  {
    name: "Worldwide Express",
    address_line1: "Ontario Office",
    city_locality: "Ontario",
    state_province: "CA",
    postal_code: "91761",
    country_code: "US",
  },
  {
    name: "Unishippers",
    address_line1: "San Diego Office",
    city_locality: "San Diego",
    state_province: "CA",
    postal_code: "92101",
    country_code: "US",
  },
  {
    name: "ShipStation",
    address_line1: "4301 Bull Creek Rd, Suite 300",
    city_locality: "Austin",
    state_province: "TX",
    postal_code: "78731",
    country_code: "US",
  },
  {
    name: "ShipStation",
    address_line1: "1990 E. Grand Avenue",
    city_locality: "El Segundo",
    state_province: "CA",
    postal_code: "90245",
    country_code: "US",
  },
  {
    name: "GlobalTranz",
    address_line1: "211 E. 7th Street, Suite 620",
    city_locality: "Austin",
    state_province: "TX",
    postal_code: "78701",
    country_code: "US",
  },
];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
  "Access-Control-Allow-Headers":
    "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,On-Behalf-Of",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS,DELETE",
};

async function getPartnerApiKey() {
  const ssmCommand = new GetParameterCommand({
    Name: SSM_PARAM_API_KEY,
    WithDecryption: true,
  });
  const ssmResponse = await ssmClient.send(ssmCommand);
  return ssmResponse.Parameter.Value;
}

module.exports.createAccount = async (event) => {
  let partnerApiKey;
  try {
    // ---- FOOLPROOF BODY PARSING ----
    let bodyData = {};
    if (event.body) {
      if (typeof event.body === "string") {
        // Handle base64 encoded payloads (common in AWS API Gateway proxy setups)
        if (event.isBase64Encoded) {
          const decodedString = Buffer.from(event.body, "base64").toString(
            "utf-8",
          );
          bodyData = JSON.parse(decodedString || "{}");
        } else {
          // Standard stringified JSON
          bodyData = JSON.parse(event.body || "{}");
        }
      } else {
        // Already parsed object
        bodyData = event.body;
      }
    }

    // Validate inputs using utility
    const createAccountValidation = validation.validateCreateAccountInput(bodyData);
    if (!createAccountValidation.isValid) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: createAccountValidation.error }),
      };
    }

    const { label, email } = createAccountValidation.validated;
    partnerApiKey = await getPartnerApiKey();

    const ssResponse = await fetch(
      "https://api.shipengine.com/v1/partners/accounts",
      {
        method: "POST",
        headers: {
          "API-Key": partnerApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, company_name: label }),
      },
    );

    if (!ssResponse.ok) {
      const errorText = await ssResponse.text();
      console.error("ShipStation API Error:", errorText);
      return {
        statusCode: ssResponse.status,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: "ShipStation API rejected the request",
          details: errorText,
        }),
      };
    }

    const { account_id } = await ssResponse.json();
    // Force it to a string so DynamoDB accepts it!
    const shipstation_account_id = account_id.toString();


    const params = {
      TableName: TABLE_NAME,
      Item: {
        account_id: shipstation_account_id,
        label,
        email,
        created_at: new Date().toISOString(),

      },
    };
    await docClient.send(new PutCommand(params));

    try {
      const randomLoc =
        WAREHOUSE_LOCATIONS[
          Math.floor(Math.random() * WAREHOUSE_LOCATIONS.length)
        ];
      const warehousePayload = {
        name: randomLoc.name,
        origin_address: {
          ...randomLoc,
          phone: "555-123-4567",
          email: "test@test.com",
        },
        return_address: {
          ...randomLoc,
          phone: "555-123-4567",
          email: "test@test.com",
        },
      };
      const warehouseResponse = await fetch(
        "https://api.shipengine.com/v1/warehouses",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "API-Key": partnerApiKey,
            "On-Behalf-Of": shipstation_account_id,
          },
          body: JSON.stringify(warehousePayload),
        },
      );
      if (!warehouseResponse.ok) {
        console.error(
          "Auto-Warehouse Creation Failed:",
          await warehouseResponse.text(),
        );
      }
    } catch (whError) {
      console.error("Error during auto-warehouse creation:", whError);
    }

    return {
      statusCode: 201,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        message: "Demo account securely created!",
        account_id: shipstation_account_id,
        label,
        email,
      }),
    };
  } catch (error) {
    console.error("Error creating account:", error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: "Internal Server Error during account creation",
      }),
    };
  }
};

module.exports.listAccounts = async (event) => {
  try {
    const params = { TableName: TABLE_NAME };
    const data = await docClient.send(new ScanCommand(params));
    return successResponse({ accounts: data.Items || [] });
  } catch (error) {
    const response = handleError(error, "listAccounts");
    return { ...response, headers: CORS_HEADERS };
  }
};

module.exports.getAccount = async (event) => {
  try {
    // Validate accountId from path
    const accountValidation = validation.validateAccountIdPath(event.pathParameters?.accountId);
    if (!accountValidation.isValid) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: accountValidation.error }),
      };
    }
    const { accountId } = accountValidation.validated;
    const data = await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { account_id: accountId },
      }),
    );
    if (!data.Item)
      return {
        statusCode: 404,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Account not found" }),
      };
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(data.Item),
    };
  } catch (error) {
    console.error("Error getting account:", error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Could not retrieve account details" }),
    };
  }
};

;

;

module.exports.directLogin = async (event, context) => {
  const requestId = getRequestId(context);
  logger.info('DIRECT_LOGIN_START', { path: event.path }, requestId);
  try {
    const body = JSON.parse(event.body || "{}");
    // Parse and validate body
    let bodyData = {};
    if (event.body) {
      if (typeof event.body === "string") {
        bodyData = event.isBase64Encoded
          ? JSON.parse(Buffer.from(event.body, "base64").toString("utf-8"))
          : JSON.parse(event.body);
      } else {
        bodyData = event.body;
      }
    }

    const loginValidation = validation.validateDirectLoginInput(bodyData);
    if (!loginValidation.isValid) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: loginValidation.error }),
      };
    }

    const { accountId } = loginValidation.validated;

    const partnerApiKey = await getPartnerApiKey();
    const themeIdResponse = await ssmClient
      .send(
        new GetParameterCommand({
          Name: SSM_PARAM_THEME_ID,
          WithDecryption: false,
        }),
      )
      .catch(() => null);
    const themeId = themeIdResponse?.Parameter?.Value || "";

    const redirectResponse = await fetch(
      "https://api.shipengine.com/v1/tokens/ephemeral?redirect=shipengine-dashboard",
      {
        method: "POST",
        headers: {
          "API-Key": partnerApiKey,
          "On-Behalf-Of": accountId.toString(),
          "Content-Type": "application/json",
        },
      },
    );

    if (!redirectResponse.ok) {
      const errorText = await redirectResponse.text();
      console.error("Direct Login API Error:", errorText);
      return {
        statusCode: redirectResponse.status,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: "Failed to generate ephemeral token",
          details: errorText,
        }),
      };
    }

    const redirectData = await redirectResponse.json();
    let finalRedirectUrl = `${redirectData.redirect_url}&redirect_to=carriers`;
    if (themeId) {
      finalRedirectUrl += `&theme_id=${themeId}`;
    }


    logger.info('DIRECT_LOGIN_SUCCESS', { statusCode: 200 }, requestId);
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        token: redirectData.token,
        redirect_url: finalRedirectUrl,
      }),
    };
  } catch (error) {
    logger.error("DIRECT_LOGIN_ERROR", { message: error.message }, requestId);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: "Internal Server Error during direct login generation",
      }),
    };
  }
};

module.exports.listCarriers = async (event) => {
  try {
    // Validate accountId from path
    const carrierValidation = validation.validateAccountIdPath(event.pathParameters?.accountId);
    if (!carrierValidation.isValid) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: carrierValidation.error }),
      };
    }

    const { accountId } = carrierValidation.validated;
    const partnerApiKey = await getPartnerApiKey();
    const carriersResponse = await fetch(
      "https://api.shipengine.com/v1/carriers",
      {
        method: "GET",
        headers: {
          "API-Key": partnerApiKey,
          "On-Behalf-Of": accountId.toString(),
          "Content-Type": "application/json",
        },
      },
    );

    if (!carriersResponse.ok) {
      const errorText = await carriersResponse.text();
      console.error("List Carriers API Error:", errorText);
      return {
        statusCode: carriersResponse.status,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: "Failed to fetch carriers from ShipStation API",
          details: errorText,
        }),
      };
    }
    const carriersData = await carriersResponse.json();
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(carriersData),
    };
  } catch (error) {
    console.error("Error listing carriers:", error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: "Internal Server Error during carrier fetch",
      }),
    };
  }
};

module.exports.listWarehouses = async (event) => {
  try {
    // Validate accountId from path
    const warehouseValidation = validation.validateAccountIdPath(event.pathParameters?.accountId);
    if (!warehouseValidation.isValid) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: warehouseValidation.error }),
      };
    }

    const { accountId } = warehouseValidation.validated;
    const partnerApiKey = await getPartnerApiKey();
    const whResponse = await fetch("https://api.shipengine.com/v1/warehouses", {
      method: "GET",
      headers: {
        "API-Key": partnerApiKey,
        "On-Behalf-Of": accountId.toString(),
        "Content-Type": "application/json",
      },
    });
    if (!whResponse.ok) {
      const errorText = await whResponse.text();
      console.error("List Warehouses API Error:", errorText);
      return {
        statusCode: whResponse.status,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: "Failed to fetch warehouses from ShipStation API",
          details: errorText,
        }),
      };
    }
    const whData = await whResponse.json();
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(whData),
    };
  } catch (error) {
    console.error("Error listing warehouses:", error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: "Internal Server Error during warehouse fetch",
      }),
    };
  }
};

module.exports.createWarehouse = async (event) => {
  try {
    // Validate accountId from path
    const createWhValidation = validation.validateAccountIdPath(event.pathParameters?.accountId);
    if (!createWhValidation.isValid) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: createWhValidation.error }),
      };
    }

    const { accountId } = createWhValidation.validated;
    const partnerApiKey = await getPartnerApiKey();
    const randomLoc =
      WAREHOUSE_LOCATIONS[
        Math.floor(Math.random() * WAREHOUSE_LOCATIONS.length)
      ];
    const warehousePayload = {
      name: randomLoc.name,
      origin_address: {
        name: randomLoc.name,
        address_line1: randomLoc.address_line1,
        city_locality: randomLoc.city_locality,
        state_province: randomLoc.state_province,
        postal_code: randomLoc.postal_code,
        country_code: randomLoc.country_code,
        phone: "555-123-4567",
        email: "test@test.com",
      },
      return_address: {
        name: randomLoc.name,
        address_line1: randomLoc.address_line1,
        city_locality: randomLoc.city_locality,
        state_province: randomLoc.state_province,
        postal_code: randomLoc.postal_code,
        country_code: randomLoc.country_code,
        phone: "555-123-4567",
        email: "test@test.com",
      },
    };
    const whResponse = await fetch("https://api.shipengine.com/v1/warehouses", {
      method: "POST",
      headers: {
        "API-Key": partnerApiKey,
        "On-Behalf-Of": accountId.toString(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(warehousePayload),
    });
    if (!whResponse.ok) {
      const errorText = await whResponse.text();
      console.error("Create Warehouse API Error:", errorText);
      return {
        statusCode: whResponse.status,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: "Failed to create warehouse on ShipStation API",
          details: errorText,
        }),
      };
    }
    const whData = await whResponse.json();
    return {
      statusCode: 201,
      headers: CORS_HEADERS,
      body: JSON.stringify(whData),
    };
  } catch (error) {
    console.error("Error creating warehouse:", error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: "Internal Server Error during warehouse manual creation",
      }),
    };
  }
};

module.exports.requestOtp = async (event, context) => {
  const requestId = getRequestId(context);
  try {
    let bodyData = {};
    if (event.body) {
      if (typeof event.body === "string") {
        bodyData = event.isBase64Encoded
          ? JSON.parse(Buffer.from(event.body, "base64").toString("utf-8"))
          : JSON.parse(event.body || "{}");
      } else {
        bodyData = event.body;
      }
    }

    const emailValidation = validation.validateEmail(bodyData.email);
    if (!emailValidation.isValid) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: emailValidation.error }),
      };
    }

    const email = emailValidation.trimmed;
    if (!auth.isAllowedEmail(email)) {
      logger.info("REQUEST_OTP_DENIED", { email }, requestId);
      return {
        statusCode: 403,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Access is restricted to ShipStation team emails." }),
      };
    }

    await auth.ensureUserExists(email);
    const { challengeName, session } = await auth.startEmailOtp(email);

    if (challengeName !== "EMAIL_OTP") {
      logger.error("REQUEST_OTP_UNEXPECTED_CHALLENGE", { challengeName }, requestId);
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Unable to start sign-in. Please try again." }),
      };
    }

    logger.info("REQUEST_OTP_SENT", { email }, requestId);
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ session }),
    };
  } catch (error) {
    logger.error("REQUEST_OTP_ERROR", { message: error.message }, requestId);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Internal Server Error while sending code" }),
    };
  }
};

module.exports.verifyOtp = async (event, context) => {
  const requestId = getRequestId(context);
  try {
    let bodyData = {};
    if (event.body) {
      if (typeof event.body === "string") {
        bodyData = event.isBase64Encoded
          ? JSON.parse(Buffer.from(event.body, "base64").toString("utf-8"))
          : JSON.parse(event.body || "{}");
      } else {
        bodyData = event.body;
      }
    }

    const emailValidation = validation.validateEmail(bodyData.email);
    if (!emailValidation.isValid) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: emailValidation.error }),
      };
    }
    const email = emailValidation.trimmed;
    const code = typeof bodyData.code === "string" ? bodyData.code.trim() : "";
    const session = typeof bodyData.session === "string" ? bodyData.session : "";

    if (!code || !session) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Code and session are required." }),
      };
    }
    if (!auth.isAllowedEmail(email)) {
      return {
        statusCode: 403,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Access is restricted to ShipStation team emails." }),
      };
    }

    let result;
    try {
      result = await auth.verifyEmailOtp(email, code, session);
    } catch (error) {
      if (error.name === "CodeMismatchException") {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: "Incorrect code. Please try again." }),
        };
      }
      if (error.name === "ExpiredCodeException") {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: "That code expired. Request a new one." }),
        };
      }
      if (error.name === "NotAuthorizedException" || error.name === "TooManyFailedAttemptsException") {
        return {
          statusCode: 401,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: "Too many attempts. Request a new code." }),
        };
      }
      throw error;
    }

    if (!result.tokens) {
      logger.error("VERIFY_OTP_UNEXPECTED_CHALLENGE", { challengeName: result.challengeName }, requestId);
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Unexpected authentication state. Request a new code." }),
      };
    }

    logger.info("VERIFY_OTP_SUCCESS", { email }, requestId);
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        idToken: result.tokens.IdToken,
        accessToken: result.tokens.AccessToken,
        refreshToken: result.tokens.RefreshToken,
        expiresIn: result.tokens.ExpiresIn,
        email,
      }),
    };
  } catch (error) {
    logger.error("VERIFY_OTP_ERROR", { message: error.message }, requestId);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Internal Server Error while verifying code" }),
    };
  }
};
// Backend deployment test - checking AWS credentials
// Trigger redeploy with API secret
// Final deployment with hardcoded API URL
