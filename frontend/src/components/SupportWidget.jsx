import React, { useState, useEffect, useRef, useMemo } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaWhatsapp, FaHeadset, FaTimes, 
    FaRobot, FaExternalLinkAlt, FaPaperPlane, FaArrowLeft, FaCheckCircle, FaTruck
} from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { useGetMyOrdersQuery } from '../slices/orderApiSlice';

const SupportWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isChatMode, setIsChatMode] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [userInput, setUserInput] = useState("");
    
    const widgetRef = useRef(null); // المرجع الأساسي للتحكم في الضغط الخارجي
    const scrollRef = useRef(null);

    const { userInfo } = useSelector((state) => state.auth);

    const { data: orders } = useGetMyOrdersQuery(undefined, {
        skip: !userInfo,
    });

    const lastOrder = useMemo(() => (orders && orders.length > 0 ? orders[0] : null), [orders]);
    const lastOrderId = useMemo(() => (lastOrder?._id ? lastOrder._id.slice(-6).toUpperCase() : null), [lastOrder]);
    
    const whatsappNumber = "+201100526027";
    const [chatMessages, setChatMessages] = useState([]);

    // ميزة إغلاق النافذة عند النقر في أي مكان خارج الـ Widget
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (widgetRef.current && !widgetRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const welcomeMessage = useMemo(() => {
        if (userInfo) {
            let statusText = lastOrder?.isDelivered ? "Delivered" : lastOrder?.isOnWay ? "On Way" : lastOrder?.isPaid ? "Paid" : "Pending";
            const msg = lastOrder
                ? `System Link Active. Welcome ${userInfo.name}.\nFound Manifest #${lastOrderId} [Status: ${statusText}]. How can I assist with your cargo?`
                : `Logistics AI Online. Hello ${userInfo.name}.\nNo active shipments found. Need a quote for a new batching plant?`;
            return [{ text: msg, sender: 'bot' }];
        }
        return [{ text: "Guest Protocol Active. Please login to access your secure logistics dashboard.", sender: 'bot' }];
    }, [userInfo, lastOrder, lastOrderId]);

    // Scroll أوتوماتيكي
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [chatMessages, isTyping]);

    const generateWAUrl = (type) => {
        const clientName = userInfo?.name || "Guest";
        let message = (type === 'order' && lastOrder)
            ? `*CARGO TRACKING PROTOCOL*\n- *ID:* #${lastOrderId}\n- *Client:* ${clientName}\n- *Payment:* ${lastOrder.isPaid ? 'CONFIRMED' : 'PENDING'}\n- *Total:* ${lastOrder.totalPrice} EGP`
            : `*FLEET ASSISTANCE*\n- *Client:* ${clientName}\n- Requesting human intervention for technical support.`;
        return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    };

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!userInput.trim()) return;

        const userMsg = userInput;
        setChatMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
        setUserInput("");
        setIsTyping(true);

        setTimeout(() => {
            let botResponse = "Analyzing logistics database... For real-time GPS tracking, please bridge to WhatsApp.";
            const input = userMsg.toLowerCase();

            if (input.includes("order") || input.includes("طلب") || input.includes("فين")) {
                botResponse = lastOrder
                    ? `Tracking Manifest #${lastOrderId}:\n• Value: ${lastOrder.totalPrice} EGP\n• Paid: ${lastOrder.isPaid ? 'Yes' : 'No'}\n• Status: ${lastOrder.isDelivered ? 'Delivered' : 'In Transit'}.`
                    : "No active manifests detected under your credentials.";
            } else if (input.includes("wallet") || input.includes("رصيد") || input.includes("محفظة")) {
                botResponse = `Financial Status: Your secure wallet balance is ${userInfo?.walletBalance || 0} EGP. Ready for instant settlement.`;
            } else if (input.includes("hi") || input.includes("سلام") || input.includes("hello")) {
                botResponse = `Hello ${userInfo?.name || 'Commander'}. Cargo Node 01 is standing by for your commands.`;
            }

            setChatMessages(prev => [...prev, { text: botResponse, sender: 'bot' }]);
            setIsTyping(false);
        }, 1000);
    };

    return (
        <div ref={widgetRef} className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[999999] font-sans selection:bg-[#FF6B00] selection:text-white" dir="ltr">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 30 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="mb-4 w-[calc(100vw-2rem)] sm:w-[380px] bg-[#0D1527] border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
                    >
                        {/* Header Section (Unified Dark Navy UI) */}
                        <div className="bg-[#0B132B] p-5 text-white flex items-center justify-between border-b border-gray-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#152039] rounded-xl flex items-center justify-center border border-gray-800 relative">
                                    <FaRobot size={20} className={isTyping ? "animate-pulse text-[#FF6B00]" : "text-white"} />
                                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0B132B] rounded-full"></span>
                                </div>
                                <div>
                                    <h4 className="font-black uppercase tracking-tight text-xs leading-tight">Cargo Intelligence</h4>
                                    <p className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">SECURE NODE: ACTIVE</p>
                                </div>
                            </div>
                            <button
                                onClick={() => isChatMode ? setIsChatMode(false) : setIsOpen(false)}
                                className="bg-[#152039] text-gray-400 p-2.5 rounded-xl hover:text-white border border-gray-800 transition-colors"
                            >
                                {isChatMode ? <FaArrowLeft size={12} /> : <FaTimes size={12} />}
                            </button>
                        </div>

                        {/* Body Section */}
                        <div className="h-[380px] bg-[#0D1527] flex flex-col relative">
                            {!isChatMode ? (
                                <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">Operations Center</p>

                                    {/* AI Chat Button */}
                                    <button onClick={() => setIsChatMode(true)} className="w-full flex items-center justify-between bg-[#152039] hover:bg-[#152039]/80 p-4 rounded-2xl border border-gray-800/80 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-[#0D1527] border border-gray-800 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                                                <FaRobot className="text-[#FF6B00]" size={18} />
                                            </div>
                                            <div className="text-left">
                                                <div className="text-[12px] font-black text-white uppercase tracking-wide">Automated Support</div>
                                                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Real-time DB Query</div>
                                            </div>
                                        </div>
                                        <div className="w-6 h-6 rounded-lg bg-[#0D1527] border border-gray-800 flex items-center justify-center group-hover:border-[#FF6B00]/40 transition-colors">
                                            <FaPaperPlane className="text-[#FF6B00]" size={10} />
                                        </div>
                                    </button>

                                    {/* Last Order Button */}
                                    <a href={generateWAUrl('order')} target="_blank" rel="noreferrer"
                                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${lastOrder ? 'bg-[#FF6B00]/5 border-[#FF6B00]/20 hover:bg-[#FF6B00]/10' : 'bg-[#152039] border-transparent opacity-40 grayscale pointer-events-none'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-[#0D1527] border border-gray-800 rounded-xl flex items-center justify-center">
                                                {lastOrder?.isDelivered ? <FaCheckCircle className="text-emerald-500" size={18} /> : <FaTruck className="text-[#FF6B00] animate-pulse" size={18} />}
                                            </div>
                                            <div className="text-left">
                                                <div className="text-[12px] font-black text-white uppercase tracking-wide">
                                                    {lastOrder ? `Manifest #${lastOrderId}` : 'No Active Shipment'}
                                                </div>
                                                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{lastOrder?.isDelivered ? 'Cargo Delivered' : 'In Transit Protocol'}</div>
                                            </div>
                                        </div>
                                        <FaWhatsapp className="text-emerald-500" size={20} />
                                    </a>

                                    {/* Human Support Button */}
                                    <a href={generateWAUrl('tech')} target="_blank" rel="noreferrer" className="flex items-center justify-between bg-[#152039] hover:bg-[#152039]/80 p-4 rounded-2xl border border-gray-800/80 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-[#0D1527] border border-gray-800 rounded-xl flex items-center justify-center group-hover:rotate-6 transition-transform">
                                                <FaHeadset className="text-[#FF6B00]" size={18} />
                                            </div>
                                            <div className="text-left">
                                                <div className="text-[12px] font-black text-white uppercase tracking-wide">Fleet Manager</div>
                                                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Human Intelligence</div>
                                            </div>
                                        </div>
                                        <FaExternalLinkAlt className="text-gray-500 group-hover:text-white transition-colors" size={10} />
                                    </a>
                                </div>
                            ) : (
                                <div className="flex flex-col h-full overflow-hidden">
                                    <div ref={scrollRef} className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#0D1527]">
                                        {chatMessages.map((msg, i) => (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                key={i}
                                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[85%] p-3.5 rounded-2xl text-[12px] font-medium leading-relaxed border ${msg.sender === 'user'
                                                        ? 'bg-[#FF6B00] text-white border-transparent rounded-tr-none font-bold'
                                                        : 'bg-[#152039] text-gray-200 border-gray-800 rounded-tl-none'
                                                    }`}>
                                                    {msg.text.split('\n').map((line, j) => <div key={j}>{line}</div>)}
                                                </div>
                                            </motion.div>
                                        ))}
                                        {isTyping && (
                                            <div className="flex justify-start px-1">
                                                <div className="flex gap-1.5 p-3 bg-[#152039] rounded-2xl border border-gray-800">
                                                    <span className="w-1.5 h-1.5 bg-[#FF6B00] rounded-full animate-bounce"></span>
                                                    <span className="w-1.5 h-1.5 bg-[#FF6B00] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                                    <span className="w-1.5 h-1.5 bg-[#FF6B00] rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <form onSubmit={handleSendMessage} className="p-4 bg-[#0B132B] border-t border-gray-800 flex gap-2">
                                        <input
                                            type="text"
                                            value={userInput}
                                            onChange={(e) => setUserInput(e.target.value)}
                                            placeholder="Transmit data..."
                                            className="flex-1 bg-[#152039] border border-gray-800 rounded-xl px-4 py-3 text-[12px] text-white focus:outline-none focus:border-[#FF6B00] transition-all font-medium placeholder:text-gray-600"
                                        />
                                        <button type="submit" className="bg-[#FF6B00] text-white p-3.5 rounded-xl hover:bg-[#e05e00] transition-all active:scale-95 shadow-md shadow-[#FF6B00]/10">
                                            <FaPaperPlane size={12} />
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Toggle Switch Button (Unified Branding Colors) */}
            <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => { if (!isOpen) setChatMessages(welcomeMessage); setIsOpen(!isOpen); }}
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 z-[999999] relative border border-gray-800/40 ${isOpen ? 'bg-white text-[#0B132B] rotate-90' : 'bg-[#FF6B00] text-white'}`}
            >
                {isOpen ? <FaTimes size={20} /> : (
                    <div className="relative">
                        <FaHeadset size={24} />
                        {!isOpen && userInfo && (
                            <span className="absolute -top-3 -right-3 w-5 h-5 bg-white text-[#FF6B00] text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#FF6B00]">1</span>
                        )}
                    </div>
                )}
            </motion.button>
        </div>
    );
};

export default SupportWidget;