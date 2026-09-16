# ShipStation Partner API Sales Demo

Full-stack demo of ShipStation Partner API with seamless direct login, dynamic carrier syncing, and account provisioning.

**Stack:** React + Vite (frontend) | Node.js 20 Lambda + API Gateway (backend) | DynamoDB | S3 + CloudFront

---

## Quick Setup

### Prerequisites
- Node.js 20+
- AWS CLI + credentials
- Serverless Framework: `npm install -g serverless`

### 1. AWS Parameter Store (one-time)

Store your ShipStation API credentials:

```bash
aws ssm put-parameter \
  --name "/shipstation-demo/partner-api-key" \
  --value "YOUR_API_KEY" \
  --type SecureString --overwrite

aws ssm put-parameter \
  --name "/shipstation-demo/theme-id" \
  --value "YOUR_THEME_ID" \
  --type String --overwrite
```

### 2. GitHub Actions Secrets (one-time)

Add to repository settings → Secrets and variables → Actions:

| Name | Value |
|------|-------|
| `TABLE_NAME` | `shipstation-partnerapi-demo-accounts` |
| `LOG_LEVEL` | `info` |
| `SSM_PARAM_API_KEY` | `/shipstation-demo/partner-api-key` |
| `SSM_PARAM_THEME_ID` | `/shipstation-demo/theme-id` |
| `AWS_ACCESS_KEY_ID` | (your AWS key) |
| `AWS_SECRET_ACCESS_KEY` | (your AWS secret) |
| `S3_BUCKET_NAME` | (your S3 bucket) |
| `CLOUDFRONT_DISTRIBUTION_ID` | (your CloudFront ID) |

### 3. Deploy

Push to `main` branch — GitHub Actions handles everything:
```bash
git push origin main
```

Deploy locally:
```bash
# Backend
cd backend && npm ci && serverless deploy

# Frontend
cd frontend && npm ci && npm run build
aws s3 sync dist/ s3://YOUR_BUCKET --delete
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

---

## Architecture

```
Frontend (React/Vite → S3/CloudFront)
    ↓
API Gateway
    ↓
Lambda Functions
    ↓
DynamoDB (accounts, carriers, warehouses)
    ↓
ShipStation Partner API
```

**Key Files:**
- `backend/handler.js` — 8 Lambda functions
- `backend/serverless.yml` — Infrastructure as code
- `backend/utils/validation.js` — Input validation
- `frontend/src/services/api.js` — API client

---

## Features

- ✅ One-click account provisioning with realistic demo data
- ✅ Persistent session state (localStorage)
- ✅ Dynamic carrier capability badges from ShipStation
- ✅ Secure API key handling (Lambda-side only)
- ✅ Environment-based configuration
- ✅ Automated CI/CD pipeline

---

## Testing

```bash
# Frontend unit tests
cd frontend && npm run test

# Backend validation
cd backend && node test-validation.js
```

---

## Documentation

- **Code improvements:** See `IMPROVEMENTS_ROADMAP.md`
- **Input validation:** `backend/utils/validation.js`
- **Error handling:** `backend/handler.js` (lines 38-60)
