# AI Context — DKTEC Equipment Marketplace

## Project Identity
- **Name**: DKTEC Equipment Marketplace
- **Type**: Amazon-level multi-vendor equipment e-commerce platform
- **Status**: Active development (pre-production)
- **Primary Language**: JavaScript (Node.js + React)

---

## Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js (Express 5.2.1) |
| Database | MongoDB (Mongoose 9.3) |
| Auth | JWT (`jsonwebtoken`), bcryptjs, Google OAuth |
| Payments | Stripe 20.4 (Checkout, Payment Intents, Setup Intents, Identity, Webhooks) |
| File Upload | Cloudinary + Multer 2.1 |
| Real-time | Socket.IO 4.8 |
| Push Notifications | Firebase Admin 13.9 (FCM) |
| Scheduling | node-cron 4.5 |
| Email | Nodemailer 8.0 (Gmail SMTP) |
| Security | Helmet 8.2, express-rate-limit 8.3, cors, cookie-parser |
| Validation | express-validator 7.3 |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 19.2 (Vite 8) |
| State | Redux Toolkit (RTK Query), React Context (Cart) |
| Routing | React Router DOM 7.13 |
| Styling | Tailwind CSS 3.4 |
| Animations | Framer Motion 12.38 |
| Icons | react-icons 5.6, @heroicons/react 2.2 |
| Carousel | Swiper 12.1 |
| Payments | @stripe/react-stripe-js 5.6, @stripe/stripe-js 8.11 |
| i18n | i18next 26.0, react-i18next 17.0 |
| Notifications | react-toastify 11.0, Firebase 12.13 (messaging) |
| Charts | Recharts 3.9 |
| Utilities | axios, jwt-decode, country-state-city, xlsx, react-confetti |

---

## Codebase Conventions
- **Backend**: ES Modules (`import`/`export`), async/await with `express-async-handler`
- **Frontend**: React functional components with hooks, RTK Query for API calls
- **Comments**: Mixed Arabic/English (Egyptian dialect for internal notes)
- **File naming**: PascalCase for React components, camelCase for utilities/services
- **Error handling**: Backend uses `express-async-handler` wrapper; Frontend uses `toast.error()` from react-toastify
- **State persistence**: Local storage for auth, cart, currency, location
- **API pattern**: RESTful with versioned paths (`/api/{resource}`)

---

## Critical Architecture Rules
1. Multi-vendor: Every order item belongs to a specific vendor; earnings calculated per-item
2. Escrow: Funds held in `payoutStatus: "Holding"` until customer confirms delivery
3. Commission: Flat 10% platform commission per item
4. Wallet Dual System: `vendorProfile.balance` (old) and `vendorProfile.availableBalance` (new) both in use
5. Stripe is primary payment gateway; COD and wallet payment also supported
6. Elite members get 20% discount on all orders
7. Vendors must complete KYC (Stripe Identity) to access certain features
8. Vendor coupons are isolated (not global)
9. Products go through approval workflow: draft -> pending -> active/rejected
10. Soft deletes: Products can be hidden/suspended/archived without deletion

---

## Long-Term Vision

### Goal
Transform DKTEC Equipment Marketplace into an **Amazon-level multi-vendor platform** for industrial and commercial equipment in the Middle East, Africa, and globally.

### Philosophy
- **Trust First**: Escrow protects every transaction. KYC verifies every vendor. Moderation ensures product quality.
- **Multi-Vendor by Design**: Every order item is vendor-specific. Platform never competes with its vendors.
- **Quality Over Quantity**: Product approval workflow, vendor performance scoring, verified reviews, and clear return policies.
- **Data-Driven**: Every financial transaction logged. Every vendor performance measured. Marketplace KPIs guide decisions.

### Long-Term Development Philosophy
1. **One feature at a time** — Never work on multiple features simultaneously
2. **Finish what you start** — Never leave partially completed work
3. **Documentation drives development** — Understand existing docs before coding; update docs after coding
4. **Single source of truth** — The `project-management/` folder is the permanent knowledge base
5. **Continuous synchronization** — Documentation must always match the codebase

---

## Coding Standards

### Frontend
- React functional components with hooks (no class components)
- PascalCase for component files, camelCase for utilities/hooks
- RTK Query for all API calls; Redux for global state; Context for cart
- Tailwind CSS for styling (inline utility classes preferred)
- Framer Motion for animations
- PropTypes for type checking (TypeScript migration planned)

### Backend
- ES Modules (`import`/`export`), async/await with `express-async-handler`
- camelCase for variables/functions/files; PascalCase for models
- Routes -> Controllers -> Models layered architecture
- `express-validator` for all input validation
- Consistent error responses via error middleware

### Naming Conventions
| Element | Convention | Example |
|---------|-----------|---------|
| React components | PascalCase | `ProductCard.jsx` |
| Utility files | camelCase | `formatAddress.js` |
| Backend models | PascalCase | `userModel.js` |
| Controllers | camelCase | `orderController.js` |
| Routes | camelCase | `productRoutes.js` |
| Redux slices | camelCase | `authSlice.js` |
| Database fields | camelCase | `availableBalance` |
| API routes | kebab-case | `/api/orders/vendor/payout` |

### Folder Structure
```
backend/
  config/         - DB, Firebase, external service config
  controllers/    - Request handler logic
  middleware/     - Auth, validation, error handling
  models/         - Mongoose schemas and models
  routes/         - Express route definitions
  services/       - Business logic (notifications, audit)
  utils/          - Helper utilities
frontend/
  src/
    components/   - Reusable UI components
    context/      - React context providers
    pages/        - Page-level components
    Screens/      - Screen-level components
    slices/       - Redux state + RTK Query API slices
    utils/        - Helper utilities
```

---

## Architectural Principles

1. **Separation of Concerns**: Routes define endpoints, controllers handle logic, models define data
2. **Defense in Depth**: Input validation + authentication + authorization + rate limiting
3. **Audit Trail**: All significant actions logged via auditService
4. **Stateless API**: JWT-based, no server-side sessions
5. **Idempotent Operations**: Where possible, operations should be safe to retry
6. **Fail Gracefully**: Comprehensive error handling, graceful degradation
7. **Real-Time by Default**: Socket.IO for live updates where appropriate
8. **Financial Integrity**: Escrow, commission calculation, and wallet transactions are immutable and auditable

---

## Scalability Principles

1. **Horizontal First**: Design for horizontal scaling (stateless APIs, shared-nothing architecture)
2. **Cache Aggressively**: Redis for frequently accessed data; CDN for static assets
3. **Optimize Queries**: Indexes, aggregation pipelines, projection limiting
4. **Lazy Load Everything**: Images, components, routes loaded on demand
5. **Code Splitting**: Route-based and component-level splitting for frontend
6. **Database Scaling Plan**: Read replicas, sharding strategy for future growth
7. **Microservices Readiness**: Current monolith designed with clear module boundaries for future splitting

---

## Quality Expectations

| Area | Standard |
|------|----------|
| Code Quality | Consistent conventions, no console.log in production |
| Error Handling | Every API endpoint has try/catch, meaningful error messages |
| UI Quality | Loading skeletons, empty states, error states on every page |
| Responsive | Mobile-first, all pages functional on all screen sizes |
| Performance | Lighthouse > 90, API response < 200ms p50 |
| Security | OWASP Top 10 compliant, proper auth on all protected routes |
| Testing | Unit tests for logic, integration for APIs, E2E for journeys |
| Documentation | Updated with every feature, synchronized with codebase |

---

## Development Workflow for Future AI Sessions

### Before Starting Any Work
1. Read this file (AI_CONTEXT.md) — understand the project context
2. Read MASTER_SPEC.md — full project specification
3. Read PROJECT_STATUS.md — current state of the project
4. Read NEXT_TASK.md — the single active task
5. Read ROADMAP.md — understand the phase we're in
6. Read BACKLOG.md — understand the overall priority
7. Read DECISIONS.md — understand architectural decisions
8. Read KNOWN_ISSUES.md — be aware of existing problems
9. Read FEATURES.md — know what exists and what's planned
10. Read ARCHITECTURE.md — understand system architecture

### While Implementing
1. Work on EXACTLY ONE task at a time (from NEXT_TASK.md)
2. Never modify multiple features in parallel
3. Follow existing code conventions (see Coding Standards above)
4. Handle loading, empty, error, and edge case states
5. Ensure responsive design works on mobile and desktop
6. Never commit partial or broken work

### After Completing a Feature
1. Update PROJECT_STATUS.md — mark the feature/module status
2. Update FEATURES.md — update completion status
3. Update CHANGELOG.md — record what was changed
4. Update ROADMAP.md — update phase progress
5. Update BACKLOG.md — mark task as completed, reorder if needed
6. Update NEXT_TASK.md — select the next single task from the backlog
7. Update MASTER_SPEC.md — add new pages, APIs, models, or business rules
8. Update KNOWN_ISSUES.md — add any new issues discovered
9. Verify documentation matches codebase reality

### Rules for Future AI Sessions
1. **DO NOT** modify source code without reading project-management docs first
2. **DO NOT** implement features from IDEAS.md — they are brainstorming only
3. **DO NOT** mark features as complete without verification
4. **DO NOT** work on multiple tasks simultaneously
5. **DO** update documentation before marking any work as complete
6. **DO** check for existing patterns before writing new code
7. **DO** handle all states (loading, empty, error, success) in UI work
8. **DO** ensure backward compatibility for API changes
9. **DO** record architectural decisions in DECISIONS.md
10. **DO** log all significant actions for audit trail

---

## Project Quality Standards

### Production Target
- **Reliability**: 99.9% uptime
- **Performance**: Sub-second page loads, < 200ms API responses
- **Security**: OWASP Top 10 compliant
- **Accessibility**: WCAG 2.1 AA minimum
- **SEO**: Full meta tags, structured data, sitemaps
- **Testing**: > 80% coverage on critical paths
- **Monitoring**: Error tracking, performance monitoring, uptime alerts
- **Backup**: Automated daily backups with DR plan

### Code Quality Checklist (Before Marking Complete)
- [ ] Feature works as specified
- [ ] No console errors or warnings
- [ ] Loading state handled
- [ ] Empty state handled
- [ ] Error state handled
- [ ] Edge cases covered
- [ ] Responsive on mobile/tablet/desktop
- [ ] API returns correct data
- [ ] Documentation updated
