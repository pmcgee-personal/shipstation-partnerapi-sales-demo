const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");

const ssmClient = new SSMClient({});

const SSM_PARAM_API_KEY = process.env.SSM_PARAM_API_KEY || '/shipstation-demo/partner-api-key';
const SSM_PARAM_THEME_ID = process.env.SSM_PARAM_THEME_ID || '/shipstation-demo/theme-id';

let cachedPartnerApiKey = null;
let cachedThemeId = null;

/**
 * Get Partner API Key from AWS Systems Manager Parameter Store
 * Uses caching to reduce SSM calls
 * @returns {Promise<string>} Partner API Key
 */
async function getPartnerApiKey() {
  if (cachedPartnerApiKey) {
    return cachedPartnerApiKey;
  }

  try {
    const response = await ssmClient.send(
      new GetParameterCommand({
        Name: SSM_PARAM_API_KEY,
        WithDecryption: true,
      }),
    );
    cachedPartnerApiKey = response.Parameter.Value;
    return cachedPartnerApiKey;
  } catch (error) {
    console.error("Failed to retrieve Partner API Key from SSM:", error);
    throw new Error("Failed to retrieve Partner API Key");
  }
}

/**
 * Get Theme ID from AWS Systems Manager Parameter Store
 * Used for branded ShipStation experience
 * @returns {Promise<string>} Theme ID
 */
async function getThemeId() {
  try {
    const response = await ssmClient.send(
      new GetParameterCommand({
        Name: SSM_PARAM_THEME_ID,
        WithDecryption: false,
      }),
    );
    return response.Parameter.Value || "";
  } catch (error) {
    console.warn("Theme ID not configured in SSM:", error.message);
    return "";
  }
}

/**
 * Fetch carriers from ShipEngine API
 * @param {string} accountId - ShipStation account ID
 * @param {string} apiKey - Partner API key
 * @returns {Promise<Array>} List of carriers
 */
async function fetchCarriersFromShipEngine(accountId, apiKey) {
  const response = await fetch("https://api.shipengine.com/v1/carriers", {
    headers: {
      "API-Key": apiKey,
      "On-Behalf-Of": accountId,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch carriers from ShipEngine");
  }

  const data = await response.json();
  return data.carriers || [];
}

/**
 * Generate ephemeral token for direct login to ShipStation
 * @param {string} accountId - ShipStation account ID
 * @param {string} apiKey - Partner API key
 * @returns {Promise<Object>} Token and redirect URL
 */
async function generateEphemeralToken(accountId, apiKey) {
  const response = await fetch(
    "https://api.shipengine.com/v1/tokens/ephemeral?redirect=shipengine-dashboard",
    {
      method: "POST",
      headers: {
        "API-Key": apiKey,
        "On-Behalf-Of": accountId.toString(),
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ShipEngine API error: ${errorText}`);
  }

  return response.json();
}

module.exports = {
  getPartnerApiKey,
  getThemeId,
  fetchCarriersFromShipEngine,
  generateEphemeralToken,
};
