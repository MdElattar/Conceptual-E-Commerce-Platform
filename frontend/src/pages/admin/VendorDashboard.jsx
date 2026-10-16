import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBoxOpen, FaChartLine, FaHeart, FaPlusCircle, FaEdit, FaTrash, 
  FaShoppingBag, FaUsers, FaArrowUp, FaArrowDown, 
  FaClipboardList, FaClock, FaCheckCircle, FaExclamationCircle,
  FaLock, FaUniversity, FaMoneyBillWave, FaTicketAlt, FaCopy, FaMagic,
  FaSpinner, FaBan, FaBullhorn, FaCreditCard, FaSearchDollar, FaWarehouse, FaCubes, FaUndo , FaTruck , FaTimesCircle
} from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Button from '../../components/Button';
import { useGetVendorProductsQuery, useAdjustStockMutation } from '../../slices/productsApiSlice';
import { useGetVendorOrdersQuery, useRequestVendorPayoutMutation, useUpdateVendorOrderItemMutation } from '../../slices/orderApiSlice';
import NotificationBell from '../../components/NotificationBell';
import ReturnsTab from '../../components/ReturnsTab';
import PayoutHistoryTab from '../../components/PayoutHistoryTab';
import SellerPerformanceTab from '../../components/SellerPerformanceTab';
import { useGetVendorReturnsQuery } from '../../slices/returnsApiSlice';
import { useCreateCouponMutation, useDeleteCouponMutation, useGetCouponsQuery } from '../../slices/couponsApiSlice';
import { useGetProfileQuery } from '../../slices/usersApiSlice';
// 🌟 Added the real API Hook for Ad Boost
import { useRequestAdBoostMutation } from '../../slices/advertisingApiSlice';

const VendorDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [stockModal, setStockModal] = useState({ open: false, product: null });
  const [stockQuantity, setStockQuantity] = useState('');
  const [stockReason, setStockReason] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState(5);

  const [adjustStock, { isLoading: isAdjustingStock }] = useAdjustStockMutation();

  // Global State
  const { userInfo } = useSelector((state) => state.auth);
  
  // 🌟 Currency Formatting
  const currencyState = useSelector((state) => state.currency) || {};
  const currencyCode = currencyState.currencyCode || 'USD';
  const rate = currencyState.rate || 1;
  
  const formatLocalPrice = (amount) => {
    const safeAmount = Number(amount) || 0;
    const convertedAmount = safeAmount * rate;
    return `${currencyCode} ${convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 🌟 Data Fetching
  const { data: productsData, isLoading: isLoadingProducts } = useGetVendorProductsQuery({});
  const { data: ordersData, isLoading: isLoadingOrders, isError: isOrdersError, refetch: refetchOrders } = useGetVendorOrdersQuery({});
  const { data: fetchedCoupons, isLoading: isLoadingCoupons, refetch: refetchCoupons } = useGetCouponsQuery({});
  const { data: profile, refetch: refetchProfile } = useGetProfileQuery(undefined, { skip: !userInfo });
  const { data: returnsData } = useGetVendorReturnsQuery();

  const [createCoupon, { isLoading: isCreatingCoupon }] = useCreateCouponMutation();
  const [deleteCoupon] = useDeleteCouponMutation();
  const [requestPayout, { isLoading: isRequestingPayout }] = useRequestVendorPayoutMutation(); 
  
  // 🌟 Initialize the real Ad Boost Mutation Hook
  const [requestAdBoost, { isLoading: isSubmittingAd }] = useRequestAdBoostMutation();
  
  // 🌟 Memoized Data
  const vendorCoupons = useMemo(() => {
    if (!fetchedCoupons) return [];
    return fetchedCoupons.filter(coupon => coupon.vendor === userInfo?._id || coupon.user === userInfo?._id);
  }, [fetchedCoupons, userInfo]);

  const vendorProducts = useMemo(() => {
    if (!productsData) return [];
    const allProds = Array.isArray(productsData) ? productsData : productsData.products || [];
    return allProds.filter(product => {
      if (!product.user) return false;
      if (typeof product.user === 'object') return product.user._id === userInfo?._id;
      return product.user === userInfo?._id;
    });
  }, [productsData, userInfo]);

  const activeProducts = useMemo(() => vendorProducts.filter(p => p.status === 'active'), [vendorProducts]);

  // Security Variables
  const isVerified = profile?.vendorProfile?.isVerified;
  const bankAccount = profile?.vendorProfile?.bankAccount?.accountNumber;
  const last4Digits = bankAccount ? bankAccount.slice(-4) : 'Unlinked';
  const profileBalance = profile?.vendorProfile?.availableBalance || 0;

  const productMetrics = useMemo(() => {
    let active = 0; let lowStock = 0; let outOfStock = 0;
    let pending = 0; let rejected = 0; let draft = 0;
    vendorProducts.forEach(p => {
      const status = p.status || 'active';
      if (status === 'pending') { pending++; return; }
      if (status === 'rejected') { rejected++; return; }
      if (status === 'draft') { draft++; return; }
      active++;
      const stock = Number(p.countInStock) || 0;
      if (stock === 0) outOfStock++;
      else if (stock <= 5) lowStock++;
    });
    return { active, lowStock, outOfStock, pending, rejected, draft, total: vendorProducts.length };
  }, [vendorProducts]);

  const financialMetrics = useMemo(() => {
    let calculatedAvailable = 0; let pendingBalance = 0;   
    let totalOrdersCount = 0; let deliveredOrdersCount = 0;
    const safeOrdersData = Array.isArray(ordersData) ? ordersData : [];

    if (safeOrdersData.length > 0) {
      safeOrdersData.forEach(order => {
        const vendorItemsInOrder = (order.orderItems || []).filter(item => 
          vendorProducts.some(vp => vp._id === item.product)
        );

        if (vendorItemsInOrder.length > 0) {
          totalOrdersCount++;
          const orderEarnings = vendorItemsInOrder.reduce((acc, item) => acc + (Number(item.price) * Number(item.qty)), 0);

          if (order.isDelivered) {
            calculatedAvailable += orderEarnings;
            deliveredOrdersCount++;
          } else if (order.isPaid) {
            pendingBalance += orderEarnings;
          }
        }
      });
    }

    return { 
        availableBalance: profileBalance > 0 ? profileBalance : calculatedAvailable, 
        pendingBalance, 
        totalOrdersCount, 
        deliveredOrdersCount 
    };
  }, [ordersData, vendorProducts, profileBalance]);

  const canWithdraw = isVerified && bankAccount && financialMetrics.availableBalance > 0;

  // 🌟 Form States
  const [couponForm, setCouponForm] = useState({ code: '', discountType: 'percentage', discountAmount: '', minOrderAmount: '', expiryDate: '' });
  
  // 🌟 Ad Campaign State
  const [adForm, setAdForm] = useState({ productId: '', packageId: 'basic' });

  const adPackages = {
      basic: { id: 'basic', days: 3, priceUSD: 15, name: "Quick Boost (3 Days)", icon: '🚀', color: 'bg-blue-500' },
      pro: { id: 'pro', days: 7, priceUSD: 30, name: "Pro Placement (7 Days)", icon: '⭐', color: 'bg-indigo-500' },
      elite: { id: 'elite', days: 14, priceUSD: 50, name: "Elite Dominance (14 Days)", icon: '👑', color: 'bg-purple-600' }
  };

  const handleOpenStockModal = (product) => {
    setStockQuantity(product.countInStock || 0);
    setLowStockThreshold(product.lowStockThreshold || 5);
    setStockReason('');
    setStockModal({ open: true, product });
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!stockModal.product) return;
    try {
      await adjustStock({
        productId: stockModal.product._id,
        quantity: Number(stockQuantity),
        reason: stockReason,
        lowStockThreshold: Number(lowStockThreshold),
      }).unwrap();
      toast.success('Stock updated successfully.');
      setStockModal({ open: false, product: null });
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update stock.');
    }
  };

  // --- Handlers ---
  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'DK-';
    for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    setCouponForm({ ...couponForm, code: result });
    toast.info("Generated new protocol code.");
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!couponForm.code || !couponForm.discountAmount || !couponForm.expiryDate) {
      return toast.error("Please fill all required coupon fields.");
    }
    if (new Date(couponForm.expiryDate) <= new Date()) {
      return toast.error("Expiration date must be set in the future.");
    }

    try {
      const finalDiscountAmount = couponForm.discountType === 'percentage' 
        ? Number(couponForm.discountAmount) 
        : Number(couponForm.discountAmount) / rate; 
      const finalMinOrderAmount = (Number(couponForm.minOrderAmount) || 0) / rate;

      await createCoupon({ 
          ...couponForm, 
          discountAmount: finalDiscountAmount,
          minOrderAmount: finalMinOrderAmount,
          isGlobal: false
      }).unwrap(); 
      
      toast.success("Marketing Protocol Activated! Coupon is live.");
      setCouponForm({ code: '', discountType: 'percentage', discountAmount: '', minOrderAmount: '', expiryDate: '' });
      refetchCoupons(); 
    } catch (err) {
      toast.error(err?.data?.message || "Failed to deploy coupon.");
    }
  };

  const handleDeleteCoupon = async (id) => {
    if(window.confirm("Are you sure you want to deactivate this protocol?")) {
      try {
        await deleteCoupon(id).unwrap();
        toast.success("Protocol Deactivated Successfully.");
        refetchCoupons();
      } catch(err) { toast.error(err?.data?.message || "Failed to deactivate protocol."); }
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Protocol Code Copied!");
  };

  // 🌟 Real Ad Submission Logic replacing the Fake setTimeout
  const handleBoostSubmit = async (e) => {
      e.preventDefault();
      if (!adForm.productId) return toast.warning("Please select a product to boost.");
      
      const selectedPackage = adPackages[adForm.packageId];
      if (financialMetrics.availableBalance < selectedPackage.priceUSD) {
          return toast.error("Insufficient wallet balance for this campaign.");
      }

      try {
        // 🌟 Send the request to the real backend
        await requestAdBoost({
          productId: adForm.productId,
          packageId: adForm.packageId
        }).unwrap();

        setIsAdModalOpen(false);
        toast.success(
          <div className="flex flex-col">
            <span className="font-black text-sm">Campaign Requested 🚀</span>
            <span className="text-xs">Sent to Admin for approval.</span>
          </div>
        );
        // Refresh the profile to show the newly deducted wallet balance
        refetchProfile(); 
      } catch (err) {
        toast.error(err?.data?.message || "Failed to submit ad campaign.");
      }
  };

  // --- UI Helpers ---
  const getStockBadge = (stock) => {
    const safeStock = Number(stock) || 0;
    if (safeStock > 5) return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider">In Stock</span>;
    if (safeStock > 0 && safeStock <= 5) return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-orange-100 text-orange-700 uppercase tracking-wider">Low Stock</span>;
    return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700 uppercase tracking-wider">Out of Stock</span>;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider border border-emerald-200">Active</span>;
      case 'pending': return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider border border-blue-200">Pending</span>;
      case 'rejected': return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wider border border-red-200">Rejected</span>;
      case 'draft': return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-gray-100 text-gray-600 uppercase tracking-wider border border-gray-200">Draft</span>;
      default: return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-gray-100 text-gray-600 uppercase tracking-wider">{status}</span>;
    }
  };

  const getOrderStatusBadge = (order) => {
    if (order.isDelivered) return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider">Fulfilled</span>;
    if (order.isPaid) return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">Processing</span>;
    return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700 uppercase tracking-wider">Pending Payment</span>;
  };

  const isLoading = isLoadingProducts || isLoadingOrders || isLoadingCoupons;

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center bg-gray-50 pt-24">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading Operations Hub...</p>
        </div>
      </div>
    );
  }

  const calculateProgress = () => {
    if (financialMetrics.totalOrdersCount === 0) return 0;
    return (financialMetrics.deliveredOrdersCount / financialMetrics.totalOrdersCount) * 100;
  };

  return (
    <div className="relative z-10 min-h-[calc(100vh-120px)] bg-gray-50 pt-24 pb-16 px-4 sm:px-6 lg:px-8 font-sans selection:bg-orange-500 selection:text-white">
      <div className="max-w-[100rem] mx-auto">
        
        {/* 🌟 Header Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Vendor Central</h1>
            <p className="text-sm font-bold text-gray-500 mt-1">Real-time business analytics and operations hub.</p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <Link to="/vendor/profile" className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all text-sm">
              <FaEdit /> Seller Profile
            </Link>
            <Link to="/vendor/product/create" className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm">
              <FaPlusCircle /> Add Product
            </Link>
          </div>
        </div>

        {/* 🌟 Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-gray-200 mb-8 overflow-x-auto custom-scrollbar pb-px relative z-20">
          {[
            { id: 'overview', name: 'Financial Overview', icon: FaChartLine },
            { id: 'products', name: `Inventory Catalog (${productMetrics.total})`, icon: FaBoxOpen },
            { id: 'orders', name: `Order Fulfillment (${financialMetrics.totalOrdersCount})`, icon: FaClipboardList },
            { id: 'returns', name: `Returns (${returnsData?.length || 0})`, icon: FaUndo },
            { id: 'performance', name: `Performance`, icon: FaChartLine },
            { id: 'payouts', name: `Payouts`, icon: FaMoneyBillWave },
            { id: 'marketing', name: `Marketing & Ads`, icon: FaBullhorn } 
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === tab.id 
                  ? 'border-orange-600 text-orange-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              <tab.icon size={14} /> {tab.name}
            </button>
          ))}
        </div>

        {/* 🌟 Tab Content */}
        <AnimatePresence mode="wait">
          
          {/* --- OVERVIEW TAB --- */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {/* Financial Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Available Balance */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><FaMoneyBillWave size={80}/></div>
                  <div className="relative z-10">
                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><FaCheckCircle className="text-emerald-500"/> Available Earnings</p>
                    <h3 className="text-3xl font-black text-gray-900 mt-2 tracking-tight">{formatLocalPrice(financialMetrics.availableBalance)}</h3>
                    <p className="text-xs font-bold text-gray-400 mt-2">Funds cleared from fulfilled orders.</p>
                  </div>
                  
                  <Button 
                    variant="primary"
                    onClick={() => {
                      if (!isVerified) return toast.error("Verification Required: Complete KYC to unlock payouts.");
                      if (!bankAccount) return toast.error("Missing Setup: Link a Bank account in Seller Profile.");
                      setIsPayoutModalOpen(true);
                    }}
                    className="mt-6 w-full"
                    disabled={financialMetrics.availableBalance <= 0 && isVerified && bankAccount}
                  >
                    {!isVerified ? <><FaLock size={10} /> Pending KYC</> : !bankAccount ? <><FaUniversity size={10} /> Link Bank</> : 'Request Disbursement'}
                  </Button>
                </div>

                {/* Pending Balance (Escrow) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><FaLock className="text-amber-500"/> Escrow Balance</p>
                    <h3 className="text-3xl font-black text-gray-900 mt-2 tracking-tight">{formatLocalPrice(financialMetrics.pendingBalance)}</h3>
                    <p className="text-xs font-bold text-gray-400 mt-2">Awaiting customer delivery confirmation.</p>
                  </div>
                  <div className="mt-6">
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1.5 overflow-hidden flex">
                      <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${calculateProgress()}%` }}></div>
                      <div className="bg-amber-500 h-full flex-1"></div>
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 text-right uppercase">Release Cycle Active</p>
                  </div>
                </div>

                {/* Inventory Health */}
                <div className="bg-[#0B132B] p-6 rounded-2xl shadow-xl flex flex-col justify-between text-white relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>
                  <div className="relative z-10">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Inventory Health</p>
                    <div className="flex items-end gap-3 mt-2">
                      <h3 className="text-4xl font-black text-white tracking-tight">{productMetrics.total}</h3>
                      <span className="text-sm font-medium text-gray-400 mb-1">Listings</span>
                    </div>
                  </div>
                  <div className="mt-6 space-y-3 relative z-10">
                    <div className="flex justify-between items-center text-xs border-b border-gray-800 pb-2">
                      <span className="text-emerald-400 font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Active</span>
                      <span className="font-mono font-bold">{productMetrics.active}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-b border-gray-800 pb-2">
                      <span className="text-amber-400 font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Low Stock</span>
                      <span className="font-mono font-bold">{productMetrics.lowStock}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-b border-gray-800 pb-2">
                      <span className="text-rose-400 font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-400"></div> Out of Stock</span>
                      <span className="font-mono font-bold">{productMetrics.outOfStock}</span>
                    </div>
                    {productMetrics.pending > 0 && (
                      <div className="flex justify-between items-center text-xs border-b border-gray-800 pb-2">
                        <span className="text-blue-400 font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-400"></div> Pending</span>
                        <span className="font-mono font-bold">{productMetrics.pending}</span>
                      </div>
                    )}
                    {productMetrics.rejected > 0 && (
                      <div className="flex justify-between items-center text-xs border-b border-gray-800 pb-2">
                        <span className="text-red-400 font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-400"></div> Rejected</span>
                        <span className="font-mono font-bold">{productMetrics.rejected}</span>
                      </div>
                    )}
                    {productMetrics.draft > 0 && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400 font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-gray-400"></div> Draft</span>
                        <span className="font-mono font-bold">{productMetrics.draft}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Insights & Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-black text-gray-900 flex items-center gap-2"><FaClock className="text-gray-400"/> Operational Alerts</h2>
                  </div>
                  <div className="space-y-4">
                    {financialMetrics.totalOrdersCount - financialMetrics.deliveredOrdersCount > 0 ? (
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-4">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600 mt-0.5"><FaShoppingBag size={14}/></div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">Pending Fulfillments</p>
                          <p className="text-xs text-gray-500 font-medium mt-1">You have {financialMetrics.totalOrdersCount - financialMetrics.deliveredOrdersCount} order(s) awaiting processing or delivery. Check the orders tab.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-start gap-4">
                        <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600 mt-0.5"><FaCheckCircle size={14}/></div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">All Caught Up</p>
                          <p className="text-xs text-gray-500 font-medium mt-1">You have no pending orders at the moment. Great job!</p>
                        </div>
                      </div>
                    )}
                    {productMetrics.lowStock > 0 && (
                      <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex items-start gap-4">
                        <div className="bg-amber-100 p-2 rounded-lg text-amber-600 mt-0.5"><FaExclamationCircle size={14}/></div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">Low Inventory Warning</p>
                          <p className="text-xs text-gray-500 font-medium mt-1">You have {productMetrics.lowStock} item(s) running low on stock. Restock soon to prevent ranking drops.</p>
                        </div>
                      </div>
                    )}
                    {productMetrics.pending > 0 && (
                      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-4">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600 mt-0.5"><FaClock size={14}/></div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">Pending Approval</p>
                          <p className="text-xs text-gray-500 font-medium mt-1">You have {productMetrics.pending} product(s) awaiting admin review. They will appear on the marketplace once approved.</p>
                        </div>
                      </div>
                    )}
                    {productMetrics.rejected > 0 && (
                      <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-4">
                        <div className="bg-red-100 p-2 rounded-lg text-red-600 mt-0.5"><FaBan size={14}/></div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">Rejected Products</p>
                          <p className="text-xs text-gray-500 font-medium mt-1">You have {productMetrics.rejected} product(s) that were rejected. Check the rejection reason and resubmit.</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-zinc-900 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                  <div className="relative z-10 flex flex-col h-full justify-center text-center">
                    <FaChartLine className="mx-auto text-zinc-600 mb-4" size={40} />
                    <h2 className="text-base font-black tracking-tight mb-2">Advanced Analytics</h2>
                    <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                      Detailed sales graphs and conversion metrics will be available once sufficient historical data is processed.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* --- PRODUCTS TAB --- */}
          {activeTab === 'products' && (
            <motion.div key="products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                <div>
                  <h2 className="text-lg font-black text-gray-900">Your Active Listings</h2>
                  <p className="text-xs font-bold text-gray-500 mt-1">Manage your catalog across the global marketplace.</p>
                </div>
              </div>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-white text-gray-400 text-[10px] uppercase tracking-widest border-b border-gray-200">
                      <th className="p-4 font-black">Item</th>
                      <th className="p-4 font-black">Price</th>
                      <th className="p-4 font-black">Stock</th>
                      <th className="p-4 font-black">Listing</th>
                      <th className="p-4 font-black">Status</th>
                      <th className="p-4 font-black text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-semibold text-gray-800 divide-y divide-gray-100">
                    {vendorProducts.length === 0 ? (
                      <tr><td colSpan="6" className="p-8 text-center text-gray-500 font-medium">You have not added any products yet.</td></tr>
                    ) : (
                      vendorProducts.map((prod) => (
                        <tr key={prod._id} className="hover:bg-orange-50/30 transition-colors group">
                          <td className="p-4 flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                              {prod.image ? <img src={prod.image} alt={prod.name} className="w-full h-full object-cover mix-blend-multiply" /> : <FaBoxOpen className="text-gray-400" />}
                            </div>
                            <div>
                              <Link to={`/product/${prod._id}`} className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-1">{prod.name}</Link>
                              <div className="text-[10px] text-gray-500 font-mono mt-0.5">ID: {prod._id.substring(0, 8).toUpperCase()}</div>
                            </div>
                          </td>
                          <td className="p-4 font-mono font-bold text-gray-900">{formatLocalPrice(prod.price)}</td>
                          <td className="p-4"><span className={`font-bold ${prod.countInStock > 5 ? 'text-gray-900' : prod.countInStock > 0 ? 'text-orange-600' : 'text-rose-600'}`}>{prod.countInStock} units</span></td>
                          <td className="p-4">{getStockBadge(prod.countInStock)}</td>
                          <td className="p-4">{getStatusBadge(prod.status)}</td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => handleOpenStockModal(prod)} className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer" title="Adjust Stock"><FaWarehouse size={14}/></button>
                              <Link to={`/vendor/product/${prod._id}/edit`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"><FaEdit size={14}/></Link>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* --- ORDERS TAB --- */}
          {activeTab === 'orders' && (
            <OrdersTab
              ordersData={ordersData}
              isOrdersError={isOrdersError}
              vendorProducts={vendorProducts}
              formatLocalPrice={formatLocalPrice}
            />
          )}

          {/* 🌟 RETURNS TAB */}
          {activeTab === 'returns' && (
            <motion.div key="returns" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <ReturnsTab />
            </motion.div>
          )}

          {/* 📊 PERFORMANCE TAB */}
          {activeTab === 'performance' && (
            <motion.div key="performance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <SellerPerformanceTab />
            </motion.div>
          )}

          {/* 🌟 PAYOUTS TAB */}
          {activeTab === 'payouts' && (
            <motion.div key="payouts" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              <PayoutHistoryTab />
            </motion.div>
          )}

          {/* 🌟 MARKETING & ADS TAB */}
          {activeTab === 'marketing' && (
            <motion.div key="marketing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-8">
              
              {/* 🌟 NEW: Boost Product / Ads Section */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                 <div className="bg-gray-900 p-6 flex justify-between items-center text-white">
                    <div>
                        <h2 className="text-xl font-black flex items-center gap-2 tracking-tight uppercase"><FaBullhorn className="text-orange-500"/> Campaign Manager</h2>
                        <p className="text-xs text-gray-400 font-bold mt-1 tracking-widest uppercase">Promote your listings to the top of search results</p>
                    </div>
                    <Button variant="primary" onClick={() => setIsAdModalOpen(true)}>
                        + New Campaign
                    </Button>
                 </div>
                 <div className="p-8 text-center bg-gray-50">
                     <FaSearchDollar size={40} className="mx-auto text-gray-300 mb-4" />
                     <h3 className="font-black text-gray-900 mb-1">No Active Campaigns</h3>
                     <p className="text-xs text-gray-500 font-bold">Boost a product to increase visibility and sales.</p>
                 </div>
              </div>

              {/* Existing Promotions/Coupons Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coupon Creator */}
                <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col">
                  <div>
                    <h2 className="text-lg font-black text-gray-900 flex items-center gap-2"><FaTicketAlt className="text-orange-600"/> Deploy Protocol</h2>
                    <p className="text-xs font-bold text-gray-500 mt-1 mb-6">Create discount codes exclusive to your catalog. (Base USD)</p>
                  </div>
                  
                  <form onSubmit={handleCreateCoupon} className="space-y-4 flex-1">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Protocol Code</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={couponForm.code} 
                          onChange={(e) => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})}
                          placeholder="e.g. SUMMER20" 
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 focus:border-orange-500 rounded-xl font-black text-xs text-gray-800 uppercase outline-none transition-all"
                        />
                        <button type="button" onClick={generateRandomCode} className="bg-zinc-900 text-white p-2.5 rounded-xl hover:bg-orange-600 transition-colors cursor-pointer" title="Generate Random">
                          <FaMagic />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Type</label>
                        <select 
                          value={couponForm.discountType}
                          onChange={(e) => setCouponForm({...couponForm, discountType: e.target.value, discountAmount: ''})}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 focus:border-orange-500 rounded-xl font-bold text-xs text-gray-800 outline-none transition-all cursor-pointer"
                        >
                          <option value="percentage">Percentage (%)</option>
                          <option value="fixed">Fixed Amount</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Value {couponForm.discountType === 'fixed' ? `(${currencyCode})` : ''}</label>
                        <input 
                          type="number" 
                          value={couponForm.discountAmount}
                          onChange={(e) => setCouponForm({...couponForm, discountAmount: e.target.value})}
                          placeholder={couponForm.discountType === 'percentage' ? 'e.g. 15' : 'e.g. 50'}
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 focus:border-orange-500 rounded-xl font-bold text-xs text-gray-800 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Min. Order Value ({currencyCode})</label>
                      <input 
                        type="number" 
                        value={couponForm.minOrderAmount}
                        onChange={(e) => setCouponForm({...couponForm, minOrderAmount: e.target.value})}
                        placeholder="e.g. 100" 
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 focus:border-orange-500 rounded-xl font-bold text-xs text-gray-800 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Expiration Date</label>
                      <input 
                        type="date" 
                        value={couponForm.expiryDate}
                        onChange={(e) => setCouponForm({...couponForm, expiryDate: e.target.value})}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 focus:border-orange-500 rounded-xl font-bold text-xs text-gray-800 outline-none transition-all cursor-pointer"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      variant="primary"
                      loading={isCreatingCoupon}
                      className="w-full mt-4"
                    >
                      Activate Protocol
                    </Button>
                  </form>
                </div>

                {/* Active Coupons List */}
                <div className="lg:col-span-2 bg-[#0B132B] rounded-2xl shadow-xl border border-gray-800 p-6 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                  <div className="relative z-10 flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-lg font-black text-white flex items-center gap-2">Active Protocols</h2>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Manage your distributed promo codes.</p>
                    </div>
                  </div>

                  <div className="relative z-10 space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                    {vendorCoupons.length === 0 ? (
                      <div className="text-center py-10 bg-white/5 rounded-xl border border-white/10 border-dashed">
                        <FaTicketAlt className="text-gray-600 text-4xl mx-auto mb-3" />
                        <p className="text-sm font-bold text-gray-400">No active promotions deployed.</p>
                      </div>
                    ) : (
                      vendorCoupons.map(coupon => {
                        const isExpired = new Date(coupon.expiryDate) < new Date();
                        return (
                          <div key={coupon._id} className={`flex items-center justify-between p-4 rounded-xl border ${isExpired ? 'bg-red-900/20 border-red-900/50' : 'bg-white/5 border-white/10 hover:bg-white/10'} transition-all`}>
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-black text-lg ${isExpired ? 'bg-red-900/40 text-red-500' : 'bg-orange-500/20 text-orange-500'}`}>
                                {coupon.discountType === 'percentage' ? '%' : '$'}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-white font-black text-sm uppercase tracking-wider">{coupon.code}</h4>
                                  {isExpired && <span className="text-[8px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-black uppercase">Expired</span>}
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold mt-1">
                                  {coupon.discountType === 'percentage' ? `${coupon.discountAmount}% OFF` : `${formatLocalPrice(coupon.discountAmount)} OFF`} • MIN: {formatLocalPrice(coupon.minOrderAmount)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => copyToClipboard(coupon.code)} className="p-2 text-gray-400 hover:text-white bg-black/20 hover:bg-black/40 rounded-lg transition-colors cursor-pointer" title="Copy Code">
                                <FaCopy size={12} />
                              </button>
                              <button onClick={() => handleDeleteCoupon(coupon._id)} className="p-2 text-gray-400 hover:text-red-500 bg-black/20 hover:bg-black/40 rounded-lg transition-colors cursor-pointer" title="Deactivate">
                                <FaTrash size={12} />
                              </button>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* 🌟 New Ad Campaign Modal */}
        <AnimatePresence>
          {isAdModalOpen && (
            <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAdModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden relative z-50">
                <div className="bg-gray-900 p-6 flex flex-col items-center text-center border-b border-gray-800">
                  <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center border border-orange-500/50 mb-4 shadow-inner">
                    <FaBullhorn className="text-orange-500 text-2xl" />
                  </div>
                  <h2 className="text-white text-xl font-black uppercase tracking-widest">Create Ad Campaign</h2>
                  <p className="text-gray-400 text-xs mt-2 font-medium">Boost your product visibility on the marketplace.</p>
                </div>
                
                <form onSubmit={handleBoostSubmit} className="p-8 bg-gray-50 space-y-6">
                   <div>
                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Select Product to Boost</label>
                       <div className="relative">
                           <select required value={adForm.productId} onChange={(e) => setAdForm({...adForm, productId: e.target.value})} className="w-full p-4 bg-white border border-gray-200 focus:border-orange-500 rounded-xl outline-none font-bold text-sm cursor-pointer appearance-none shadow-sm">
                               <option value="" disabled>Choose an active product...</option>
                               {activeProducts.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                           </select>
                           <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
                       </div>
                       {activeProducts.length === 0 && <p className="text-[10px] text-red-500 mt-2 font-bold">You have no active products to promote.</p>}
                   </div>

                   <div>
                       <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Select Campaign Package</label>
                       <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                           {Object.values(adPackages).map(pkg => (
                               <div key={pkg.id} onClick={() => setAdForm({...adForm, packageId: pkg.id})} className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${adForm.packageId === pkg.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                                   {adForm.packageId === pkg.id && <div className="absolute top-2 right-2 text-orange-500"><FaCheckCircle/></div>}
                                   <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white mb-2 ${pkg.color}`}>{pkg.icon}</div>
                                   <h4 className="font-black text-xs uppercase tracking-tight">{pkg.name}</h4>
                                   <p className="text-gray-500 text-[10px] font-bold mt-1">Cost: {formatLocalPrice(pkg.priceUSD)}</p>
                               </div>
                           ))}
                       </div>
                   </div>

                   <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                       <div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Available Wallet Balance</p>
                           <p className="font-black text-lg text-emerald-600">{formatLocalPrice(financialMetrics.availableBalance)}</p>
                       </div>
                       <FaCreditCard className="text-gray-300 text-3xl" />
                   </div>

                   <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <Button variant="secondary" onClick={() => setIsAdModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" loading={isSubmittingAd} disabled={activeProducts.length === 0}>
                      Pay & Submit
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 🌟 Stock Adjustment Modal */}
        <AnimatePresence>
          {stockModal.open && (
            <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setStockModal({ open: false, product: null })} className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative z-50 p-8">
                <FaWarehouse className="text-4xl text-emerald-500 mx-auto mb-4" />
                <h3 className="text-xl font-black text-gray-900 mb-2 text-center">Adjust Stock</h3>
                <p className="text-sm text-gray-500 mb-6 text-center">
                  <strong>{stockModal.product?.name}</strong>
                </p>
                <form onSubmit={handleAdjustStock} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Stock</label>
                    <p className="text-lg font-black text-gray-900">{stockModal.product?.countInStock || 0} units</p>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">New Quantity *</label>
                    <input type="number" min="0" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} required
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Low Stock Alert Threshold</label>
                    <input type="number" min="0" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Reason (optional)</label>
                    <input type="text" value={stockReason} onChange={(e) => setStockReason(e.target.value)} placeholder="e.g. Restock from supplier"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-emerald-500 transition-all" />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button variant="secondary" onClick={() => setStockModal({ open: false, product: null })}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" loading={isAdjustingStock}>
                      <FaCubes /> Update Stock
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* 🌟 Security Payout Modal */}
        <AnimatePresence>
          {isPayoutModalOpen && (
            <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPayoutModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative z-50">
                <div className="bg-zinc-900 p-8 flex flex-col items-center text-center border-b border-zinc-800">
                  <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700 mb-4 shadow-inner">
                    <FaUniversity className="text-white text-2xl" />
                  </div>
                  <h2 className="text-white text-xl font-black uppercase tracking-widest">Disbursement Request</h2>
                  <p className="text-zinc-400 text-xs mt-2 font-medium">Secure financial routing to your bank.</p>
                </div>
                
                <div className="p-8">
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center mb-8 shadow-inner">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Available Funds</p>
                    <p className="text-4xl font-black text-emerald-600">{formatLocalPrice(financialMetrics.availableBalance)}</p>
                  </div>

                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start gap-3 text-sm text-gray-700 font-medium">
                      <FaCheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={16}/>
                      <span>Funds will be transferred via ACH to your account ending in <strong className="text-gray-900 font-mono">**{last4Digits}</strong>.</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-gray-700 font-medium">
                      <FaClock className="text-amber-500 mt-0.5 shrink-0" size={16}/>
                      <span>Standard clearing time is 3-5 business days depending on your financial institution.</span>
                    </li>
                  </ul>

                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setIsPayoutModalOpen(false)} disabled={isRequestingPayout}>
                      Cancel
                    </Button>
                    <Button 
                      variant="primary"
                      loading={isRequestingPayout}
                      onClick={async () => {
                        try {
                          if (requestPayout) {
                            await requestPayout({ amount: financialMetrics.availableBalance }).unwrap();
                            toast.success("Disbursement request submitted to secure processing queue.");
                            refetchOrders(); 
                          } else {
                            toast.success("Disbursement request generated (Simulation mode).");
                          }
                          setIsPayoutModalOpen(false);
                        } catch (err) {
                          toast.error(err?.data?.message || "Failed to process withdrawal request.");
                        }
                      }}
                    >
                      Confirm Transfer
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

const getItemStatusBadge = (status) => {
  switch (status) {
    case 'Pending': return <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-gray-100 text-gray-600 uppercase tracking-wider">Pending</span>;
    case 'Processed': return <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider">Processed</span>;
    case 'Shipped': return <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wider">Shipped</span>;
    case 'Delivered': return <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider">Delivered</span>;
    case 'Cancelled': return <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wider">Cancelled</span>;
    default: return <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-gray-100 text-gray-600 uppercase tracking-wider">{status}</span>;
  }
};

const OrdersTab = ({ ordersData, isOrdersError, vendorProducts, formatLocalPrice }) => {
  const [updateOrderItem, { isLoading: isUpdating }] = useUpdateVendorOrderItemMutation();
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [shipModal, setShipModal] = useState({ open: false, orderId: null, itemId: null, name: '' });
  const [cancelModal, setCancelModal] = useState({ open: false, orderId: null, itemId: null, name: '' });
  const [trackingNumber, setTrackingNumber] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [orderFilter, setOrderFilter] = useState('all');

  const vendorProductIds = useMemo(() => new Set(vendorProducts.map(p => p._id)), [vendorProducts]);

  // Build list of vendor items across all orders
  const vendorItems = useMemo(() => {
    if (!ordersData) return [];
    const items = [];
    ordersData.forEach(order => {
      (order.orderItems || []).forEach(item => {
        if (vendorProductIds.has(item.product)) {
          items.push({ ...item, orderId: order._id, orderCreatedAt: order.createdAt, customerName: order.user?.name || order.customerName || 'Guest' });
        }
      });
    });
    return items;
  }, [ordersData, vendorProductIds]);

  const filteredItems = useMemo(() => {
    if (orderFilter === 'all') return vendorItems;
    return vendorItems.filter(i => i.itemStatus === orderFilter);
  }, [vendorItems, orderFilter]);

  const handleShip = async () => {
    try {
      await updateOrderItem({ orderId: shipModal.orderId, itemId: shipModal.itemId, status: 'Shipped', trackingNumber }).unwrap();
      toast.success('Item marked as shipped.');
      setShipModal({ open: false, orderId: null, itemId: null, name: '' });
      setTrackingNumber('');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update item.');
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) return toast.error('Please provide a cancellation reason.');
    try {
      await updateOrderItem({ orderId: cancelModal.orderId, itemId: cancelModal.itemId, status: 'Cancelled', reason: cancelReason }).unwrap();
      toast.success('Item cancelled.');
      setCancelModal({ open: false, orderId: null, itemId: null, name: '' });
      setCancelReason('');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to cancel item.');
    }
  };

  const handleProcess = async (orderId, itemId) => {
    try {
      await updateOrderItem({ orderId, itemId, status: 'Processed' }).unwrap();
      toast.success('Item marked as processed.');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to process item.');
    }
  };

  const filterTabs = [
    { id: 'all', label: `All (${vendorItems.length})` },
    { id: 'Pending', label: `Pending (${vendorItems.filter(i => i.itemStatus === 'Pending').length})` },
    { id: 'Shipped', label: `Shipped (${vendorItems.filter(i => i.itemStatus === 'Shipped').length})` },
    { id: 'Delivered', label: `Delivered (${vendorItems.filter(i => i.itemStatus === 'Delivered').length})` },
    { id: 'Cancelled', label: `Cancelled (${vendorItems.filter(i => i.itemStatus === 'Cancelled').length})` },
  ];

  if (isOrdersError) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <FaExclamationCircle className="text-amber-500 text-5xl mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900">API Connection Error</h3>
        <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">Could not fetch vendor orders. Please check backend connection.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{vendorItems.filter(i => i.itemStatus === 'Pending').length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Shipped</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{vendorItems.filter(i => i.itemStatus === 'Shipped').length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Delivered</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{vendorItems.filter(i => i.itemStatus === 'Delivered').length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Items</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{vendorItems.length}</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-1 p-4 border-b border-gray-100 overflow-x-auto custom-scrollbar">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setOrderFilter(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                orderFilter === tab.id
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white text-gray-400 text-[10px] uppercase tracking-widest border-b border-gray-200">
                <th className="p-4 font-black">Product</th>
                <th className="p-4 font-black">Customer</th>
                <th className="p-4 font-black">Qty</th>
                <th className="p-4 font-black">Earnings</th>
                <th className="p-4 font-black">Status</th>
                <th className="p-4 font-black">Tracking</th>
                <th className="p-4 font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm font-semibold text-gray-800 divide-y divide-gray-100">
              {filteredItems.length === 0 ? (
                <tr><td colSpan="7" className="p-12 text-center text-gray-500 font-medium">No items match this filter.</td></tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                          {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <FaBoxOpen className="text-gray-400 text-xs" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 text-xs truncate max-w-[180px]">{item.name}</p>
                          <p className="text-[9px] text-gray-400 font-mono mt-0.5">{new Date(item.orderCreatedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-gray-600">{item.customerName}</td>
                    <td className="p-4 font-mono text-xs">{item.qty}</td>
                    <td className="p-4 font-bold text-gray-900 font-mono text-xs">{formatLocalPrice(item.price * item.qty)}</td>
                    <td className="p-4">{getItemStatusBadge(item.itemStatus)}</td>
                    <td className="p-4 text-xs font-mono text-gray-500 max-w-[120px] truncate">
                      {item.trackingNumber || <span className="text-gray-300 italic">—</span>}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        {item.itemStatus === 'Pending' && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleProcess(item.orderId, item._id)}
                              disabled={isUpdating}
                            >
                              Process
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setCancelModal({ open: true, orderId: item.orderId, itemId: item._id, name: item.name })}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {item.itemStatus === 'Processed' && (
                          <>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setShipModal({ open: true, orderId: item.orderId, itemId: item._id, name: item.name })}
                            >
                              Ship
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setCancelModal({ open: true, orderId: item.orderId, itemId: item._id, name: item.name })}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {item.itemStatus === 'Shipped' && (
                          <span className="text-[10px] text-gray-400 italic px-2">Awaiting delivery confirmation</span>
                        )}
                        {item.itemStatus === 'Delivered' && (
                          <span className="text-[10px] text-emerald-600 font-bold px-2">Completed</span>
                        )}
                        {item.itemStatus === 'Cancelled' && (
                          <span className="text-[10px] text-red-400 italic px-2">{item.cancelledReason || 'Cancelled'}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ship Modal */}
      <AnimatePresence>
        {shipModal.open && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShipModal({ open: false, orderId: null, itemId: null, name: '' })} className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative z-50 p-8">
              <FaTruck className="text-4xl text-indigo-500 mx-auto mb-4" />
              <h3 className="text-xl font-black text-gray-900 mb-2 text-center">Ship Item</h3>
              <p className="text-sm text-gray-500 mb-6 text-center">Mark <strong>{shipModal.name}</strong> as shipped.</p>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Tracking number (optional)"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm mb-6 outline-none focus:border-indigo-500 transition-all"
              />
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setShipModal({ open: false, orderId: null, itemId: null, name: '' })}>Cancel</Button>
                <Button variant="primary" onClick={handleShip} loading={isUpdating}>Mark as Shipped</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cancel Modal */}
      <AnimatePresence>
        {cancelModal.open && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setCancelModal({ open: false, orderId: null, itemId: null, name: '' })} className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative z-50 p-8">
              <FaTimesCircle className="text-4xl text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-black text-gray-900 mb-2 text-center">Cancel Item</h3>
              <p className="text-sm text-gray-500 mb-6 text-center">Cancel <strong>{cancelModal.name}</strong>. Provide a reason.</p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Reason for cancellation (required)..."
                rows={3}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm mb-6 outline-none focus:border-red-500 transition-all resize-none"
              />
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setCancelModal({ open: false, orderId: null, itemId: null, name: '' })}>Keep Order</Button>
                <Button variant="danger" onClick={handleCancel} disabled={!cancelReason.trim()} loading={isUpdating}>Cancel Item</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VendorDashboard;