# Code Improvements Roadmap

---

## 🎯 PRIORITY 1: Code Structure

**Files:**

- `frontend/src/shells/modern-wms/CarrierSettings.jsx` (267 lines)
- `backend/handler.js` (800+ lines)

**Extract:**

- Database operations helper
- Carrier/warehouse transformation utilities
- Split large components into smaller, testable units

**Impact:** Easier testing/maintenance

---

## 🎯 PRIORITY 2: E2E Tests

**Add:** Cypress tests for critical flows

- Create account
- Add carrier mapping
- Add warehouse location

**Impact:** Catch regressions early

---

## 🎯 PRIORITY 3: TypeScript (Optional)

**Incremental migration** `.js` → `.ts`/`.tsx`

**Impact:** Type safety, better IDE support

---

## 🔗 Key Files

- Frontend API: `frontend/src/services/api.js`
- Frontend auth session: `frontend/src/services/auth.js`
- Frontend login gate: `frontend/src/components/LoginGate.jsx`
- Backend handlers: `backend/handler.js`
- Backend auth (Cognito OTP): `backend/utils/auth.js`
- Validation: `backend/utils/validation.js`
- Config: `backend/serverless.yml`
- CI/CD: `.github/workflows/deploy.yml`
