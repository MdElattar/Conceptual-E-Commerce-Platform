import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import { toast } from 'react-toastify';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaStore, FaFileContract, FaArrowLeft, FaShieldAlt, 
  FaIdCard, FaCheckCircle, FaEnvelope, FaFingerprint
} from 'react-icons/fa';
import Button from './Button';

const BecomeVendorScreen = () => {
  const navigate = useNavigate();

  // States الهوية التجارية للمتجر
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [commercialRegister, setCommercialRegister] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false); 
  
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      return toast.warning("You must agree to the Merchant Terms of Service.");
    }
    
    if (nationalId.length < 14) {
      return toast.warning("Please enter a valid 14-digit National ID.");
    }

    setLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo?.token}`,
        },
      };

      const vendorData = {
        storeName,
        storeDescription,
        nationalId,
        commercialRegister,
      };

      // 🔗 استخدام axiosInstance الموحد المربوط بدومين الباك إند
      const { data } = await axiosInstance.post('/api/users/verify-identity', vendorData, config);
      
      setLoading(false);
      setShowSuccess(true);
      
      setTimeout(() => {
        window.location.href = data.url;
      }, 3000);
      
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to initiate verification session.");
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 md:pt-32 pb-10 md:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto font-sans text-gray-900 min-h-screen relative">
      
      {/* 🌟 شاشة النجاح الاحترافية (Success Modal) */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 50 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
              className="bg-white rounded-[2rem] p-8 md:p-10 max-w-lg w-full text-center shadow-2xl flex flex-col items-center border border-gray-100"
            >
              <motion.div 
                 initial={{ scale: 0 }} 
                 animate={{ scale: 1 }} 
                 transition={{ type: "spring", delay: 0.2, bounce: 0.5 }}
                 className="bg-emerald-100 text-emerald-500 w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-inner"
              >
                <FaCheckCircle size={50} />
              </motion.div>
              
              <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 uppercase tracking-tight">
                Secure Session Created!
              </h2>
              
              <p className="text-gray-500 font-medium text-sm leading-relaxed mb-6">
                Your primary details have been securely logged. You are now being redirected to the <strong className="text-black">Stripe Identity Gate</strong> to complete your biometric scan.
              </p>
              
              <div className="flex items-center justify-center gap-3 text-orange-600 font-bold bg-orange-50 border border-orange-100 py-3 px-5 rounded-xl w-full mb-8">
                <FaEnvelope size={18} className="animate-pulse" /> 
                <span className="text-xs uppercase tracking-widest text-left">
                  An email confirmation will be sent upon final admin approval.
                </span>
              </div>

              {/* شريط التحميل (Loading Bar) */}
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden relative">
                 <motion.div 
                   initial={{ width: "0%" }} 
                   animate={{ width: "100%" }} 
                   transition={{ duration: 3, ease: "linear" }}
                   className="bg-emerald-500 h-full absolute left-0 top-0"
                 />
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-3">
                Redirecting securely...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navigation */}
      <div className="mb-8 flex justify-between items-center border-b border-gray-100 pb-6">
        <div>
           <h1 className="text-3xl sm:text-4xl font-black uppercase italic text-gray-900 tracking-tighter leading-none mb-2">
            VENDOR <span className="text-orange-600">PARTNERSHIP</span>
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-wider">
            JOIN OUR GLOBAL LOGISTICS NETWORK. SUBMIT YOUR OFFICIAL DOCUMENTATION.
          </p>
        </div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-orange-600 font-bold transition-all group px-4 py-2 border border-gray-200 rounded-lg bg-white shadow-sm">
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> 
          <span className="uppercase text-xs tracking-widest">Back</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <form onSubmit={submitHandler} className="space-y-6">
            
            {/* Commercial Identity Section */}
            <section className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="font-black text-sm mb-6 flex items-center gap-2 text-gray-900 uppercase tracking-widest border-b border-gray-50 pb-4">
                <FaStore className="text-orange-500" size={16} /> Commercial Identity
              </h3>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Store / Company Name *</label>
                    <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 focus:border-orange-500 rounded-xl focus:bg-white transition-all outline-none font-bold text-gray-800" placeholder="e.g. DK Heavy Industries" required />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Business Description *</label>
                    <textarea value={storeDescription} onChange={(e) => setStoreDescription(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 focus:border-orange-500 rounded-xl h-32 focus:bg-white transition-all outline-none font-medium resize-none leading-relaxed text-sm text-gray-700" placeholder="Describe the industrial units or parts you intend to sell..." required></textarea>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                      <FaFingerprint /> National ID *
                    </label>
                    <input type="text" maxLength="14" value={nationalId} onChange={(e) => setNationalId(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 focus:border-orange-500 rounded-xl font-mono text-xs font-bold text-gray-800 outline-none tracking-widest" placeholder="14-Digit ID Number" required />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                       Commercial Register / Tax ID
                    </label>
                    <input type="text" value={commercialRegister} onChange={(e) => setCommercialRegister(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 focus:border-orange-500 rounded-xl font-mono text-xs font-bold text-gray-800 outline-none tracking-widest" placeholder="Optional" />
                  </div>
                </div>
              </div>
            </section>
          </form>
        </div>

        {/* Right Column: Info & Submit (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Security Hub Box */}
          <div className="bg-[#111827] text-white p-6 rounded-2xl shadow-xl border border-gray-800">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-xs uppercase tracking-widest text-gray-300">SECURITY HUB</h3>
                <FaShieldAlt className="text-orange-500" />
             </div>
             
             <div className="space-y-4 mb-8">
               <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/50 flex items-start gap-3">
                  <FaIdCard className="text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-black uppercase text-[10px] tracking-wider text-white">Biometric Scan Required</h5>
                    <p className="text-gray-400 text-[10px] font-medium leading-relaxed mt-1">
                      You will be securely redirected to Stripe to capture live photos of your Passport, National ID, and a live matching selfie.
                    </p>
                  </div>
               </div>

               <div>
                  <h4 className="font-black text-white uppercase tracking-widest text-xs mb-1">Strict Fraud Prevention</h4>
                  <p className="text-gray-400 text-[11px] font-bold leading-relaxed">
                    Stripe Identity checks biometric signatures, document authenticity, and data integrity. Your registration goes to the admin queue as soon as your identity is validated.
                  </p>
               </div>
             </div>

             <div className="border-t border-gray-700 pt-6 mb-6">
                 <div className="flex items-start gap-3">
                  <input 
                    type="checkbox" 
                    id="terms" 
                    checked={agreedToTerms} 
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-orange-500 cursor-pointer rounded bg-gray-900 border-gray-700"
                  />
                  <label htmlFor="terms" className="text-[10px] font-bold text-gray-400 leading-relaxed cursor-pointer select-none">
                    I declare that all submitted information is authentic. I agree to authorization of Stripe Document Analysis.
                  </label>
                </div>
             </div>

             <Button 
                onClick={submitHandler}
                disabled={loading || showSuccess || !agreedToTerms} 
                loading={loading}
                variant="primary"
                className="w-full"
              >
                {showSuccess ? (
                  <><FaCheckCircle /> Verification Ready</>
                ) : (
                  <>Verify with Stripe <FaFileContract /></>
                )}
              </Button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default BecomeVendorScreen;