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
│  └─ Warehouse Locations: Add locations  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  AWS API Gateway + Lambda (Node.js 20)  │
│  ├─ requestOtp, verifyOtp (public)      │
│  ├─ createAccount, listAccounts   ┐     │
│  ├─ directLogin (to ShipStation)  ├ Cognito-authorized
│  ├─ listCarriers, listWarehouses  │     │
│  └─ createWarehouse               ┘     │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┼──────────┬──────────┐
        ▼         ▼          ▼          ▼
    DynamoDB   Cognito    ShipStation  AWS SSM
    (accounts) (OTP auth)  (carriers)  (secrets)
```

**Tech Stack:**

- **Frontend:** React 18 + Vite + TailwindCSS
- **Backend:** Node.js 20 + AWS Lambda + API Gateway
- **Auth:** Amazon Cognito passwordless email OTP + Cognito API Gateway authorizer
- **Database:** DynamoDB
- **Storage:** S3 + CloudFront
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
│   │   ├── shells/               # Page containers
│   │   │   ├─ CarrierSettings.jsx
│   │   │   ├─ CarrierTableSection.jsx
│   │   │   ├─ WarehouseLocationsSection.jsx
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
