import React, { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaPaperPlane, FaUser, FaEnvelope, FaPhone, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import Button from './Button';

const InquiryModal = ({ isOpen, onClose, productTitle }) => {
    const [isSending, setIsSending] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false); // حالة النجاح
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSending(true);
        try {
            const payload = {
                ...formData,
                productTitle: productTitle || "General Inquiry" 
            };

            await axios.post('/api/inquiries', payload);
            
            // تفعيل حالة النجاح
            setIsSuccess(true);
            
            // إغلاق المودال تلقائياً بعد 3 ثواني
            setTimeout(() => {
                onClose();
            }, 3500);

        } catch (err) {
            const errorMsg = err.response?.data?.message || 'Transmission failed. Check connection.';
            toast.error(errorMsg);
            setIsSending(false);
        }
    };

    // أنيميشن رسم علامة الصح
    const checkmarkVariants = {
        hidden: { pathLength: 0, opacity: 0 },
        visible: { 
            pathLength: 1, 
            opacity: 1,
            transition: { duration: 0.8, ease: "easeInOut" }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        onClick={onClose}
                        className="absolute inset-0 bg-black/85 backdrop-blur-xl"
                    />
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 30 }} 
                        animate={{ opacity: 1, scale: 1, y: 0 }} 
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        className={`bg-[#0d0d0d] w-full max-w-xl rounded-[3rem] p-8 md:p-12 relative overflow-hidden border border-white/10 transition-shadow duration-700 ${isSuccess ? 'shadow-[0_0_50px_rgba(34,197,94,0.2)]' : 'shadow-[0_0_50px_rgba(234,88,12,0.15)]'}`}
                    >
                        {/* الخلفية التفاعلية */}
                        <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] transition-colors duration-1000 ${isSuccess ? 'bg-green-600/20' : 'bg-orange-600/20'}`} />

                        <button onClick={onClose} className="absolute top-8 right-8 text-gray-500 hover:text-orange-500 transition-colors z-20">
                            <FaTimes size={22}/>
                        </button>

                        <AnimatePresence mode="wait">
                            {!isSuccess ? (
                                // --- واجهة الفورم ---
                                <motion.div 
                                    key="form"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="relative z-10"
                                >
                                    <div className="mb-10">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="w-8 h-[2px] bg-orange-600"></span>
                                            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                                                Technical <span className="text-orange-600">Inquiry</span>
                                            </h2>
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] ml-11">
                                            Reference: <span className="text-orange-500">{productTitle}</span>
                                        </p>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div className="relative">
                                            <FaUser className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-600/50" />
                                            <input 
                                                type="text" 
                                                placeholder="Authorized Name" 
                                                required 
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-orange-600/50 transition-all"
                                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="relative">
                                                <FaEnvelope className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-600/50" />
                                                <input 
                                                    type="email" 
                                                    placeholder="Corporate Email" 
                                                    required 
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-orange-600/50 transition-all"
                                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                                />
                                            </div>
                                            <div className="relative">
                                                <FaPhone className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-600/50" />
                                                <input 
                                                    type="text" 
                                                    placeholder="Contact Phone" 
                                                    required 
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-5 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-orange-600/50 transition-all"
                                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                                />
                                            </div>
                                        </div>

                                        <textarea 
                                            placeholder="Requirement details..." 
                                            rows="4" 
                                            required 
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-orange-600/50 resize-none transition-all"
                                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                                        ></textarea>
                                        
                                        <Button 
                                            type="submit" 
                                            disabled={isSending}
                                            loading={isSending}
                                            variant="primary"
                                            className="w-full"
                                        >
                                            {isSending ? 'Transmitting...' : <>Dispatch Inquiry <FaPaperPlane/></>}
                                        </Button>
                                    </form>
                                </motion.div>
                            ) : (
                                // --- واجهة النجاح (Success State) ---
                                <motion.div 
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="relative z-10 text-center py-10"
                                >
                                    <div className="flex justify-center mb-6">
                                        <div className="relative">
                                            {/* دائرة خارجية بتلف */}
                                            <motion.div 
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                                className="absolute -inset-4 border-2 border-dashed border-green-500/30 rounded-full"
                                            />
                                            {/* أيقونة الصح المتحركة */}
                                            <svg width="100" height="100" viewBox="0 0 50 50" className="text-green-500">
                                                <motion.path
                                                    fill="none"
                                                    strokeWidth="3"
                                                    stroke="currentColor"
                                                    d="M14,27 L22,35 L36,15"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    variants={checkmarkVariants}
                                                    initial="hidden"
                                                    animate="visible"
                                                />
                                                <motion.circle
                                                    cx="25"
                                                    cy="25"
                                                    r="23"
                                                    fill="none"
                                                    strokeWidth="2"
                                                    stroke="currentColor"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 0.2 }}
                                                    transition={{ delay: 0.5 }}
                                                />
                                            </svg>
                                        </div>
                                    </div>

                                    <motion.h2 
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-3xl font-black text-white uppercase italic mb-2"
                                    >
                                        Inquiry <span className="text-green-500">Received</span>
                                    </motion.h2>
                                    
                                    <motion.p 
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="text-gray-400 text-sm font-bold uppercase tracking-widest"
                                    >
                                        Our technical fleet is reviewing your manifest.
                                    </motion.p>

                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: "100%" }}
                                        transition={{ delay: 0.8, duration: 2.5 }}
                                        className="h-1 bg-green-500/20 mt-10 rounded-full overflow-hidden mx-auto max-w-[200px]"
                                    >
                                        <div className="h-full bg-green-500 w-full animate-loading-bar" />
                                    </motion.div>
                                    <p className="text-[8px] text-gray-600 mt-2 uppercase tracking-[0.4em]">System Auto-closing</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default InquiryModal;