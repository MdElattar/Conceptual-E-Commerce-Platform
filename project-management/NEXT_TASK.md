# Next Task — Production Readiness Sprint

> **Generated**: 2026-07-06
> **Context**: The website is not yet production-ready. All Redis/cache/backend-optimization work is paused. User-facing work has higher priority.

---

## Current Priority: 1. Runtime Verification ✅ Complete

### Completed (2026-07-06)
- ✅ All 12 public pages load with HTTP 200
- ✅ All API endpoints verified (correct paths return expected data)
- ✅ **Fixed**: Missing `return.approve` / `return.reject` in AuditLog action enum → added to `backend/models/auditLogModel.js`
- ✅ **Fixed**: Deprecated `{ new: true }` → `{ returnDocument: 'after' }` in 3 controllers (`orderController.js:819`, `notificationController.js:24`, `userController.js:629`)
- ✅ **Fixed**: Duplicate Wishlist schema index on `{user:1}` → removed redundant `schema.index()` from `backend/models/wishlistModel.js`
- ✅ **Verified**: No hardcoded `localhost:5000` URLs remain in frontend source
- ✅ **Verified**: No cross-imports from backend (`Navbar.jsx` uses `frontend/src/utils/currencies.js`)
- ✅ **Verified**: No missing env vars (VITE_STRIPE_PUBLIC_KEY, VITE_WEB3FORMS_ACCESS_KEY, VITE_API_ENDPOINT all present)
- ✅ **166/166 backend tests pass** (14 suites, zero warnings)
- ✅ **33/33 frontend tests pass** (3 suites)

### Known remaining (non-blocking)
- ⚠️ Inquiry email dispatch fails during tests (fake credentials, caught gracefully — real `.env` has valid creds)
- ⚠️ No browser-level test of console errors (need manual QA with DevTools)

---

## Sprint Dependency Chain

| # | Priority | Status |
|---|----------|--------|
| 1 | **Runtime Verification** — Fix browser console errors, Network 404s, verify API endpoints | ✅ Complete |
| 2 | **UI/UX Consistency** — Unify spacing, typography, colors, buttons, cards, empty/loading/skeleton states | 🟢 Active |
| 3 | **Responsive Audit** — Every page: Navbar, Sidebar, Profile, Cart, Checkout, Elite, Dashboard | ⏳ Planned |
| 4 | **Product Experience** — Product cards, hero products, wishlist, search, filters | ⏳ Planned |
| 5 | **Authentication & 2FA** — Login, register, forgot password, 2FA, session handling | ⏳ Planned |
| 6 | **Subscription Flow** — Elite, vendor plans, payments, auto-renew, currency | ⏳ Planned |
| 7 | **Checkout/Payment Flow** — Verify complete purchase flow (cart → checkout → payment → confirmation) | ⏳ Planned |
| 8 | **Performance** — Image optimization, Redis caching, lazy loading, bundle size | ⏳ Planned |
| 9 | **Code Cleanup** — Remove unused dependencies, fix module systems, consolidate | ⏳ Planned |
| 10 | **Documentation** — Update all docs to reflect current project state | ⏳ Planned |

---

## Recently Completed (sprint)
- ✅ **Runtime Verification (Priority 1)** — All pages 200, all API paths valid, 3 code bugs fixed (audit log enum, deprecated new:true, duplicate index), 166/166 backend tests pass, 33/33 frontend tests pass

## Recently Completed (pre-sprint)
- ✅ UX Polish & Design Consistency Sprint (tokens, Button, auto-renew, SubNavbar, React.memo, lazy loading, hardcoded URLs)
- ✅ Vendor Controller Error Handling
- ✅ Tests for Untested Routes (wishlist, banner, notification, inquiry — 55 new tests)
- ✅ Mongoose ValidationError fix in error middleware
- ✅ Redis cache service + middleware + product/banner/elite/vendor-profile routes
- ✅ `utiles/` → `utils/` directory consolidation

---

## Backlog Reference
See `BACKLOG.md` for the complete prioritized implementation backlog.
