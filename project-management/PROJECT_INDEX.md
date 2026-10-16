# Project File Index — DKTEC Equipment Marketplace

> Complete inventory of every source file in the project.
> **Total**: 177 files (backend: 54, frontend: 112, other: 4, project-management: 15)

---

## BACKEND (54 files)

### Root Configuration
| File | Lines | Purpose |
|------|-------|---------|
| `server.js` | ~150 | Main entry: middleware, routes, webhooks, cron, socket.io |
| `socket.js` | ~30 | Socket.IO client configuration |
| `package.json` | 30 | Dependencies and scripts |
| `.env` | 15 | Environment variables (JWT_SECRET, MONGO_URI, STRIPE_KEYS, etc.) |

### Config (4 files)
| File | Purpose |
|------|---------|
| `config/db.js` | MongoDB connection via Mongoose |
| `config/firebase.js` | Firebase client config |
| `config/firebaseAdmin.js` | Firebase Admin SDK initialization |
| `config/serviceAccountKey.json` | Firebase service account |

### Models (18 files)
| File | Database Collection | Purpose |
|------|-------------------|---------|
| `models/userModel.js` | User | Users, vendors, admins with profiles, KYC, addresses |
| `models/productModel.js` | Product | Products with multi-status, reviews, specs, SEO |
| `models/orderModel.js` | Order | Orders with multi-vendor items, escrow, commission |
| `models/categoryModel.js` | Category | Hierarchical categories with attributes |
| `models/couponModel.js` | Coupon | Discount coupons (global + vendor) |
| `models/inquiryModel.js` | Inquiry | Customer inquiries |
| `models/bannerModel.js` | Banner | Homepage banners |
| `models/wishlistModel.js` | Wishlist | User wishlists |
| `models/returnModel.js` | ReturnRequest | Return/refund requests |
| `models/shippingRateModel.js` | ShippingRate | Country-based shipping tiers |
| `models/notificationModel.js` | Notification | In-app notifications |
| `models/auditLogModel.js` | AuditLog | Compliance audit trail |
| `models/eliteSubscriptionModel.js` | EliteSubscription | Buyer Elite memberships |
| `models/vendorSubscriptionModel.js` | VendorSubscription | Vendor plan subscriptions |
| `models/adRequestModel.js` | AdRequest | Sponsored product requests |
| `models/categoryRequestModel.js` | CategoryRequest | Vendor category suggestions |
| `models/walletTransactionModel.js` | WalletTransaction | Financial transaction ledger |
| `models/recentlyViewedModel.js` | RecentlyViewed | User browsing history |

### Controllers (19 files)
| File | Functions | Purpose |
|------|-----------|---------|
| `controllers/userController.js` | 21 | Auth, profile, KYC, vendor approval |
| `controllers/productController.js` | 18 | Product CRUD, reviews, approvals, stock |
| `controllers/orderController.js` | 21 | Orders, escrow, payouts, wallet history, shipping |
| `controllers/vendorController.js` | 5 | Vendor stats, orders, item status, performance, withdraw |
| `controllers/paymentController.js` | 4 | Stripe saved cards management |
| `controllers/shippingController.js` | 4 | Shipping rate CRUD and cost calculation |
| `controllers/couponController.js` | 4 | Coupon CRUD and validation |
| `controllers/inquiryController.js` | 4 | Contact form management |
| `controllers/bannerController.js` | 5 | Homepage banner management |
| `controllers/wishlistController.js` | 4 | Wishlist CRUD |
| `controllers/returnController.js` | 9 | Full return lifecycle (customer, vendor, admin) |
| `controllers/categoryRequestController.js` | 3 | Vendor category suggestions |
| `controllers/recentlyViewedController.js` | 3 | Browsing history |
| `controllers/addressController.js` | 5 | User address CRUD |
| `controllers/notificationController.js` | 4 | In-app notification management |
| `controllers/auditLogController.js` | 2 | Audit log viewing |
| `controllers/eliteController.js` | 10 | Elite membership lifecycle |
| `controllers/advertisingController.js` | 4 | Ad campaign management |
| `controllers/vendorSubscriptionController.js` | 5 | Vendor plan subscriptions |

