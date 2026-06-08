const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  GetCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");
const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
const ssmClient = new SSMClient({});

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
    Name: "/shipstation-demo/partner-api-key",
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

    const { label, email } = bodyData;

    // Echo the exact payload back to the frontend error log
    if (!label || !email) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: `label and email are required. Backend received this payload: ${JSON.stringify(bodyData)}`,
        }),
      };
    }

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

    let defaultShipVias = [];
    try {
      const carriersResponse = await fetch(
        "https://api.shipengine.com/v1/carriers",
        {
          headers: {
            "API-Key": partnerApiKey,
            "On-Behalf-Of": shipstation_account_id,
          },
        },
      );
      if (carriersResponse.ok) {
        const { carriers } = await carriersResponse.json();
        const uspsCarrier = carriers.find(
          (c) => c.carrier_code === "stamps_com" && c.primary,
        );
        if (uspsCarrier) {
          defaultShipVias.push({
            ship_via_code: "USPSGA",
            carrier_id: uspsCarrier.carrier_id,
            service_code: "usps_ground_advantage",
          });
          console.log(
            `Successfully mapped USPSGA to carrier_id: ${uspsCarrier.carrier_id}`,
          );
        }
      } else {
        console.error(
          "Could not fetch carriers to auto-provision Ship Via:",
          await carriersResponse.text(),
        );
      }
    } catch (svError) {
      console.error(
        "Error during auto-provisioning of Ship Via default:",
        svError,
      );
    }

    const params = {
      TableName: "shipstation-partnerapi-demo-accounts",
      Item: {
        account_id: shipstation_account_id,
        label,
        email,
        created_at: new Date().toISOString(),
        shipVias: defaultShipVias,
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
    const params = { TableName: "shipstation-partnerapi-demo-accounts" };
    const data = await docClient.send(new ScanCommand(params));
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ accounts: data.Items || [] }),
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

module.exports.getAccount = async (event) => {
  try {
    const { accountId } = event.pathParameters;
    if (!accountId)
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "accountId is required" }),
      };
    const data = await docClient.send(
      new GetCommand({
        TableName: "shipstation-partnerapi-demo-accounts",
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

module.exports.addShipVia = async (event) => {
  try {
    const { accountId } = event.pathParameters;
    const body = JSON.parse(event.body || "{}");
    const { ship_via_code, carrier_id, service_code } = body;

    if (!accountId || !ship_via_code || !carrier_id || !service_code) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error:
            "Missing required fields: ship_via_code, carrier_id, and service_code are all required.",
        }),
      };
    }

    const { Item } = await docClient.send(
      new GetCommand({
        TableName: "shipstation-partnerapi-demo-accounts",
        Key: { account_id: accountId },
      }),
    );
    if (!Item)
      return {
        statusCode: 404,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Account not found" }),
      };

    const shipVias = Item.shipVias || [];
    if (
      shipVias.some(
        (sv) => sv.ship_via_code.toLowerCase() === ship_via_code.toLowerCase(),
      )
    ) {
      return {
        statusCode: 409,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: `Ship Via code '${ship_via_code}' already exists for this account.`,
        }),
      };
    }

    const newShipVias = [
      ...shipVias,
      { ship_via_code, carrier_id, service_code },
    ];

    await docClient.send(
      new UpdateCommand({
        TableName: "shipstation-partnerapi-demo-accounts",
        Key: { account_id: accountId },
        UpdateExpression: "SET shipVias = :sv",
        ExpressionAttributeValues: { ":sv": newShipVias },
      }),
    );

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ shipVias: newShipVias }),
    };
  } catch (error) {
    console.error("Error adding Ship Via:", error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: "Internal Server Error while adding Ship Via.",
      }),
    };
  }
};

module.exports.deleteShipVia = async (event) => {
  try {
    const { accountId, shipViaCode } = event.pathParameters;
    if (!accountId || !shipViaCode)
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: "accountId and shipViaCode are required in the path.",
        }),
      };

    const { Item } = await docClient.send(
      new GetCommand({
        TableName: "shipstation-partnerapi-demo-accounts",
        Key: { account_id: accountId },
      }),
    );
    if (!Item)
      return {
        statusCode: 404,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Account not found" }),
      };

    const newShipVias = (Item.shipVias || []).filter(
      (sv) => sv.ship_via_code.toLowerCase() !== shipViaCode.toLowerCase(),
    );

    await docClient.send(
      new UpdateCommand({
        TableName: "shipstation-partnerapi-demo-accounts",
        Key: { account_id: accountId },
        UpdateExpression: "SET shipVias = :sv",
        ExpressionAttributeValues: { ":sv": newShipVias },
      }),
    );

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ shipVias: newShipVias }),
    };
  } catch (error) {
    console.error("Error deleting Ship Via:", error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: "Internal Server Error while deleting Ship Via.",
      }),
    };
  }
};

module.exports.directLogin = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { accountId } = body;

    if (!accountId) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "accountId is required" }),
      };
    }

    const partnerApiKey = await getPartnerApiKey();
    const themeIdResponse = await ssmClient
      .send(
        new GetParameterCommand({
          Name: "/shipstation-demo/theme-id",
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
    const accountId = event.pathParameters?.accountId;
    if (!accountId) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "accountId is required in the path" }),
      };
    }
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
    const accountId = event.pathParameters?.accountId;
    if (!accountId) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "accountId is required in the path" }),
      };
    }
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
