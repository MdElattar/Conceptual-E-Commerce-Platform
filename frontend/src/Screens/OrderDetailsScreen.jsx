import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import {
  useGetOrderDetailsQuery,
  useDeliverOrderMutation,
  useProcessOrderMutation,
  useOnWayOrderMutation,
  useCancelOrderMutation,
  useAdminBankRefundAndDeductMutation,
  useConfirmItemDeliveryMutation 
} from '../slices/orderApiSlice';
import {
  FaShippingFast, FaCreditCard, FaBox, FaTruck, FaBoxOpen,
  FaHome, FaCheckCircle, FaBan, FaHistory, FaTag,
  FaPalette, FaRulerCombined, FaCopy, FaPrint, FaUniversity, 
  FaExclamationTriangle, FaPhoneAlt, FaSpinner, FaCamera, FaCloudUploadAlt, FaShieldAlt, FaLock,
  FaClock, FaChevronLeft
} from 'react-icons/fa';
import Message from '../components/Message';
import { toast } from 'react-toastify';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { formatAddressMultiLine } from '../utils/formatAddress';

const OrderDetailsScreen = () => {
  const { id: orderId } = useParams();
  const { userInfo } = useSelector((state) => state.auth);
  
  // 🛡️ Frontend Security Guard: Prevent backend call if ID is missing
  const { data: order, isLoading, error, refetch } = useGetOrderDetailsQuery(orderId, {
    skip: !orderId || orderId === 'undefined' || orderId === 'null'
  });

  // Admin Specific Modals
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDeductedSuccessfully, setIsDeductedSuccessfully] = useState(false);

  // 🌟 Escrow (Proof of Delivery) States - For Customers Only
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [selectedItemForDelivery, setSelectedItemForDelivery] = useState(null);
  const [proofImage, setProofImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Mutations
  const [deliverOrder, { isLoading: loadingDeliver }] = useDeliverOrderMutation();
  const [processOrder, { isLoading: loadingProcess }] = useProcessOrderMutation();
  const [onWayOrder, { isLoading: loadingOnWay }] = useOnWayOrderMutation();
  const [cancelOrder, { isLoading: loadingCancel }] = useCancelOrderMutation();
  const [adminBankRefundAndDeduct, { isLoading: loadingDeduct }] = useAdminBankRefundAndDeductMutation();
  const [confirmItemDelivery, { isLoading: loadingConfirmDelivery }] = useConfirmItemDeliveryMutation(); 

  // --- Handlers ---
  const processOrderHandler = async () => {
    if (window.confirm('Mark this manifest node as Processing?')) {
      try { await processOrder(orderId).unwrap(); refetch(); toast.success('Order Processing'); }
      catch (err) { toast.error(err?.data?.message || err.error); }
    }
  };

  const onWayOrderHandler = async () => {
    if (window.confirm('Dispatch package to courier (On The Way)?')) {
      try { await onWayOrder(orderId).unwrap(); refetch(); toast.success('Order On Way'); }
      catch (err) { toast.error(err?.data?.message || err.error); }
    }
  };

  const deliverOrderHandler = async () => {
    if (window.confirm('Confirm successful terminal delivery?')) {
      try { await deliverOrder(orderId).unwrap(); refetch(); toast.success('Order Delivered'); }
      catch (err) { toast.error(err?.data?.message || err.error); }
    }
  };

  const cancelOrderHandler = async () => {
    if (window.confirm('Are you sure you want to terminate this order sequence?')) {
      try {
        await cancelOrder(orderId).unwrap();
        refetch();
        if (order?.isPaid && order?.paymentMethod === "Wallet") {
          toast.success('Sequence terminated. Funds reverse-credited to your wallet!');
        } else {
          toast.success('Order cancelled successfully!');
        }
      } catch (err) { toast.error(err?.data?.message || err.error); }
    }
  };

  const handleDeductWallet = async () => {
    try {
      const res = await adminBankRefundAndDeduct(orderId).unwrap();
      toast.success(res.message || "Ledger balance deducted successfully.");
      setIsConfirmModalOpen(false);
      setIsDeductedSuccessfully(true); 
      refetch();
    } catch (err) { toast.error(err?.data?.message || err.error || "Deduction sequence failed"); }
  };

  // Upload handler for customer proof of delivery
  const uploadProofHandler = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('image', file);
    setUploadingImage(true);
    
    try {
      const config = { 
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${userInfo.token}`
        } 
      };
      const { data } = await axios.post('/api/upload', formData, config);
      setProofImage(data);
      toast.success("Proof document verified & uploaded.");
    } catch {
      toast.error("Network rejection: Failed to upload proof. Check file size or permissions.");
    } finally {
      setUploadingImage(false);
    }
  };

  const submitItemDeliveryConfirmation = async () => {
    if (!proofImage) {
      toast.warning("You must attach a photographic proof to release merchant escrow funds.");
      return;
    }
    try {
      await confirmItemDelivery({ 
        orderId, 
        itemId: selectedItemForDelivery._id, 
        deliveryProofImage: proofImage 
      }).unwrap();
      
      toast.success("Receipt Confirmed! Funds securely released to merchant.");
      setIsDeliveryModalOpen(false);
      setProofImage('');
      setSelectedItemForDelivery(null);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Escrow release failed.");
    }
  };

  const copyOrderIdHandler = () => {
    navigator.clipboard.writeText(order?._id);
    toast.success('Manifest ID copied!');
  };

  const printInvoiceHandler = () => {
    window.print();
  };

  // Local helper for formatting safely without '$' overriding
  const formatLocalNumber = (num) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);

  if (isLoading) return <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa]"><FaSpinner className="animate-spin text-orange-600 text-4xl mb-4" /><p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Syncing Node...</p></div>;
  if (error) return <div className="p-4 pt-32 max-w-7xl mx-auto"><Message variant='danger'>{error.data?.message || error.error}</Message></div>;
  if (!order) return <div className="p-4 pt-32 max-w-7xl mx-auto"><Message variant='danger'>Manifest node offline</Message></div>;

  const orderCurrency = order.currency || 'USD';
  const orderRate = Number(order.exchangeRate) || 1;
  const safeItemsPrice = Number(order.itemsPrice) || 0;
  const safeShipping = Number(order.shippingPrice) || 0;
  const safeTax = Number(order.taxPrice) || 0;
  const safeDiscount = Number(order.discountPrice) || 0;
  const safeTotal = Number(order.totalPrice) || (safeItemsPrice + safeShipping + safeTax - safeDiscount);

  const steps = [
    { label: 'Confirmed', done: order.isPaid, icon: <FaCheckCircle /> },
    { label: 'Processing', done: order.isProcessed, icon: <FaBoxOpen className={order.isProcessed && !order.isOnWay ? "animate-pulse" : ""} /> },
    { label: 'On Way', done: order.isOnWay, icon: <FaTruck className={order.isOnWay && !order.isDelivered ? "animate-bounce" : ""} /> },
    { label: 'Delivered', done: order.isDelivered, icon: <FaHome /> },
  ];

  let progressWidth = '0%';
  if (order.isDelivered) progressWidth = '100%';
  else if (order.isOnWay) progressWidth = '75%';
  else if (order.isProcessed) progressWidth = '50%';
  else if (order.isPaid) progressWidth = '25%';

  const isCardPending = !order.isPaid && (order.paymentMethod === 'Card' || order.paymentMethod === 'Visa' || order.paymentMethod === 'Stripe');
  const isCustomer = userInfo?._id === order.user?._id;
  const isAdmin = userInfo?.isAdmin;
  
  // Can only cancel if it's the customer and not a pending card payment, or if it's an admin
  const showCancelButton = !order.isOnWay && !order.isDelivered && (isCustomer && !isCardPending || isAdmin);
  const isAlreadyRefunded = order.refundStatus === 'Refunded_To_Bank' || isDeductedSuccessfully;
  const orderPhone = order.phoneNumber || order.shippingAddress?.phone || order.user?.phone || 'N/A';

  return (
    // 🌟 pt-28 ensures it clears the new SubNavbar perfectly
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.3 }}
      id="invoice-wrap" 
      className="w-full max-w-[100rem] mx-auto px-4 sm:px-6 pt-28 pb-12 antialiased box-border print:pt-0 bg-gray-50 min-h-[calc(100vh-120px)]"
    >
      
      {/* 🌟 Header & Title Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 border-b border-gray-200 pb-6 print:border-black">
        <div>
          <Link to="/orders" className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1.5 hover:text-orange-600 transition-colors mb-3 print:hidden w-fit">
            <FaChevronLeft size={10} /> Back to My Orders
          </Link>
          <h1 className="text-2xl sm:text-4xl font-black uppercase italic text-gray-900 tracking-tighter flex items-center gap-3">
            Manifest <span className="text-orange-600 font-mono bg-orange-50 px-3 py-1 rounded-lg border border-orange-100">#{order._id?.slice(-8).toUpperCase()}</span>
          </h1>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
            <FaClock className="text-gray-400" /> Logged: {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0 print:hidden">
          {order.isCancelled && (
            <span className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-sm">
              <FaBan size={12} /> Sequence Voided
            </span>
          )}
          <button onClick={copyOrderIdHandler} className="bg-white border border-gray-200 text-gray-600 hover:text-orange-600 px-4 py-2 font-bold uppercase text-xs tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer">
            <FaCopy size={12} /> Copy ID
          </button>
          <button onClick={printInvoiceHandler} className="bg-gray-900 text-white px-5 py-2 font-bold uppercase text-xs tracking-wider rounded-xl hover:bg-orange-600 transition-colors flex items-center gap-2 shadow-md cursor-pointer">
            <FaPrint size={12} /> Print PDF
          </button>
        </div>
      </div>

      {/* 🌟 Progress Tracker */}
      <div className="w-full p-6 mb-8 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden print:hidden box-border relative">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><FaShieldAlt size={100} /></div>
        <div className="relative flex items-center justify-between max-w-4xl mx-auto z-10">
          <div className="absolute left-6 right-6 top-1/2 h-1 bg-gray-100 -translate-y-1/2 z-0 rounded-full"></div>
          <div className="absolute left-6 top-1/2 h-1 bg-orange-500 -translate-y-1/2 z-0 transition-all duration-1000 ease-out rounded-full shadow-[0_0_10px_rgba(249,115,22,0.5)]" style={{ width: order.isCancelled ? '0%' : `calc(${progressWidth} - 1rem)` }}></div>

          {steps.map((step, index) => (
            <div key={index} className="relative z-10 flex flex-col items-center group">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border-2 transition-all duration-500 ${step.done ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/30 scale-110' : 'bg-white border-gray-200 text-gray-300'}`}>
                <span className="text-sm sm:text-base">{step.icon}</span>
              </div>
              <span className={`mt-3 text-[9px] sm:text-xs font-black uppercase tracking-widest transition-colors ${step.done ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 w-full box-border">
        
        {/* Left Column */}
        <div className="xl:col-span-2 space-y-6 w-full box-border">

          {/* 🌟 Itemized Payload Registry (Escrow Enabled) */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm box-border">
            <h2 className="flex items-center gap-2 font-black text-sm md:text-base mb-6 uppercase tracking-widest text-gray-900">
              <FaBox className="text-orange-600" size={18} /> Itemized Payload Registry
            </h2>
            <div className="divide-y divide-gray-100">
              {order.orderItems?.map((item, index) => {
                // Customer ONLY logic for escrow
                const canConfirmReceipt = isCustomer && !item.customerConfirmedDelivery && (order.isOnWay || order.isDelivered);

                return (
                <div key={index} className="flex flex-col md:flex-row md:items-center justify-between py-5 first:pt-0 last:pb-0 gap-4">
                  <div className="flex items-start gap-4">
                    <div className="relative overflow-hidden rounded-xl shrink-0 border border-gray-200 w-20 h-20 bg-[#F8F9FA] p-1 shadow-sm flex items-center justify-center">
                      <img 
                        src={item.image || '/images/sample.jpg'} 
                        alt={item.name} 
                        className="max-w-full max-h-full object-contain mix-blend-multiply" 
                        onError={(e) => { e.target.src = 'https://placehold.co/100x100/111/fff?text=DK-TEC'; }}
                      />
                    </div>
                    <div>
                      <Link to={`/product/${item.product}`} className="font-black text-gray-900 text-sm mb-1 leading-tight uppercase hover:text-orange-600 transition-colors no-underline block">
                        {item.name}
                      </Link>
                      
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(item.selectedColor || item.color) && (
                          <span className="flex items-center gap-1 text-[9px] font-bold bg-gray-900 text-white px-2 py-1 rounded uppercase">
                            <FaPalette size={10} className="text-gray-400"/> {item.selectedColor || item.color}
                          </span>
                        )}
                        {(item.selectedSize || item.size) && (
                          <span className="flex items-center gap-1 text-[9px] font-bold bg-gray-900 text-white px-2 py-1 rounded uppercase">
                            <FaRulerCombined size={10} className="text-gray-400"/> {item.selectedSize || item.size}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-[10px] text-gray-400 font-mono font-bold">
                        {item.qty} UNIT(s) <span className="mx-1 text-gray-300">×</span> {orderCurrency} {formatLocalNumber(item.price * orderRate)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-start md:items-end gap-3 shrink-0">
                    <span className="text-gray-900 font-black font-mono text-lg tracking-tight">
                      {orderCurrency} {formatLocalNumber((item.qty * item.price) * orderRate)}
                    </span>
                    
                    {/* 🌟 Escrow System Actions (Visibility strictly controlled) */}
                    {item.customerConfirmedDelivery ? (
                       <span className="text-[10px] flex items-center gap-1.5 text-emerald-600 uppercase font-black tracking-widest print:hidden">
                         <FaCheckCircle size={12}/> Receipt Confirmed
                       </span>
                    ) : canConfirmReceipt ? (
                       <button 
                         onClick={() => { setSelectedItemForDelivery(item); setIsDeliveryModalOpen(true); }}
                         className="text-[10px] bg-orange-600 hover:bg-black text-white px-4 py-2 rounded-lg uppercase font-black tracking-widest transition-all shadow-md active:scale-95 flex items-center gap-2 print:hidden cursor-pointer"
                       >
                         <FaCamera size={12}/> Confirm Receipt
                       </button>
                    ) : (
                       <span className="text-[10px] flex items-center gap-1.5 text-gray-400 uppercase font-bold tracking-widest print:hidden">
                         <FaLock size={10}/> Funds in Escrow
                       </span>
                    )}
                  </div>
                </div>
              )})}
            </div>
          </div>

          {/* 🌟 Settlement Matrix Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm box-border">
            <h2 className="flex items-center gap-2 font-black text-sm md:text-base mb-6 uppercase tracking-widest text-gray-900">
              <FaCreditCard className="text-orange-600" size={18} /> Settlement Matrix
            </h2>
            
            <p className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-widest">
              Gateway: <span className="text-gray-900 ml-1">{order.paymentMethod}</span>
            </p>
            
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-[9px] font-black px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 uppercase font-mono">Currency: {orderCurrency}</span>
              <span className="text-[9px] font-black px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 uppercase font-mono">Rate: {orderRate.toFixed(4)}</span>
              {safeDiscount > 0 && (
                <span className="text-[9px] font-black px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-lg text-orange-600 uppercase font-mono">
                  Discount: -{formatLocalNumber(safeDiscount * orderRate)}
                </span>
              )}
            </div>
            
            {order.isPaid ? (
              <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-emerald-800 font-bold print:border-zinc-300 print:text-black">
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-emerald-600 shrink-0" size={16} /> 
                  <span className="uppercase tracking-widest">Settled: {new Date(order.paidAt).toLocaleDateString()}</span>
                </div>
                <span className="font-mono font-black text-sm shrink-0">
                  {orderCurrency} {formatLocalNumber(safeTotal * orderRate)}
                </span>
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl font-black text-[11px] uppercase tracking-widest text-center print:text-black print:border-zinc-300">Transaction Balance Unpaid</div>
            )}
          </div>
          
          {/* 🌟 Logistics Details Card */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm box-border relative overflow-hidden">
            <h2 className="flex items-center gap-2 font-black text-sm md:text-base mb-5 uppercase tracking-widest text-gray-900 relative z-10">
              <FaShippingFast className="text-orange-600" size={18} /> Terminal Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              <div className="space-y-4 text-sm font-medium text-gray-700">
                <div><span className="text-gray-400 uppercase font-black text-[10px] tracking-widest block mb-1">Consignee</span> <span className="font-bold text-gray-900">{order.user?.name || order.customerName}</span></div>
                <div><span className="text-gray-400 uppercase font-black text-[10px] tracking-widest block mb-1">Routing Address</span>
                  <span className="block leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-200">
                    {typeof order.address === 'object' ? (
                      <span className="block space-y-0.5">
                        {formatAddressMultiLine(order.address).map((line, i) => (
                          <span key={i} className="block text-[11px]">{line}</span>
                        ))}
                      </span>
                    ) : (
                      order.address
                    )}
                  </span>
                </div>
              </div>
              
              <div className="flex flex-col justify-between">
                <div className="bg-gray-900 text-white p-4 rounded-xl shadow-inner border border-gray-800">
                  <span className="text-gray-400 uppercase font-black text-[10px] tracking-widest block mb-2">Secure Contact</span>
                  <div className="flex items-center gap-3">
                    <FaPhoneAlt className="text-orange-500" size={14}/>
                    <span className="font-mono font-bold tracking-wider">{orderPhone}</span>
                  </div>
                </div>

                {order.isDelivered ? (
                  <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl font-bold text-xs flex items-center gap-3 shadow-sm">
                    <div className="bg-emerald-100 p-2 rounded-lg"><FaCheckCircle size={16} /></div>
                    <div><span className="block text-[10px] uppercase text-emerald-600 tracking-widest mb-0.5">Status</span> Executed at {new Date(order.deliveredAt).toLocaleDateString()}</div>
                  </div>
                ) : order.isOnWay ? (
                  <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-xl font-bold text-xs flex items-center gap-3 shadow-sm">
                    <div className="bg-blue-100 p-2 rounded-lg"><FaTruck className="animate-pulse" size={16} /></div>
                    <div><span className="block text-[10px] uppercase text-blue-600 tracking-widest mb-0.5">Status</span> Transport vector active...</div>
                  </div>
                ) : (
                  <div className="mt-4 bg-gray-50 border border-gray-200 text-gray-500 p-4 rounded-xl font-bold text-xs flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg border border-gray-200"><FaClock size={16} /></div>
                    <div><span className="block text-[10px] uppercase text-gray-400 tracking-widest mb-0.5">Status</span> Awaiting Logistics Clearance</div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* 🌟 Right Column Summary Box */}
        <div className="xl:col-span-1 w-full box-border">
          <div className="bg-gray-950 text-white p-6 sm:p-8 rounded-2xl border border-gray-900 shadow-2xl xl:sticky xl:top-28 print:border-zinc-300 print:text-black print:bg-white box-border w-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-600 rounded-full blur-[80px] opacity-20 -mr-10 -mt-10 pointer-events-none print:hidden"></div>
            
            <h2 className="text-lg font-black mb-6 uppercase tracking-widest text-orange-500 flex items-center gap-2 border-b border-gray-800 print:border-zinc-200 pb-4 relative z-10">
              <FaUniversity size={18} className="print:hidden" /> Ledger Summary
            </h2>
            
            <div className="space-y-4 border-b border-gray-800 print:border-zinc-200 pb-6 text-sm font-medium text-gray-400 print:text-gray-600 relative z-10">
              <div className="flex justify-between items-center">
                <span className="uppercase tracking-wider text-[11px]">Gross Matrix Total</span>
                <span className="font-mono font-bold text-white print:text-black">{orderCurrency} {formatLocalNumber(safeItemsPrice * orderRate)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="uppercase tracking-wider text-[11px]">Logistics Surcharge</span>
                <span className="font-mono font-bold text-emerald-400 print:text-black">+{orderCurrency} {formatLocalNumber(safeShipping * orderRate)}</span>
              </div>
              {safeDiscount > 0 && (
                <div className="flex justify-between items-center bg-orange-500/10 p-3 rounded-xl border border-orange-500/20 print:bg-transparent mt-2">
                  <span className="text-orange-400 print:text-black text-[11px] uppercase font-black flex items-center gap-1.5"><FaTag size={12}/> Protocol Rebate</span>
                  <span className="text-orange-400 print:text-black font-mono font-bold text-sm">-{orderCurrency} {formatLocalNumber(safeDiscount * orderRate)}</span>
                </div>
              )}
              <div className="flex justify-between items-center mt-2">
                <span className="uppercase tracking-wider text-[11px]">Tax Surcharge</span>
                <span className="font-mono font-bold text-white print:text-black">+{orderCurrency} {formatLocalNumber(safeTax * orderRate)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-1 mt-6 mb-8 relative z-10">
              <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Net Payable</span>
              <span className="text-orange-500 print:text-black font-mono text-3xl font-black tracking-tighter italic">
                {orderCurrency} {formatLocalNumber(safeTotal * orderRate)}
              </span>
            </div>

            {/* Core Action Pipelines */}
            {(loadingDeliver || loadingProcess || loadingOnWay || loadingCancel || loadingDeduct) && <div className="py-4 flex justify-center relative z-10"><FaSpinner className="animate-spin text-orange-500 text-2xl" /></div>}

            {!order.isCancelled && (
              <div className="space-y-3 pt-2 print:hidden w-full box-border relative z-10">
                {/* Cancel button is available for customers (if allowed) or admins */}
                {showCancelButton && (
                  <button onClick={cancelOrderHandler} disabled={loadingCancel} className='w-full bg-transparent border border-red-500/30 hover:border-red-500 text-red-500 font-black py-3.5 rounded-xl uppercase text-xs tracking-widest transition-colors disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer'>
                    <FaBan size={14} /> {isAdmin && isCardPending ? 'Abort Node (Unpaid)' : 'Abort Order sequence'}
                  </button>
                )}

                {/* 🛡️ SECURITY GUARD: STRICTLY ADMIN ONLY CONTROLS */}
                {isAdmin && (
                  <div className="pt-4 space-y-3 bg-black/40 p-5 rounded-2xl border border-gray-800/80 w-full box-border shadow-inner">
                    <p className="text-[10px] uppercase font-black text-gray-500 tracking-widest text-center mb-2 flex items-center justify-center gap-2"><FaShieldAlt /> Admin Overrides</p>
                    {!order.isProcessed && <button onClick={processOrderHandler} className='w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-xl uppercase text-[10px] tracking-widest transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer'><FaBoxOpen size={14} /> Commit Processing</button>}
                    {order.isProcessed && !order.isOnWay && <button onClick={onWayOrderHandler} className='w-full bg-amber-500 hover:bg-amber-400 text-gray-950 font-black py-3 rounded-xl uppercase text-[10px] tracking-widest transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer'><FaTruck size={14} /> Dispatch Vector</button>}
                    {order.isOnWay && !order.isDelivered && <button onClick={deliverOrderHandler} className='w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-3 rounded-xl uppercase text-[10px] tracking-widest transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer'><FaHome size={14} /> Terminate Final Delivery</button>}
                  </div>
                )}
              </div>
            )}

            {/* Advanced Store Credit Reversal Panel */}
            {order.isCancelled && order.isPaid && (
              <div className="mt-4 space-y-3 print:hidden w-full box-border">
                <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl relative overflow-hidden">
                  <div className="flex items-center gap-2 text-orange-500 font-black uppercase text-[10px] tracking-widest mb-2">
                    <FaHistory size={12} /> Auto Credit Reconciliation
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed mb-4">
                    Balance amount of <span className="text-white font-bold font-mono">{orderCurrency} {formatLocalNumber(safeTotal * orderRate)}</span> has been securely reverse-credited to client core wallet.
                  </p>
                  <div className="bg-black/40 p-3 rounded-lg border border-gray-800 flex items-center justify-between text-[10px] font-bold font-mono">
                    <span className="text-gray-500 uppercase">State:</span>
                    <span className="text-orange-500 uppercase">{isAlreadyRefunded ? 'Settled Bank Clearing' : 'Available In Wallet'}</span>
                  </div>
                </div>

                {/* 🛡️ SECURITY GUARD: STRICTLY ADMIN ONLY DEDUCTION */}
                {isAdmin && !isAlreadyRefunded && (
                  <button
                    onClick={() => setIsConfirmModalOpen(true)}
                    disabled={loadingDeduct}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-black uppercase text-[10px] py-4 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                  >
                    <FaUniversity size={14} /> Deduct Wallet & Bank Settlement
                  </button>
                )}

                {isAlreadyRefunded && (
                  <div className="w-full bg-emerald-950/20 border border-emerald-500/20 p-4 rounded-xl text-emerald-400 flex items-start gap-3 mt-4">
                    <FaCheckCircle className="shrink-0 mt-0.5" size={16} />
                    <div className="text-xs">
                      <p className="font-black uppercase tracking-widest">Manual Audit Concluded</p>
                      <p className="text-gray-400 mt-1 font-medium leading-relaxed">Wallet record cleared, bank transfer marked as locked and fully executed.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 🌟 Customer Delivery Proof Modal (Escrow Release UI) */}
      <AnimatePresence>
        {isDeliveryModalOpen && selectedItemForDelivery && (
          <div className="fixed inset-0 bg-gray-950/90 backdrop-blur-sm z-[999] flex items-center justify-center p-4 print:hidden">
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-3xl w-full max-w-md p-8 border border-gray-200 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-orange-500"></div>
              <h3 className="font-black uppercase text-xl tracking-tight mb-2 text-gray-900 mt-2">Confirm Receipt</h3>
              <p className="text-sm text-gray-500 font-medium mb-6 leading-relaxed">
                Please attach a photographic proof of the received item (<strong className="text-gray-900">{selectedItemForDelivery.name}</strong>) to release funds to the merchant securely.
              </p>
              
              <div className="relative border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-orange-50 hover:border-orange-300 transition-colors rounded-2xl h-56 flex items-center justify-center mb-8 overflow-hidden group cursor-pointer shadow-inner">
                 {proofImage ? (
                   <img src={proofImage} alt="Proof" className="w-full h-full object-cover" />
                 ) : (
                   <div className="text-center text-gray-400 group-hover:text-orange-600 flex flex-col items-center transition-colors">
                     <FaCloudUploadAlt size={40} className="mb-3" />
                     <span className="text-[10px] uppercase tracking-widest font-black bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm group-hover:border-orange-200">Tap to Upload Image</span>
                   </div>
                 )}
                 <input type="file" accept="image/*" onChange={uploadProofHandler} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                 {uploadingImage && (
                   <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center">
                     <FaSpinner className="animate-spin text-orange-600 text-4xl mb-3" />
                     <span className="text-[10px] font-black uppercase text-gray-600 tracking-widest">Encrypting...</span>
                   </div>
                 )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setIsDeliveryModalOpen(false); setProofImage(''); }} disabled={loadingConfirmDelivery} className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer">Cancel</button>
                <button onClick={submitItemDeliveryConfirmation} disabled={loadingConfirmDelivery || !proofImage || uploadingImage} className="flex-1 py-3.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex justify-center items-center gap-2 active:scale-95 cursor-pointer">
                  {loadingConfirmDelivery ? <><FaSpinner className="animate-spin" /> Verifying...</> : <><FaCheckCircle size={14} /> Release Escrow</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Industrial Audit Modal Panel (For Admins) */}
      <AnimatePresence>
        {isConfirmModalOpen && (
          <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-xs z-[999] flex items-center justify-center p-4 print:hidden">
            <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }} className="bg-white rounded-xl w-full max-w-md p-5 sm:p-6 border border-gray-200 shadow-xl text-gray-950 box-border">
              <div className="flex items-center gap-2.5 text-red-600 mb-4">
                <div className="bg-red-50 p-2 rounded-lg border border-red-100"><FaExclamationTriangle size={18} /></div>
                <div>
                  <h3 className="font-black uppercase italic text-base tracking-tight">Financial Audit Verification</h3>
                  <p className="text-[8px] text-gray-400 uppercase font-bold tracking-wider">Ledger Deduction Authorization</p>
                </div>
              </div>
              <div className="flex gap-2 w-full box-border">
                <button type="button" onClick={() => setIsConfirmModalOpen(false)} disabled={loadingDeduct} className="w-1/2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors cursor-pointer">Abort Action</button>
                <button type="button" onClick={handleDeductWallet} disabled={loadingDeduct} className="w-1/2 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-colors shadow-xs flex items-center justify-center gap-1 cursor-pointer">
                  {loadingDeduct ? 'Processing...' : 'Confirm Override'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default OrderDetailsScreen;