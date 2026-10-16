import React, { useState, useMemo } from 'react';
import { 
  FaTimes, FaCheck, FaBoxOpen, FaShoppingBag, FaCreditCard, 
  FaWallet, FaExclamationTriangle, FaTruck, FaCogs, FaBan, FaChevronRight,
  FaUndo, FaClock, FaPlus
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useGetMyOrdersQuery } from '../slices/orderApiSlice';
import { useSelector } from 'react-redux';
import { useGetMyReturnsQuery, useCreateReturnRequestMutation } from '../slices/returnsApiSlice';
import { toast } from 'react-toastify';

const TableSkeleton = () => (
  <div className="animate-pulse w-full divide-y divide-gray-100">
    {[1, 2, 3].map((n) => (
      <div key={n} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 sm:p-5 gap-4">
        <div className="flex items-center gap-3 w-full md:w-1/3">
          <div className="w-12 h-12 bg-gray-200 rounded-xl shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-gray-200 rounded w-3/4"></div>
            <div className="h-2.5 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="h-3 bg-gray-200 rounded w-16 hidden md:block"></div>
        <div className="h-4 bg-gray-200 rounded w-12 hidden md:block"></div>
        <div className="h-6 bg-gray-200 rounded-full w-20"></div>
        <div className="h-9 bg-gray-200 rounded-xl w-full md:w-24"></div>
      </div>
    ))}
  </div>
);

