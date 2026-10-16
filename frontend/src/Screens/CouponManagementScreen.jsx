import React, { useState, useMemo } from 'react';
import { useGetCouponsQuery, useCreateCouponMutation, useDeleteCouponMutation } from '../slices/couponsApiSlice';
import { toast } from 'react-toastify';
import {
  FiPlus, FiTrash2, FiCopy, FiTag, FiActivity, FiSearch, FiX, FiCalendar, FiCheck, FiPercent, FiDollarSign
} from 'react-icons/fi';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux'; // 🌟 Added Redux

const CouponManagementScreen = () => {
  const [showDrawer, setShowDrawer] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Form State (User inputs local currency values here)
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountAmount, setDiscountAmount] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [usageLimit, setUsageLimit] = useState(100);
  const [minOrderAmount, setMinOrderAmount] = useState('');

  // 🌟 Currency Setup
  const { currencyCode = 'USD', rate = 1 } = useSelector((state) => state.currency);

  const { data: coupons, isLoading, refetch } = useGetCouponsQuery();
  const [createCoupon, { isLoading: isCreating }] = useCreateCouponMutation();
  const [deleteCoupon] = useDeleteCouponMutation();

  // 🌟 منع السكرول للصفحة الأساسية لما يكون الـ Drawer مفتوح
  React.useEffect(() => {
    if (showDrawer) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [showDrawer]);

  const handleClose = () => {
    setShowDrawer(false);
    setCode('');
    setDiscountAmount('');
    setExpiryDate('');
    setUsageLimit(100);
    setMinOrderAmount('');
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.info(`Promo code copied!`, { position: "bottom-center", autoClose: 1000, hideProgressBar: true });
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 🌟 Local Display Formatter
  const formatLocalPrice = (amount) => {
    const safeAmount = Number(amount) || 0;
    const convertedAmount = safeAmount * rate;
    return `${currencyCode} ${convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!code || !discountAmount || !expiryDate) {
        return toast.warning("Please fill all required payload fields.");
    }

    try {
      // 🌟 MAGIC HAPPENS HERE: Convert Local Input -> Base USD Output
      // If percentage, send as is. If fixed amount, convert back to USD base.
      const finalDiscountAmount = discountType === 'percentage' 
        ? Number(discountAmount) 
        : Number(discountAmount) / rate; 

      const finalMinOrderAmount = (Number(minOrderAmount) || 0) / rate;

      await createCoupon({
        code: code.trim().toUpperCase(),
        discountType,
        discountAmount: finalDiscountAmount, // Saved as USD Base
        expiryDate,
        usageLimit: Number(usageLimit),
        minOrderAmount: finalMinOrderAmount, // Saved as USD Base
        isGlobal: true 
      }).unwrap();
      
      toast.success('🎉 Campaign Deployed Successfully!');
      handleClose();
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err.error || "Failed to deploy campaign.");
    }
  };

  const deleteHandler = async (id) => {
    if (window.confirm('WARNING: Are you sure you want to decommission this active coupon rule? ⚠️')) {
      try {
        await deleteCoupon(id).unwrap();
        toast.success('🗑️ Coupon Matrix Removed');
        refetch();
      } catch (err) {
        toast.error(err?.data?.message || err.error);
      }
    }
  };

  const isExpired = (date) => new Date(date) < new Date();

  const filteredCoupons = useMemo(() => {
    if (!coupons) return [];
    return coupons.filter(c => c.code.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [coupons, searchTerm]);

  return (
    <div className="bg-[#fafafa] min-h-screen pt-28 pb-20 px-4 sm:px-6 lg:px-8 font-sans antialiased text-gray-900 relative" style={{ backgroundImage: `radial-gradient(#e5e7eb 1px, transparent 1px)`, backgroundSize: '24px 24px' }}>
      <div className="max-w-[100rem] mx-auto relative z-10">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-10">
          <div>
            <div className="inline-block bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg mb-3 shadow-sm">
              Admin Marketing Module
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 uppercase tracking-tighter italic leading-none">
              Platform <span className="text-orange-600">Promotions</span>
            </h1>
            <p className="text-gray-500 font-bold mt-2 text-xs md:text-sm tracking-wide">Manage global platform discount campaigns.</p>
          </div>
          <button 
            onClick={() => setShowDrawer(true)}
            className="w-full md:w-auto bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-orange-600 transition-colors shadow-lg active:scale-95 flex items-center justify-center gap-3 shrink-0 cursor-pointer"
          >
            <FiPlus size={18} /> Deploy Global Rule
          </button>
        </div>

        {/* --- STATS CARDS --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <FiTag size={24} />
            </div>
            <div>
              <h6 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Total Rules</h6>
              <h3 className="text-3xl font-black text-gray-900 leading-none tracking-tight">{coupons?.length || 0}</h3>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
              <FiActivity size={24} className="animate-pulse" />
            </div>
            <div>
              <h6 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Active Live</h6>
              <h3 className="text-3xl font-black text-gray-900 leading-none tracking-tight">
                {coupons?.filter(c => !isExpired(c.expiryDate)).length || 0}
              </h3>
            </div>
          </div>
        </div>

        {/* --- SEARCH BAR --- */}
        <div className="relative group mb-10 max-w-2xl">
            <FiSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-600 transition-colors" size={20} />
            <input 
                type="text" 
                placeholder="Search active payload by promo code..." 
                className="pl-14 pr-8 py-4 bg-white border border-gray-200 rounded-[2rem] shadow-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 w-full font-bold text-sm transition-all text-gray-900"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>

        {/* --- CONTENT AREA --- */}
        {isLoading ? (
          <div className="text-center py-24">
            <div className="animate-spin h-12 w-12 border-4 border-gray-200 border-t-orange-600 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400 font-black tracking-widest uppercase text-xs">Fetching Campaign Grid...</p>
          </div>
        ) : (
          <div>
            {/* 1. DESKTOP VIEW (TABLE) */}
            <div className="hidden lg:block bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="p-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-left">Promo Code</th>
                      <th className="p-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-left">Source</th>
                      <th className="p-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-left">Min Payload</th>
                      <th className="p-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-left">Discount Factor</th>
                      <th className="p-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-left">Global Usage</th>
                      <th className="p-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-left">Expiry Gateway</th>
                      <th className="p-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-left">Status</th>
                      <th className="p-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCoupons.map((coupon) => {
                      const expired = isExpired(coupon.expiryDate);
                      return (
                        <tr key={coupon._id} className={`hover:bg-orange-50/30 transition-colors ${expired ? 'grayscale opacity-60 bg-gray-50/50' : ''}`}>
                          {/* Code */}
                          <td className="p-6">
                            <div className="flex items-center gap-3">
                              <span className="bg-gray-900 text-white px-4 py-2 rounded-xl font-mono font-black text-xs tracking-wider shadow-inner">
                                {coupon.code}
                              </span>
                              <button onClick={() => copyToClipboard(coupon.code, coupon._id)} className="text-gray-400 hover:text-orange-600 transition-colors cursor-pointer">
                                {copiedId === coupon._id ? <FiCheck className="text-emerald-500" size={18} /> : <FiCopy size={18} />}
                              </button>
                            </div>
                          </td>
                          {/* Source (Global vs Vendor) */}
                          <td className="p-6">
                            {coupon.isGlobal ? (
                              <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider">Platform</span>
                            ) : (
                              <span className="bg-purple-50 text-purple-600 border border-purple-100 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider">Vendor</span>
                            )}
                          </td>
                          {/* 🌟 Min Amount - Display locally */}
                          <td className="p-6 font-black text-gray-900 text-sm">
                            {coupon.minOrderAmount > 0 ? formatLocalPrice(coupon.minOrderAmount) : 'None'}
                          </td>
                          {/* 🌟 Discount Value - Display locally if fixed */}
                          <td className="p-6">
                            <span className="font-black text-xl text-orange-600">
                              {coupon.discountType === 'percentage' ? coupon.discountAmount : formatLocalPrice(coupon.discountAmount)}
                              <span className="text-xs text-gray-400 ml-1">{coupon.discountType === 'percentage' ? '%' : ''}</span>
                            </span>
                          </td>
                          {/* Usage */}
                          <td className="p-6">
                            <div className="bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 text-xs font-bold shadow-sm">
                              <span className="text-gray-900">{coupon.usedCount || 0}</span>
                              <span className="text-gray-400">/ {coupon.usageLimit}</span>
                            </div>
                          </td>
                          {/* Expiry */}
                          <td className="p-6">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                              <FiCalendar className="text-gray-400" size={14} />
                              {new Date(coupon.expiryDate).toLocaleDateString('en-GB')}
                            </div>
                          </td>
                          {/* Status */}
                          <td className="p-6">
                            {expired ? (
                              <span className="bg-gray-200 text-gray-500 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">Expired</span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1.5 w-fit">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Live
                              </span>
                            )}
                          </td>
                          {/* Action */}
                          <td className="p-6 text-center">
                            <button 
                              onClick={() => deleteHandler(coupon._id)} 
                              className="text-gray-400 hover:text-red-600 p-2.5 bg-white hover:bg-red-50 border border-gray-200 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                              title="Delete Coupon"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredCoupons.length === 0 && (
                      <tr>
                        <td colSpan="8" className="p-16 text-center text-gray-400 font-bold uppercase tracking-widest text-xs border-dashed border-2 border-gray-100 m-4 rounded-xl">
                          No coupons match your active search vector.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. MOBILE VIEW (CARDS) */}
            <div className="lg:hidden space-y-4">
              {filteredCoupons.map((coupon) => {
                const expired = isExpired(coupon.expiryDate);
                return (
                  <div key={coupon._id} className={`bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden ${expired ? 'grayscale opacity-75' : ''}`}>
                    {/* Header */}
                    <div className="p-5 border-b border-dashed border-gray-200 bg-gray-50/50 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="bg-gray-900 text-white px-3 py-1.5 rounded-lg font-mono font-black text-sm tracking-wider shadow-inner">
                          {coupon.code}
                        </span>
                        <button onClick={() => copyToClipboard(coupon.code, coupon._id)} className="text-gray-400 hover:text-orange-600 cursor-pointer">
                          {copiedId === coupon._id ? <FiCheck className="text-emerald-500" size={18} /> : <FiCopy size={18} />}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                         {coupon.isGlobal ? (
                            <span className="bg-blue-50 text-blue-600 border border-blue-100 px-2 py-1 rounded text-[8px] font-bold uppercase tracking-wider">Platform</span>
                          ) : (
                            <span className="bg-purple-50 text-purple-600 border border-purple-100 px-2 py-1 rounded text-[8px] font-bold uppercase tracking-wider">Vendor</span>
                          )}
                         {expired ? (
                           <span className="bg-gray-200 text-gray-500 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md">Expired</span>
                         ) : (
                           <span className="bg-emerald-100 text-emerald-600 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md">Live</span>
                         )}
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-5 flex justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-black text-gray-400 block mb-1">Payload Factor</span>
                        <span className="text-2xl font-black text-orange-600">
                          {/* 🌟 Mobile Display locally */}
                          {coupon.discountType === 'percentage' ? coupon.discountAmount : formatLocalPrice(coupon.discountAmount)}
                          <span className="text-xs text-gray-400 ml-1">{coupon.discountType === 'percentage' ? '%' : ''}</span>
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-black text-gray-400 block mb-1">Usage Load</span>
                        <div className="bg-gray-50 border border-gray-200 px-3 py-1 rounded-lg inline-flex items-center gap-1 text-xs font-bold">
                          <span className="text-gray-900">{coupon.usedCount || 0}</span>
                          <span className="text-gray-400">/ {coupon.usageLimit}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                        <FiCalendar className="text-gray-400" size={14}/>
                        {new Date(coupon.expiryDate).toLocaleDateString('en-GB')}
                      </div>
                      <button onClick={() => deleteHandler(coupon._id)} className="text-gray-400 hover:text-red-600 p-2.5 bg-white rounded-xl border border-gray-200 shadow-sm cursor-pointer active:scale-95">
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                )
              })}
              {filteredCoupons.length === 0 && (
                <div className="text-center p-12 bg-white rounded-3xl shadow-sm text-gray-400 font-bold text-xs uppercase tracking-widest border border-dashed border-gray-200">
                  No coupons found.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- 🌟 PRO SIDE DRAWER (OFF-CANVAS) --- */}
      <AnimatePresence>
        {showDrawer && (
          <>
            {/* Backdrop: z-[2000] to cover everything including Navbar */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
              onClick={handleClose} 
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[2000] cursor-pointer" 
            />
            
            {/* Drawer Container */}
            <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[2010] flex flex-col border-l border-gray-200"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50 shrink-0">
                <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic m-0">Establish <span className="text-orange-600">Rule</span></h4>
                <button onClick={handleClose} className="p-2 text-gray-400 hover:text-red-600 bg-white border border-gray-200 shadow-sm rounded-xl transition-colors hover:bg-red-50 cursor-pointer">
                  <FiX size={20} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                <form id="coupon-form" onSubmit={submitHandler} className="space-y-6">
                  
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Promo Code Vector</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><FiTag className="text-gray-400 group-focus-within:text-orange-600 transition-colors" /></div>
                      <input 
                        type="text" 
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-2xl outline-none font-black text-gray-900 uppercase tracking-wider transition-all" 
                        placeholder="E.G. VIP2026" 
                        value={code} 
                        onChange={(e) => setCode(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    {/* 🌟 Update label to tell admin to enter local currency */}
                    <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Activation Threshold (Min Amount {currencyCode})</label>
                    <div className="relative group">
                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><FiDollarSign className="text-gray-400 group-focus-within:text-orange-600 transition-colors" /></div>
                       <input 
                         type="number" 
                         className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-2xl outline-none font-bold text-gray-800 transition-all" 
                         placeholder="0.00" 
                         value={minOrderAmount} 
                         onChange={(e) => setMinOrderAmount(e.target.value)} 
                       />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Logic Type</label>
                      <div className="relative">
                        <select 
                          className="w-full pl-4 pr-8 py-4 bg-gray-50 border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-2xl outline-none font-bold text-gray-800 appearance-none cursor-pointer transition-all" 
                          value={discountType} 
                          onChange={(e) => setDiscountType(e.target.value)}
                        >
                          <option value="percentage">Percent (%)</option>
                          <option value="fixed">Fixed (Value)</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {/* 🌟 Update label */}
                      <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Impact Value {discountType === 'fixed' ? `(${currencyCode})` : ''}</label>
                      <input 
                        type="number" min="1" 
                        className="w-full px-5 py-4 bg-gray-900 border border-gray-800 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/50 rounded-2xl outline-none font-black text-white transition-all placeholder-gray-600" 
                        placeholder="0"
                        value={discountAmount} 
                        onChange={(e) => setDiscountAmount(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">Usage Capacity</label>
                      <input 
                        type="number" min="1" 
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-2xl outline-none font-bold text-gray-800 transition-all" 
                        placeholder="100"
                        value={usageLimit} 
                        onChange={(e) => setUsageLimit(e.target.value)} 
                        required 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-gray-500 tracking-widest ml-1">System Expiry Date</label>
                      <input 
                        type="date" 
                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-2xl outline-none font-bold text-gray-800 transition-all cursor-pointer" 
                        value={expiryDate} 
                        onChange={(e) => setExpiryDate(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>
                </form>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-gray-200 bg-white grid grid-cols-2 gap-4 shrink-0">
                <button 
                  type="button" 
                  onClick={handleClose} 
                  className="py-4 font-black text-xs tracking-widest uppercase rounded-2xl bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  form="coupon-form"
                  disabled={isCreating} 
                  className="py-4 font-black text-xs tracking-widest uppercase rounded-2xl bg-orange-600 text-white hover:bg-gray-900 transition-all shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isCreating ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> : 'Deploy'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Custom Scrollbar for Drawer (Optional inline fix) */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
};

export default CouponManagementScreen;