# Known Issues — DKTEC Equipment Marketplace

> **Last Updated**: 2026-07-06
> Documented known problems, bugs, and technical debt.

---

## Issue Tracking Legend

| Severity | Definition |
|----------|------------|
| 🔴 Critical | Blocks functionality, affects financial flows, or causes data loss |
| 🟡 High | Significant impact on user experience or functionality |
| 🟠 Medium | Noticeable issue with workaround available |
| 🔵 Low | Minor annoyance, cosmetic, or nice-to-have fix |

---

## 🔴 Critical Issues

### (None currently open)

---

## 🟡 High Severity Issues

### Backend Cross-Import from Frontend (Fixed)

| Field | Value |
|-------|-------|
| **Description** | `frontend/src/components/Navbar.jsx` was directly importing `backend/utiles/currencies`. Fixed — frontend now uses its own copy at `frontend/src/utils/currencies.js`. The duplicate `backend/utiles/` directory has been consolidated into `backend/utils/`. |
| **Affected Modules** | `Navbar.jsx`, `frontend/src/utils/currencies.js`, `backend/utils/currencies.js` |
| **Severity** | 🟡 High |
| **Current Workaround** | ✅ Fixed — frontend has its own currencies copy; backend `utiles/` merged into `utils/`. |
| **Status** | ✅ Resolved |

---

### Mixed Module Systems

| Field | Value |
|-------|-------|
| **Description** | Most backend files use ES Modules (`import`/`export`) but `vendorMiddleware.js` uses CommonJS (`module.exports`). This creates inconsistency and potential import issues. |
| **Affected Modules** | `vendorMiddleware.js`, `authMiddleware.js` |
| **Severity** | 🟡 High |
| **Current Workaround** | Works currently because Node.js handles mixed modules, but may cause issues with tree-shaking or future upgrades. |
| **Planned Solution** | Convert `vendorMiddleware.js` to ES Module syntax. |
| **Status** | ⏳ Planned |

---

### No CI/CD Pipeline

| Field | Value |
|-------|-------|
| **Description** | No automated CI/CD pipeline exists. No automated linting, testing, or deployment. |
| **Affected Modules** | Infrastructure |
| **Severity** | 🟡 High |
| **Current Workaround** | Manual deployment only |
| **Planned Solution** | Set up GitHub Actions with automated testing, linting, and deployment. |
| **Status** | ⏳ Planned (DevOps phase) |

---

### No Server-Side Caching Beyond Product Routes

| Field | Value |
|-------|-------|
| **Description** | Redis caching infrastructure exists (cacheService.js, cacheMiddleware.js) but only covers product routes. Banners, categories, and other public GET endpoints are not cached. |
| **Affected Modules** | Banner routes, category routes, vendor profile routes |
| **Severity** | 🟡 High |
| **Current Workaround** | None |
| **Planned Solution** | Extend cache middleware to banner, category, and vendor profile routes. |
| **Status** | ⏳ Planned (next task) |

---

### No TypeScript

| Field | Value |
|-------|-------|
| **Description** | Entire codebase is plain JavaScript with no type checking. This leads to runtime type errors, poor IDE support, and reduced code quality. |
| **Affected Modules** | All |
| **Severity** | 🟡 High |
| **Current Workaround** | None |
| **Planned Solution** | Migrate to TypeScript incrementally. Start with backend, then frontend. |
| **Status** | 🔵 Future |

---

## 🟠 Medium Severity Issues

### No Pagination on Product Search

| Field | Value |
|-------|-------|
| **Description** | Product search and listing endpoints may not paginate results properly, potentially returning large result sets. |
| **Affected Modules** | `productController.js` |
| **Severity** | 🟠 Medium |
| **Current Workaround** | None |
| **Planned Solution** | Add consistent pagination to all product listing/search endpoints. |
| **Status** | ⏳ Planned |

---

### No Translations Configured

| Field | Value |
|-------|-------|
| **Description** | i18next library is installed and configured but no translation files exist. All UI is in one language (Arabic/English mixed). |
| **Affected Modules** | Frontend UI |
| **Severity** | 🟠 Medium |
| **Current Workaround** | Hardcoded text throughout the UI |
| **Planned Solution** | Create translation files, extract all hardcoded strings, implement language switcher. |
| **Status** | ⏳ Planned |

