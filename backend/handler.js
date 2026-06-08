const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} = require("@aws-sdk/lib-dynamodb");
const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");

// Connect to AWS Services
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const ssmClient = new SSMClient({});

// Combined Warehouse Addresses with real ZIP codes to pass ShipStation API validation
const WAREHOUSE_LOCATIONS = [
  {
    name: "Worldwide Express",
    address_line1: "2021 McKinney Avenue, Suite 1600",
    city: "Dallas",
    state: "TX",
    postal_code: "75201",
    country_code: "US",
  },
  {
    name: "Unishippers",
    address_line1: "2323 Victory Avenue",
    city: "Dallas",
    state: "TX",
    postal_code: "75219",
    country_code: "US",
  },
  {
    name: "GlobalTranz",
    address_line1: "2700 Commerce Street, Suite 1500",
    city: "Dallas",
    state: "TX",
    postal_code: "75226",
    country_code: "US",
  },
  {
    name: "Jear Logistics",
    address_line1: "Tempe Office",
    city: "Tempe",
    state: "AZ",
    postal_code: "85281",
    country_code: "US",
  },
  {
    name: "BLX Logistics",
    address_line1: "Culver City Office",
    city: "Culver City",
    state: "CA",
    postal_code: "90232",
    country_code: "US",
  },
  {
    name: "Worldwide Express",
    address_line1: "Ontario Office",
    city: "Ontario",
    state: "CA",
    postal_code: "91761",
    country_code: "US",
  },
  {
    name: "Unishippers",
    address_line1: "San Diego Office",
    city: "San Diego",
    state: "CA",
    postal_code: "92101",
    country_code: "US",
  },
  {
    name: "ShipStation",
    address_line1: "4301 Bull Creek Rd, Suite 300",
    city: "Austin",
    state: "TX",
    postal_code: "78731",
    country_code: "US",
  },
  {
    name: "ShipStation",
    address_line1: "1990 E. Grand Avenue",
    city: "El Segundo",
    state: "CA",
    postal_code: "90245",
    country_code: "US",
  },
  {
    name: "Auctane LLC",
    address_line1: "211 E. 7th Street, Suite 620",
    city: "Austin",
    state: "TX",
    postal_code: "78701",
    country_code: "US",
  },
];

// Reusable CORS headers for all endpoints to prevent "Failed to fetch" browser errors
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Credentials": true,
  "Access-Control-Allow-Headers":
    "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

module.exports.createAccount = async (event) => {
  // Define partnerApiKey in the outer scope to be accessible in the warehouse creation block
  let partnerApiKey;

  try {
    const body = JSON.parse(event.body || "{}");
    const { label, email } = body;

    if (!label || !email) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "label and email are required" }),
      };
    }

    // 1. Securely fetch your Partner API Key from AWS SSM Parameter Store
    const ssmCommand = new GetParameterCommand({
      Name: "/shipstation-demo/partner-api-key",
      WithDecryption: true,
    });
    const ssmResponse = await ssmClient.send(ssmCommand);
    partnerApiKey = ssmResponse.Parameter.Value;

    // 2. Call the backend platform to provision the real ShipStation API account
    const ssResponse = await fetch(
      "https://api.shipengine.com/v1/partners/accounts",
      {
        method: "POST",
        headers: {
          "API-Key": partnerApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          company_name: label, // Passing our internal label as the company name
        }),
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

    const ssData = await ssResponse.json();

    // 3. Extract the REAL ShipStation account_id
    const shipstation_account_id = ssData.account_id.toString();
    const created_at = new Date().toISOString();

    // 4. Save to DynamoDB using the ShipStation account_id
    const params = {
      TableName: "shipstation-partnerapi-demo-accounts",
      Item: {
        account_id: shipstation_account_id,
        label: label,
        email: email,
        created_at: created_at,
      },
    };
    await docClient.send(new PutCommand(params));

    // --- PHASE 2: AUTO-CREATE WAREHOUSE ---
    try {
      const randomLoc =
        WAREHOUSE_LOCATIONS[
          Math.floor(Math.random() * WAREHOUSE_LOCATIONS.length)
        ];

      const warehousePayload = {
        name: randomLoc.name,
        origin_address: {
          name: randomLoc.name,
          address_line1: randomLoc.address_line1,
          city_locality: randomLoc.city,
          state_province: randomLoc.state,
          postal_code: randomLoc.postal_code,
          country_code: randomLoc.country_code,
          phone: "555-123-4567",
          email: "test@test.com",
        },
        return_address: {
          name: randomLoc.name,
          address_line1: randomLoc.address_line1,
          city_locality: randomLoc.city,
          state_province: randomLoc.state,
          postal_code: randomLoc.postal_code,
          country_code: randomLoc.country_code,
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
      } else {
        console.log(
          `Successfully auto-created warehouse for account: ${shipstation_account_id}`,
        );
      }
    } catch (whError) {
      console.error("Error during auto-warehouse creation:", whError);
    }
    // --- END PHASE 2 ---

    // 5. Return success to the frontend
    return {
      statusCode: 201,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        message:
          "Demo account securely created in ShipStation API and DynamoDB!",
        account_id: shipstation_account_id,
        label: label,
        email: email,
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
    const params = {
      TableName: "shipstation-partnerapi-demo-accounts",
    };

    // 1. Scan the DynamoDB table to get all records
    const data = await docClient.send(new ScanCommand(params));

    // 2. Return the array of accounts back to the caller
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        accounts: data.Items || [],
      }),
    };
  } catch (error) {
    console.error("Error listing accounts:", error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: "Could not retrieve accounts from DynamoDB",
      }),
    };
  }
};

