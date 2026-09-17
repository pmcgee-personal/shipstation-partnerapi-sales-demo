# ShipStation Partner API Sales Demo

A full-stack test harness demonstrating ShipStation Partner API integration with account provisioning and carrier management.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│  React Frontend (Vite)                  │
│  ├─ Dashboard: Account creation         │
│  ├─ Carrier Settings: Sync & connect    │
│  └─ Warehouse Locations: Add locations  │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  AWS API Gateway + Lambda (Node.js 20)  │
│  ├─ createAccount, listAccounts         │
│  ├─ directLogin (to ShipStation)        │
│  ├─ listCarriers, listWarehouses        │
│  └─ createWarehouse                     │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴──────────┬──────────┐
        ▼                    ▼          ▼
    DynamoDB          ShipStation    AWS SSM
    (accounts)        (carriers)     (secrets)
```

**Tech Stack:**

- **Frontend:** React 18 + Vite + TailwindCSS
- **Backend:** Node.js 20 + AWS Lambda + API Gateway
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
│   │   │   └─ DemoBar.jsx
│   │   ├── shells/               # Page containers
│   │   │   ├─ CarrierSettings.jsx
│   │   │   ├─ CarrierTableSection.jsx
│   │   │   ├─ WarehouseLocationsSection.jsx
│   │   │   └─ Layout.jsx
│   │   ├── services/
│   │   │   └─ api.js             # API client
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
