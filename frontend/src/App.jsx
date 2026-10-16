import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import io from "socket.io-client";
import { requestForToken, onMessageListener } from "./firebase";
import { toast } from "react-toastify";
import ToastProvider from './components/ToastProvider';
import axios from 'axios';

// Global Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Loader from './components/Loader';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';
import OwnerRoute from './components/OwnerRoute';


// Home & Public Pages
import HomePage from './components/home/HomePage';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';

// Auth Screens
import LoginScreen from './Screens/LoginScreen';
import RegisterScreen from './Screens/RegisterScreen';
import VerifyScreen from './Screens/VerifyScreen';
import ForgotPassword from './components/ForgetPassword';
import ResetCode from './components/ResetCode';
import NewPassword from './components/NewPassword';

// User Dashboard & Checkout
import DashboardScreen from './Screens/DashboardScreen';
import ProfileScreen from './Screens/ProfileScreen';
import TwoFactorSetup from './components/TwoFactorSetup';
import AddressScreen from './Screens/AddressScreen';
import MyOrdersScreen from './Screens/MyOrdersScreen';
import OrderDetailsScreen from './Screens/OrderDetailsScreen';
import Checkout from './pages/Checkout';
import PaymentScreen from './Screens/PaymentScreen';
import Success from './pages/Success';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import ProductEdit from './pages/admin/ProductEdit';
import UserListScreen from './pages/admin/UserListScreen';
import UserEditScreen from './pages/admin/UserEditScreen';
import OrderListScreen from './Screens/orderListScreen';
import DashboardScreenn from './pages/admin/DashboardScreenn';
import InquiryListScreen from './Screens/InquiryListScreen';

// Slices
import { detectLocationAndCurrency, updateAllRates } from './slices/currencySlice';
import ShippingRatesScreen from './Screens/ShippingRatesScreen';
import CouponCreateScreen from './Screens/CouponCreateScreen';
import CouponManagementScreen from './Screens/CouponManagementScreen';
import SupportWidget from './components/SupportWidget';
import WalletHistoryTable from './components/WalletHistoryTable';
import AdminWalletHistory from './pages/admin/AdminWalletHistory';
import AdminReturnsScreen from './Screens/AdminReturnsScreen';
import SecurityGate from './components/SecurityGate';
import Contact from './components/Contact';
import VendorDashboard from './pages/admin/VendorDashboard';
import BecomeVendorScreen from './components/BecomeVendorScreen';
import AdminVendorApprovals from './Screens/AdminVendorApprovals';
import SettingsScreen from './components/SettingsScreen';
import VendorProfileScreen from './Screens/VendorProfileScreen';
import SubNavbar from './components/SubNavbar';
import CategoryScreen from './Screens/CategoryScreen';
import SearchScreen from './Screens/SearchScreen';
import Wishlist from './pages/Wishlist';
import ReturnsPolicy from './pages/ReturnsPolicy';
import DKElite from './pages/DKElite';
import EliteDashboard from './pages/EliteDashboard';
import BrowsingHistory from './pages/BrowsingHistory';
import NewestProducts from './pages/NewestProducts';
import VendorProductCreate from './Screens/VendorProductCreate';
import VendorProductEdit from './pages/VendorProductEdit';
import VendorCategoryRequest from './Screens/VendorCategoryRequest';
import AdminBannersScreen from './pages/admin/AdminBannersScreen';
import AdminPendingEdits from './pages/admin/AdminPendingEdits';
import VendorStore from './pages/VendorStore';
import VendorMembership from './pages/VendorMembership';
import AdminMembershipScreen from './Screens/AdminMembershipScreen';
import AccessDenied from './pages/AccessDenied';
import ErrorBoundary from './components/ErrorBoundary';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
const ENDPOINT = import.meta.env.VITE_API_ENDPOINT;

const socket = io(ENDPOINT, {
  autoConnect: false,
  transports: ["websocket"]
});
window.socket = socket;

// 🌟 1. جدار حماية التجار (Vendor Route Guard)
const VendorRoute = () => {
  const { userInfo } = useSelector((state) => state.auth);
  return userInfo && (userInfo.role === 'vendor' || userInfo.role === 'admin' || userInfo.isAdmin) ? (
    <ErrorBoundary><Outlet /></ErrorBoundary>
  ) : (
    <Navigate to="/403" replace />
  );
};

// 🌟 2. جدار حماية مدير المنصة (Admin Route Guard)
const AdminRoute = () => {
  const { userInfo } = useSelector((state) => state.auth);
  return userInfo && (userInfo.role === 'admin' || userInfo.isAdmin) ? (
    <ErrorBoundary><Outlet /></ErrorBoundary>
  ) : (
    <Navigate to="/403" replace />
  );
};