module.exports.directLogin = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { accountId } = body;

    // 1. Validation
    if (!accountId) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "accountId is required" }),
      };
    }

    // 2. Fetch both the secure Partner API Key and the Theme ID from AWS SSM Parameter Store
    const apiKeyCommand = new GetParameterCommand({
      Name: "/shipstation-demo/partner-api-key",
      WithDecryption: true,
    });
    const themeIdCommand = new GetParameterCommand({
      Name: "/shipstation-demo/theme-id",
      WithDecryption: false,
    });

    const [apiKeyResponse, themeIdResponse] = await Promise.all([
      ssmClient.send(apiKeyCommand),
      ssmClient.send(themeIdCommand).catch(() => null),
    ]);

    const partnerApiKey = apiKeyResponse.Parameter.Value;
    const themeId = themeIdResponse?.Parameter?.Value || "";

    // 3. Request the Ephemeral Token using the exact Partner API spec
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

    // 4. Return the ephemeral redirect URL to the frontend
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        token: redirectData.token,
        redirect_url: finalRedirectUrl,
      }),
    };
  } catch (error) {
    console.error("Error during direct login generation:", error);
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
    const accountId = event.pathParameters?.accountId;
    if (!accountId) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "accountId is required in the path" }),
      };
    }

    const ssmCommand = new GetParameterCommand({
      Name: "/shipstation-demo/partner-api-key",
      WithDecryption: true,
    });
    const ssmResponse = await ssmClient.send(ssmCommand);
    const partnerApiKey = ssmResponse.Parameter.Value;

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
    const accountId = event.pathParameters?.accountId;
    if (!accountId) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "accountId is required in the path" }),
      };
    }

    const ssmCommand = new GetParameterCommand({
      Name: "/shipstation-demo/partner-api-key",
      WithDecryption: true,
    });
    const ssmResponse = await ssmClient.send(ssmCommand);
    const partnerApiKey = ssmResponse.Parameter.Value;

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
    const accountId = event.pathParameters?.accountId;
    if (!accountId) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "accountId is required in the path" }),
      };
    }

    const ssmCommand = new GetParameterCommand({
      Name: "/shipstation-demo/partner-api-key",
      WithDecryption: true,
    });
    const ssmResponse = await ssmClient.send(ssmCommand);
    const partnerApiKey = ssmResponse.Parameter.Value;

    const randomLoc =
      WAREHOUSE_LOCATIONS[
        Math.floor(Math.random() * WAREHOUSE_LOCATIONS.length)
      ];

    const warehousePayload = {
      name: randomLoc.name,
      origin_address: {
        name: randomLoc.name,
        address_line1: randomLoc.address_line1,
        city_locality: randomLoc.city,
        state_province: randomLoc.state,
        postal_code: randomLoc.postal_code,
        country_code: randomLoc.country_code,
        phone: "555-123-4567",
        email: "test@test.com",
      },
      return_address: {
        name: randomLoc.name,
        address_line1: randomLoc.address_line1,
        city_locality: randomLoc.city,
        state_province: randomLoc.state,
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
