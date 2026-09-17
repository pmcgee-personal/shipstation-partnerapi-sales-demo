# ShipStation Partner API Sales Demo

A full-stack application demonstrating ShipStation Partner API integration with account provisioning, carrier management, and warehouse location tracking.

**Live Demo:** https://shipstation-demo.example.com (configure CloudFront URL)

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
- **Frontend:** React 18 + Vite + TailwindCSS + Lucide icons
- **Backend:** Node.js 20 + AWS Lambda + API Gateway
- **Database:** DynamoDB
- **Storage:** S3 + CloudFront
- **Testing:** Vitest (unit) + Cypress (E2E)
- **CI/CD:** GitHub Actions

---

## 📁 Project Structure

```
shipstation-partnerapi-sales-demo/
├── frontend/
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   │   ├─ CarrierTable.jsx
│   │   │   ├─ LocationTable.jsx
│   │   │   └─ DemoBar.jsx
│   │   ├── shells/               # Page containers
│   │   │   ├─ CarrierSettings.jsx
│   │   │   ├─ CarrierTableSection.jsx    (refactored)
│   │   │   ├─ WarehouseLocationsSection.jsx (refactored)
│   │   │   └─ Layout.jsx
│   │   ├── services/
│   │   │   └─ api.js             # API client
│   │   └── App.jsx
│   ├── cypress/
│   │   ├── e2e/                  # E2E tests
│   │   │   ├─ create-account.cy.js
│   │   │   ├─ carrier-settings.cy.js
│   │   │   └─ warehouse-locations.cy.js
│   │   └── support/
│   ├── package.json
│   └── cypress.config.js
│
├── backend/
│   ├── handler.js                # Lambda handlers (648 lines)
│   ├── serverless.yml            # IaC + CloudWatch alarms
│   ├── utils/
│   │   ├─ validation.js          # Input validation
│   │   ├─ database.js            # DynamoDB operations (refactored)
│   │   ├─ warehouse.js           # Warehouse utilities (refactored)
│   │   └─ api-clients.js         # External API clients (refactored)
│   └── package.json
│
├── README.md                      # This file
├── IMPROVEMENTS_ROADMAP.md        # Development roadmap
└── .github/workflows/
    └── deploy.yml                 # Automated CI/CD
```

---

## 🚀 Quick Start

### Prerequisites

```bash
node --version  # v20.0+
npm --version   # v10.0+
```

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/shipstation-partnerapi-sales-demo.git
cd shipstation-partnerapi-sales-demo

# Frontend
cd frontend && npm install
cd ../

# Backend
cd backend && npm install
cd ../
```

### 2. Local Development

**Start Frontend:**
```bash
cd frontend
npm run dev
# Opens http://localhost:5173
```

**Start Backend (requires AWS credentials):**
```bash
cd backend
# Deploy locally (or use serverless-offline for emulation)
serverless deploy
```

### 3. Configure AWS Secrets (one-time)

Store ShipStation credentials in AWS Systems Manager Parameter Store:

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

### 4. GitHub Actions Setup (for CI/CD)

Add these secrets to GitHub Actions (`Settings → Secrets and variables → Actions`):

| Secret | Value |
|--------|-------|
| `AWS_ACCESS_KEY_ID` | Your AWS access key |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key |
| `TABLE_NAME` | `shipstation-partnerapi-demo-accounts` |
| `LOG_LEVEL` | `info` |
| `SSM_PARAM_API_KEY` | `/shipstation-demo/partner-api-key` |
| `SSM_PARAM_THEME_ID` | `/shipstation-demo/theme-id` |
| `S3_BUCKET_NAME` | Your S3 bucket for frontend |
| `CLOUDFRONT_DISTRIBUTION_ID` | Your CloudFront distribution ID |

---

## 🧪 Testing

### Unit Tests

```bash
cd frontend
npm run test              # Run all tests once
npm run test:watch       # Watch mode during development
```

**Coverage:** UI components, utilities, API client
- ✅ 10 tests passing
- ✅ CarrierTable, LocationTable, DemoUtils

### E2E Tests (Cypress)

```bash
cd frontend

