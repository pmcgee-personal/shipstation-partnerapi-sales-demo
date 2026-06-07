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

module.exports.createAccount = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const { label, email } = body;

    if (!label || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "label and email are required" }),
      };
    }

    // 1. Securely fetch your Partner API Key from AWS SSM Parameter Store
    const ssmCommand = new GetParameterCommand({
      Name: "/shipstation-demo/partner-api-key",
      WithDecryption: true,
    });
    const ssmResponse = await ssmClient.send(ssmCommand);
    const partnerApiKey = ssmResponse.Parameter.Value;

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
        body: JSON.stringify({
          error: "ShipStation API rejected the request",
          details: errorText,
        }),
      };
    }

    const ssData = await ssResponse.json();

    // 3. Extract the REAL ShipStation account_id (We do NOT save the child API key anywhere!)
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

    // 5. Return success to the frontend
    return {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
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
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        accounts: data.Items || [],
      }),
    };
  } catch (error) {
    console.error("Error listing accounts:", error);
    return {
      statusCode: 500,
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
        body: JSON.stringify({ error: "accountId is required" }),
      };
    }

    // 2. Fetch the secure Partner API Key from AWS SSM Parameter Store
    const ssmCommand = new GetParameterCommand({
      Name: "/shipstation-demo/partner-api-key",
      WithDecryption: true,
    });
    const ssmResponse = await ssmClient.send(ssmCommand);
    const partnerApiKey = ssmResponse.Parameter.Value;

    // 3. Request the Ephemeral Token using the exact Partner API spec
    const redirectResponse = await fetch(
      "https://api.shipengine.com/v1/tokens/ephemeral?redirect=shipengine-dashboard",
      {
        method: "POST",
        headers: {
          "API-Key": partnerApiKey,
          "On-Behalf-Of": accountId.toString(), // The child account ID goes here!
          "Content-Type": "application/json",
        },
      },
    );

    if (!redirectResponse.ok) {
      const errorText = await redirectResponse.text();
      console.error("Direct Login API Error:", errorText);
      return {
        statusCode: redirectResponse.status,
        body: JSON.stringify({
          error: "Failed to generate ephemeral token",
          details: errorText,
        }),
      };
    }

    const redirectData = await redirectResponse.json();

    // We get back { "token": "...", "redirect_url": "..." }
    // Per the docs, we want to append &redirect_to=carriers so the sales rep
    // lands exactly on the carrier page, which is the core of this demo.
    const finalRedirectUrl = `${redirectData.redirect_url}&redirect_to=carriers`;

    // 4. Return the ephemeral redirect URL to the frontend
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Required for CORS
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({
        token: redirectData.token,
        redirect_url: finalRedirectUrl,
      }),
    };
  } catch (error) {
    console.error("Error during direct login generation:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal Server Error during direct login generation",
      }),
    };
  }
};
module.exports.listCarriers = async (event) => {
  try {
    // 1. Extract the dynamic {accountId} from the URL path
    const accountId = event.pathParameters?.accountId;

    if (!accountId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "accountId is required in the path" }),
      };
    }

    // 2. Fetch the secure Partner API Key from AWS SSM
    const ssmCommand = new GetParameterCommand({
      Name: "/shipstation-demo/partner-api-key",
      WithDecryption: true,
    });
    const ssmResponse = await ssmClient.send(ssmCommand);
    const partnerApiKey = ssmResponse.Parameter.Value;

    // 3. Request the connected carriers list ON BEHALF OF the child account
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
        body: JSON.stringify({
          error: "Failed to fetch carriers from ShipStation API",
          details: errorText,
        }),
      };
    }

    const carriersData = await carriersResponse.json();

    // 4. Return the list of carriers to the frontend
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // Required for CORS
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify(carriersData),
    };
  } catch (error) {
    console.error("Error listing carriers:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal Server Error during carrier fetch",
      }),
    };
  }
};
