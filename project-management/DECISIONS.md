# Architectural Decisions — DKTEC Equipment Marketplace

> **Last Updated**: 2026-07-05
> Records important architectural decisions, their rationale, and impact.

---

## Decision Log

---

### 1. availableBalance is the Canonical Wallet Balance

| Field | Value |
|-------|-------|
| **Decision** | `vendorProfile.availableBalance` is the single source of truth for vendor wallet balance going forward |
| **Reason** | The legacy `vendorProfile.balance` field was used in older payout flows. `availableBalance` was introduced for the new escrow/payout system. To avoid confusion, all new code should use `availableBalance`. Migration of existing `balance` values is planned. |
| **Date** | 2026-07-03 |
| **Status** | ✅ Fully implemented — All code paths now use `availableBalance`. Migration script ready. |
| **Impact** | All payout flows now reference `availableBalance`. Legacy `balance` field kept in schema for backward compatibility. Migration script at `backend/scripts/migrateWalletBalance.js`. |

---

### 2. Escrow is Released Only After Delivery Confirmation

| Field | Value |
|-------|-------|
| **Decision** | Funds are held in `payoutStatus: "Holding"` until delivery is confirmed by either the vendor (marking as delivered) or the customer (confirming delivery with proof photo) |
| **Reason** | Protects both buyers and sellers. Buyers don't pay before receiving goods; sellers are guaranteed payment once delivery is confirmed. |
| **Date** | Project inception |
| **Impact** | Order items track individual payout status. Commission (10%) is deducted at release time. Platform never holds user funds unnecessarily. |

---

### 3. Stripe is the Primary Payment Gateway

| Field | Value |
|-------|-------|
| **Decision** | Stripe is the primary and only third-party payment processor (Checkout, Payment Intents, Setup Intents, Identity, Webhooks) |
| **Reason** | Stripe provides comprehensive payment infrastructure, strong security, global reach, and excellent API/documentation. |
| **Date** | Project inception |
| **Impact** | Payment flows depend on Stripe API availability. Webhook signature verification required for security. Saved cards use Setup Intents. Vendor KYC uses Stripe Identity. |

---

### 4. Multi-Vendor Architecture: Per-Item Order Processing

| Field | Value |
|-------|-------|
| **Decision** | Each order contains multiple `OrderItem` records, each belonging to a specific vendor. Earnings, commission, and escrow status are calculated per-item. |
| **Reason** | Enables true multi-vendor marketplace where a single order can contain items from multiple sellers, each with independent fulfillment, escrow, and payout. |
| **Date** | Project inception |
| **Impact** | Order-level status (`isDelivered`) is derived from all items. Each item has independent status tracking. Vendor earnings are item-specific. |

---

### 5. Platform Commission is 10% Flat Per Item

| Field | Value |
|-------|-------|
| **Decision** | Platform charges a flat 10% commission on every item sold |
| **Reason** | Simple, transparent, easy to calculate. No tiered or category-based complexity initially. |
| **Date** | Project inception |
| **Impact** | Commission rate stored per item at time of sale. Vendor earnings = item total × 0.9. Future: may need dynamic commission rates per category or vendor tier. |

---

### 6. JWT Authentication with Token Versioning

| Field | Value |
|-------|-------|
| **Decision** | JWT Bearer tokens stored in localStorage, with `tokenVersion` field for "logout all devices" capability |
| **Reason** | Stateless authentication, no server-side session storage needed. Token versioning allows immediate invalidation of all tokens for a user. |
| **Date** | Project inception |
| **Impact** | Tokens expire and need refresh. Token stored in localStorage (vulnerable to XSS — mitigated by helmet and input sanitization). Backend checks `tokenVersion` on every request. |

---

### 7. Express-Validator for Input Validation

| Field | Value |
|-------|-------|
| **Decision** | Server-side input validation using `express-validator` middleware |
| **Reason** | Declarative validation chaining, easy to compose, integrates naturally with Express middleware stack. |
| **Date** | Project inception |
| **Impact** | All API inputs validated server-side. Validation middleware can be composed per-route. Consistent error format for validation failures. |

---

### 8. Soft Deletes for Products

| Field | Value |
|-------|-------|
| **Decision** | Products are never permanently deleted from the database. They transition through statuses: active → hidden/suspended/archived. |
| **Reason** | Audit trail, data recovery, and compliance. Soft deletes prevent accidental data loss and maintain order history integrity. |
| **Date** | Project inception |
| **Impact** | Product queries must filter by status. Archived products remain in order history. Admin can restore hidden/suspended products. |

---

### 9. Vendor Coupons are Isolated (Not Global)

| Field | Value |
|-------|-------|
| **Decision** | Vendor-created coupons apply only to that vendor's products. Global coupons are admin-only. |
| **Reason** | Prevents coupon conflicts and ensures vendors control their own promotions within the marketplace. |
| **Date** | Project inception |
| **Impact** | Coupon validation must check vendor scope. Checkout applies relevant coupons per vendor item. |