# Interactive mode (opens Cypress UI)
npm run cypress

# Headless mode (CI/CD)
npm run cypress:run
```

**Test Coverage:**
- ✅ **Create Account** — Form validation, API integration, error handling
- ✅ **Carrier Settings** — Load carriers, sync data, display errors
- ✅ **Warehouse Locations** — List warehouses, add new locations, error states

---

## 📊 Code Quality

### Linting

```bash
cd frontend
npm run lint        # Check ESLint violations
```

### Build Verification

```bash
# Frontend
cd frontend && npm run build

# Backend (syntax check)
cd backend && node -c handler.js
```

---

## 🔄 Development Workflow

### Creating a Feature Branch

```bash
git checkout -b feature/my-feature
# Make changes...
git add .
git commit -m "Add my feature"
git push origin feature/my-feature
```

### Local Testing Before Merge

```bash
# 1. Run unit tests
npm run test

# 2. Run E2E tests
npm run cypress:run

# 3. Build
npm run build

# 4. Syntax check (backend)
cd backend && node -c handler.js
```

### Automated Deployment

Push to `main` → GitHub Actions automatically:
1. ✅ Runs linting
2. ✅ Runs unit tests
3. ✅ Builds frontend
4. ✅ Deploys backend to Lambda
5. ✅ Deploys frontend to S3/CloudFront

---

## 📈 Roadmap Status

| Priority | Feature | Status |
|----------|---------|--------|
| 1 | Input Validation | ✅ Complete |
| 2 | Environment Configuration | ✅ Complete |
| 3 | Monitoring & Logging | ✅ Complete (CloudWatch alarms) |
| 4 | Code Structure | ✅ Complete (React components + utilities) |
| 5 | E2E Tests | ✅ Complete (Cypress) |
| 6 | TypeScript | ⏳ Optional |

See `IMPROVEMENTS_ROADMAP.md` for detailed progress.

---

## 🔐 Security Features

- ✅ **API Key Storage:** Secrets in AWS Systems Manager (never in code)
- ✅ **CORS Enabled:** Restricts cross-origin requests
- ✅ **Input Validation:** All user inputs validated server-side
- ✅ **Error Handling:** Generic error messages (no sensitive data leaks)
- ✅ **Environment Variables:** Configuration externalized

---

## 📝 API Endpoints

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

---

## 🐛 Troubleshooting

### Local Development Issues

**Port 5173 already in use:**
```bash
lsof -i :5173          # Find process
kill -9 <PID>          # Kill it
npm run dev            # Try again
```

**API calls failing (CORS):**
- Ensure backend is deployed or serverless-offline is running
- Check `VITE_API_BASE_URL` in `frontend/.env.local`

**Tests failing:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run test
```

### AWS Deployment Issues

**CloudFormation errors:**
- Check GitHub Actions secrets are set correctly
- Verify AWS credentials have IAM permissions
- Check CloudWatch Logs in AWS Console

**Lambda function errors:**
```bash
# View logs
aws logs tail /aws/lambda/shipstation-partnerapi-sales-demo-dev-createAccount --follow
```

---

## 📚 Documentation

- **[Improvements Roadmap](./IMPROVEMENTS_ROADMAP.md)** — Development plans
- **[Input Validation](./backend/utils/validation.js)** — Validation rules
- **[API Client](./frontend/src/services/api.js)** — API integration
- **[Error Handling](./backend/handler.js#L40-L60)** — Error patterns

---

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes following code structure guidelines
3. Run tests: `npm run test && npm run cypress:run`
4. Commit: `git commit -m "Add feature"`
5. Push: `git push origin feature/my-feature`
6. Open Pull Request

---

## 📞 Support

- **Issues:** GitHub Issues
- **Docs:** See `IMPROVEMENTS_ROADMAP.md`
- **ShipStation API:** https://docs.shipstation.com/

---

**Last Updated:** 2026-09-16 | **Version:** 1.0.0 | **Status:** Production Ready
