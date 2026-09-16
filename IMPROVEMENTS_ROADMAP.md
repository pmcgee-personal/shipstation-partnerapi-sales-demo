# Code Improvements Roadmap

## ✅ COMPLETED

### Priority 1: Input Validation (Commit: 6b1cee3, c392097)
- Backend validation utility with email, label, accountId, carrier code validators
- All 8 handlers updated: createAccount, getAccount, addShipVia, deleteShipVia, directLogin, listCarriers, listWarehouses, createWarehouse
- Validates format, trims whitespace, returns clear error messages
- **Status:** Live and working

### Priority 2: Environment Configuration (Commit: 42339f8, 04e0e50)
- Extracted TABLE_NAME, LOG_LEVEL, SSM parameter paths to environment variables
- Updated serverless.yml with environment configuration section
- GitHub Actions workflow passes secrets to deployment
- All 7 table name references and 2 SSM paths now configurable
- **Status:** Live and working, secrets configured in GitHub

### Previous: Error Handling, Linting, CI/CD, Node.js 20
- All from prior sessions working and stable

---

## 🎯 PRIORITY 3: Monitoring & Logging

**Files:** `backend/handler.js`

**Add:**
- Request ID logging (trace requests end-to-end)
- CloudWatch alarms for Lambda errors/throttling
- API Gateway 5xx error alerts

**Pattern:**
```javascript
const requestId = context.requestId || crypto.randomUUID();
logger.info(`Created account`, { requestId, accountId });
```

**Impact:** Production visibility, faster debugging

---

## 🎯 PRIORITY 4: Code Structure

**Files:** 
- `frontend/src/shells/modern-wms/CarrierSettings.jsx` (267 lines)
- `backend/handler.js` (800+ lines)

**Extract:**
- Database operations helper
- Carrier/warehouse transformation utilities
- Split large components into smaller, testable units

**Impact:** Easier testing/maintenance

---

## 🎯 PRIORITY 5: E2E Tests

**Add:** Cypress tests for critical flows
- Create account
- Add carrier mapping
- Add warehouse location

**Impact:** Catch regressions early

---

## 🎯 PRIORITY 6: TypeScript (Optional)

**Incremental migration** `.js` → `.ts`/`.tsx`

**Impact:** Type safety, better IDE support

---

## 📋 Current Status

| Component | Status |
|-----------|--------|
| Input Validation | ✅ Done |
| Environment Config | ✅ Done |
| Error Handling | ✅ Done |
| CI/CD Pipeline | ✅ Done |
| Testing (Unit) | ✅ Done |
| Monitoring & Logging | ⏳ Priority 3 |
| Code Structure | ⏳ Priority 4 |
| E2E Tests | ⏳ Priority 5 |
| TypeScript | ⏳ Priority 6 (optional) |

---

## 🔗 Key Files

- Frontend API: `frontend/src/services/api.js`
- Backend handlers: `backend/handler.js`
- Validation: `backend/utils/validation.js`
- Config: `backend/serverless.yml`
- CI/CD: `.github/workflows/deploy.yml`
