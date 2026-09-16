# Code Improvements Roadmap

## ✅ COMPLETED (Current Session)

### Error Handling (Commit: 0e6b48f)
- Backend: Specific HTTP status codes, structured logging, centralized error handler
- Frontend: 10s request timeout, retry logic (2 attempts, exponential backoff)
- UI: Specific error messages to users
- **Status:** Live and working

### Linting & Code Quality (Commits: 08d5217, e2d80ef)
- Fixed 31 linting errors (unused React imports, missing PropTypes, unescaped entities)
- Added prop-types package
- **Status:** All tests passing, 0 errors, 1 expected warning

### CI/CD Pipeline (Commits: da7f3a5, bc5e65e, cbf6625, 8613c60)
- GitHub Actions workflow (lint, test, build, deploy)
- Backend deployment via Serverless (Lambda, API Gateway)
- Frontend deployment (S3, CloudFront)
- **Status:** Fully automated, zero-touch deployments

### Node.js Runtime Fix (Commit: 431384f)
- Downgraded from Node 22.x to 20.x (Serverless Framework compatibility)
- **Status:** Deployed and working

---

## 🎯 PRIORITY 1: Input Validation

**Files to update:**
- `frontend/src/components/DemoBar.jsx` - Validate label & email before API call
- `backend/handler.js` - Validate all incoming parameters (accountId, body fields)

**Frontend pattern:**
```javascript
if (!label?.trim() || !email?.trim()) {
  throw new Error("Label and email are required");
}
if (!email.includes("@")) {
  throw new Error("Invalid email format");
}
```

**Backend pattern:**
```javascript
if (!accountId || typeof accountId !== "string") {
  return { statusCode: 400, headers: CORS_HEADERS, 
    body: JSON.stringify({ error: "Invalid accountId" }) };
}
```

**Impact:** Prevents bad data in database, clearer error messages

---

## 🎯 PRIORITY 2: Configuration via Environment Variables

**Current issue:** Hardcoded table names, region, stage in code

**Update serverless.yml:**
```yaml
environment:
  DYNAMODB_TABLE: ${self:service}-${self:provider.stage}-accounts
  LOG_LEVEL: ${self:provider.stage}
  PARTNER_API_PARAM_PATH: shipstation-demo
```

**Update handler.js:**
```javascript
const TABLE_NAME = process.env.DYNAMODB_TABLE || "shipstation-partnerapi-demo-accounts";
const params = { TableName: TABLE_NAME };
```

**Files:**
- `backend/serverless.yml` - Add environment section
- `backend/handler.js` - Replace hardcoded values with env vars

**Impact:** Easy to change per environment (dev/staging/prod), better portability

---

## 🎯 PRIORITY 3: Monitoring & Logging

**Backend improvements:**
- Add request ID logging (trace requests end-to-end)
- CloudWatch alarms for Lambda errors
- DynamoDB throttling alerts
- API Gateway 5xx error alerts

**Implementation:**
```javascript
const requestId = context.requestId || crypto.randomUUID();
console.log(JSON.stringify({ requestId, function: "listAccounts", status: "success" }));
```

**Files:**
- `backend/handler.js` - Add request ID to all logs
- AWS CloudWatch - Create alarms (via Serverless plugin or manual)
- Frontend - Optional: Sentry/error tracking integration

**Impact:** Visibility into issues, faster debugging, production readiness

---

## 🎯 PRIORITY 4: Code Structure Improvements

**Large functions to refactor:**
- `frontend/src/shells/modern-wms/CarrierSettings.jsx` (267 lines) → Split into smaller components
- `backend/handler.js` - Extract common patterns into utilities

**Extract:**
- API response formatting (already done: `successResponse()`)
- Database operations (scan, get, put, update patterns)
- Carrier/warehouse data transformation

**Impact:** Easier to test, maintain, extend

---

## 🎯 PRIORITY 5: Testing Improvements

**Current state:**
- Unit tests exist (Vitest + React Testing Library)
- Missing E2E tests
- Missing backend unit tests

**Add:**
- Backend unit tests for handler functions
- E2E tests (Cypress/Playwright) for critical flows:
  - Create account
  - Add carrier mapping
  - Add warehouse location
- Mock API tests

**Impact:** Catch regressions early, safer refactoring

---

## 🎯 PRIORITY 6: TypeScript (Optional, large effort)

**Benefits:** Type safety, better IDE support, catches errors at compile time

**Migration path:**
1. Rename `.js` to `.ts`/`.tsx`
2. Add basic types (tsconfig.json)
3. Gradually add stricter types
4. Can do incrementally (no big bang)

**Impact:** Long-term maintainability, fewer runtime errors

---

## 📝 CURRENT CODEBASE STATE

**Frontend:**
- React 18.3.1 + Vite
- Tailwind CSS for styling
- Vitest for testing
- Error handling: ✅ Complete with timeouts & retries
- PropTypes validation: ✅ Added to all components
- Linting: ✅ 0 errors

**Backend:**
- Node.js 20.x (AWS Lambda)
- AWS SDK v3
- Serverless Framework (IaC)
- Error handling: ✅ Complete with specific HTTP codes
- Configuration: ❌ Hardcoded values (Priority 2)
- Logging: ⚠️ Basic console.error (Priority 3)

**Infrastructure:**
- S3 + CloudFront (frontend)
- Lambda + API Gateway (backend)
- DynamoDB (data)
- GitHub Actions (CI/CD)

---

## 🔗 USEFUL REFERENCES

**Git commits for context:**
- Error handling: `0e6b48f`
- Linting fixes: `08d5217`
- CI/CD setup: `da7f3a5`
- Node 20 fix: `431384f`

**Important files:**
- Frontend API: `frontend/src/services/api.js`
- Backend handler: `backend/handler.js`
- Workflow: `.github/workflows/deploy.yml`
- Serverless config: `backend/serverless.yml`

---

## 📌 KNOWN LIMITATIONS & NOTES

**GitHub Actions Secrets in Build Environment:**
- ❌ `${{ secrets.VAR }}` in `env:` blocks doesn't work reliably for build-time vars
- ✅ Workaround: Hardcode values or use `.env.production` file
- Remember for future: Avoid using secrets in build environment variables

**DynamoDB Design:**
- Uses generic "accounts" table for demo purposes
- No indexes configured (OK for demo scale)
- No TTL configured (data persists indefinitely)
- Consider adding in production

---

## 🚀 NEXT STEPS CHECKLIST

- [ ] Implement Priority 1: Input Validation
- [ ] Implement Priority 2: Environment Configuration
- [ ] Implement Priority 3: Monitoring & Logging
- [ ] Implement Priority 4: Refactor Large Functions
- [ ] Implement Priority 5: E2E Tests
- [ ] Optional: Priority 6: TypeScript Migration
