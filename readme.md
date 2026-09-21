# ShipStation Partner API Sales Demo

A full-stack test harness demonstrating ShipStation Partner API integration with account provisioning and carrier management.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│  React Frontend (Vite)                  │
│  ├─ Login Gate: Cognito email OTP       │
│  ├─ Dashboard: Account creation         │
│  ├─ Carrier Settings: Sync & connect    │
│  ├─ Warehouse Locations: Add locations  │
│  └─ Account Settings: ShipEngine        │
│     Elements (carriers, external        │
│     carriers, payment, warehouses)      │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  AWS API Gateway + Lambda (Node.js 20)  │
│  ├─ requestOtp, verifyOtp (public)      │
│  ├─ createAccount, listAccounts   ┐     │
│  ├─ directLogin (to ShipStation)  │     │
│  ├─ listCarriers, listWarehouses  ├ Cognito-authorized
│  ├─ createWarehouse               │     │
│  └─ generateElementsToken         ┘     │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┼──────────┬──────────┐
        ▼         ▼          ▼          ▼
    DynamoDB   Cognito    ShipStation  AWS SSM
    (accounts) (OTP auth)  + Elements  (secrets)
                            (carriers,
                             JWT signing key)
```

**Tech Stack:**

- **Frontend:** React 18 + Vite + TailwindCSS
- **Backend:** Node.js 20 + AWS Lambda + API Gateway
- **Auth:** Amazon Cognito passwordless email OTP + Cognito API Gateway authorizer
- **Database:** DynamoDB
- **Storage:** S3 + CloudFront
- **Elements:** `@shipengine/elements` (Account Settings, Connect External
  Carrier, Manage External Carriers React components)
- **Testing:** Cypress (E2E)

---

## 📁 Project Structure

```
shipstation-partnerapi-sales-demo/
├── frontend/
│   ├── src/
│   │   ├── components/           # UI components
│   │   │   ├─ CarrierTable.jsx
│   │   │   ├─ LocationTable.jsx
│   │   │   ├─ LoginGate.jsx      # OTP login gate
│   │   │   └─ DemoBar.jsx
│   │   ├─ shells/               # Page containers
│   │   │   ├─ CarrierSettings.jsx
│   │   │   ├─ CarrierTableSection.jsx
│   │   │   ├─ WarehouseLocationsSection.jsx
│   │   │   ├─ AccountSettingsElement.jsx  # ShipEngine Elements page
│   │   │   └─ Layout.jsx
│   │   ├── services/
│   │   │   ├─ api.js             # API client
│   │   │   └─ auth.js            # Local session storage for the OTP login
│   │   └── App.jsx
│   ├── cypress/
│   │   └── e2e/                  # E2E tests
│   └── package.json
│
├── backend/
│   ├── handler.js                # Lambda handlers
│   ├── serverless.yml            # Infrastructure
│   ├── utils/
│   │   ├─ validation.js
│   │   ├─ auth.js                # Cognito OTP helpers
│   │   ├─ database.js
│   │   ├─ warehouse.js
│   │   └─ api-clients.js
│   └── package.json
│
└── .github/workflows/
    └── deploy.yml
```

---

## 🚀 Quick Start

### Install Dependencies

```bash
cd frontend && npm install
cd ../backend && npm install
```

### Local Development

**Frontend:**

```bash
cd frontend && npm run dev
```

**Backend (requires AWS credentials):**

```bash
cd backend && serverless deploy
```

### Configure AWS Secrets

```bash
aws ssm put-parameter \
  --name "/shipstation-demo/partner-api-key" \
  --value "YOUR_PARTNER_API_KEY" \
  --type SecureString --overwrite

aws ssm put-parameter \
  --name "/shipstation-demo/theme-id" \
  --value "YOUR_THEME_ID" \
  --type String --overwrite
```

ShipEngine Elements (Account Settings page) needs a private key for JWT
signing, plus four partner-onboarding values:

```bash
aws ssm put-parameter \
  --name "/shipstation-demo/elements/private-key" \
  --value "$(cat /path/to/private.pem)" \
  --type SecureString --overwrite
```

`SHIPENGINE_PARTNER_ID`, `SHIPENGINE_SCOPE`, `SHIPENGINE_PLATFORM_ISSUER`,
and `SHIPENGINE_PLATFORM_KEY_ID` are provided by your ShipEngine technical
contact during partner onboarding. They're stored as GitHub Actions repo
secrets and passed into `serverless deploy` by `.github/workflows/deploy.yml`;
for a manual local deploy, export them as shell env vars first.

Sign-in is restricted to an allow-list checked by the `requestOtp` handler.
Defaults live in `backend/serverless.yml` (`ALLOWED_EMAIL`,
`ALLOWED_EMAIL_DOMAIN`) and can be overridden per deploy:

```bash
ALLOWED_EMAIL="you@example.com" ALLOWED_EMAIL_DOMAIN="@yourcompany.com" serverless deploy
```

No SES setup is required: Cognito's built-in email service delivers the
one-time codes.

---

## 🧪 Testing

**Unit Tests:**

```bash
cd frontend && npm run test
```

**E2E Tests (Cypress):**

```bash
cd frontend && npm run cypress:run
```

---

## 📝 What We Built

### Auth

- `POST /api/auth/request-code` — Send an email OTP (allow-listed emails only, public)
- `POST /api/auth/verify-code` — Verify the OTP and issue a Cognito ID token (public)

All other endpoints below require that ID token in the `Authorization` header
(enforced by a Cognito API Gateway authorizer).

### Accounts

- `POST /api/accounts` — Create new account
- `GET /api/accounts` — List all accounts
- `GET /api/accounts/{accountId}` — Get account details

### Carriers

- `POST /api/direct-login` — Get ShipStation direct login URL
- `GET /api/carriers/{accountId}` — List carriers for account

### Warehouses

- `GET /api/warehouses/{accountId}` — List warehouse locations
- `POST /api/warehouses/{accountId}` — Create new warehouse

### ShipEngine Elements

- `GET /api/elements-token/{accountId}` — Sign a short-lived (1hr) ShipEngine
  Elements Platform JWT (RS256) for the given seller account, using
  `jsonwebtoken` and a private key held server-side only (AWS SSM
  SecureString). Never exposed to the browser.

The "Account Settings" nav page (`AccountSettingsElement.jsx`) wraps this
token endpoint in `ElementsProvider` and renders three `@shipengine/elements`
React components side by side:

- `AccountSettings.Element` — carriers, external carriers, payment method,
  warehouses, units, and label layout in one workflow (default view, no
  feature overrides)
- `ConnectExternalCarrier.Element` — connect a new external carrier account
  (picker built from `enabledExternalCarriers`)
- `ManageExternalCarriers.Element` — view/manage already-connected external
  carrier accounts, stacked underneath Connect External Carrier

`AccountSettings.Element` and the `ConnectExternalCarrier`/`ManageExternalCarriers`
pair each mount into their own `container` ref (two containers, side by
side) so they get separate shadow roots (`ElementsProvider`'s `container`
prop controls where its shadow root attaches; left unset, every Element
under one provider shares one implicit `elements-container` shadow root and
stacks regardless of any outer layout CSS). Connect and Manage External
Carrier intentionally share one container since they're meant to stack
within the same column.

**CSP note:** this app doesn't currently set a Content-Security-Policy
header/meta tag, so the Elements payment-method iframe
(`https://elements-payments.shipstation.com`) renders fine as-is. If a CSP
is ever added (e.g. via a CloudFront response-headers policy), it must
include `frame-src https://elements-payments.shipstation.com` or that
section of Account Settings will render blank with a console CSP error.