function App() {
  const [showLoader, setShowLoader] = useState(true);
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);

  const updateUserFCMTokenOnServer = async (fcmToken, user) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`,
        },
      };
      await axios.put(`${ENDPOINT}/api/users/fcm-token`, { fcmToken }, config);
      // console.log("✅ FCM Token Updated on Server");
    } catch (error) {
      console.error("❌ Error updating FCM token", error);
    }
  };

  useEffect(() => {
    if (userInfo) {
      socket.connect();
      socket.emit("setup", userInfo._id);

      socket.on("orderUpdate", (data) => {
        toast(data.message, {
          icon: "📦",
          className: "custom-system-toast"
        });
      });

      requestForToken().then((token) => {
        if (token && userInfo.token) {
          updateUserFCMTokenOnServer(token, userInfo);
        }
      });
    }

    onMessageListener()
      .then((payload) => {
        toast(
          <div>
            <strong className="block text-sm">{payload.notification.title}</strong>
            <span className="text-xs text-gray-500">{payload.notification.body}</span>
          </div>,
          {
            icon: "🔔",
            className: "custom-system-toast"
          }
        );

        if (Notification.permission === "granted") {
          new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: "/favicon.svg",
          });
        } else if (Notification.permission !== "denied") {
          Notification.requestPermission();
        }
      })
      .catch((err) => console.log("FCM Listener Error: ", err));

    return () => {
      socket.off("orderUpdate");
      socket.off("setup");
    };
  }, [userInfo?._id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoader(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const hasSavedCurrency = localStorage.getItem("userCurrency");
    if (!hasSavedCurrency) {
      dispatch(detectLocationAndCurrency());
    }
    dispatch(updateAllRates());
  }, [dispatch]);

  return (
    <Router>
      <ToastProvider />

      <ScrollToTop />
      {showLoader && <Loader />}

      <div className="min-h-screen flex flex-col font-sans bg-white selection:bg-[#FF6B00] selection:text-white">
        <Navbar />
        <SubNavbar />
        <SupportWidget />
        <main className="flex-grow">
          <ErrorBoundary>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/department/:category" element={<CategoryScreen />} />
            <Route path="/search" element={<SearchScreen />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/vendor/:id" element={<VendorStore />} />
            <Route path="/cart" element={<Cart />} />
            <Route path='/contact' element={<Contact />} />
            <Route path='/wishlist' element={<Wishlist />} />
            <Route path='/returns' element={<ReturnsPolicy />} />
            <Route path='/browsing-history' element={<BrowsingHistory />} />
            <Route path='/newest' element={<NewestProducts />} />
            <Route path='/dk-elite' element={<DKElite />} />
            <Route path='/elite-dashboard' element={<EliteDashboard />} />

            {/* Auth Routes */}
            <Route path='/login' element={<LoginScreen />} />
            <Route path='/register' element={<RegisterScreen />} />
            <Route path='/verify' element={<VerifyScreen />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-code" element={<ResetCode />} />
            <Route path="/new-password" element={<NewPassword />} />

            {/* Checkout Routes */}
            <Route path="/checkout" element={<ErrorBoundary><Elements stripe={stripePromise}><Checkout /></Elements></ErrorBoundary>} />
            <Route path="/payment" element={<ErrorBoundary><PaymentScreen /></ErrorBoundary>} />
            <Route path="/success" element={<ErrorBoundary><Success /></ErrorBoundary>} />

            {/* 🛡️ 1. جدار حماية العملاء المسجلين فقط */}
            <Route path="" element={<ProtectedRoute />}>
              <Route path="/" element={<DashboardScreen />}>
                <Route path='/profile' element={<ProfileScreen />} />
                <Route path='/2fa' element={<TwoFactorSetup />} />
                <Route path='/addresses' element={<AddressScreen />} />
                <Route path='/orders' element={<MyOrdersScreen />} />
                <Route path='/order/:id' element={<OrderDetailsScreen />} />
                <Route path='/walletHistory' element={<WalletHistoryTable />} />
                <Route path='/securityGate' element={<SecurityGate />} />
              </Route>
              <Route path='/become-vendor' element={<BecomeVendorScreen />} />
            </Route>

            {/* 🛡️ 2. جدار حماية التجار الصارم (ممنوع الدخول لغير رتبة vendor) */}
            <Route path="" element={<VendorRoute />}>
              {/* ... other vendor routes */}
              <Route path="/vendor/dashboard" element={<VendorDashboard />} />

              {/* 🌟 New Vendor Specific Product Routes */}
              <Route path="/vendor/product/create" element={<VendorProductCreate />} />
              <Route path="/vendor/product/:id/edit" element={<VendorProductEdit />} />
              <Route path="/vendor/category/request" element={<VendorCategoryRequest />} />
              <Route path="/vendor/profile" element={<VendorProfileScreen />} />
              <Route path="/vendor/membership" element={<VendorMembership />} />
            </Route>

            {/* 🛡️ 3. جدار حماية مدير الموقع (Admin) */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/dashboard" element={<DashboardScreenn />} />
              <Route path="/admin/product/create" element={<ProductEdit />} />
              <Route path="/admin/product/:id/edit" element={<ProductEdit />} />
              <Route path='/admin/userlist' element={<UserListScreen />} />
              <Route path='/admin/orderlist' element={<OrderListScreen />} />
              <Route path='/admin/user/:id/edit' element={<UserEditScreen />} />
              <Route path='/admin/inquirylist' element={<InquiryListScreen />} />
              <Route path='/admin/shipping' element={<ShippingRatesScreen />} />
              <Route path='/admin/coupons' element={<CouponCreateScreen />} />
              <Route path='/admin/coupons-manger' element={<CouponManagementScreen />} />
              <Route path='/admin/AdminWalletHistory' element={<AdminWalletHistory />} />
              <Route path='/admin/vendor-approvals' element={<AdminVendorApprovals />} />
              <Route path='/admin/returns' element={<AdminReturnsScreen />} />
              <Route path='/admin/pending-edits' element={<AdminPendingEdits />} />
              <Route path='/admin/banners' element={<AdminBannersScreen />} />
              <Route path='/admin/settings' element={<SettingsScreen />} />
              <Route path='/admin/memberships' element={<AdminMembershipScreen />} />
            </Route>

            <Route path="/403" element={<AccessDenied />} />
            <Route path='' element={<OwnerRoute />}></Route>
          </Routes>
          </ErrorBoundary>
        </main>

        <footer className='z-[10]'>
          <Footer />
        </footer>
      </div>
    </Router>
  );
}

export default App;