### Routes (20 files)
| File | Routes | Purpose |
|------|--------|---------|
| `routes/userRoutes.js` | 22 | Auth, profile, vendor, KYC endpoints |
| `routes/productRoutes.js` | 17 | Product CRUD, reviews, approvals |
| `routes/orderRoutes.js` | 18 | Orders, payouts, wallet, shipping |
| `routes/paymentRoutes.js` | 4 | Stripe card management |
| `routes/vendorRoutes.js` | 5 | Vendor-specific operations |
| `routes/shippingRoutes.js` | 3 | Shipping rate CRUD |
| `routes/couponRoutes.js` | 4 | Coupon CRUD, validation |
| `routes/inquiryRoutes.js` | 4 | Inquiry management |
| `routes/bannerRoutes.js` | 5 | Banner CRUD |
| `routes/wishlistRoutes.js` | 4 | Wishlist CRUD |
| `routes/returnRoutes.js` | 9 | Return request lifecycle |
| `routes/categoryRequestRoutes.js` | 3 | Category suggestions |
| `routes/recentlyViewedRoutes.js` | 3 | Browsing history |
| `routes/addressRoutes.js` | 5 | Address CRUD |
| `routes/notificationRoutes.js` | 4 | Notification management |
| `routes/auditLogRoutes.js` | 2 | Audit log viewing |
| `routes/eliteRoutes.js` | 10 | Elite membership endpoints |
| `routes/advertisingRoutes.js` | 3 | Ad campaign endpoints |
| `routes/vendorSubscriptionRoutes.js` | 5 | Vendor plan subscription |
| `routes/uploadRoutes.js` | 2 | File upload (Cloudinary) |

### Middleware (4 files)
| File | Functions | Purpose |
|------|-----------|---------|
| `middleware/authMiddleware.js` | protect, admin, isVendor | JWT auth, role checks |
| `middleware/vendorMiddleware.js` | isVendor, isVerifiedVendor, isAdminOrVendor | Vendor-specific guards |
| `middleware/eliteMiddleware.js` | isEliteMember, requireElite | Elite membership checks |
| `middleware/errorMiddleware.js` | notFound, errorHandler | Global error handling |
| `middleware/validationMiddleware.js` | validate | Request validation |

### Services (2 files)
| File | Functions | Purpose |
|------|-----------|---------|
| `services/auditService.js` | 13 | Action audit logging |
| `services/notificationService.js` | 7 | In-app notification creation |

### Utilities (3 files)
| File | Functions | Purpose |
|------|-----------|---------|
| `utils/currencies.js` | - | Currency data |
| `utils/generateToken.js` | 1 | JWT generation |
| `utils/sendEmail.js` | 1 | Email sending via Nodemailer |

---

## FRONTEND (112 files)

### Root Configuration (9 files)
| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts (includes recharts 3.9) |
| `index.html` | HTML entry with CDN links |
| `vite.config.js` | Vite config with API proxy |
| `tailwind.config.js` | Tailwind CSS configuration |
| `postcss.config.js` | PostCSS configuration |
| `eslint.config.js` | ESLint configuration |
| `.env` | Environment variables (Stripe, Web3Forms) |
| `.gitignore` | Git ignore rules |
| `README.md` | Project readme |

### Public (4 files)
| File | Purpose |
|------|---------|
| `public/favicon.svg` | Site favicon |
| `public/icons.svg` | SVG icons sprite |
| `public/electric-motor.png` | Static image |
| `public/firebase-messaging-sw.js` | Firebase service worker |

### Source Root (5 files)
| File | Purpose |
|------|---------|
| `src/main.jsx` | React entry point with providers |
| `src/App.jsx` | Router, layout, socket, FCM setup |
| `src/store.js` | Redux store configuration |
| `src/firebase.js` | Firebase messaging initialization |
| `src/index.css` | Global styles + Tailwind |

### Slices (19 files)

#### State Slices (4)
| File | Reducer Key | Purpose |
|------|-------------|---------|
| `slices/apiSlice.js` | apiSlice | Base RTK Query API with auth token injection |
| `slices/authSlice.js` | auth | User authentication state |
| `slices/currencySlice.js` | currency | Currency detection and rates |
| `slices/locationSlice.js` | location | Map location state |

