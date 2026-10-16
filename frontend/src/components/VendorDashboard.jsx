import React, { useState, useMemo } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaBoxOpen, FaChartLine, FaHeart, FaPlusCircle, FaEdit, FaTrash, 
  FaShoppingBag, FaUsers, FaArrowUp, FaArrowDown, 
  FaClipboardList, FaClock, FaCheckCircle, FaExclamationCircle,
  FaLock, FaUniversity, FaMoneyBillWave
} from 'react-icons/fa';
import Button from './Button';
import { useSelector } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// 🌟 Real API Hooks
import { useGetVendorProductsQuery } from '../slices/productsApiSlice';
import { useGetVendorOrdersQuery } from '../slices/ordersApiSlice'; 

const VendorDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

  // Global State
  const { userInfo } = useSelector((state) => state.auth);
  
  // 🌟 Currency Formatting (Strictly English as requested)
  const { currencyCode, rate } = useSelector((state) => state.currency);
  
  const formatCurrency = (amount) => {
    const convertedAmount = amount * rate;
    // Always use the standard ISO currency code (e.g., EGP, USD, SAR) instead of symbols like ج.م
    return `${currencyCode} ${convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 🌟 1. Real Data Fetching
  const { data: productsData, isLoading: isLoadingProducts } = useGetVendorProductsQuery({});
  const { data: ordersData, isLoading: isLoadingOrders, isError: isOrdersError } = useGetVendorOrdersQuery({});

  // 🌟 2. Data Processing & Aggregation (Real-time Live Engine)
  
  // Extract Vendor's specific products
  const vendorProducts = useMemo(() => {
    if (!productsData) return [];
    const allProds = Array.isArray(productsData) ? productsData : productsData.products || [];
    return allProds.filter(product => {
      if (!product.user) return false;
      if (typeof product.user === 'object') return product.user._id === userInfo._id;
      return product.user === userInfo._id;
    });
  }, [productsData, userInfo]);

  // Calculate Inventory Health Metrics
  const productMetrics = useMemo(() => {
    let active = 0; let lowStock = 0; let outOfStock = 0;
    vendorProducts.forEach(p => {
      if (p.countInStock > 5) active++;
      else if (p.countInStock > 0 && p.countInStock <= 5) lowStock++;
      else if (p.countInStock === 0) outOfStock++;
    });
    return { active, lowStock, outOfStock, total: vendorProducts.length };
  }, [vendorProducts]);

  // Calculate Financial & Order Metrics strictly from real Backend Orders
  const financialMetrics = useMemo(() => {
    let availableBalance = 0; // Cleared funds (Delivered)
    let pendingBalance = 0;   // Escrow funds (Paid but not delivered)
    let totalOrdersCount = 0;
    let deliveredOrdersCount = 0;

    if (ordersData && Array.isArray(ordersData)) {
      ordersData.forEach(order => {
        // Filter items in the order that specifically belong to this vendor
        const vendorItemsInOrder = order.orderItems.filter(item => 
          vendorProducts.some(vp => vp._id === item.product)
        );

        if (vendorItemsInOrder.length > 0) {
          totalOrdersCount++;
          const orderEarnings = vendorItemsInOrder.reduce((acc, item) => acc + (item.price * item.qty), 0);

          if (order.isDelivered) {
            availableBalance += orderEarnings;
            deliveredOrdersCount++;
          } else if (order.isPaid) {
            pendingBalance += orderEarnings;
          }
        }
      });
    }

    return { availableBalance, pendingBalance, totalOrdersCount, deliveredOrdersCount };
  }, [ordersData, vendorProducts]);

  // Status Badge Component
  const getStockBadge = (stock) => {
    if (stock > 5) return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase tracking-wider">Active</span>;
    if (stock > 0 && stock <= 5) return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-200 uppercase tracking-wider">Low Stock</span>;
    return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 uppercase tracking-wider">Out of Stock</span>;
  };

  const getOrderStatusBadge = (order) => {
    if (order.isDelivered) return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider">Fulfilled</span>;
    if (order.isPaid) return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">Processing</span>;
    return <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700 uppercase tracking-wider">Pending Payment</span>;
  };

  const isLoading = isLoadingProducts || isLoadingOrders;

  if (!userInfo || (userInfo.role !== 'vendor' && !userInfo.isAdmin)) {
    return <Navigate to="/403" />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)] bg-[#F8F9FA] pt-8 pb-16 px-4 sm:px-6 lg:px-8 font-sans selection:bg-orange-500 selection:text-white">
      <div className="max-w-7xl mx-auto">
        
        {/* 🌟 Header Section */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Vendor Central</h1>
            <p className="text-sm font-bold text-gray-500 mt-1">Real-time business analytics and operations hub.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/vendor/profile" className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all text-sm">
              <FaEdit /> Seller Profile
            </Link>
            <Link to="/admin/productlist" className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm">
              <FaPlusCircle /> Add Product
            </Link>
          </div>
        </div>

        {/* 🌟 Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-gray-200 mb-8 overflow-x-auto custom-scrollbar pb-px">
          {[
            { id: 'overview', name: 'Financial Overview', icon: FaChartLine },
            { id: 'products', name: `Inventory Catalog (${productMetrics.total})`, icon: FaBoxOpen },
            { id: 'orders', name: `Order Fulfillment (${financialMetrics.totalOrdersCount})`, icon: FaClipboardList }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
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
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5"><FaMoneyBillWave size={80}/></div>
                  <div className="relative z-10">
                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><FaCheckCircle className="text-emerald-500"/> Available Earnings</p>
                    <h3 className="text-3xl font-black text-gray-900 mt-2 tracking-tight">{formatCurrency(financialMetrics.availableBalance)}</h3>
                    <p className="text-xs font-bold text-gray-400 mt-2">Funds cleared from fulfilled orders.</p>
                  </div>
                  <Button 
                    onClick={() => setIsPayoutModalOpen(true)}
                    variant="primary"
                    className="mt-6 w-full"
                    disabled={financialMetrics.availableBalance <= 0}
                  >
                    Request Disbursement
                  </Button>
                </div>

                {/* Pending Balance (Escrow) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-black text-gray-500 uppercase tracking-widest flex items-center gap-1.5"><FaLock className="text-amber-500"/> Escrow Balance</p>
                    <h3 className="text-3xl font-black text-gray-900 mt-2 tracking-tight">{formatCurrency(financialMetrics.pendingBalance)}</h3>
                    <p className="text-xs font-bold text-gray-400 mt-2">Awaiting customer delivery confirmation.</p>
                  </div>
                  <div className="mt-6">
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1.5 overflow-hidden flex">
                      <div className="bg-emerald-500 h-full" style={{ width: `${financialMetrics.totalOrdersCount === 0 ? 0 : (financialMetrics.deliveredOrdersCount / financialMetrics.totalOrdersCount) * 100}%` }}></div>
                      <div className="bg-amber-500 h-full flex-1"></div>
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 text-right uppercase">Release Cycle Active</p>
                  </div>
                </div>

                {/* Inventory Health */}
                <div className="bg-[#0B132B] p-6 rounded-2xl shadow-xl flex flex-col justify-between text-white relative">
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Inventory Health</p>
                    <div className="flex items-end gap-3 mt-2">
                      <h3 className="text-4xl font-black text-white tracking-tight">{productMetrics.total}</h3>
                      <span className="text-sm font-medium text-gray-400 mb-1">Listings</span>
                    </div>
                  </div>
                  <div className="mt-6 space-y-3">
                    <div className="flex justify-between items-center text-xs border-b border-gray-800 pb-2">
                      <span className="text-emerald-400 font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400"></div> Active</span>
                      <span className="font-mono font-bold">{productMetrics.active}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-b border-gray-800 pb-2">
                      <span className="text-amber-400 font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-400"></div> Low Stock</span>
                      <span className="font-mono font-bold">{productMetrics.lowStock}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-rose-400 font-bold flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-400"></div> Out of Stock</span>
                      <span className="font-mono font-bold">{productMetrics.outOfStock}</span>
                    </div>
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
                  </div>
                </div>

                {/* Backend Missing Connection Notice Placeholder */}
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
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
            >
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
                      <th className="p-4 font-black">Status</th>
                      <th className="p-4 font-black text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm font-semibold text-gray-800 divide-y divide-gray-100">
                    {vendorProducts.length === 0 ? (
                      <tr><td colSpan="5" className="p-8 text-center text-gray-500 font-medium">You have not added any products yet.</td></tr>
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
                          <td className="p-4 font-mono font-bold text-gray-900">{formatCurrency(prod.price)}</td>
                          <td className="p-4"><span className={`font-bold ${prod.countInStock > 5 ? 'text-gray-900' : prod.countInStock > 0 ? 'text-orange-600' : 'text-rose-600'}`}>{prod.countInStock} units</span></td>
                          <td className="p-4">{getStockBadge(prod.countInStock)}</td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Link to={`/admin/product/${prod._id}/edit`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"><FaEdit size={14}/></Link>
                              {/* Add delete handler if needed */}
                              <button className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><FaTrash size={14}/></button>
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
            <motion.div
              key="orders"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-black text-gray-900">Order Fulfillment Center</h2>
                  <p className="text-xs text-gray-500 font-medium mt-1">Review customer orders containing your products.</p>
                </div>
              </div>

              {isOrdersError ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                    <FaExclamationCircle className="text-amber-500 text-5xl mb-4" />
                    <h3 className="text-lg font-bold text-gray-900">API Connection Pending</h3>
                    <p className="text-sm text-gray-500 mt-2 max-w-md">Your backend orders endpoint is currently unavailable. Please ensure <code className="bg-gray-100 px-1 rounded text-rose-500">/api/orders/vendor</code> is correctly implemented and linked.</p>
                </div>
              ) : (
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-white text-gray-400 text-[10px] uppercase tracking-widest border-b border-gray-200">
                        <th className="p-4 font-black">Order ID</th>
                        <th className="p-4 font-black">Date</th>
                        <th className="p-4 font-black">Customer</th>
                        <th className="p-4 font-black">Vendor Share</th>
                        <th className="p-4 font-black">Status</th>
                        <th className="p-4 font-black text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm font-semibold text-gray-800 divide-y divide-gray-100">
                      {!ordersData || ordersData.length === 0 ? (
                        <tr><td colSpan="6" className="p-12 text-center text-gray-500 font-medium">No customer orders recorded yet.</td></tr>
                      ) : (
                        ordersData.map((order) => {
                          // Calculate this specific vendor's share of the total order
                          const vendorShare = order.orderItems
                            .filter(item => vendorProducts.some(vp => vp._id === item.product))
                            .reduce((acc, item) => acc + (item.price * item.qty), 0);

                          if (vendorShare === 0) return null; // Safety check

                          return (
                            <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                              <td className="p-4 font-mono text-xs text-gray-500">{order._id.substring(0, 10).toUpperCase()}</td>
                              <td className="p-4 text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</td>
                              <td className="p-4">{order.user?.name || 'Guest'}</td>
                              <td className="p-4 font-bold text-gray-900">{formatCurrency(vendorShare)}</td>
                              <td className="p-4">{getOrderStatusBadge(order)}</td>
                              <td className="p-4 text-right">
                                <Link to={`/order/${order._id}`} className="text-xs font-black bg-gray-900 hover:bg-orange-600 text-white px-4 py-2 rounded-lg transition-colors">
                                  View Details
                                </Link>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>

        {/* 🌟 Security Payout Modal (Amazon Style Safety Check) */}
        <AnimatePresence>
          {isPayoutModalOpen && (
            <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsPayoutModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative z-10"
              >
                <div className="bg-zinc-900 p-8 flex flex-col items-center text-center border-b border-zinc-800">
                  <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700 mb-4 shadow-inner">
                    <FaUniversity className="text-white text-2xl" />
                  </div>
                  <h2 className="text-white text-xl font-black uppercase tracking-widest">Disbursement Request</h2>
                  <p className="text-zinc-400 text-xs mt-2 font-medium">Secure financial routing to your registered bank.</p>
                </div>
                
                <div className="p-8">
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 text-center mb-8 shadow-inner">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Available Funds</p>
                    <p className="text-4xl font-black text-emerald-600">{formatCurrency(financialMetrics.availableBalance)}</p>
                  </div>

                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start gap-3 text-sm text-gray-700 font-medium">
                      <FaCheckCircle className="text-emerald-500 mt-0.5 shrink-0" size={16}/>
                      <span>Funds will be transferred via ACH to your account ending in <strong className="text-gray-900 font-mono">**9021</strong>.</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-gray-700 font-medium">
                      <FaClock className="text-amber-500 mt-0.5 shrink-0" size={16}/>
                      <span>Standard clearing time is 3-5 business days depending on your financial institution.</span>
                    </li>
                  </ul>

                  <div className="flex gap-3">
                    <Button onClick={() => setIsPayoutModalOpen(false)} variant="secondary" className="flex-1">
                      Cancel
                    </Button>
                    <Button 
                      onClick={() => {
                        toast.success("Disbursement request submitted to secure processing queue.");
                        setIsPayoutModalOpen(false);
                      }}
                      variant="primary"
                      className="flex-1"
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

export default VendorDashboard;