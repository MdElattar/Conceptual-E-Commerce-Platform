import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import Message from '../components/Message';
import {
  useGetOrdersQuery,
  useDeliverOrderMutation,
  useProcessOrderMutation,
  useOnWayOrderMutation
} from '../slices/orderApiSlice';
import { 
  FaBan, FaCheckCircle, FaClock, FaBoxOpen, FaSearch, 
  FaTimesCircle, FaSync, FaTruck, FaHome, FaCreditCard, 
  FaPhoneAlt, FaCopy, FaUser, FaCalendarAlt, FaChevronRight
} from 'react-icons/fa';
import { toast } from 'react-toastify';

const OrderListScreen = () => {
  const navigate = useNavigate();
  const { data: orders, isLoading, error, refetch } = useGetOrdersQuery();

  const [processOrder, { isLoading: loadingProcess }] = useProcessOrderMutation();
  const [onWayOrder, { isLoading: loadingOnWay }] = useOnWayOrderMutation();
  const [deliverOrder, { isLoading: loadingDeliver }] = useDeliverOrderMutation();

  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();
  const sp = new URLSearchParams(location.search);
  const filter = sp.get('filter') || 'all';

  const updateStatusHandler = async (id, stage) => {
    let action;
    let message;

    if (stage === 'process') { action = processOrder; message = 'Order lifecycle updated to Processing! 🛠️'; }
    else if (stage === 'onway') { action = onWayOrder; message = 'Logistics updated: Order is On Its Way! 🚚'; }
    else if (stage === 'deliver') { action = deliverOrder; message = 'Final Stage: Order Delivered! ✅'; }

    if (window.confirm(`Are you sure you want to transition this node to ${stage.toUpperCase()} stage?`)) {
      try {
        await action(id).unwrap();
        refetch();
        toast.success(message);
      } catch (err) {
        toast.error(err?.data?.message || err.error || 'Pipeline transition failed');
      }
    }
  };

  const handleCopyText = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard 📋`, { position: 'bottom-right', autoClose: 2000 });
  };

  // حساب العدادات الحقيقية ديناميكياً للـ Badges
  const countAll = orders?.length || 0;
  const countPending = orders?.filter(o => !o.isDelivered && !o.isCancelled).length || 0;
  const countCancelled = orders?.filter(o => o.isCancelled).length || 0;

  const displayedOrders = orders?.filter(order => {
    let matchesFilter = true;
    if (filter === 'pending') matchesFilter = !order.isDelivered && !order.isCancelled;
    if (filter === 'cancelled') matchesFilter = order.isCancelled;

    const matchesSearch =
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.user?.name || 'Guest').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.user?.email || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  }) || [];

  return (
    <div className="bg-gray-50/40 min-h-screen pt-24 md:pt-32 pb-10 md:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans text-gray-900 antialiased">
      
      {/* Top Header & Search Panel */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10 bg-white p-6 rounded-[2rem] shadow-xs border border-gray-150">
        <div>
          <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight">
            Logistics <span className="text-orange-600">Pipeline</span>
          </h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
            Fulfillment Monitoring & Order Routing Terminal
          </p>
        </div>

        {/* Search Input Control */}
        <div className="relative w-full lg:w-96 group">
          <input
            type="text"
            placeholder="Search ID, Customer, or Email..."
            className="w-full pl-11 pr-11 py-3.5 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none font-bold text-xs shadow-inner transition-all text-gray-800 placeholder:text-gray-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-600 transition-colors" size={12} />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-red-500 transition-colors">
              <FaTimesCircle size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 💎 تريكة لوحة تصفية الحالات الفخمة الموحدة */}
      <div className="flex flex-wrap items-center gap-2 mb-8 bg-gray-100/60 p-1.5 rounded-2xl w-fit border border-gray-200/40">
        <button 
          onClick={() => navigate('/admin/orderlist')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${filter === 'all' ? 'bg-white text-black shadow-xs' : 'text-gray-500 hover:text-black'}`}
        >
          All Hub ({countAll})
        </button>
        <button 
          onClick={() => navigate('/admin/orderlist?filter=pending')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${filter === 'pending' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-500 hover:text-orange-600'}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
          Active Pending ({countPending})
        </button>
        <button 
          onClick={() => navigate('/admin/orderlist?filter=cancelled')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${filter === 'cancelled' ? 'bg-white text-red-600 shadow-xs' : 'text-gray-500 hover:text-red-600'}`}
        >
          Cancelled ({countCancelled})
        </button>
      </div>

      {/* Global State Handler */}
      {(loadingProcess || loadingOnWay || loadingDeliver) && (
        <div className="fixed inset-0 bg-gray-950/20 backdrop-blur-xs z-50 flex items-center justify-center">
          <Loader />
        </div>
      )}

      {isLoading ? <Loader /> : error ? <Message variant='danger'>{error?.data?.message || error.error}</Message> : (
        <div className="space-y-4">
          {displayedOrders.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-[2.5rem] border border-gray-150 shadow-xs">
               <FaBoxOpen className="text-gray-200 text-6xl mx-auto mb-4 animate-bounce" />
               <h3 className="text-gray-400 font-black uppercase tracking-widest text-sm">No Orders Registered In This Node</h3>
               {searchTerm && <button onClick={() => setSearchTerm('')} className="mt-3 text-orange-600 font-black text-xs uppercase tracking-wider underline">Reset Search Filter</button>}
            </div>
          ) : (
            displayedOrders.map((order) => {
              const phone = order.phoneNumber || order.shippingAddress?.phone || order.user?.phone;
              
              // تحديد لون الشارة الجانبية للمرحلة الحالية للطلب
              let stageColor = "border-gray-200";
              if (order.isCancelled) stageColor = "border-red-500 bg-red-50/40";
              else if (order.isDelivered) stageColor = "border-emerald-500";
              else if (order.isOnWay) stageColor = "border-blue-500";
              else if (order.isProcessed) stageColor = "border-orange-500";

              return (
                <div 
                  key={order._id} 
                  className={`bg-white rounded-[2rem] border-l-4 p-5 lg:p-6 shadow-xs border border-gray-150 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 transition-all duration-300 group ${stageColor} ${!order.isCancelled && 'hover:shadow-xl hover:border-gray-300'}`}
                >
                  
                  {/* Section 1: Order Metadata */}
                  <div className="flex items-start gap-3 shrink-0 min-w-[140px]">
                    <div className="bg-gray-50 p-3 rounded-xl border border-gray-200/60 text-gray-400 group-hover:text-orange-500 transition-colors">
                      <FaCalendarAlt size={14} />
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block">Token Reference</span>
                      <span className="font-mono text-sm font-black text-gray-900 block mt-0.5">
                        #{order._id.slice(-8).toUpperCase()}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 font-mono block mt-0.5">{order.createdAt?.substring(0, 10)}</span>
                    </div>
                  </div>

                  {/* Section 2: Customer Micro-Card with Smart Copy Action */}
                  <div className="space-y-1.5 w-full lg:w-56 break-words">
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block">Customer Vector</span>
                    <div className="flex items-center gap-1.5 text-gray-900 font-black text-sm">
                      <FaUser size={10} className="text-gray-400" />
                      <span>{order.user?.name || 'Guest Identity'}</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-gray-500 font-semibold group/mail">
                      <span className="truncate max-w-[160px]">{order.user?.email || 'No Email Logged'}</span>
                      {order.user?.email && (
                        <button onClick={() => handleCopyText(order.user.email, 'Email')} className="opacity-0 group-hover/mail:opacity-100 text-gray-300 hover:text-orange-600 transition-all">
                          <FaCopy size={10} />
                        </button>
                      )}
                    </div>

                    {/* Contact Number Micro badge */}
                    {phone ? (
                      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-lg w-fit group/phone hover:border-orange-300 transition-colors">
                        <div className="flex items-center gap-1.5">
                          <FaPhoneAlt size={8} className="text-gray-400" />
                          <span className="font-mono text-[10px] font-black text-gray-700 tracking-wide">{phone}</span>
                        </div>
                        <button
                          onClick={() => handleCopyText(phone, 'Phone number')}
                          className="opacity-0 group-hover/phone:opacity-100 ml-2 text-gray-400 hover:text-orange-600 transition-all"
                        >
                          <FaCopy size={10} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[9px] text-gray-400 italic font-bold uppercase tracking-wider block">⚠️ No Phone Metadata</span>
                    )}
                  </div>

                  {/* Section 3: Value Matrix */}
                  <div className="shrink-0">
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block">Value Matrix</span>
                    <span className="font-mono text-xl font-black text-gray-900 block mt-0.5">
                      ${order.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-wider mt-0.5">
                      <FaCreditCard size={10} />
                      <span>{order.paymentMethod}</span>
                    </div>
                  </div>

                  {/* Section 4: Settlement (Payment State) */}
                  <div className="shrink-0">
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block">Settlement</span>
                    {order.isPaid ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider mt-1">
                        <FaCheckCircle size={10} /> Account Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider mt-1">
                        <FaClock size={10} className="animate-spin" /> Unsettled
                      </span>
                    )}
                  </div>

                  {/* Section 5: Step Metric (Pipeline Display) */}
                  <div className="w-full lg:w-auto min-w-[150px]">
                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest block mb-1">Pipeline Node</span>
                    {order.isCancelled ? (
                      <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 border border-red-200 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-xs">
                        <FaBan size={10} /> Hard Cancelled
                      </span>
                    ) : (
                      <div className="space-y-1">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border shadow-2xs
                          ${order.isDelivered ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            order.isOnWay ? 'bg-blue-50 text-blue-700 border-blue-200' :
                              order.isProcessed ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}>
                          {order.isDelivered ? <><FaCheckCircle /> Delivered Terminal</> :
                            order.isOnWay ? <><FaTruck className="animate-pulse" /> On Route</> :
                              order.isProcessed ? <><FaSync className="animate-spin" /> Processing Node</> : <><FaClock /> Awaiting Action</>}
                        </span>
                        
                        {/* 💎 تريكة مؤشر الحالة البصري الصغير السريع */}
                        <div className="flex items-center gap-0.5 w-24 h-1 bg-gray-100 rounded-full overflow-hidden mt-2">
                          <div className={`h-full ${order.isProcessed || order.isOnWay || order.isDelivered ? 'bg-orange-500' : 'bg-gray-200'} flex-1`}></div>
                          <div className={`h-full ${order.isOnWay || order.isDelivered ? 'bg-blue-500' : 'bg-gray-200'} flex-1`}></div>
                          <div className={`h-full ${order.isDelivered ? 'bg-emerald-500' : 'bg-gray-200'} flex-1`}></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Section 6: Action Gateway Console */}
                  <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-40 shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-gray-100">
                    <button 
                      onClick={() => navigate(`/order/${order._id}`)}
                      className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-1 shadow-sm"
                    >
                      Inspect Details <FaChevronRight size={8} />
                    </button>

                    {/* 💎 أزرار تفعيل مراحل خط الإنتاج والشحن السريع بنقرة واحدة */}
                    {!order.isCancelled && order.isPaid && (
                      <>
                        {!order.isProcessed && (
                          <button
                            onClick={() => updateStatusHandler(order._id, 'process')}
                            disabled={loadingProcess}
                            className="flex-1 bg-orange-600 text-white text-[10px] font-black py-2.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-black transition-all shadow-md shadow-orange-100 active:scale-95"
                          >
                            <FaSync size={10} className={loadingProcess ? 'animate-spin' : ''} /> Process Node
                          </button>
                        )}

                        {order.isProcessed && !order.isOnWay && (
                          <button
                            onClick={() => updateStatusHandler(order._id, 'onway')}
                            disabled={loadingOnWay}
                            className="flex-1 bg-blue-600 text-white text-[10px] font-black py-2.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-black transition-all shadow-md shadow-blue-100 active:scale-95"
                          >
                            <FaTruck size={10} /> Deploy Freight
                          </button>
                        )}

                        {order.isOnWay && !order.isDelivered && (
                          <button
                            onClick={() => updateStatusHandler(order._id, 'deliver')}
                            disabled={loadingDeliver}
                            className="flex-1 bg-emerald-600 text-white text-[10px] font-black py-2.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-black transition-all shadow-md shadow-emerald-100 active:scale-95"
                          >
                            <FaHome size={10} /> Close & Deliver
                          </button>
                        )}
                      </>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default OrderListScreen;