---

### No Database Index Optimization

| Field | Value |
|-------|-------|
| **Description** | Database indexes exist but have not been optimized for query patterns. Some queries may be slow as data grows. |
| **Affected Modules** | Database models |
| **Severity** | 🟠 Medium |
| **Current Workaround** | Acceptable at current data volume |
| **Planned Solution** | Audit query patterns and add/optimize indexes. |
| **Status** | ⏳ Planned |

---

## 🔵 Low Severity Issues

### No Bulk Product Operations

| Field | Value |
|-------|-------|
| **Description** | Vendors can only create/edit products one at a time. No CSV/Excel bulk import or export. |
| **Affected Modules** | Vendor product management |
| **Severity** | 🔵 Low |
| **Current Workaround** | Manual product creation |
| **Planned Solution** | Implement bulk product import/export with template support. |
| **Status** | ⏳ Planned |

---

### No Vendor Messaging

| Field | Value |
|-------|-------|
| **Description** | No direct buyer-to-seller messaging system. Communication relies on order notes and inquiries. |
| **Affected Modules** | Communication |
| **Severity** | 🔵 Low |
| **Current Workaround** | Contact form and inquiry system |
| **Planned Solution** | Implement in-platform messaging system. |
| **Status** | ⏳ Planned |

---

### No Abandoned Cart Recovery

| Field | Value |
|-------|-------|
| **Description** | No automated abandoned cart email/SMS reminders for users who leave items in cart. |
| **Affected Modules** | Cart, Marketing |
| **Severity** | 🔵 Low |
| **Current Workaround** | None |
| **Planned Solution** | Implement abandoned cart detection and automated recovery emails. |
| **Status** | ⏳ Planned |

---

### No Storewide Sales / Promo Campaigns

| Field | Value |
|-------|-------|
| **Description** | No admin-created storewide sales, discount campaigns, or promotional events. |
| **Affected Modules** | Marketing, Admin |
| **Severity** | 🔵 Low |
| **Current Workaround** | Vendor-level coupons only |
| **Planned Solution** | Implement admin campaign management with scheduled sales. |
| **Status** | ⏳ Planned |

---

### Sporadic Comment Language Mixing

| Field | Value |
|-------|-------|
| **Description** | Code comments are mixed between Arabic (Egyptian dialect) and English, which may confuse non-Arabic-speaking developers. |
| **Affected Modules** | All backend/frontend code |
| **Severity** | 🔵 Low |
| **Current Workaround** | None |
| **Planned Solution** | Standardize comments to English for maintainability. |
| **Status** | 🔵 Future |

---

## Technical Debt Register

| Item | Impact | Est. Effort | Priority |
|------|--------|-------------|----------|
| Backend cross-import from frontend | 🟡 Fixed — frontend uses own currencies.js copy | Done | ✅ Resolved |
| Mixed module systems (ESM/CJS) | 🟠 Import compatibility | 1 file | Medium |
| No TypeScript | 🟡 Runtime type errors | Very large | Low |
| No pagination on search | 🟠 Performance at scale | Small | Medium |
| No tests (beyond 112 existing) | 🟡 Regression risk | Very large | High |
| No CI/CD | 🟡 Deployment reliability | Medium | High |
| Comments in mixed languages | 🔵 Maintainability | Medium | Low |
| Hardcoded localhost URLs | 🔴 Fixed (17 occurrences) | Done | ✅ Fixed |

---

## Performance Debt Register

| Item | Impact | Est. Effort | Priority |
|------|--------|-------------|----------|
| No server-side caching (banners/categories) | High | Small | High |
| Image optimization | High | Medium | High |
| No code splitting (routes) | Medium | Medium | Medium |
| No database index optimization | Medium | Medium | Medium |
| API response sizes not optimized | Low | Small | Low |

---

## Security Debt Register

| Item | Impact | Est. Effort | Priority |
|------|--------|-------------|----------|
| Two-Factor Authentication | ✅ Implemented | Medium | Resolved |
| Hardcoded localhost URLs | ✅ Fixed (17 occurrences) | Done | Resolved |
| No device session tracking | Medium | Medium | Medium |
| No login history | Low | Small | Low |
| No security audit performed | High | Large | High |
| No dependency vulnerability scanning | Medium | Small | Medium |
