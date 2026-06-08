# ShipStation Partner API Sales Demo

## Overview

This repository contains a full-stack, live demonstration of the ShipStation Partner API. It showcases the "Seamless Direct Login" flow, dynamic carrier syncing, and auto-provisioning of child accounts.

The architecture is split into two parts:

1. **Backend:** AWS Serverless (Node.js v20, API Gateway, Lambda, DynamoDB).
2. **Frontend:** React/Vite application hosted on AWS S3 + CloudFront, featuring a swappable WMS layout engine.

---

## 🛠 Backend Deployment

### Prerequisites

- Node.js 20+
- AWS CLI configured with administrator access
- Serverless Framework globally installed (`npm install -g serverless`)

### 1. Configure AWS SSM Parameter Store

The backend requires two secure parameters to function. Run these AWS CLI commands to set them up in your AWS environment (replace `YOUR_API_KEY` and `YOUR_THEME_ID` with actual values):

````bash
# 1. Store your ShipStation Partner API Key (SecureString)
aws ssm put-parameter \
  --name "/shipstation-demo/partner-api-key" \
  --value "YOUR_API_KEY_HERE" \
  --type SecureString \
  --overwrite

# 2. Store your ShipStation Theme ID (String)
aws ssm put-parameter \
  --name "/shipstation-demo/theme-id" \
  --value "YOUR_THEME_ID_HERE" \
  --type String \
  --overwrite


### 2. Deploy to AWS
Navigate to the backend directory, install dependencies, and deploy:

```bash
cd backend
npm install
serverless deploy
````

_Note: Once deployment is successful, the terminal will output your API Gateway URL. Copy this URL for the frontend setup._

---

## 💻 Frontend Deployment

### 1. Environment Setup

The frontend needs to know where your backend API lives.

Navigate to the `frontend` directory and create a `.env.local` file:

```bash
cd frontend
touch .env.local
```

Open .env.local and add your unique API Gateway URL (provided by the Serverless deploy output in the previous step):

```env
VITE_API_BASE_URL=https://YOUR_API_GATEWAY_ID.execute-api.us-west-2.amazonaws.com/dev
```

### 2. Build and Deploy to S3

Compile the React code and sync it to the AWS S3 hosting bucket:

```bash
# Build the production files
npm run build

# Sync the dist folder to the S3 bucket
aws s3 sync dist/ s3://YOUR_S3_BUCKET_NAME --delete
```

### 3. Invalidate CloudFront Cache

To ensure users instantly see the latest deployment on the live domain, clear the CloudFront cache:

```bash
aws cloudfront create-invalidation --distribution-id YOUR_CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
```

### 4. Running Tests 🧪

The frontend has a fully automated unit and UI component test suite powered by Vitest and React Testing Library. To run tests locally:

````bash
cd frontend
# Run tests once
npm run test

# Run tests in watch mode (interactive)
npm run test:watch
---

## 📂 File Structure

```text
/
├── backend/                       ← Serverless API Framework
│   ├── handler.js                 ← Lambda functions (Accounts, Direct Login, Carriers)
│   └── serverless.yml             ← AWS infrastructure as code (DynamoDB, IAM, API Gateway)
│
└── frontend/                      ← React / Vite Application
    ├── src/
    │   ├── components/            ← Global components (DemoBar, CarrierTable)
    │   ├── services/              ← API client logic (api.js)
    │   └── shells/modern-wms/     ← Swappable "Mock" WMS Layouts (Layout.jsx, CarrierSettings.jsx)
    ├── .env.local                 ← Local environment variables (API URL)
    └── package.json
````

## ✨ Core Features

- **One-Click Account Provisioning:** Automatically generates realistic demo companies and provisions real ShipStation API accounts with Locations (warehouses), Carriers and Ship Vias
- **Persistent Sessions:** Utilizes `localStorage` to perfectly maintain the active demo state when returning from the ShipStation API portal.
- **Carrier Capability Badges:** Dynamically parses ShipStation API data to show valid domestic, international, and return services.
- **Secure Architecture:** Partner API keys are never exposed to the frontend; all ShipStation API calls route securely through AWS Lambda.
