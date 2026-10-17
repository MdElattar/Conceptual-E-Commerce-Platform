import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import axiosInstance from '../utils/axios';
import { setCredentials } from '../slices/authSlice';
import { toast } from 'react-toastify';
import { FaShieldAlt, FaPaperPlane, FaClock, FaMicrochip } from 'react-icons/fa';

const VerifyScreen = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false); 
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const email = localStorage.getItem('verifyEmail');

  useEffect(() => {
    if (!email) {
      toast.error("Security Session Expired. Please register again.");
      navigate('/register');
    }
  }, [email, navigate]);

  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // دعم النسخ واللصق (Paste)
  const handlePaste = (e) => {
    const data = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(data)) return; 

    const newOtp = [...otp];
    data.split('').forEach((char, index) => {
      newOtp[index] = char;
    });
    setOtp(newOtp);
    
    document.getElementById(`otp-${data.length - 1}`)?.focus();
  };

  const resendHandler = async () => {
    try {
      setIsLoading(true);
      const { status } = await axiosInstance.post('/api/users/resend-otp', { email });
      if (status === 200) {
        toast.success('Security protocol initiated: New code sent.');
        setTimer(60);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        setIsError(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Transmission failed. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handleChange = (value, index) => {
    if (isNaN(value)) return;
    setIsError(false); 

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const submitHandler = async (e) => {
    if (e) e.preventDefault();
    const otpString = otp.join('');

    if (otpString.length < 6) {
      setIsError(true);
      return toast.warning('Security Clearance: 6-digit code required.');
    }

    setIsLoading(true);
    try {
      const { data } = await axiosInstance.post('/api/users/verify', {
        email,
        otp: Number(otpString)
      });

      dispatch(setCredentials({ ...data }));
      localStorage.removeItem('verifyEmail');
      toast.success('Access Granted. Account Fully Activated.');
      navigate('/');
    } catch (err) {
      setIsError(true); 
      toast.error(err.response?.data?.message || 'Verification Failed: Invalid Code.');
    } finally {
      setIsLoading(false);
    }
  };

  // الإرسال التلقائي عند اكتمال الـ 6 أرقام
  useEffect(() => {
    if (otp.join('').length === 6 && !isLoading) {
      submitHandler();
    }
  }, [otp]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-24 antialiased">
      <div className={`max-w-md w-full bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-gray-200 text-center relative overflow-hidden transition-transform duration-300 ${isError ? 'animate-shake' : ''}`}>
        
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] z-20 flex items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-orange-600">Verifying Identity...</p>
            </div>
          </div>
        )}

        {/* Top Tech Border Indicator */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>
        
        {/* Icon Unit */}
        <div className="bg-orange-50 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-6 border border-orange-100 shadow-sm">
          <FaShieldAlt className={`text-orange-600 text-xl ${isLoading ? 'animate-pulse' : ''}`} />
        </div>

        <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">
          Verify <span className="text-orange-600">Identity</span>
        </h2>
        
        <div className="flex items-center justify-center gap-1.5 mt-2 mb-6 opacity-60">
          <FaMicrochip className="text-orange-500 text-[10px]" />
          <p className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Identity Validation Terminal</p>
        </div>

        <p className="text-gray-500 font-medium text-xs leading-relaxed mb-8 px-2">
          Transmission successfully sent to:<br/>
          <span className="text-gray-900 lowercase font-bold tracking-normal block mt-1 bg-gray-50 py-1.5 px-3 rounded-lg border border-gray-100 break-all">{email}</span>
        </p>

        <form onSubmit={submitHandler}>
          {/* OTP Input Fields */}
          <div className="flex justify-center gap-2 mb-6" dir="ltr" onPaste={handlePaste}>
            {otp.map((data, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength="1"
                className={`w-11 h-14 bg-gray-50 border border-gray-200 rounded-xl text-center text-xl font-black transition-all outline-none
                  ${isError ? 'text-red-500 border-red-500 ring-1 ring-red-500' : 'text-gray-900 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500'}`}
                value={data}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
              />
            ))}
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-orange-600 text-white py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs shadow-sm hover:bg-gray-950 transition-all mb-6 disabled:bg-gray-200 disabled:text-gray-400"
          >
            {isLoading ? 'Decrypting...' : 'Confirm Activation'}
          </button>
        </form>

        {/* Footer Actions / Countdown */}
        <div className="border-t border-gray-100 pt-6">
          {canResend ? (
            <button
              onClick={resendHandler}
              className="group flex items-center justify-center gap-2 mx-auto text-orange-600 font-bold uppercase text-[10px] tracking-wider hover:text-gray-950 transition-colors"
            >
              <FaPaperPlane size={10} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              Resend Security Code
            </button>
          ) : (
            <div className="flex items-center justify-center gap-1.5 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
              <FaClock size={10} className="animate-pulse text-orange-500" />
              Resend available in {timer}s
            </div>
          )}
        </div>

        <p className="mt-6 text-[9px] text-gray-300 font-bold uppercase tracking-widest">
          Secured by DTCEX Encryption Standard
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

export default VerifyScreen;