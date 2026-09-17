/**
 * Cognito-backed passwordless email OTP authentication.
 * Users are provisioned on demand (AdminCreateUser) only for allow-listed
 * emails, then signed in with Cognito's native EMAIL_OTP first factor
 * (USER_AUTH flow). Cognito generates, delivers, and verifies the code
 * itself, so no SES setup or custom challenge Lambdas are required.
 */
const {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminGetUserCommand,
  AdminInitiateAuthCommand,
  AdminRespondToAuthChallengeCommand,
} = require("@aws-sdk/client-cognito-identity-provider");

const cognitoClient = new CognitoIdentityProviderClient({});

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;

// Access is restricted to a single allow-listed address and an entire
// email domain (case-insensitive), both configurable via environment.
const ALLOWED_EMAIL = (process.env.ALLOWED_EMAIL || "p.mcgee1986@gmail.com").trim().toLowerCase();
const ALLOWED_EMAIL_DOMAIN = (process.env.ALLOWED_EMAIL_DOMAIN || "@shipstation.com").trim().toLowerCase();

/**
 * Check whether an email is permitted to sign in to this demo.
 * @param {string} email - Email address to check
 * @returns {boolean}
 */
function isAllowedEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  return normalized === ALLOWED_EMAIL || normalized.endsWith(ALLOWED_EMAIL_DOMAIN);
}

/**
 * Ensure a Cognito user exists for this email, creating one on first sign-in.
 * Email is marked verified at creation time since we've already restricted
 * sign-in to allow-listed addresses; Cognito still proves ownership via OTP.
 * @param {string} email - Email address to provision
 * @returns {Promise<void>}
 */
async function ensureUserExists(email) {
  try {
    await cognitoClient.send(
      new AdminGetUserCommand({ UserPoolId: USER_POOL_ID, Username: email }),
    );
  } catch (error) {
    if (error.name !== "UserNotFoundException") throw error;
    await cognitoClient.send(
      new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        UserAttributes: [
          { Name: "email", Value: email },
          { Name: "email_verified", Value: "true" },
        ],
        MessageAction: "SUPPRESS",
        DesiredDeliveryMediums: ["EMAIL"],
      }),
    );
  }
}

/**
 * Start a passwordless sign-in, triggering Cognito to email a one-time code.
 * @param {string} email - Email address to sign in
 * @returns {Promise<{challengeName: string, session: string}>}
 */
async function startEmailOtp(email) {
  const result = await cognitoClient.send(
    new AdminInitiateAuthCommand({
      UserPoolId: USER_POOL_ID,
      ClientId: CLIENT_ID,
      AuthFlow: "USER_AUTH",
      AuthParameters: {
        USERNAME: email,
        PREFERRED_CHALLENGE: "EMAIL_OTP",
      },
    }),
  );
  return { challengeName: result.ChallengeName, session: result.Session };
}

/**
 * Verify a one-time code and complete sign-in.
 * @param {string} email - Email address signing in
 * @param {string} code - Code the user received by email
 * @param {string} session - Session token from startEmailOtp
 * @returns {Promise<{challengeName: string, session: string, tokens: object|null}>}
 */
async function verifyEmailOtp(email, code, session) {
  const result = await cognitoClient.send(
    new AdminRespondToAuthChallengeCommand({
      UserPoolId: USER_POOL_ID,
      ClientId: CLIENT_ID,
      ChallengeName: "EMAIL_OTP",
      ChallengeResponses: {
        USERNAME: email,
        EMAIL_OTP_CODE: code,
      },
      Session: session,
    }),
  );
  return {
    challengeName: result.ChallengeName,
    session: result.Session,
    tokens: result.AuthenticationResult || null,
  };
}

module.exports = {
  isAllowedEmail,
  ensureUserExists,
  startEmailOtp,
  verifyEmailOtp,
};
