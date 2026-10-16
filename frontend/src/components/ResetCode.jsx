import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaShieldAlt, FaSyncAlt, FaArrowRight, FaMicrochip } from 'react-icons/fa';
import Button from './Button';

const ResetCode = () => {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email; 
    const [timer, setTimer] = useState(60);

    useEffect(() => {
        if (!email) {
            toast.error("Session missing. Restart recovery.");
            navigate('/forgot-password');
        }
    }, [email, navigate]);

    useEffect(() => {
        if (timer > 0) {
            const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
            return () => clearInterval(interval);
        }
    }, [timer]);

    const handleResend = async () => {
        try {
            await axios.post('/api/users/forgot-password', { email });
            toast.success("New code transmitted successfully");
            setTimer(60);
            setOtp(new Array(6).fill(""));
        } catch {
            toast.error("Transmission failed. Try again.");
        }
    };

    const handleChange = (value, index) => {
        if (isNaN(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        // Auto-focus next
        if (value && index < 5) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const code = otp.join('');
        setIsLoading(true);
        try {
            const { data } = await axios.post('/api/users/verify-reset-code', {
                email,
                otp: code
            });
            if (data.success) {
                toast.success("Security clearance granted");
                navigate('/new-password', { state: { email } });
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Invalid or expired security code");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-24 antialiased">
            <div className="max-w-md w-full bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-gray-200 text-center relative overflow-hidden">
                
                {/* Top Tech Border Indicator */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>

                <div className="text-center mb-8">
                    {/* Icon Unit */}
                    <div className="bg-orange-50 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-6 border border-orange-100 shadow-sm">
                        <FaShieldAlt className="text-orange-600 text-xl" />
                    </div>
                    
                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">
                        Verify <span className="text-orange-600">Code</span>
                    </h2>
                    
                    <div className="flex items-center justify-center gap-1.5 mt-2 mb-4 opacity-60">
                        <FaMicrochip className="text-orange-500 text-[10px]" />
                        <p className="text-gray-400 font-bold text-[9px] uppercase tracking-wider">Verification Terminal</p>
                    </div>

                    <p className="text-gray-500 font-medium text-xs leading-relaxed px-2">
                        Security code successfully dispatched to:<br/>
                        <span className="text-gray-900 lowercase font-bold tracking-normal block mt-1 bg-gray-50 py-1.5 px-3 rounded-lg border border-gray-100 break-all">{email}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* OTP Inputs */}
                    <div className="flex justify-center gap-2" dir="ltr">
                        {otp.map((data, index) => (
                            <input
                                id={`otp-${index}`}
                                key={index}
                                type="text"
                                inputMode="numeric"
                                maxLength="1"
                                className="w-11 h-14 bg-gray-50 border border-gray-200 rounded-xl text-center text-xl font-black text-gray-900 focus:bg-white focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                                value={data}
                                onChange={e => handleChange(e.target.value, index)}
                                onKeyDown={e => handleKeyDown(e, index)}
                            />
                        ))}
                    </div>

                    {/* Signal Status Info Box */}
                    <div className="bg-gray-50 border border-gray-100 py-3 px-4 rounded-xl flex items-center justify-between">
                        <span className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">Signal Pulse</span>
                        {timer > 0 ? (
                            <span className="text-orange-600 font-bold text-xs uppercase tracking-wider">
                                Retry in {timer}s
                            </span>
                        ) : (
                            <Button
                                type="button"
                                variant="link"
                                onClick={handleResend}
                                className="font-black text-xs uppercase tracking-wider"
                            >
                                <FaSyncAlt size={9} /> Resend Now
                            </Button>
                        )}
                    </div>

                    {/* Action Button */}
                    <Button
                        type="submit"
                        variant="primary"
                        size="full"
                        disabled={isLoading || otp.includes('')}
                        className="uppercase tracking-wider text-xs"
                    >
                        {isLoading ? "Validating Signal..." : (
                            <span className="flex items-center justify-center gap-2">
                                Confirm Code <FaArrowRight size={10} />
                            </span>
                        )}
                    </Button>
                </form>

                <p className="mt-8 text-[9px] text-gray-300 font-bold uppercase tracking-widest">
                    DTCEX Cryptographic Validation
                </p>
            </div>
        </div>
    );
};

export default ResetCode;