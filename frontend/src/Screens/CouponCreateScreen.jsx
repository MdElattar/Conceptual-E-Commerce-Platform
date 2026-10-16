import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateCouponMutation } from '../slices/couponsApiSlice';
import { toast } from 'react-toastify';
import { 
  FiTag, FiCalendar, FiDollarSign, FiPercent, FiPlus, 
  FiLock, FiZap, FiTarget, FiBox, FiUsers 
} from 'react-icons/fi';

const CouponCreateScreen = () => {
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountAmount, setDiscountAmount] = useState('');
  const [minPurchase, setMinPurchase] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [usageLimit, setUsageLimit] = useState(100);

  const navigate = useNavigate();
  const [createCoupon, { isLoading }] = useCreateCouponMutation();

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!code || !discountAmount || !expiryDate) {
        return toast.warning("Please fill all required payload fields.");
    }

    try {
      await createCoupon({
        code: code.trim().toUpperCase(),
        discountType,
        discountAmount: Number(discountAmount),
        minPurchase: Number(minPurchase) || 0,
        expiryDate,
        usageLimit: Number(usageLimit) || 100,
      }).unwrap();
      
      toast.success('Coupon Engine Activated Successfully! 🚀');
      navigate('/admin/coupons');
    } catch (err) {
      toast.error(err?.data?.message || err.error || 'Engine Deployment Failed');
    }
  };

  return (
    <div className="bg-gray-50/30 min-h-screen pt-24 md:pt-32 pb-10 md:pb-20 px-4 sm:px-6 lg:px-8 font-sans antialiased text-gray-900" style={{ backgroundImage: `radial-gradient(#e5e7eb 1px, transparent 1px)`, backgroundSize: '24px 24px' }}>
      
      <div className="max-w-7xl mx-auto">
        {/* Header Section with Motion */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }} 
          animate={{ opacity: 1, x: 0 }} 
          className="mb-12 flex justify-between items-end"
        >
          <div>
            <div className="inline-block bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg mb-3 shadow-sm">
              Logistic Marketing Module
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tighter italic leading-none">
              Create <span className="text-orange-600">Voucher</span>
            </h1>
            <p className="text-gray-500 font-bold mt-2 text-sm tracking-wide">Configure high-performance discount rules for your fleet.</p>
          </div>
          <div className="hidden md:block text-gray-200">
              <FiBox size={60} strokeWidth={1} />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Form Column */}
          <ColWrapper className="lg:col-span-7">
            <motion.div 
              initial={{ opacity: 0, y: 30 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.1 }}
              className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-gray-200/50 border border-white relative z-10"
            >
              <form onSubmit={submitHandler} className="space-y-6">
                
                {/* Promo Code Input */}
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase font-black text-gray-400 tracking-widest ml-1">Unique Promo Code</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                      <FiTag className="text-orange-600 transition-transform group-focus-within:scale-110" size={20}/>
                    </div>
                    <input
                      type="text"
                      className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none font-black text-2xl text-gray-800 placeholder-gray-300 transition-all shadow-inner uppercase tracking-wider"
                      placeholder="EX: HEAVY-DUTY-20"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Discount Type */}
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase font-black text-gray-400 tracking-widest ml-1">Discount Architecture</label>
                    <div className="relative">
                      <select 
                        className="w-full pl-5 pr-10 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none font-bold text-gray-800 transition-all shadow-inner appearance-none cursor-pointer"
                        value={discountType} 
                        onChange={(e) => setDiscountType(e.target.value)}
                      >
                        <option value="percentage">Percentage Model (%)</option>
                        <option value="fixed">Fixed Currency (EGP)</option>
                      </select>
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
                    </div>
                  </div>

                  {/* Discount Value */}
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase font-black text-gray-400 tracking-widest ml-1">Operational Value</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                        {discountType === 'percentage' ? <FiPercent className="text-white" /> : <FiDollarSign className="text-white" />}
                      </div>
                      <input
                        type="number"
                        className="w-full pl-12 pr-6 py-4 bg-gray-900 border-2 border-transparent focus:ring-4 focus:ring-orange-500/20 rounded-2xl outline-none font-black text-xl text-white placeholder-gray-700 transition-all shadow-inner"
                        placeholder="0"
                        value={discountAmount}
                        onChange={(e) => setDiscountAmount(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Min Purchase */}
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase font-black text-gray-400 tracking-widest ml-1">Min. Purchase Limit (EGP)</label>
                    <input 
                      type="number" 
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none font-bold text-gray-800 transition-all shadow-inner"
                      placeholder="0.00"
                      value={minPurchase} 
                      onChange={(e) => setMinPurchase(e.target.value)} 
                    />
                  </div>

                  {/* Usage Limit (Added) */}
                  <div className="space-y-2">
                    <label className="block text-[10px] uppercase font-black text-gray-400 tracking-widest ml-1">Global Usage Limit</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                            <FiUsers size={16} />
                        </div>
                        <input 
                            type="number" 
                            className="w-full pl-10 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none font-bold text-gray-800 transition-all shadow-inner"
                            placeholder="100"
                            value={usageLimit} 
                            onChange={(e) => setUsageLimit(e.target.value)} 
                        />
                    </div>
                  </div>

                  {/* Expiry Date */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="block text-[10px] uppercase font-black text-gray-400 tracking-widest ml-1">Rule Expiration Gateway</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                            <FiCalendar size={16} />
                        </div>
                        <input 
                            type="date" 
                            className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none font-bold text-gray-800 transition-all shadow-inner cursor-pointer"
                            value={expiryDate} 
                            onChange={(e) => setExpiryDate(e.target.value)} 
                            required 
                        />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <button 
                    type="submit" 
                    disabled={isLoading} 
                    className="w-full bg-orange-600 text-white py-5 rounded-2xl font-black text-sm tracking-widest uppercase hover:bg-gray-900 transition-all duration-300 shadow-xl shadow-orange-600/20 hover:shadow-gray-900/20 active:scale-95 flex justify-center items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? <FiZap className="animate-spin" size={18} /> : <><FiPlus size={18}/> Deploy Voucher System</>}
                  </button>
                </div>

              </form>
            </motion.div>
          </ColWrapper>

          {/* Live Preview Column */}
          <ColWrapper className="lg:col-span-5">
            <motion.div 
              initial={{ opacity: 0, x: 30 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ delay: 0.2 }}
              className="sticky top-32" 
            >
              <h6 className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-6 flex items-center gap-2">
                  <FiTarget className="text-orange-600" size={14} /> Live Logic Simulation
              </h6>
              
              {/* Ticket Card Design using pure Tailwind */}
              <div className="bg-gray-950 rounded-[2.5rem] shadow-2xl shadow-gray-900/40 relative overflow-hidden group">
                {/* Tailwind Cutouts */}
                <div className="absolute w-10 h-10 bg-[#f8f9fa] rounded-full top-1/2 -translate-y-1/2 -left-5 z-10 shadow-inner border border-gray-100"></div>
                <div className="absolute w-10 h-10 bg-[#f8f9fa] rounded-full top-1/2 -translate-y-1/2 -right-5 z-10 shadow-inner border border-gray-100"></div>
                
                <div className="p-8 md:p-10 relative z-0">
                  <div className="flex justify-between items-start mb-8">
                      <div className="font-black italic text-2xl text-white tracking-tighter">DK<span className="text-orange-600">TEC</span></div>
                      <div className="bg-orange-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm">
                          Verified Rule
                      </div>
                  </div>

                  <div className="text-center py-6">
                      <h1 className="text-4xl md:text-5xl font-black m-0 tracking-tighter text-white break-all">
                          {code || 'D-TECH-X'}
                      </h1>
                      <div className="flex justify-center mt-6">
                          <div className="w-2/3 border-t-2 border-dashed border-gray-700 opacity-50"></div>
                      </div>
                  </div>

                  <div className="flex justify-between items-end mt-6 pt-2">
                    <div>
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block mb-1">Discount Payload</span>
                      <span className="text-3xl font-black text-orange-600 leading-none block">
                          {discountAmount || '0'}{discountType === 'percentage' ? '%' : ' EGP'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block mb-1">System Expiry</span>
                      <span className="text-sm font-bold text-white tracking-wide block">{expiryDate || 'UNDEFINED'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Protocol Notice */}
              <motion.div 
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="mt-6 p-5 rounded-2xl bg-white border-l-4 border-orange-600 shadow-md flex items-center gap-4"
              >
                <div className="bg-orange-50 p-3 rounded-xl text-orange-600 shrink-0">
                    <FiLock size={20} />
                </div>
                <div className="text-[11px] text-gray-600 font-bold leading-relaxed">
                  <span className="text-gray-900 font-black uppercase tracking-wider block mb-0.5">Security Protocol Triggered:</span>
                  Only applicable on checkouts above <span className="text-orange-600 font-black">{minPurchase || '0'} EGP</span>. Limited to {usageLimit} redemptions.
                </div>
              </motion.div>

            </motion.div>
          </ColWrapper>
        </div>
      </div>
    </div>
  );
};

// Helper component to mimic the Col structural tag purely
const ColWrapper = ({ children, className }) => (
    <div className={className}>{children}</div>
);

export default CouponCreateScreen;