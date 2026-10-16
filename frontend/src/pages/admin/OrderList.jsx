import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPhoneAlt, FaCopy, FaSpinner, FaExclamationTriangle, FaBoxOpen } from 'react-icons/fa';
import { useSelector } from 'react-redux';

const OrderList = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { userInfo } = useSelector((state) => state.auth);

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data } = await axios.get('/api/orders', {
                    headers: { Authorization: `Bearer ${userInfo?.token}` },
                });
                setOrders(Array.isArray(data) ? data : []);
            } catch (err) {
                setError(err?.response?.data?.message || 'Failed to load orders.');
            } finally {
                setLoading(false);
            }
        };
        if (userInfo?.token) fetchOrders();
    }, [userInfo]);

    // تريكة: دالة نسخ الرقم السريعة للأدمن
    const handleCopyPhone = (phone) => {
        if (!phone) return;
        navigator.clipboard.writeText(phone);
        toast.success('تم نسخ رقم العميل بنجاح 📋', { position: 'bottom-right' });
    };

    return (
        <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-black uppercase tracking-tight text-gray-900">
                    Customer <span className="text-orange-600 italic">Orders</span>
                </h1>
                <span className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest shadow-inner">
                    Total: {orders.length}
                </span>
            </div>
            
            {loading ? (
                <div className="flex items-center justify-center py-24 bg-white rounded-3xl border border-gray-100">
                    <FaSpinner className="animate-spin text-orange-600" size={32} />
                </div>
            ) : error ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-gray-100">
                    <FaExclamationTriangle className="text-red-400 mb-4" size={40} />
                    <p className="text-sm font-bold text-red-600">{error}</p>
                </div>
            ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-gray-100">
                    <FaBoxOpen className="text-zinc-300 mb-4" size={40} />
                    <p className="text-sm font-bold text-zinc-500">No orders found</p>
                </div>
            ) : (
            <div className="overflow-x-auto bg-white rounded-3xl shadow-xl border border-gray-100">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead className="bg-gray-950 text-white uppercase text-[10px] tracking-widest font-black">
                        <tr>
                            <th className="p-5 rounded-tl-3xl">Order ID</th>
                            <th className="p-5">Customer</th>
                            <th className="p-5">Contact</th>
                            <th className="p-5">Total</th>
                            <th className="p-5">Date</th>
                            <th className="p-5 rounded-tr-3xl">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(order => {
                            // حماية لضمان قراءة الرقم من أي مسار في قاعدة البيانات
                            const phone = order.phoneNumber || order.shippingAddress?.phone || order.user?.phone;
                            
                            return (
                                <tr key={order._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                                    <td className="p-5 text-xs text-gray-400 font-mono font-bold">
                                        #{order._id.slice(-6).toUpperCase()}
                                    </td>
                                    <td className="p-5 font-black text-gray-800 text-sm">{order.customerName}</td>
                                    
                                    {/* 📱 تريكة عرض الهاتف الذكي للأدمن */}
                                    <td className="p-5">
                                        {phone ? (
                                            <div className="flex items-center gap-3 bg-white border border-gray-200 px-3 py-1.5 rounded-xl w-max shadow-sm group/phone hover:border-orange-300 transition-all">
                                                <div className="bg-gray-100 p-1.5 rounded-lg text-gray-500">
                                                    <FaPhoneAlt size={10} />
                                                </div>
                                                <span className="font-mono text-xs font-black text-gray-700 tracking-wide">{phone}</span>
                                                <button
                                                    onClick={() => handleCopyPhone(phone)}
                                                    className="opacity-0 group-hover/phone:opacity-100 text-gray-400 hover:text-orange-600 hover:bg-orange-50 p-1.5 rounded-lg transition-all active:scale-90"
                                                    title="نسخ الرقم"
                                                >
                                                    <FaCopy size={12} />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-[10px] text-gray-400 italic font-bold">No Contact</span>
                                        )}
                                    </td>

                                    <td className="p-5 text-orange-600 font-black text-sm">${order.totalPrice}</td>
                                    <td className="p-5 text-xs text-gray-500 font-bold">{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td className="p-5">
                                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                                            order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                            order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            )}
        </div>
    );
};
export default OrderList;