# System Architecture — DKTEC Equipment Marketplace

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React 19)                │
│  ┌───────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Redux      │  │ React    │  │ Stripe Elements  │  │
│  │ Store      │  │ Router   │  │ (Card Payment)   │  │
│  │ (RTK +     │  │ (7.13)   │  │                  │  │
│  │  Query)    │  │          │  │ Firebase FCM     │  │
│  └─────┬─────┘  └────┬─────┘  └──────────────────┘  │
│        │             │                              │
│  ┌─────▼─────────────▼──────────────────────────────┐│
│  │              Tailwind CSS + Framer Motion         ││
│  └──────────────────────────────────────────────────┘│
│                   Port 5173 (dev)                     │
└──────────────────────┬────────────────────────────────┘
                       │ HTTP Proxy (Vite)
                       ▼
┌─────────────────────────────────────────────────────┐
│                   Backend (Express 5)                 │
│  ┌───────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ Middleware  │  │ Routes   │  │ Controllers      │  │
│  │ - Helmet   │  │ (20      │  │ (19 files)       │  │
│  │ - CORS     │  │  files)  │  │                  │  │
│  │ - Rate Lim │  │          │  │ Socket.IO        │  │
│  │ - JWT Auth │  │          │  │ (Real-time)      │  │
│  └───────────┘  └────┬─────┘  └──────────────────┘  │
│                      │                               │
│  ┌───────────────────▼──────────────────────────────┐│
│  │               Mongoose ODM (9.x)                 ││
│  │           18 Models + 17 Collections             ││
│  └───────────────────┬──────────────────────────────┘│
│                      │                               │
│  External Services:  │                               │
│  - Stripe API        │                               │
│  - Cloudinary        │                               │
│  - Firebase Admin    │                               │
│  - Nodemailer/Gmail  │                               │
│  - ExchangeRate API  │                               │
│                   Port 5000                          │
└──────────────────────┬────────────────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │   MongoDB      │
              │  (Atlas/SaaS)  │
              └────────────────┘
```

---

## Backend Architecture

### Request Lifecycle
```
HTTP Request
    │
    ▼
Stripe Webhook Route (raw body parser) ──── Optional path
    │
    ▼
General Middleware: helmet → cors → rate-limit → json parser → cookie-parser
    │
    ▼
Route Matching ──► Auth Middleware (protect/admin/isVendor) ──► Controller
    │
    ▼
Mongoose Model ──► Database Operation
    │
    ▼
Response JSON
```

### Middleware Stack (in order)
| Middleware | Purpose |
|------------|---------|
| `helmet()` | Security HTTP headers |
| `generalLimiter` | 200 req / 15 min per IP |
| `cors()` | Cross-origin (credentials: true) |
| `express.json()` | Body parser |
| `express.urlencoded()` | URL-encoded body parser |
| `cookieParser()` | Parse cookies |
| `protect` (per route) | JWT verification |
| `admin` (per route) | Admin role check |
| `isVendor` (per route) | Vendor role check |
| `isVerifiedVendor` (per route) | Vendor + KYC verified |
| `isEliteMember` (per route) | Elite membership check |

### Module Dependency Graph
```
server.js
  ├── Config: db.js, firebase.js, firebaseAdmin.js
  ├── Middleware: authMiddleware, errorMiddleware, vendorMiddleware, eliteMiddleware
  ├── Routes (20) → Controllers (19) → Models (18)
  ├── Services: auditService, notificationService
  ├── Socket.IO → Socket events
  └── Cron: checkAndExpireAds
```

---

## Frontend Architecture

### Component Tree
```
main.jsx
  └── Provider (Redux)
      └── GoogleOAuthProvider
          └── CartProvider
              └── App.jsx
                  ├── BrowserRouter
                  │   ├── ScrollToTop
                  │   ├── ToastProvider
                  │   ├── Navbar
                  │   ├── SubNavbar
                  │   ├── Routes → Pages/Screens/Components
                  │   └── Footer
                  └── SupportWidget
```

### State Management
```
Redux Store
  ├── api (RTK Query Cache)
  │   ├── productsApiSlice (17 endpoints)
  │   ├── orderApiSlice (21 endpoints)
  │   ├── usersApiSlice (13 endpoints)
  │   ├── paymentApiSlice (4 endpoints)
  │   ├── addressesApiSlice (6 endpoints)
  │   ├── couponsApiSlice (4 endpoints)
  │   ├── inquiriesApiSlice (4 endpoints)
  │   ├── wishlistApiSlice (4 endpoints)
  │   ├── bannersApiSlice (5 endpoints)
  │   ├── returnsApiSlice (7 endpoints)
  │   ├── eliteApiSlice (9 endpoints)
  │   ├── vendorSubscriptionApiSlice (5 endpoints)
  │   ├── advertisingApiSlice (3 endpoints)
  │   ├── notificationsApiSlice (4 endpoints)
  │   └── recentlyViewedApiSlice (3 endpoints)
  ├── auth (userInfo + addresses)
  ├── currency (currencyCode, rate, symbol)
  └── location (currentLocation)

