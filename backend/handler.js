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
