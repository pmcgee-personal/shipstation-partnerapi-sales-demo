const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const crypto = require("crypto"); // Built-in Node tool to generate unique IDs

// Connect to DynamoDB
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

module.exports.createAccount = async (event) => {
  try {
    // 1. Read the data sent from the frontend
    const body = JSON.parse(event.body || "{}");
    const { label, email } = body;

    if (!label || !email) {
      return { 
        statusCode: 400, 
        body: JSON.stringify({ error: "label and email are required" }) 
      };
    }

    // 2. Generate a unique ID and a timestamp
    const account_id = crypto.randomUUID();
    const created_at = new Date().toISOString();

    // NOTE: This is where we will eventually add the fetch() call to the ShipStation API
    // to actually provision the child account using your Partner API key.
    // For this exact moment, we are just saving it to DynamoDB to test the AWS connection.

    // 3. Save it to our DynamoDB table
    const params = {
      TableName: "shipstation-partnerapi-demo-accounts",
      Item: {
        account_id: account_id,
        label: label,
        email: email,
        created_at: created_at,
      },
    };

    await docClient.send(new PutCommand(params));

    // 4. Return success message back to the frontend
    return {
      statusCode: 201,
      headers: {
        "Access-Control-Allow-Origin": "*", // Required for CORS (so frontend can talk to it)
        "Access-Control-Allow-Credentials": true,
      },
      body: JSON.stringify({ 
        message: "Demo account saved to database!", 
        account_id: account_id, 
        label: label, 
        email: email 
      }),
    };
    
  } catch (error) {
    console.error("Error creating account:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Could not create account in DynamoDB" }),
    };
  }
};