React Context
  └── CartContext (cartItems, addToCart, decrementQty, removeFromCart, clearCart, totalPrice)
```

### Routing Strategy
- **Public routes**: Home, products, categories, search, cart, contact, login, register
- **Protected routes** (wrapped in `<ProtectedRoute>`): Profile, orders, wallet, security, vendor application
- **Vendor routes**: Dashboard, products CRUD, profile, membership
- **Admin routes**: All management interfaces
- Protected route checks `userInfo` from Redux store; redirects to `/login` if not authenticated

### Data Flow
```
User Action → Component → RTK Query Hook → API Call → Backend → MongoDB
                                        ↓
                              Redux Cache Update → UI Re-render
```

---

## Database Schema Relationships

```
User (1) ───── hasMany ────► Order (N)
User (1) ───── hasMany ────► Product (N) [as vendor]
User (1) ───── hasOne ────► Wishlist (1)
User (1) ───── hasOne ────► RecentlyViewed (1)
User (1) ───── hasMany ────► WalletTransaction (N)
User (1) ───── hasOne ────► EliteSubscription (1)
User (1) ───── hasOne ────► VendorSubscription (1)
User (1) ───── hasMany ────► Notification (N)
User (1) ───── hasMany ────► AuditLog (N)
User (1) ───── hasMany ────► ShippingRate (N) [as vendor]
User (1) ───── hasMany ────► Coupon (N) [as vendor]
User (1) ───── hasMany ────► CategoryRequest (N) [as vendor]
User (1) ───── hasMany ────► AdRequest (N) [as vendor]
User (1) ───── hasMany ────► ReturnRequest (N) [as customer]
User (1) ───── hasMany ────► ReturnRequest (N) [as vendor]

Product (1) ── belongsTo ──► User (1) [vendor]
Product (1) ── belongsTo ──► Category (1)
Product (1) ── hasMany ────► OrderItem (N)
Product (1) ── hasMany ────► ReturnRequest (N)
Product (1) ── hasOne ────► AdRequest (1)

Order (1) ──── hasMany ────► OrderItem (N)
Order (1) ──── belongsTo ──► User (1) [customer]
Order (N) ──── hasMany ────► WalletTransaction (N) [via order ref]
Order (1) ──── hasMany ────► ReturnRequest (N)

Category (1) ── hasMany ────► Product (N)
Category (1) ── hasMany ────► Coupon (N) [via specificCategories]
Category (1) ── hasMany ────► Category (N) [children via parent ref]
```

---

## Key Design Patterns

### Multi-Vendor Order Processing
```
Order
  └── OrderItem (N)
       ├── product → references Product
       ├── vendor → references User (the seller)
       ├── price, qty, weight
       ├── commissionRate (10%), commissionEarned, vendorEarnings
       ├── payoutStatus: ["Holding", "Released", "Refunded"]
       ├── itemStatus: ["Pending", "Processed", "Shipped", "Delivered", "Cancelled"]
       └── trackingNumber, shippedAt, deliveredAt, cancelledAt
```

### Escrow Release Flow
```
Customer buys → OrderItem.payoutStatus = "Holding"
                                              │
                        ┌─────────────────────┤
                        ▼                     ▼
              Vendor ships              Customer confirms
              item.payoutStatus =        delivery with photo
              "Released"                 item.payoutStatus =
              (vendor marks              "Released"
               delivered)               (customer confirms)
                        │                     │
                        └─────────┬───────────┘
                                  ▼
                    Vendor.availableBalance += earnings
                    Product.numSales += qty
                    Order.isDelivered = true (if all items delivered)
```

### Commission Calculation
```
itemTotal = effectivePrice × qty
commissionEarned = itemTotal × 10%
vendorEarnings = itemTotal - commissionEarned
totalPlatformCommission = sum of all commissionEarned
```

---

## API Architecture

### Versioning
- All routes under `/api/{resource}`
- No explicit version prefix (e.g., `/api/v1/`)
- Webhooks at `/api/webhook` and `/api/elite/webhook`

### Authentication
- JWT tokens in `Authorization: Bearer <token>` header
- Token stored in localStorage on frontend
- Token contains: `{ id, role, tokenVersion }`
- `protect` middleware verifies token and attaches `req.user`

### Response Format
- Success: `res.json(data)` — direct JSON
- Error: `{ message: "..." }` — via error middleware
- Some controllers use: `{ success: true, data }` or `{ success: false, message }`

### Pagination
- Implemented in: audit logs, Elite memberships, vendor subscriptions
- Uses `page` and `limit` query parameters
- Returns: `{ data, page, pages, total }`

---

## Security Architecture

| Layer | Implementation |
|-------|---------------|
| Transport | Helmet headers, CORS restricted to CLIENT_URL |
| Authentication | JWT with Bearer tokens, token version invalidation |
| Rate Limiting | Global (200/15min) + Login (5/min) |
| Input Validation | express-validator in validationMiddleware |
| Password | bcryptjs hashing, strong regex enforcement |
| OTP | Time-limited codes for email, phone, password reset |
| Role Authorization | protect → admin/isVendor/isVerifiedVendor middleware chain |
| Stripe Security | Webhook signature verification with secret |
| File Upload | Cloudinary with secure URLs |
| Email Security | Gmail SMTP with app password |
| Session Security | Login attempt tracking (max 5), account lockout |

---

## Authentication Flow

```
User → Login/Register → Backend validates credentials
  → JWT generated (payload: { id, role, tokenVersion })
  → Token returned → Stored in localStorage
  → Subsequent requests: Authorization: Bearer <token>
  → protect middleware: verify token → attach req.user
  → admin/isVendor middleware: check role