#### API Slices (15)
| File | Endpoints | Purpose |
|------|-----------|---------|
| `slices/productsApiSlice.js` | 16 | Product CRUD, reviews, approvals, stock |
| `slices/orderApiSlice.js` | 21 | Orders, payouts, wallet, vendor items, performance |
| `slices/usersApiSlice.js` | 13 | Auth, profile, vendor requests, admin users |
| `slices/paymentApiSlice.js` | 4 | Stripe saved cards |
| `slices/addressesApiSlice.js` | 6 | Address CRUD, geocoding |
| `slices/couponsApiSlice.js` | 4 | Coupon CRUD, validation |
| `slices/inquiriesApiSlice.js` | 4 | Inquiry CRUD |
| `slices/wishlistApiSlice.js` | 4 | Wishlist CRUD |
| `slices/bannersApiSlice.js` | 5 | Banner CRUD |
| `slices/returnsApiSlice.js` | 7 | Returns lifecycle |
| `slices/eliteApiSlice.js` | 9 | Elite membership |
| `slices/vendorSubscriptionApiSlice.js` | 5 | Vendor plans |
| `slices/advertisingApiSlice.js` | 3 | Ad campaigns |
| `slices/notificationsApiSlice.js` | 4 | Notifications |
| `slices/recentlyViewedApiSlice.js` | 3 | Recently viewed |

### Pages (26 files)

#### Root Pages (17)
| File | Component | Route |
|------|-----------|-------|
| `pages/AccessDenied.jsx` | AccessDenied | /403 |
| `pages/AdminDashboard.jsx` | AdminDashboard | /admin |
| `pages/AdminVendorApprovals.jsx` | AdminVendorApprovals | /admin/vendor-approvals |
| `pages/BrowsingHistory.jsx` | BrowsingHistory | /browsing-history |
| `pages/Cart.jsx` | Cart | /cart |
| `pages/Checkout.jsx` | Checkout | /checkout |
| `pages/CheckoutCoupon.jsx` | CheckoutCoupon | (inline) |
| `pages/DKElite.jsx` | DKElite | /dk-elite |
| `pages/EliteDashboard.jsx` | EliteDashboard | /elite-dashboard |
| `pages/NewestProducts.jsx` | NewestProducts | /newest |
| `pages/ProductDetails.jsx` | ProductDetails | /product/:id |
| `pages/ReturnsPolicy.jsx` | ReturnsPolicy | /returns |
| `pages/Success.jsx` | Success | /success |
| `pages/VendorMembership.jsx` | VendorMembership | /vendor/membership |
| `pages/VendorProductEdit.jsx` | VendorProductEdit | /vendor/product/:id/edit |
| `pages/VendorStore.jsx` | VendorStore | /vendor/:id |
| `pages/Wishlist.jsx` | Wishlist | /wishlist |

#### Admin Pages (9)
| File | Component | Route |
|------|-----------|-------|
| `pages/admin/AdminBannersScreen.jsx` | AdminBannersScreen | /admin/banners |
| `pages/admin/AdminPendingEdits.jsx` | AdminPendingEdits | /admin/pending-edits |
| `pages/admin/AdminWalletHistory.jsx` | AdminWalletHistory | /admin/AdminWalletHistory |
| `pages/admin/DashboardScreenn.jsx` | DashboardScreenn | /admin/dashboard |
| `pages/admin/OrderList.jsx` | OrderList | (standalone) |
| `pages/admin/ProductEdit.jsx` | ProductEdit | /admin/product/create, /admin/product/:id/edit |
| `pages/admin/UserEditScreen.jsx` | UserEditScreen | /admin/user/:id/edit |
| `pages/admin/UserListScreen.jsx` | UserListScreen | /admin/userlist |
| `pages/admin/VendorDashboard.jsx` | VendorDashboard | /vendor/dashboard |

