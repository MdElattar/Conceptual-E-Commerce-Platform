import { useState, useEffect } from 'react';
import { useSendPhoneOtpMutation, useVerifyPhoneOtpMutation } from '../slices/usersApiSlice';
import { FaPhoneAlt, FaLock, FaCheckCircle, FaSpinner } from 'react-icons/fa';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import Button from './Button';

const PhoneVerifier = ({ userPhoneStatus, onVerificationSuccess }) => {
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+20'); // الافتراضي مصر
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);

  const [sendPhoneOtp, { isLoading: isSending }] = useSendPhoneOtpMutation();
  const [verifyPhoneOtp, { isLoading: isVerifying }] = useVerifyPhoneOtpMutation();

  // تريكة مؤقت إعادة الإرسال (Cooldown Timer) لحماية باقة الـ SMS
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // دالة طلب إرسال الكود
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone) return toast.error('برجاء إدخال رقم الهاتف أولاً');

    // دمج رمز الدولة مع الرقم المدخل وتأمين الصيغة القياسية
    const fullFormattedPhone = `${countryCode}${phone.replace(/^0+/, '')}`; 

    try {
      const res = await sendPhoneOtp({ phone: fullFormattedPhone }).unwrap();
      toast.success(res.message || 'تم إرسال كود التحقق بنجاح');
      setIsOtpSent(true);
      setTimer(60); // قفل الزر لمدة 60 ثانية
    } catch (err) {
      toast.error(err?.data?.message || err.error || 'فشل إرسال الكود');
    }
  };

  // دالة مطابقة الكود وتأكيده
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return toast.error('برجاء إدخال كود الـ OTP المكون من 6 أرقام');

    try {
      const res = await verifyPhoneOtp({ otp }).unwrap();
      toast.success('تم توثيق رقم الهاتف بنجاح ✅');
      if (onVerificationSuccess) onVerificationSuccess();
    } catch (err) {
      toast.error(err?.data?.message || err.error || 'الكود غير صحيح أو انتهت صلاحيته');
    }
  };

  return (
    <div className="bg-white border border-zinc-100 rounded-3xl p-6 shadow-[0_10px_30px_rgba(0,0,0,0.02)] max-w-md mx-auto text-right" dir="rtl">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-orange-50 text-orange-600 p-3 rounded-xl">
          <FaPhoneAlt size={18} />
        </div>
        <div>
          <h3 className="font-black text-zinc-900 text-lg tracking-tight">توثيق رقم الهاتف الدولي</h3>
          <p className="text-zinc-400 text-xs mt-0.5">مطلوب لتأكيد وتأمين الشحن والدعم الفني للطلب</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isOtpSent ? (
          /* الشاشة الأولى: إدخال الهاتف واختيار الدولة */
          <motion.form 
            key="phone-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleSendOtp} 
            className="space-y-4"
          >
            <div className="flex gap-2">
              {/* قائمة الدول الأكثر استخداماً كمثال احترافي للمواقع الدولية */}
              <select 
                value={countryCode} 
                onChange={(e) => setCountryCode(e.target.value)}
                className="bg-zinc-50 border border-zinc-200 text-zinc-800 font-bold text-xs rounded-xl px-2 focus:outline-none focus:border-orange-500 font-mono"
              >
                <option value="+20">🇪🇬 +20</option>
                <option value="+966">🇸🇦 +966</option>
                <option value="+971">🇦🇪 +971</option>
                <option value="+965">🇰🇼 +965</option>
                <option value="+1">🇺🇸 +1</option>
              </select>

              <div className="relative flex-1">
                <input 
                  type="tel" 
                  placeholder="10XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))} // يقبل أرقام فقط لراحة العميل
                  required
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3.5 pr-4 pl-10 font-mono text-sm focus:outline-none focus:border-orange-500 text-zinc-900"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="full"
              disabled={isSending || timer > 0}
              className="text-xs uppercase tracking-wider"
            >
              {isSending ? <FaSpinner className="animate-spin" /> : 'إرسال كود التفعيل عبر SMS'}
            </Button>
          </motion.form>
        ) : (
          /* الشاشة الثانية: إدخال كود الـ OTP بعد نجاح الإرسال */
          <motion.form 
            key="otp-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleVerifyOtp} 
            className="space-y-4"
          >
            <div className="text-center p-3 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200 mb-2">
              <span className="text-xs font-bold text-zinc-500">تم إرسال الكود المكون من 6 أرقام إلى الرقم المختم بـ:</span>
              <div className="text-sm font-black text-zinc-800 font-mono mt-1" dir="ltr">{countryCode} ***{phone.slice(-4)}</div>
            </div>

            <div className="relative">
              <input 
                type="text" 
                maxLength="6"
                placeholder="أدخل كود الـ OTP المكون من 6 أرقام"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3.5 px-4 font-mono text-center text-lg tracking-[0.5em] font-black focus:outline-none focus:border-emerald-500 text-zinc-900 placeholder:tracking-normal placeholder:text-xs placeholder:font-sans"
              />
              <FaLock className="absolute right-4 top-4 text-zinc-300" size={14} />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={timer > 0 || isSending}
                onClick={handleSendOtp}
                className="w-1/2 text-xs"
              >
                {timer > 0 ? `إعادة الإرسال بعد (${timer}ث)` : 'إعادة إرسال الكود'}
              </Button>
              
              <Button
                type="submit"
                variant="success"
                disabled={isVerifying}
                className="w-1/2 text-xs"
              >
                {isVerifying ? <FaSpinner className="animate-spin" /> : 'تأكيد الرمز وبدء التوثيق'}
              </Button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhoneVerifier;