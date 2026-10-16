# Changelog — DKTEC Equipment Marketplace

All significant changes to this project are recorded here.

---

## [Unreleased] — 2026-07-06

### Added
- **Design Tokens**: Added custom `brand-orange`, `brand-action` colors, `rounded-btn`/`rounded-card` border radius, `shadow-card`/`shadow-modal` utilities, `font-display`/`font-body` families to `tailwind.config.js`
- **CSS Custom Properties**: Added design tokens as CSS variables in `index.css` (`--color-brand`, `--color-action`, `--radius-btn`, `--radius-card`, `--shadow-card`, `--font-display`, etc.)
- **Button Component**: Reusable `<Button>` component with 8 variants (primary, action, secondary, danger, success, dark, ghost, link) and 6 sizes (xs through full + loading state)
- **Auto-Renew Toggle**: Backend `toggleAutoRenew` controller + `PATCH /api/elite/auto-renew` route + frontend `useToggleAutoRenewMutation` + clickable toggle in `EliteDashboard.jsx`
- **Dynamic Navbar Positioning**: SubNavbar now measures actual desktop/mobile navbar heights via `ResizeObserver` on `.desktop-nav`/`.mobile-nav` classes; CSS variables `--navbar-desktop-height` and `--navbar-mobile-height` replace hardcoded `top-[60px]`/`top-[110px]`
- **React.memo**: Wrapped `ProductCard` and `HomeProductCard` with `React.memo` to prevent unnecessary re-renders in product grids
- **Lazy Loading**: Added `loading="lazy"` to 18 `<img>` tags across 10 files (Cart, Checkout, Wishlist, ProductDetails, VendorStore, CrossSell, FeaturedProducts, QuickViewModal, AboutSection, ImageZoom)
- **Vite Config**: Raised `chunkSizeWarningLimit` to 600 kB; added `advancedChunks` code-splitting config
- **UX States**: Added error states to `BrowsingHistory.jsx` and `DKElite.jsx` via `ErrorDisplay` component; added loading/error/empty states to `admin/OrderList.jsx` with auth token fix

### Fixed
- **Dead Code**: Removed `cancelMembership` mutation from `eliteApiSlice.js` — pointed to `/api/elite/cancel` which had no backend route. Actual cancel flow uses `/api/elite/cancel-request`.
- **Hardcoded localhost URLs**: Replaced 17 occurrences of `http://localhost:5000/api/` with `/api/` across 10 files to use Vite proxy (LoginScreen, RegisterScreen, VerifyScreen, ForgetPassword, ResetCode, NewPassword, BecomeVendorScreen, AdminVendorApprovals, apiSlice)
- **OrderList Auth**: Added `Authorization: Bearer` header to admin OrderList axios calls
- **Cleanup**: Removed unused `theme.css` file
- **Index.css**: Consolidated and cleaned up — removed duplicate/legacy CSS classes, kept print styles, toast overrides, and scrollbar utilities

### Changed
- **ProductCard add-to-cart button**: Replaced inline `<button>` with reusable `<Button variant="action" size="sm">`
- **HomeProductCard add-to-cart button**: Same migration to `<Button>` component
- **Index.css**: Moved font import to top, reorganized CSS variable definitions, added animation utilities