### Screens (23 files)
| File | Component | Route | Purpose |
|------|-----------|-------|---------|
| `Screens/AddressScreen.jsx` | AddressScreen | /addresses | Address management |
| `Screens/AdminMembershipScreen.jsx` | AdminMembershipScreen | /admin/memberships | Manage memberships |
| `Screens/AdminReturnsScreen.jsx` | AdminReturnsScreen | /admin/returns | Admin returns |
| `Screens/AdminVendorApprovals.jsx` | - | /admin/vendor-approvals | Approvals hub |
| `Screens/CategoryScreen.jsx` | CategoryScreen | /department/:category | Category listing |
| `Screens/CouponCreateScreen.jsx` | CouponCreateScreen | /admin/coupons | Create coupon |
| `Screens/CouponManagementScreen.jsx` | CouponManagementScreen | /admin/coupons-manger | Manage coupons |
| `Screens/DashboardScreen.jsx` | DashboardScreen | /profile | User dashboard layout |
| `Screens/InquiryListScreen.jsx` | InquiryListScreen | /admin/inquirylist | Manage inquiries |
| `Screens/LoginScreen.jsx` | LoginScreen | /login | Login with Google |
| `Screens/MyOrdersScreen.jsx` | MyOrdersScreen | /orders | User orders |
| `Screens/OrderDetailsScreen.jsx` | OrderDetailsScreen | /order/:id | Order details |
| `Screens/PaymentScreen.jsx` | PaymentScreen | /payment | Saved cards |
| `Screens/ProductsScreen.jsx` | ProductsScreen | (standalone) | Products listing |
| `Screens/ProfileScreen.jsx` | ProfileScreen | /profile | User profile menu |
| `Screens/RegisterScreen.jsx` | RegisterScreen | /register | Registration |
| `Screens/SearchScreen.jsx` | SearchScreen | /search | Search with filters |
| `Screens/ShippingRatesScreen.jsx` | ShippingRatesScreen | /admin/shipping | Shipping rates |
| `Screens/orderListScreen.jsx` | orderListScreen | /admin/orderlist | Order management |
| `Screens/VendorCategoryRequest.jsx` | VendorCategoryRequest | /vendor/category/request | Request category |
| `Screens/VendorProductCreate.jsx` | VendorProductCreate | /vendor/product/create | Create product |
| `Screens/VendorProfileScreen.jsx` | VendorProfileScreen | /vendor/profile | Vendor KYC/profile |
| `Screens/VerifyScreen.jsx` | VerifyScreen | /verify | Email OTP verification |

### Components (46 files)

#### Routing & Global (5)
| File | Purpose |
|------|---------|
| `components/ProtectedRoute.jsx` | Auth guard with redirect |
| `components/OwnerRoute.jsx` | Owner-only guard |
| `components/ErrorBoundary.jsx` | Error boundary |
| `components/ScrollToTop.jsx` | Scroll to top on route change |
| `components/ToastProvider.jsx` | Toast notification container |

#### Layout (4)
| File | Purpose |
|------|---------|
| `components/Navbar.jsx` | Main navigation (1056 lines) |
| `components/SubNavbar.jsx` | Secondary nav with departments |
| `components/Sidebar.jsx` | Dashboard sidebar |
| `components/Footer.jsx` | Site footer |

#### Loaders & Skeletons (4)
| File | Exports |
|------|---------|
| `components/Loader.jsx` | Full-screen gear loader |
| `components/LoaderSign.jsx` | Inline spinner |
| `components/LoaderOverlay.jsx` | Overlay spinner |
| `components/Skeleton.jsx` | SkeletonCard, SkeletonProductDetails, SkeletonRow |

#### UI (6)
| File | Purpose |
|------|---------|
| `components/Message.jsx` | Alert message |
| `components/Rating.jsx` | Star rating |
| `components/ProductCard.jsx` | Product card |
| `components/ImageZoom.jsx` | Image magnifier |
| `components/QuickViewModal.jsx` | Quick view modal |
| `components/FilterSidebar.jsx` | Search filters |

#### Auth & Security (7)
| File | Purpose |
|------|---------|
| `components/ForgetPassword.jsx` | Password reset email |
| `components/ResetCode.jsx` | Reset OTP entry |
| `components/NewPassword.jsx` | New password form |
| `components/SecurityGate.jsx` | Security settings |
| `components/PhoneVerifier.jsx` | Phone OTP |
| `components/SettingsScreen.jsx` | Admin settings |
| `components/BecomeVendorScreen.jsx` | Vendor application |

