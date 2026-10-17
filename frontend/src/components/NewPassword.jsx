import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axios';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaLock, FaShieldAlt, FaKey, FaMicrochip } from 'react-icons/fa';
import Button from './Button';

const NewPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [strength, setStrength] = useState({ label: '', color: 'bg-gray-200', width: '0%', textClass: 'text-gray-400' });

    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    useEffect(() => {
        if (!email) {
            toast.error("Access denied. Please restart the process.");
            navigate('/forgot-password');
        }
    }, [email, navigate]);

    const checkStrength = (pass) => {
        const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!\%*?&]{8,}$/;
        if (pass.length === 0) {
            setStrength({ label: '', color: 'bg-gray-200', width: '0%', textClass: 'text-gray-400' });
        } else if (strongRegex.test(pass)) {
            setStrength({ label: 'Maximum Security (Strong)', color: 'bg-green-500', width: '100%', textClass: 'text-green-600' });
        } else if (pass.length >= 6) {
            setStrength({ label: 'Medium: Add symbols & uppercase', color: 'bg-amber-500', width: '60%', textClass: 'text-amber-600' });
        } else {
            setStrength({ label: 'Critical: Too short', color: 'bg-red-500', width: '30%', textClass: 'text-red-500' });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            return toast.error("Key mismatch! Passwords do not match.");
        }

        if (password.length < 6) {
            return toast.warning("Password too weak for industrial standards.");
        }

        setIsLoading(true);
        try {
            const { data } = await axiosInstance.post('/api/users/reset-password', {
                email,
                password
            });
            if (data.success) {
                toast.success("Security Key Updated! Access Granted.");
                navigate('/login');
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Transmission error. Try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-24 antialiased">
            <div className="max-w-md w-full bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
                
                {/* Top Tech Border Indicator */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>

                {/* Visual Identity */}
                <div className="text-center mb-8">
                    {/* Icon Unit */}
                    <div className="bg-orange-50 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-6 border border-orange-100 shadow-sm">
                        <FaKey className="text-orange-600 text-xl" />
                    </div>
                    
                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">
                        Set New <span className="text-orange-600">Key</span>
                    </h2>
                    
                    <div className="flex items-center justify-center gap-1.5 mt-2 mb-4 opacity-60">
                        <FaMicrochip className="text-orange-500 text-[10px]" />
                        <p className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Access Core Terminal</p>
                    </div>

                    <p className="text-gray-500 font-medium text-xs leading-relaxed px-2">
                        Initialize secure access credentials for: <br/>
                        <span className="text-gray-900 lowercase font-bold tracking-normal block mt-1 bg-gray-50 py-1.5 px-3 rounded-lg border border-gray-100 break-all">{email}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* New Password Field */}
                    <div className="space-y-1.5">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider ml-1">New Password</label>
                        <div className="relative group">
                            <FaLock size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors z-10"/>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="w-full pl-10 pr-12 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none font-semibold text-sm transition-all text-gray-900"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); checkStrength(e.target.value); }} 
                            />
                            <button
                                type="button"
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors z-10 p-1"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <FaEyeSlash size={14}/> : <FaEye size={14}/>}
                            </button>
                        </div>
                        
                        {/* Strength Meter UI */}
                        {password && (
                            <div className="px-1 pt-1">
                                <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-500 ease-out ${strength.color}`} 
                                        style={{ width: strength.width }}
                                    ></div>
                                </div>
                                <p className={`text-[9px] font-bold uppercase mt-1 tracking-wider ${strength.textClass}`}>
                                    {strength.label}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Confirm Password Field */}
                    <div className="space-y-1.5">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider ml-1">Confirm Identity Key</label>
                        <div className="relative group">
                            <FaShieldAlt size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors z-10"/>
                            <input
                                type={showPassword ? "text" : "password"}
                                required
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none font-semibold text-sm transition-all text-gray-900"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Submit Action Button */}
                    <Button
                        type="submit"
                        variant="primary"
                        size="full"
                        disabled={isLoading || !password}
                        className="uppercase tracking-wider text-xs mt-2"
                    >
                        {isLoading ? "Synchronizing..." : "Overwrite Security Key"}
                    </Button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest">
                        Industrial Grade Encryption Active
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NewPassword;