Google OAuth:
  User → Google Login → Google returns token
  → Token sent to POST /api/users/auth/google
  → Backend verifies with Google → User found/created → JWT issued

OTP Flows:
  Email/Phone → OTP generated (6-digit, 10min expiry)
  → Stored in user record → Sent to user
  → User submits OTP → Verified against stored value → User marked verified
```

---

## Payment Flow

```
Checkout → User selects payment method

Stripe Checkout:
  → POST /api/orders → Order created (isPaid: false)
  → Frontend creates Stripe Checkout Session
  → User redirected to Stripe → Completes payment
  → Stripe webhook: checkout.session.completed
  → Order marked as paid (isPaid: true)
  → Order items created with payoutStatus: "Holding"

Saved Card (Stripe Payment Intents):
  → Setup Intent creates payment method → Saved to user profile
  → Checkout uses saved payment method → Payment Intent confirmed
  → Immediate payment confirmation

Wallet Payment:
  → User.walletBalance >= totalPrice → Deduct from wallet
  → Order created with isPaid: true
  → Wallet transaction logged (type: Deduction)

COD:
  → Order created with isPaid: false
  → No payment processing at checkout
  → Payment collected on delivery
```

---

## Wallet Flow

```
Customer Balance:
  → Refunds from cancellations → +walletBalance
  → Wallet payment → -walletBalance
  → Type: Deposit (credit), Deduction (debit)

Vendor Balance:
  → Order item delivered → +vendorProfile.availableBalance (after 10% commission)
  → Payout requested → Pending admin approval
  → Admin approves → WalletTransaction created (type: Withdrawal, status: Completed)
  → Admin rejects → Refund to availableBalance
  → All wallet transactions immutable and auditable
```

---

## Escrow Flow

```
Order created → OrderItem.payoutStatus = "Holding"
  ├── Vendor marks item as shipped → itemStatus = "Shipped"
  │   └── Vendor marks delivered → payoutStatus = "Released"
  │       └── availableBalance += vendorEarnings
  │
  └── Customer confirms delivery with proof photo
      └── payoutStatus = "Released"
          └── availableBalance += vendorEarnings

All items released → Order.isDelivered = true
Commission: itemTotal × 10% deducted before release
```

---

## Notification Flow

```
System Event (order placed, product approved, etc.)
  → notificationService.createNotification(userId, type, message, link)
  → Notification document saved to MongoDB (Notification collection)
  → Socket.IO emits "notification" event to user's socket room
  → Frontend NotificationBell shows unread count badge
  → If user offline: FCM push sent via Firebase Admin SDK
  → Foreground FCM listener shows browser notification
  → User can mark as read, mark all read, or delete
```

---

## Deployment Architecture (Target)

```
                     ┌─────────────┐
                     │   DNS/CDN    │
                     │  (Cloudflare)│
                     └──────┬──────┘
                            │
                     ┌──────▼──────┐
                     │  Load Balancer│
                     └──────┬──────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
        ┌─────▼─────┐ ┌────▼────┐ ┌─────▼─────┐
        │ Node App 1 │ │Node App2│ │ Node App N │
        │  (Express) │ │(Express)│ │ (Express)  │
        └─────┬─────┘ └────┬────┘ └─────┬─────┘
              │             │             │
              └─────────────┼─────────────┘
                            │
              ┌─────────────▼─────────────┐
              │        MongoDB Atlas       │
              │   (Primary + Replicas)     │
              └───────────────────────────┘

External Services:
  - Stripe API (payments, identity, webhooks)
  - Cloudinary (image upload/storage)
  - Firebase Admin (FCM push notifications)
  - Gmail SMTP (email via Nodemailer)
  - ExchangeRate API (currency conversion)

Storage:
  - Cloudinary → Product/banner images
  - Firebase → Push notification tokens
  - MongoDB → All application data
```

---

## Frontend Build & Deployment

```
Development:
  Vite Dev Server (port 5173) → Proxy API requests to backend (port 5000)

Production:
  Vite Build → Static assets (dist/) → Serve via Nginx/CDN
  API requests → Load balancer → Node.js application servers

Environment Variables:
  VITE_API_URL → Backend API endpoint
  VITE_STRIPE_KEY → Stripe publishable key
  VITE_WEB3FORMS_KEY → Web3Forms API key
```
