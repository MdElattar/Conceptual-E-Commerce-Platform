import React, { useState } from 'react';
import axiosInstance from '../utils/axios';
import { toast } from 'react-toastify';
import { useNavigate, Link } from 'react-router-dom';
import { FaEnvelope, FaLockOpen, FaArrowLeft, FaExclamationCircle, FaMicrochip } from 'react-icons/fa';
import Button from './Button';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false); 
  const navigate = useNavigate();

  // فلتر التأكد من صيغة الإيميل (Validation)
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. التحقق إن الخانة مش فاضية
    if (!email.trim()) {
      setIsError(true);
      return toast.warning("System Alert: Email address is required.");
    }

    // 2. التحقق من صيغة الإيميل قبل إرسال الطلب للسيرفر
    if (!validateEmail(email)) {
      setIsError(true);
      return toast.error("Format Error: Please enter a valid email address.");
    }

    setIsLoading(true);
    setIsError(false); 

    try {
      const { data } = await axiosInstance.post('/api/users/forgot-password', { email });
      if (data.success) {
        toast.success("Security code dispatched successfully.");
        navigate('/reset-code', { state: { email } });
      }
    } catch (err) {
      setIsError(true); 
      toast.error(err.response?.data?.message || "Email not found in our fleet database.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (isError) setIsError(false); 
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-24 antialiased">
      <div className={`max-w-md w-full bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden transition-transform duration-300 ${isError ? 'animate-shake' : ''}`}>

        {/* Top Tech Border Indicator */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>

        <div className="text-center mb-8 relative z-10">
          {/* Icon Unit */}
          <div className="bg-orange-50 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-6 border border-orange-100 shadow-sm">
            <FaLockOpen className={`text-orange-600 text-xl ${isLoading ? 'animate-pulse' : ''}`} />
          </div>
          
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">
            Reset <span className="text-orange-600">Access</span>
          </h2>
          
          <div className="flex items-center justify-center gap-1.5 mt-2 mb-4 opacity-60">
            <FaMicrochip className="text-orange-500 text-[10px]" />
            <p className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Access Recovery Terminal</p>
          </div>

          <p className="text-gray-500 font-medium text-xs leading-relaxed px-4">
            Lost your key? Enter your registered email to dispatch a recovery security code.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="relative group">
            <FaEnvelope size={12} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors z-10 ${isError ? 'text-red-500' : 'text-gray-400 group-focus-within:text-orange-500'}`} />
            <input
              type="email"
              required
              className={`w-full pl-10 pr-10 py-3 rounded-xl bg-gray-50 border outline-none font-semibold text-sm transition-all
                ${isError
                  ? 'border-red-500 text-red-600 focus:bg-white focus:ring-1 focus:ring-red-500'
                  : 'border-gray-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-gray-900'}`}
              placeholder="operator@dtcex.com"
              value={email}
              onChange={handleEmailChange}
            />
            {isError && (
              <FaExclamationCircle size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 z-10" />
            )}
          </div>

          <Button
            type="submit"
            variant="primary"
            size="full"
            disabled={isLoading || !email.trim()}
            className="uppercase tracking-wider text-xs py-3.5"
          >
            {isLoading ? "Transmitting..." : "Send Reset Code"}
          </Button>
        </form>

        {/* Back to Login Link */}
        <div className="mt-8 text-center border-t border-gray-100 pt-6 relative z-10">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-gray-400 font-bold uppercase text-[10px] tracking-wider hover:text-gray-950 transition-colors"
          >
            <FaArrowLeft size={9} />
            Back to Base Login
          </Link>
        </div>

        <p className="mt-6 text-[9px] text-gray-300 font-bold uppercase tracking-widest text-center">
          DTCEX Security Protocol v2.0
        </p>
      </div>

      {/* Shake Keyframe Injection */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.15s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
};

export default ForgotPassword;