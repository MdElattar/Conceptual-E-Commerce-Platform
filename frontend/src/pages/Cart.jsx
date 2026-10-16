import React, { useEffect, useState, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { 
    FaTrash, FaMinus, FaPlus, FaArrowLeft, 
    FaPalette, FaWeightHanging, FaDolly, 
    FaLock, FaExclamationTriangle, FaPaperPlane, FaTimes,
    FaUser, FaEnvelope, FaPhone, FaCheckCircle,
    FaMicrochip, FaCommentAlt, FaShieldAlt
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { formatCurrency } from '../utils/currencies';
import axios from 'axios';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const Cart = () => {
    const { cartItems, removeFromCart, addToCart, decrementQty } = useCart(); 
    const navigate = useNavigate();

    const { userInfo } = useSelector((state) => state.auth);
    const { currencyCode, rate, countryCode, shippingFee: reduxShippingFee } = useSelector((state) => state.currency);
    
    const [dynamicShipping, setDynamicShipping] = useState(0);
    const [isLoadingShipping, setIsLoadingShipping] = useState(false);
    const [showQuoteModal, setShowQuoteModal] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [loadingText, setLoadingText] = useState('Initializing Protocol...');
    const [quoteData, setQuoteData] = useState({ name: '', email: '', phone: '', message: '' });

    const OVERWEIGHT_LIMIT = 1000;

    // تعبئة البيانات التلقائية
    useEffect(() => {
        if (userInfo) {
            setQuoteData(prev => ({ ...prev, name: userInfo.name || '', email: userInfo.email || '' }));
        }
    }, [userInfo]);

    // حساب الوزن بدقة مع تحسين الأداء
    const totalWeight = useMemo(() => {
        return cartItems.reduce((acc, item) => {
            const physical = Number(item.weight || 0);
            const volumetric = (Number(item.length || 0) * Number(item.width || 0) * Number(item.height || 0)) / 5000;
            return acc + (Math.max(physical, volumetric) * item.qty);
        }, 0);
    }, [cartItems]);

    const subtotalUSD = useMemo(() => {
        return cartItems.reduce((acc, item) => acc + (Number(item.qty) * Number(item.price)), 0);
    }, [cartItems]);

    // جلب تكلفة الشحن ديناميكياً
    useEffect(() => {
        const fetchShipping = async () => {
            if (cartItems.length === 0) return;
            try {
                setIsLoadingShipping(true);
                const { data } = await axios.post('/api/orders/shipping-estimate', { cartItems, countryCode: countryCode || 'EG' });
                setDynamicShipping(data.shippingPrice);
            } catch {
                setDynamicShipping(Number(reduxShippingFee) || 0);
            } finally {
                setIsLoadingShipping(false);
            }
        };
        fetchShipping();
    }, [cartItems, countryCode, reduxShippingFee]);

    const finalShippingCost = totalWeight >= 500 ? dynamicShipping * 0.8 : dynamicShipping;
    const finalTotalUSD = subtotalUSD + finalShippingCost;
    const isOverweight = totalWeight >= OVERWEIGHT_LIMIT;

    const handleQuoteSubmit = async (e) => {
        e.preventDefault();
        setIsSending(true);
        const loadingPhases = ['Establishing Link...', 'Scanning Manifest...', 'Uploading Data...'];
        let phase = 0;
        const interval = setInterval(() => { setLoadingText(loadingPhases[phase % 3]); phase++; }, 800);

        try {
            await axios.post('/api/inquiries', {
                ...quoteData,
                productTitle: `Heavy Logistics Request: ${totalWeight.toFixed(1)} KG`,
                message: `Cargo: ${cartItems.map(i => i.name).join(', ')}\n\nNote: ${quoteData.message}`
            });
            clearInterval(interval);
            setIsSending(false);
            setIsSuccess(true);
            setTimeout(() => { setShowQuoteModal(false); setIsSuccess(false); }, 4000);
        } catch {
            clearInterval(interval);
            setIsSending(false);
            toast.error('Logistics Terminal Error');
        }
    };

    if (cartItems.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="text-center bg-white border border-gray-200 p-12 rounded-2xl shadow-sm max-w-md w-full">
                    <div className="bg-orange-50 p-6 rounded-full inline-block mb-6">
                        <FaDolly className="text-5xl text-orange-600" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-3">Hangar is Empty</h2>
                    <p className="text-gray-500 text-sm mb-8 font-medium">Your fleet deployment manifest has no active machinery items loaded.</p>
                    {/* 🌟 تم التعديل: التوجيه لمسار البحث العام بدلاً من products */}
                        <Button to="/search" variant="dark" size="lg" className="w-full rounded-xl uppercase tracking-wider">
                            <FaArrowLeft size={12} /> Start Loading
                        </Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="pt-28 pb-20 bg-gray-50 min-h-screen antialiased selection:bg-orange-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Modern Header */}
                <header className="mb-12">
                    <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }}>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter uppercase text-gray-900">
                            Cargo <span className="text-orange-600">Manifest</span>
                        </h1>
                        <div className="w-20 h-1.5 bg-orange-600 mt-4 rounded-full mb-3"></div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fleet Management Unit 01</p>
                    </motion.div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Items Section */}
                    <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                        <AnimatePresence mode='popLayout'>
                            {cartItems.map((item) => (
                                <motion.div 
                                    layout 
                                    initial={{ opacity: 0, scale: 0.98 }} 
                                    animate={{ opacity: 1, scale: 1 }} 
                                    exit={{ opacity: 0, x: -15 }}
                                    key={`${item._id}-${item.selectedColor}-${item.selectedSize}`}
                                    className="group relative bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-6 hover:shadow-md transition-all duration-300"
                                >
                                    {/* 🌟 تم التعديل: جعل الصورة رابط للعودة لصفحة المنتج */}
                                    <Link to={`/product/${item._id}`} className="relative w-28 h-28 sm:w-32 sm:h-32 bg-gray-50 rounded-xl overflow-hidden p-3 flex items-center justify-center shrink-0 border border-gray-100 cursor-pointer">
                                        <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute top-0 left-0 w-full h-[1.5px] bg-orange-500/30 translate-y-[-100%] group-hover:animate-scan z-10" />
                                        <img src={item.image} alt={item.name} loading="lazy" className="max-w-full max-h-full object-contain relative z-0 mix-blend-multiply transition-transform duration-500 group-hover:scale-105" />
                                    </Link>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 text-center sm:text-left">
                                        <span className="text-[10px] font-black bg-gray-100 text-gray-800 px-2 py-0.5 rounded tracking-wider uppercase mb-1.5 inline-block">Verified Spec</span>
                                        {/* 🌟 تم التعديل: جعل العنوان رابط للعودة لصفحة المنتج */}
                                        <Link to={`/product/${item._id}`} className="no-underline">
                                            <h3 className="text-lg font-bold text-gray-900 truncate mb-2 group-hover:text-orange-600 transition-colors">{item.name}</h3>
                                        </Link>
                                        
                                        <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start mb-3">
                                            <div className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 text-xs font-semibold">
                                                <FaWeightHanging className="text-orange-600 text-[10px]" />
                                                <span>{item.weight} KG</span>
                                            </div>
                                            {item.selectedColor && (
                                                <div className="flex items-center gap-1 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 text-xs font-semibold uppercase">
                                                    <FaPalette className="text-orange-600 text-[10px]" />
                                                    <span>{item.selectedColor}</span>
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-xl font-black text-gray-900 tracking-tight">
                                            {formatCurrency(item.price * (rate || 1), currencyCode)}
                                        </p>
                                    </div>

                                    {/* Controls */}
                                    <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-4 border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-6 w-full sm:w-auto">
                                        <div className="flex items-center bg-gray-900 p-1 rounded-xl shadow-sm">
                                            <button onClick={() => decrementQty(item._id, item.selectedColor, item.selectedSize)} className="w-8 h-8 flex items-center justify-center text-white hover:bg-orange-600 rounded-lg transition-all"><FaMinus size={8}/></button>
                                            <span className="w-8 text-center text-white font-bold text-sm">{item.qty}</span>
                                            <button onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center text-white hover:bg-orange-600 rounded-lg transition-all"><FaPlus size={8}/></button>
                                        </div>
                                        <button onClick={() => removeFromCart(item._id, item.selectedColor, item.selectedSize)} className="text-gray-300 hover:text-red-500 transition-colors p-2 hover:scale-110 duration-200 cursor-pointer">
                                            <FaTrash size={14} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Sidebar "Control Tower" */}
                    <aside className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-32">
                        <div className="bg-gray-900 text-white p-6 sm:p-8 rounded-2xl shadow-md border border-gray-800 relative overflow-hidden group">
                            
                            <div className="relative z-10">
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Logistics Hub</h3>
                                    <FaShieldAlt className="text-orange-500 animate-pulse" />
                                </div>

                                <div className="space-y-5">
                                    <div className="bg-white/[0.03] p-4 rounded-xl border border-white/5">
                                        <div className="flex justify-between text-[10px] font-bold uppercase mb-2">
                                            <span className="text-gray-400">Payload Loadout</span>
                                            <span className={isOverweight ? 'text-red-400' : 'text-orange-400'}>{totalWeight.toFixed(1)} / {OVERWEIGHT_LIMIT} KG</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min((totalWeight / OVERWEIGHT_LIMIT) * 100, 100)}%` }} className={`h-full ${isOverweight ? 'bg-red-500' : 'bg-orange-500'}`} />
                                        </div>
                                    </div>

                                    <div className="space-y-3 px-1 text-xs font-semibold uppercase">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Gross Subtotal</span>
                                            <span className="text-white">{formatCurrency(subtotalUSD * (rate || 1), currencyCode)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Shipping Unit</span>
                                            <span className={isOverweight ? 'text-orange-400' : 'text-white'}>{isOverweight ? 'Restricted' : formatCurrency(finalShippingCost * (rate || 1), currencyCode)}</span>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-white/10">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Final Investment</span>
                                        <motion.div key={finalTotalUSD} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-black text-orange-500 tracking-tight mt-1">
                                            {isOverweight ? "HOLD" : formatCurrency(finalTotalUSD * (rate || 1), currencyCode)}
                                        </motion.div>
                                    </div>
                                </div>

                                <Button 
                                    onClick={() => isOverweight ? setShowQuoteModal(true) : (userInfo ? navigate('/checkout') : navigate('/login?redirect=/cart'))}
                                    variant={isOverweight ? 'danger' : 'primary'}
                                    size="full"
                                    className="mt-8 uppercase tracking-wider"
                                >
                                    {isOverweight ? (
                                        <>Request Logistics <FaExclamationTriangle className="animate-bounce" /></>
                                    ) : (
                                        <>Deploy Checkout <FaLock size={12} className="text-orange-200" /></>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            {/* Futuristic Modal */}
            <AnimatePresence>
                {showQuoteModal && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isSending && setShowQuoteModal(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer" />
                        
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-gray-900 w-full max-w-xl rounded-2xl p-6 sm:p-8 border border-white/10 shadow-xl overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />
                            
                            <AnimatePresence mode="wait">
                                {isSuccess ? (
                                    <motion.div key="sc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-8">
                                        <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                                            <FaCheckCircle className="text-green-500 text-3xl animate-pulse" />
                                        </div>
                                        <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Transmission Success</h2>
                                        <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Logistics HQ has acknowledged your manifest.</p>
                                    </motion.div>
                                ) : (
                                    <motion.div key="form">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h2 className="text-xl font-black text-white uppercase tracking-tight">Cargo <span className="text-orange-500">Inquiry</span></h2>
                                                <div className="flex items-center gap-1.5 mt-1.5 opacity-60"><FaMicrochip className="text-orange-500 text-[10px]" /> <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Secure Data Link Active</span></div>
                                            </div>
                                            <button onClick={() => setShowQuoteModal(false)} className="text-gray-400 hover:text-white transition-colors p-1 cursor-pointer"><FaTimes size={18}/></button>
                                        </div>

                                        <form onSubmit={handleQuoteSubmit} className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="relative group">
                                                    <FaUser size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500 transition-colors" />
                                                    <input type="text" placeholder="Contact Name" required value={quoteData.name} onChange={(e) => setQuoteData({...quoteData, name: e.target.value})} className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all" />
                                                </div>
                                                <div className="relative group">
                                                    <FaPhone size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500 transition-colors" />
                                                    <input type="tel" placeholder="Contact Phone" required value={quoteData.phone} onChange={(e) => setQuoteData({...quoteData, phone: e.target.value})} className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all" />
                                                </div>
                                            </div>
                                            <div className="relative group">
                                                <FaEnvelope size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-orange-500 transition-colors" />
                                                <input type="email" placeholder="Corporate Email" required value={quoteData.email} onChange={(e) => setQuoteData({...quoteData, email: e.target.value})} className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-semibold text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all" />
                                            </div>
                                            <div className="relative group">
                                                <FaCommentAlt size={12} className="absolute left-4 top-4 text-gray-500 group-focus-within:text-orange-500 transition-colors" />
                                                <textarea placeholder="Specific Requirements / Logistics Notes..." required rows="4" value={quoteData.message} onChange={(e) => setQuoteData({...quoteData, message: e.target.value})} className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-4 text-sm font-semibold text-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all resize-none" />
                                            </div>
                                            <Button type="submit" disabled={isSending} loading={isSending} variant="primary" size="full">
                                                {isSending ? loadingText : <>Transmit Request <FaPaperPlane size={10} /></>}
                                            </Button>
                                        </form>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                @keyframes scan {
                    0% { transform: translateY(-100%); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateY(200%); opacity: 0; }
                }
                .animate-scan { animation: scan 2.5s linear infinite; }
            `}</style>
        </div>
    );
};

export default Cart;