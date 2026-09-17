const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  GetCommand,
  UpdateCommand,
} = require("@aws-sdk/lib-dynamodb");

// Initialize DynamoDB client
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.TABLE_NAME || 'shipstation-partnerapi-demo-accounts';

/**
 * Create a new account in DynamoDB
 * @param {Object} accountData - Account data to create
 * @returns {Promise<void>}
 */
async function createAccount(accountData) {
  const params = {
    TableName: TABLE_NAME,
    Item: accountData,
  };
  return docClient.send(new PutCommand(params));
}

/**
 * Get all accounts from DynamoDB
 * @returns {Promise<Array>} List of accounts
 */
async function getAllAccounts() {
  const params = {
    TableName: TABLE_NAME,
  };
  const data = await docClient.send(new ScanCommand(params));
  return data.Items || [];
}

/**
 * Get a single account by ID
 * @param {string} accountId - Account ID to retrieve
 * @returns {Promise<Object>} Account data
 */
async function getAccountById(accountId) {
  const params = {
    TableName: TABLE_NAME,
    Key: { account_id: accountId },
  };
  return docClient.send(new GetCommand(params));
}

/**
 * Update an account in DynamoDB
 * @param {string} accountId - Account ID to update
 * @param {string} updateExpression - DynamoDB update expression
 * @param {Object} expressionAttributeValues - Values for the expression
 * @returns {Promise<void>}
 */
async function updateAccount(accountId, updateExpression, expressionAttributeValues) {
  const params = {
    TableName: TABLE_NAME,
    Key: { account_id: accountId },
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
  };
  return docClient.send(new UpdateCommand(params));
}

module.exports = {
  docClient,
  TABLE_NAME,
  createAccount,
  getAllAccounts,
  getAccountById,
  updateAccount,
};