#### Vendor Dashboard Tabs (5)
| File | Purpose |
|------|---------|
| `components/VendorDashboard.jsx` | Main vendor panel |
| `components/ReturnsTab.jsx` | Vendor returns |
| `components/PayoutHistoryTab.jsx` | Payout history |
| `components/SellerPerformanceTab.jsx` | Performance metrics |
| `components/WalletHistoryTable.jsx` | Wallet transactions |

#### Home Page (5)
| File | Purpose |
|------|---------|
| `components/home/HomePage.jsx` | Main homepage |
| `components/home/HeroBanner.jsx` | Banner carousel |
| `components/home/WelcomeCard.jsx` | User shortcuts |
| `components/home/ProductShelf.jsx` | Product carousel |
| `components/home/HomeProductCard.jsx` | Compact product card |

#### Other (10)
| File | Purpose |
|------|---------|
| `components/CrossSell.jsx` | Cross-sell widgets |
| `components/RecentlyViewed.jsx` | Recently viewed strip |
| `components/InquiryModal.jsx` | Product inquiry |
| `components/SupportWidget.jsx` | Floating support |
| `components/Contact.jsx` | Contact form |
| `components/Hero.jsx` | Old hero section |
| `components/FeaturedProducts.jsx` | Featured products |
| `components/AboutSection.jsx` | About section |
| `components/ProjectCases.jsx` | Case studies |
| `components/SponsoredBanner.jsx` | Sponsored ad |
| `components/AddressCard.jsx` | Address display |
| `components/AdminWalletHistory.jsx` | Admin wallet view |
| `components/NotificationBell.jsx` | Notification bell |

### Context (1 file)
| File | Purpose |
|------|---------|
| `context/CartContext.jsx` | Shopping cart with localStorage |

### Utilities (1 file)
| File | Functions |
|------|-----------|
| `utils/formatAddress.js` | formatAddress, formatAddressShort, formatAddressMultiLine |

---

## PROJECT ROOT (4 files)

| File | Purpose |
|------|---------|
| `package-lock.json` | Lock file |
| `last100100100100` | (unknown file) |
| `النسخه الاخيره` | Arabic: "the latest version" |
| `النسخه الحاليه` | Arabic: "the current version" |

---

## PROJECT MANAGEMENT (15 files — MASTER REFERENCE)

| File | Purpose |
|------|---------|
| `project-management/MASTER_SPEC.md` | **Ultimate project specification — single source of truth** |
| `project-management/AI_CONTEXT.md` | Project identity, tech stack, conventions, coding standards, development workflow |
| `project-management/PROJECT_STATUS.md` | Module completion status, known issues, planned features, technical debt |
| `project-management/ROADMAP.md` | Development phases (completed + future), current priority |
| `project-management/NEXT_TASK.md` | Current highest-priority unfinished work (exactly ONE at a time) |
| `project-management/FEATURES.md` | Complete feature inventory (completed + planned) |
| `project-management/BACKLOG.md` | Prioritized implementation backlog (Critical -> Future) |
| `project-management/VISION.md` | Product vision, strategy, Amazon-level goals, milestones |
| `project-management/DECISIONS.md` | Architectural decision log with rationale and impact |
| `project-management/KNOWN_ISSUES.md` | Known bugs, issues, technical debt, performance/security debt |
| `project-management/IDEAS.md` | Long-term brainstorming ideas (never auto-implement) |
| `project-management/CHANGELOG.md` | Change history |
| `project-management/ARCHITECTURE.md` | System architecture, flows, deployment architecture |
| `project-management/PROJECT_INDEX.md` | Full file inventory (this file) |

### Reading Order for New AI Sessions
1. `AI_CONTEXT.md` — Understand project context and conventions
2. `MASTER_SPEC.md` — Complete project specification
3. `PROJECT_STATUS.md` — Current project state
4. `NEXT_TASK.md` — Active task (what to work on now)
5. `ROADMAP.md` — Overall phase context
6. `BACKLOG.md` — Prioritized task list
7. `DECISIONS.md` — Architectural decisions
8. `KNOWN_ISSUES.md` — Known problems
9. `FEATURES.md` — Feature details
10. `ARCHITECTURE.md` — System architecture
