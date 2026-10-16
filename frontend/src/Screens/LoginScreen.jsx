import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios"; 
import { GoogleLogin } from "@react-oauth/google";
import { FaEye, FaEyeSlash, FaLock, FaEnvelope, FaMicrochip } from "react-icons/fa";
import { setCredentials } from "../slices/authSlice";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";
import LoaderSign from "../components/LoaderSign";

// 🌟 تهيئة Axios Instance برابط الباك إند المباشر لمنع تحويل الطلبات للفرونت إند
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_ENDPOINT || 'https://conceptual-e-commerce-platform-m2k7.vercel.app',
});

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  const [lockTimer, setLockTimer] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [twoFACode, setTwoFACode] = useState("");
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { userInfo } = useSelector((state) => state.auth);
  const redirect = new URLSearchParams(location.search).get("redirect") || "/";

  useEffect(() => {
    if (userInfo) navigate(redirect);
  }, [navigate, redirect, userInfo]);

  const googleSuccess = async (credentialResponse) => {
    try {
      const details = jwtDecode(credentialResponse.credential);
      const { data } = await axiosInstance.post("/api/users/google", {
        name: details.name,
        email: details.email,
        image: details.picture,
      });
      if (data.requires2FA) {
        setRequires2FA(true);
        setTempToken(data.tempToken);
        return;
      }
      dispatch(setCredentials({ ...data }));
      toast.success("Welcome back!");
      navigate(redirect);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Google login failed");
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (lockTimer) return toast.error(`Account locked. Wait ${lockTimer}s`);
    
    setIsLoading(true);
    try {
      const { data } = await axiosInstance.post("/api/users/login", { email, password });
      if (data.requires2FA) {
        setRequires2FA(true);
        setTempToken(data.tempToken);
        return;
      }
      dispatch(setCredentials({ ...data }));
      navigate(redirect);
    } catch (err) {
      const headerRemaining = err.response?.headers["ratelimit-remaining"] || err.response?.headers["x-ratelimit-remaining"];
      const remainingNum = headerRemaining !== undefined ? Number(headerRemaining) : null;

      if (err.response?.status === 429 || remainingNum === 0) {
        setLockTimer(60);
        const interval = setInterval(() => {
          setLockTimer((prev) => {
            if (prev <= 1) { clearInterval(interval); return null; }
            return prev - 1;
          });
        }, 1000);
        toast.error("Too many attempts. Locked for 1 minute.");
      } else {
        setRemainingAttempts(remainingNum);
        toast.error(err.response?.data?.message || "Invalid Email or Password");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (twoFACode.length !== 6) return toast.error("Please enter your 6-digit code");
    setIsVerifying2FA(true);
    try {
      const { data } = await axiosInstance.post("/api/users/verify-2fa", {
        tempToken,
        token: twoFACode,
      });
      dispatch(setCredentials({ ...data }));
      toast.success("Welcome back!");
      navigate(redirect);
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid verification code");
    } finally {
      setIsVerifying2FA(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-24 antialiased">
      <div className="w-full max-w-md bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
        
        {/* Top Tech Border Indicator */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />

        <div className="text-center mb-8 relative z-10">
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">
            {requires2FA ? 'Verify ' : 'Sign '}
            <span className="text-orange-600">{requires2FA ? 'Identity' : 'In'}</span>
          </h1>
          <div className="flex items-center justify-center gap-1.5 mt-2 opacity-60">
            <FaMicrochip className="text-orange-500 text-[10px]" />
            <p className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Access Machinery Dashboard</p>
          </div>
        </div>

        {requires2FA ? (
          <div className="space-y-4 relative z-10">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <p className="text-sm text-blue-800 font-bold mb-1">Two-Factor Authentication Required</p>
              <p className="text-xs text-blue-600">Enter the 6-digit code from your authenticator app or a backup code.</p>
            </div>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={twoFACode}
              onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full text-center text-2xl tracking-[0.5em] font-mono px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              onClick={handleVerify2FA}
              disabled={isVerifying2FA || twoFACode.length !== 6}
              className="w-full bg-orange-600 text-white font-bold py-3.5 rounded-xl shadow-sm hover:bg-gray-950 transition-all uppercase tracking-wider text-xs disabled:bg-gray-200 disabled:text-gray-400 border-0 cursor-pointer"
            >
              {isVerifying2FA ? 'Verifying...' : 'Verify Code'}
            </button>
            <button
              onClick={() => { setRequires2FA(false); setTempToken(''); setTwoFACode(''); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700 bg-transparent border-0 cursor-pointer"
            >
              Back to login
            </button>
          </div>
        ) : (
          <>
          <form onSubmit={submitHandler} className="space-y-4 relative z-10">
            
            {/* Email Input */}
            <div className="relative group">
              <FaEnvelope size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors"/>
              <input
                type="email"
                placeholder="Email Address"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none font-semibold text-sm transition-all text-gray-900"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password Input */}
            <div className="relative group">
              <FaLock size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors"/>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                required
                className="w-full pl-10 pr-12 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none font-semibold text-sm transition-all text-gray-900"
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors p-1"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash size={14}/> : <FaEye size={14}/>}
              </button>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end px-1">
              <Link to="/forgot-password" className="text-[10px] font-bold uppercase text-gray-400 hover:text-orange-600 transition-colors tracking-wider">
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              disabled={isLoading || lockTimer}
              type="submit"
              className="w-full bg-orange-600 text-white font-bold py-3.5 rounded-xl shadow-sm hover:bg-gray-950 transition-all uppercase tracking-wider text-xs disabled:bg-gray-200 disabled:text-gray-400"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <LoaderSign /> Processing...
                </div>
              ) : 'Unlock Dashboard'}
            </button>

            {/* Divider */}
            <div className="relative py-2 flex items-center">
               <div className="flex-grow border-t border-gray-100"></div>
               <span className="flex-shrink mx-3 text-gray-300 text-[9px] font-black uppercase tracking-widest">OR</span>
               <div className="flex-grow border-t border-gray-100"></div>
            </div>

            {/* Google Login Wrapper */}
            <div className="flex justify-center transform hover:scale-[1.01] transition-transform">
              <GoogleLogin onSuccess={googleSuccess} onError={() => toast.error("Google Login Failed")} theme="outline" shape="pill" />
            </div>
          </form>

          {/* Create Account Link Footer */}
          <div className="mt-8 text-center relative z-10 border-t border-gray-100 pt-6">
            <p className="text-gray-400 text-xs font-semibold">New to DTCEX?</p>
            <Link to="/register" className="text-orange-600 font-black uppercase text-xs tracking-wider hover:text-gray-950 mt-1.5 inline-block transition-colors">
              Create Master Account
            </Link>
          </div>

          {/* Security / Alert Status Logs */}
          <div className="mt-4 text-center">
            {remainingAttempts !== null && !lockTimer && (
              <div className="bg-red-50 text-red-600 py-1.5 px-3 rounded-lg text-[9px] font-bold inline-block border border-red-100 uppercase tracking-wider">
                Security Alert: {remainingAttempts} Attempts Left
              </div>
            )}
            {lockTimer && (
              <div className="bg-gray-950 text-red-400 py-1.5 px-3 rounded-lg text-[9px] font-bold inline-block animate-pulse uppercase tracking-wider border border-gray-800">
                System Locked: Retry In {lockTimer}s
              </div>
            )}
          </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;