---

### 10. COD and Wallet as Secondary Payment Methods

| Field | Value |
|-------|-------|
| **Decision** | Beyond Stripe, support Cash on Delivery (COD) and Wallet (store credit) as payment methods |
| **Reason** | COD is expected in target markets. Wallet enables store credit refunds and direct platform payments. |
| **Date** | Project inception |
| **Impact** | COD orders bypass Stripe but follow same escrow flow. Wallet payments deduct from user balance and credit vendor escrow. |

---

### 11. DK Elite Membership with 20% Discount

| Field | Value |
|-------|-------|
| **Decision** | Elite members get a flat 20% discount on all orders |
| **Reason** | Subscription-based loyalty program that drives repeat purchases and customer retention. 20% is a compelling incentive. |
| **Date** | Project inception |
| **Impact** | Discount applied at checkout. Platform covers discount from commission. Requires careful financial modeling to ensure sustainability. |

---

### 12. Vendor KYC via Stripe Identity

| Field | Value |
|-------|-------|
| **Decision** | Vendor identity verification uses Stripe Identity for document collection and verification |
| **Reason** | Stripe Identity provides regulatory-grade KYC verification, avoids building custom verification infrastructure, and integrates with existing Stripe setup. |
| **Date** | Project inception |
| **Impact** | Vendors must complete Stripe Identity session. Webhook handles verification result. Admin can manually override. |

---

### 13. Node-Cron for Scheduled Tasks

| Field | Value |
|-------|-------|
| **Decision** | Use `node-cron` for background scheduled tasks (ad expiry, etc.) |
| **Reason** | Simple, lightweight, no external dependency needed for basic cron scheduling. |
| **Date** | Project inception |
| **Impact** | Cron runs in-process. For production, consider moving to dedicated job queue (Bull/BullMQ) for reliability and scalability. |

---

### 14. Socket.IO for Real-Time Updates

| Field | Value |
|-------|-------|
| **Decision** | Socket.IO for real-time order updates and notification delivery |
| **Reason** | Real-time order status updates improve user experience. Notification delivery needs instant push to connected clients. |
| **Date** | Project inception |
| **Impact** | Adds WebSocket infrastructure. Requires sticky sessions in production. Scales with additional Socket.IO nodes. |

---

### 15. Multi-Currency with Live Exchange Rates

| Field | Value |
|-------|-------|
| **Decision** | Display prices in multiple currencies using live exchange rates. Internal accounting in base currency (presumably USD/EGP). |
| **Reason** | Target markets include multiple currency zones. Live rates ensure accurate pricing. |
| **Date** | Project inception |
| **Impact** | Currency conversion on frontend. Exchange rate API dependency. Order values recorded in both displayed and base currency. |

---

### 16. Recommendation Engine: Lightweight Scoring, No External ML

| Field | Value |
|-------|-------|
| **Decision** | Use a lightweight in-house recommendation engine (Mongoose aggregation pipelines + in-memory scoring) instead of an external ML service or dedicated search/recommendation engine (e.g., Algolia, Amazon Personalize) |
| **Reason** | The product catalog is moderate-sized. An in-memory scoring approach using category/brand/feature similarity, collaborative filtering via order co-occurrence, and sales/rating popularity is sufficient. Avoids external service costs, latency, and dependency. |
| **Date** | 2026-07-05 |
| **Status** | ✅ Implemented — `backend/utils/recommendationEngine.js` with 4 modes: personalized (browsing + purchase history), trending, similar (category/brand/feature), boughtTogether (collaborative). API at `GET /api/products/recommendations`. Frontend integration on HomePage and ProductDetails. |
| **Impact** | Recommendation quality depends on available data (recently viewed + orders). No cold-start problem as trending fallback handles new users. Extensible to add more signals (tags, specs overlap) later. |

---

## Future Architectural Decisions (Deferred)

These decisions are deferred until relevant implementation phases begin:

| Topic | Question | Deferred Until |
|-------|----------|----------------|
| **Caching Strategy** | Redis vs in-memory vs CDN caching | Performance Optimization phase |
| **Database Scaling** | Sharding vs replication vs partitioning | Performance Optimization phase |
| **Microservices** | Should monolith be split? | Post-MVP scaling |
| **CI/CD Platform** | GitHub Actions vs GitLab CI vs others | DevOps phase |
| **Monitoring Stack** | Sentry vs Datadog vs New Relic vs self-hosted | DevOps phase |
| **Mobile Framework** | React Native vs Flutter | Mobile App phase |
| **Testing Framework** | Jest vs Vitest, Cypress vs Playwright | Testing phase |
| **Search Engine** | MongoDB Atlas Search vs ElasticSearch vs Algolia | Search Evolution phase |