const MyOrdersScreen = () => {
  const [activeTab, setActiveTab] = useState(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    return tab === 'returns' ? 'returns' : 'orders';
  });
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnDetails, setReturnDetails] = useState('');

  const { data: orders, isLoading, error } = useGetMyOrdersQuery();
  const { data: myReturns, isLoading: returnsLoading } = useGetMyReturnsQuery(undefined, { skip: activeTab !== 'returns' });
  const [createReturn, { isLoading: isCreatingReturn }] = useCreateReturnRequestMutation();
  const { currencyCode = 'USD', rate = 1 } = useSelector((state) => state.currency);
  
  // 🌟 دالة لفرمتة الأرقام محلياً بدون تضارب علامات الدولار
  const formatLocalPrice = (amount) => {
    return Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getReturnStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      received: 'bg-purple-100 text-purple-800 border-purple-200',
      refunded: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return styles[status] || styles.pending;
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    if (!selectedOrderItem || !returnReason) {
      toast.error('Please select an item and provide a reason');
      return;
    }
    try {
      await createReturn({
        orderId: selectedOrderItem.orderId,
        orderItemId: selectedOrderItem._id,
        productId: selectedOrderItem.product,
        reason: returnReason,
        details: returnDetails,
      }).unwrap();
      toast.success('Return request submitted successfully!');
      setShowReturnForm(false);
      setReturnReason('');
      setReturnDetails('');
      setSelectedOrderItem(null);
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit return request');
    }
  };

  // الفلترة الذكية الصارمة
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(order => {
      const isOnlinePayment = 
        order.paymentMethod?.toLowerCase() === "card" || 
        order.paymentMethod?.toLowerCase() === "visa" || 
        order.paymentMethod?.toLowerCase() === "stripe";
        
      return !(isOnlinePayment && !order.isPaid);
    });
  }, [orders]);

  // 🌟 محرك حالات الطلب (Amazon Style Order Tracking)
  const getOrderStatus = (order) => {
    if (order.isCancelled) return { text: 'Voided', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: <FaBan size={10} /> };
    if (order.isDelivered) return { text: 'Delivered', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <FaCheck size={10} /> };
    if (order.isOnWay) return { text: 'On Way', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: <FaTruck size={10} /> };
    if (order.isProcessed) return { text: 'Processing', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: <FaCogs size={10} /> };
    if (order.isPaid) return { text: 'Confirmed', color: 'text-gray-700', bg: 'bg-gray-100', border: 'border-gray-300', icon: <FaCheck size={10} /> };
    return { text: 'Pending', color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', icon: <FaTimes size={10} /> };
  };

  return (
    <div className="w-full max-w-[100rem] mx-auto overflow-x-hidden pb-16 pt-28 px-4 sm:px-6 lg:px-8 antialiased box-border min-h-[calc(100vh-120px)] bg-gray-50">
      
      {/* Breadcrumbs & Header Section */}
      <nav className="flex items-center gap-2 mb-4 text-[10px] font-bold uppercase text-gray-400 tracking-wider">
          <Link to="/profile" className="hover:text-orange-600 transition-colors">Account</Link>
          <FaChevronRight size={8} />
          <span className="text-gray-900">Order History</span>
      </nav>

      <div className="mb-6 border-b border-gray-200 pb-5">
        <h1 className="text-2xl sm:text-3xl font-black uppercase italic text-gray-900 tracking-tighter flex items-center gap-2.5 select-none">
          {activeTab === 'returns' ? (
            <><FaUndo className="text-orange-600" size={24} /> Returns <span className="text-orange-600">& Orders</span></>
          ) : (
            <><FaBoxOpen className="text-orange-600" size={24} /> My <span className="text-orange-600">Orders</span></>
          )}
        </h1>
        <p className="text-[10px] sm:text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">
          {activeTab === 'returns' ? 'Return Requests & Order History' : 'Manifest Registry & Dispatch Terminal'}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-6 py-3 text-[13px] font-bold border-b-2 transition-all bg-transparent cursor-pointer ${
            activeTab === 'orders'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300'
          }`}
        >
          <FaBoxOpen size={14} className="inline mr-2" />
          Your Orders
        </button>
        <button
          onClick={() => setActiveTab('returns')}
          className={`px-6 py-3 text-[13px] font-bold border-b-2 transition-all bg-transparent cursor-pointer ${
            activeTab === 'returns'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:border-zinc-300'
          }`}
        >
          <FaUndo size={14} className="inline mr-2" />
          Your Returns
        </button>
      </div>

      {activeTab === 'orders' ? (
        <>
      {error ? (
        <div className="w-full p-5 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 text-sm font-bold shadow-sm">
          <FaExclamationTriangle className="shrink-0 text-red-500" size={18} />
          <span>{error?.data?.message || error.error || "Terminal data Sync Failure!"}</span>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 w-full box-border">
          
          {isLoading && (
            <div className="w-full">
              <div className="hidden md:block bg-gray-50 h-12 border-b border-gray-200"></div>
              <TableSkeleton />
            </div>
          )}

          {!isLoading && filteredOrders?.length === 0 && (
            <div className="text-center py-20 px-4 flex flex-col items-center justify-center bg-gray-50/50">
              <div className="w-16 h-16 bg-orange-50 rounded-2xl border border-orange-100 flex items-center justify-center mb-4 text-orange-500 shadow-sm group hover:bg-gray-900 hover:text-white transition-all duration-300">
                <FaShoppingBag size={24} className="group-hover:rotate-12 transition-transform" />
              </div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">No Clearance Orders</h3>
              <p className="text-gray-500 text-sm font-medium max-w-sm mx-auto mb-8 leading-relaxed">
                Your deployment history is vacant. Incomplete digital transactions are automatically cleared from this node.
              </p>
              <Link 
                to="/search" 
                className="bg-gray-900 text-white font-black px-8 py-3.5 rounded-xl hover:bg-orange-600 transition-all duration-300 uppercase text-xs tracking-widest shadow-md"
              >
                Initiate Procurement Flow
              </Link>
            </div>
          )}
          
          {/* Desktop Matrix Layout (>= md) */}
          {!isLoading && filteredOrders?.length > 0 && (
            <div className="hidden md:block overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-black uppercase text-[10px] tracking-widest">
                  <tr>
                    <th className="p-5 pl-6">Product Unit</th>
                    <th className="p-5">Timestamp</th>
                    <th className="p-5">Routing</th>
                    <th className="p-5">Total Price</th>
                    <th className="p-5">Status</th>
                    <th className="p-5 pr-6 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-medium text-gray-700">
                  {filteredOrders?.map((order) => {
                    const status = getOrderStatus(order);
                    return (
                    <tr key={order._id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="p-5 pl-6">
                        <div className="flex items-center gap-4">
                          <div className="relative overflow-hidden rounded-xl border border-gray-200 shrink-0 w-12 h-12 bg-[#F8F9FA] p-1 flex justify-center items-center">
                            <img 
                              src={order.orderItems?.[0]?.image} 
                              alt="Item"
                              className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                              onError={(e) => { e.target.src = 'https://placehold.co/100x100/111/fff?text=DK'; }}
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 truncate max-w-[200px] group-hover:text-orange-600 transition-colors">
                              {order.orderItems?.[0]?.name}
                            </p>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5 font-bold uppercase tracking-wider">
                              ID: #{order._id?.slice(-8)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 font-mono font-bold text-gray-500">{order.createdAt?.substring(0, 10)}</td>
                      <td className="p-5 font-bold">
                        {order.paymentMethod?.toLowerCase() === 'wallet' ? (
                          <span className="inline-flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100"><FaWallet size={10}/> Wallet</span>
                        ) : order.paymentMethod?.toLowerCase() === 'cod' ? (
                           <span className="inline-flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100"><FaTruck size={10}/> COD</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-purple-600 bg-purple-50 px-2 py-1 rounded border border-purple-100"><FaCreditCard size={10}/> Digital</span>
                        )}
                      </td>
                      <td className="p-5 font-black text-gray-900 text-sm">
                        <span className="text-[10px] text-gray-500 mr-1">{currencyCode}</span>
                        {formatLocalPrice((order.totalPrice || 0) * rate)}
                      </td>
                      <td className="p-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${status.bg} ${status.color} ${status.border}`}>
                          {status.icon} {status.text}
                        </span>
                      </td>
                      <td className="p-5 pr-6 text-center">
                        <Link 
                          to={`/order/${order._id}`}
                          className="inline-block bg-white border border-gray-200 text-gray-900 text-[10px] font-black px-5 py-2.5 rounded-lg hover:bg-gray-900 hover:text-white transition-all duration-300 uppercase tracking-widest shadow-sm"
                        >
                          Inspect
                        </Link>
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )}

          {/* Mobile Card Docker (< md) */}
          {!isLoading && filteredOrders?.length > 0 && (
            <div className="md:hidden divide-y divide-gray-100 w-full box-border">
              {filteredOrders?.map((order) => {
                const status = getOrderStatus(order);
                return (
                <div key={order._id} className="p-5 flex flex-col gap-4 hover:bg-gray-50 transition-colors box-border w-full relative">
                  
                  <div className="flex items-start justify-between w-full gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-14 h-14 rounded-xl border border-gray-200 bg-[#F8F9FA] shrink-0 p-1 flex justify-center items-center">
                        <img 
                          src={order.orderItems?.[0]?.image} 
                          alt="Item" 
                          className="w-full h-full object-contain mix-blend-multiply"
                          onError={(e) => { e.target.src = 'https://placehold.co/100x100/111/fff?text=DK'; }}
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm truncate max-w-[160px] xs:max-w-[200px] mb-0.5">{order.orderItems?.[0]?.name}</h3>
                        <p className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider">ID: #{order._id?.slice(-8)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-xs font-bold text-gray-500">{currencyCode}</span>
                      <p className="font-black text-gray-900 text-base leading-none">{formatLocalPrice((order.totalPrice || 0) * rate)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center bg-gray-50 p-3 rounded-xl border border-gray-100 text-[10px] box-border w-full">
                    <div className="flex flex-col gap-1 border-r border-gray-200">
                      <span className="text-gray-400 text-[9px] uppercase font-black tracking-widest">Date</span>
                      <span className="text-gray-900 font-bold font-mono">{order.createdAt?.substring(5, 10)}</span>
                    </div>
                    <div className="flex flex-col gap-1 border-r border-gray-200 items-center justify-center">
                      <span className="text-gray-400 text-[9px] uppercase font-black tracking-widest">Gateway</span>
                      <span className="text-gray-900 font-bold flex items-center gap-1 uppercase text-[10px] truncate max-w-full">
                        {order.paymentMethod?.toLowerCase() === 'wallet' ? <FaWallet className="text-blue-500" size={10}/> : order.paymentMethod?.toLowerCase() === 'cod' ? <FaTruck className="text-amber-500" size={10}/> : <FaCreditCard className="text-purple-500" size={10}/>}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 items-center justify-center">
                      <span className="text-gray-400 text-[9px] uppercase font-black tracking-widest">Status</span>
                      <span className={`${status.color} font-black flex items-center gap-1 text-[10px] uppercase tracking-wider`}>
                        {status.icon} {status.text}
                      </span>
                    </div>
                  </div>

                  <Link 
                    to={`/order/${order._id}`}
                    className="w-full py-3 bg-gray-900 text-white rounded-xl text-center font-black text-xs uppercase hover:bg-orange-600 active:scale-95 transition-all duration-300 shadow-sm tracking-widest"
                  >
                    View Manifest
                  </Link>
                </div>
              )})}
            </div>
          )}

        </div>
      )}
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FaUndo className="text-orange-600" /> My Return Requests
            </h3>
            {myReturns?.length > 0 && (
              <button
                onClick={() => setShowReturnForm(true)}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer border-0"
              >
                <FaPlus size={12} /> New Return
              </button>
            )}
          </div>

          {showReturnForm && (
            <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <form onSubmit={handleSubmitReturn} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-900 text-sm">Initiate Return</h4>
                  <button type="button" onClick={() => setShowReturnForm(false)} className="text-xs text-gray-500 hover:text-red-500 bg-transparent border-0 cursor-pointer">Cancel</button>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Select Order Item</label>
                  <select
                    value={selectedOrderItem ? `${selectedOrderItem.orderId}::${selectedOrderItem._id}` : ''}
                    onChange={(e) => {
                      const [orderId, itemId] = e.target.value.split('::');
                      const order = orders?.find(o => o._id === orderId);
                      const item = order?.orderItems?.find(i => i._id === itemId);
                      setSelectedOrderItem(item ? { ...item, orderId } : null);
                    }}
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-orange-500"
                  >
                    <option value="">Select a delivered item</option>
                    {orders?.filter(o => o.isDelivered).map(order =>
                      order.orderItems?.map(item => (
                        <option key={item._id} value={`${order._id}::${item._id}`}>
                          {item.name} (Order: {order._id.slice(-6)})
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Reason</label>
                  <select value={returnReason} onChange={(e) => setReturnReason(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-orange-500">
                    <option value="">Select a reason</option>
                    <option value="Defective or damaged">Defective or damaged</option>
                    <option value="Wrong item sent">Wrong item sent</option>
                    <option value="Not as described">Not as described</option>
                    <option value="No longer needed">No longer needed</option>
                    <option value="Better price available">Better price available</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Details (optional)</label>
                  <textarea value={returnDetails} onChange={(e) => setReturnDetails(e.target.value)} rows={3} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-orange-500 resize-none" placeholder="Tell us more..." />
                </div>
                <button type="submit" disabled={isCreatingReturn} className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer border-0 disabled:opacity-50">
                  {isCreatingReturn ? 'Submitting...' : 'Submit Return Request'}
                </button>
              </form>
            </div>
          )}

          {returnsLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-12 bg-gray-100 rounded"></div>
              <div className="h-12 bg-gray-100 rounded"></div>
            </div>
          ) : myReturns?.length > 0 ? (
            <div className="space-y-3">
              {myReturns.map((ret) => (
                <div key={ret._id} className="border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <FaClock className="text-orange-500 shrink-0" size={14} />
                      <p className="font-bold text-sm text-gray-900 truncate">{ret.product?.name || 'Product'}</p>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 ml-6">{ret.reason}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 ml-6">{new Date(ret.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                  </div>
                  <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold border ${getReturnStatusBadge(ret.status)}`}>
                    {ret.status.charAt(0).toUpperCase() + ret.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          ) : !showReturnForm ? (
            <div className="text-center py-12">
              <FaUndo className="text-gray-200 mx-auto mb-3" size={48} />
              <h3 className="font-bold text-gray-900 mb-1">No return requests</h3>
              <p className="text-sm text-gray-500 mb-6">You haven't requested any returns yet.</p>
              <button
                onClick={() => setShowReturnForm(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer border-0"
              >
                <FaPlus size={12} className="inline mr-1" /> Start a Return
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default MyOrdersScreen;