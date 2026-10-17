import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from '../slices/authSlice';
import axiosInstance from '../utils/axios';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from "jwt-decode";
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash, FaUser, FaEnvelope, FaLock, FaPhoneAlt, FaMicrochip } from 'react-icons/fa';

const RegisterScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [strength, setStrength] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { search } = useLocation();
  const redirect = new URLSearchParams(search).get('redirect') || '/';
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    if (userInfo) navigate(redirect);
  }, [navigate, redirect, userInfo]);

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    if (val.length === 0) setStrength('');
    else if (val.length < 8) setStrength('Weak');
    else if (val.match(/[A-Z]/) && val.match(/[0-9]/) && val.match(/[@$!%*?&]/)) setStrength('Strong');
    else setStrength('Medium');
  };

  const googleSuccess = async (credentialResponse) => {
    try {
      const details = jwtDecode(credentialResponse.credential);
      const { data } = await axiosInstance.post('/api/users/google', {
        name: details.name, email: details.email, image: details.picture
      });
      dispatch(setCredentials({ ...data }));
      toast.success("Welcome aboard!");
      navigate('/');
    } catch {
      toast.error("Google Registration Failed");
    }
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return toast.error('Passwords do not match');

    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!\%*?&]{8,}$/;
    if (!strongPasswordRegex.test(password)) return toast.error("Security Level Low: Follow password requirements.");

    setIsLoading(true);
    try {
      await axiosInstance.post('/api/users', { name, email, phone , password });
      localStorage.setItem('verifyEmail', email);
      navigate('/verify', { state: { email } });
      toast.info('Verification code dispatched to your email');
    } catch (err) {
      toast.error(err?.response?.data?.message || "Registration Failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-24 antialiased">
      <div className="w-full max-w-md bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
        
        {/* Top Tech Border Indicator */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />

        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">
            Join the <span className="text-orange-600">Fleet</span>
          </h1>
          <div className="flex items-center justify-center gap-1.5 mt-2 opacity-60">
            <FaMicrochip className="text-orange-500 text-[10px]" />
            <p className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Register Industrial Profile</p>
          </div>
        </div>

        <form onSubmit={submitHandler} className="space-y-4">
          
          {/* Full Name Input */}
          <div className="relative group">
            <FaUser size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
            <input type="text" placeholder="Full Name" required className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none font-semibold text-sm text-gray-900 transition-all" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {/* Email Input */}
          <div className="relative group">
            <FaEnvelope size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
            <input type="email" placeholder="Email Address" required className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none font-semibold text-sm text-gray-900 transition-all" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          {/* Phone Input */}
          <div className="relative group">
            <FaPhoneAlt size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
            <input
              type="tel"
              placeholder="Phone Number (01xxxxxxxxx)"
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none font-semibold text-sm text-gray-900 transition-all"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* Master Password Input */}
          <div className="relative group">
            <FaLock size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
            <input type={showPassword ? "text" : "password"} placeholder="Master Password" required className="w-full pl-10 pr-12 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none font-semibold text-sm text-gray-900 transition-all" value={password} onChange={handlePasswordChange} />
            <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors p-1" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
            </button>
          </div>

          {/* Password Strength Logs Tracker */}
          {password && (
            <div className="px-1">
              <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden flex">
                <div className={`h-full transition-all duration-500 ${strength === 'Weak' ? 'w-1/3 bg-red-500' : strength === 'Medium' ? 'w-2/3 bg-amber-500' : 'w-full bg-green-500'}`}></div>
              </div>
              <p className={`text-[9px] font-bold uppercase mt-1 tracking-wider ${strength === 'Weak' ? 'text-red-500' : strength === 'Medium' ? 'text-amber-500' : 'text-green-500'}`}>
                Security Level: {strength}
              </p>
            </div>
          )}

          {/* Confirm Password Input */}
          <div className="relative group">
            <FaLock size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" />
            <input type={showPassword ? "text" : "password"} placeholder="Confirm Master Password" required className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none font-semibold text-sm text-gray-900 transition-all" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>

          {/* Submit Action Button */}
          <button type="submit" disabled={isLoading} className="w-full bg-orange-600 text-white font-bold py-3.5 rounded-xl shadow-sm hover:bg-gray-950 transition-all uppercase tracking-wider text-xs mt-2">
            {isLoading ? 'Creating Account...' : 'Initialize Profile'}
          </button>

          {/* Divider */}
          <div className="relative py-2 flex items-center">
            <div className="flex-grow border-t border-gray-100"></div>
            <span className="mx-3 text-gray-300 text-[9px] font-black uppercase tracking-widest">or register via</span>
            <div className="flex-grow border-t border-gray-100"></div>
          </div>

          {/* Google Register Button Wrapper */}
          <div className="flex justify-center transform hover:scale-[1.01] transition-transform">
            <GoogleLogin onSuccess={googleSuccess} onError={() => toast.error("Google Auth Failed")} theme="outline" shape="pill" />
          </div>
        </form>

        {/* Existing Member Footer Login Redirect */}
        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-gray-400 text-xs font-semibold">Already a member?</p>
          <Link to="/login" className="text-orange-600 font-black uppercase text-xs tracking-wider hover:text-gray-950 mt-1.5 inline-block transition-colors">
            Sign In to Fleet
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterScreen;