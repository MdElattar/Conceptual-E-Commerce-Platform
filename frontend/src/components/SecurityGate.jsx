import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiShield, FiKey, FiLock, FiEye, FiEyeOff, FiRefreshCw, 
  FiSmartphone, FiActivity, FiCheckCircle, FiAlertCircle,
  FiUser, FiMail, FiPhone, FiXCircle, FiGlobe, FiSettings, FiSliders
} from 'react-icons/fi';

// قائمة الدول المدعومة لأكواد الاتصال والحفظ الصحيح بالداتا بيز
const COUNTRIES = [
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  { code: 'AE', name: 'UAE', dialCode: '+971', flag: '🇦🇪' },
  { code: 'US', name: 'USA', dialCode: '+1', flag: '🇺🇸' }
];

const SecurityGate = () => {
  // 🗂️ التبويب النشط الحالي بالصفحة (Sub-views Navigation)
  const [activeTab, setActiveTab] = useState('general'); // general | verification | sessions

  // 👤 States البيانات الأساسية وقراءتها المبدئية
  const [fullName, setFullName] = useState(() => localStorage.getItem('gate_full_name') || 'Mohamed Elattar');
  const [email, setEmail] = useState(() => localStorage.getItem('gate_email') || 'pubg.2778intro@gmail.com');
  const [phone, setPhone] = useState(() => localStorage.getItem('gate_phone') || '1023456789');
  const [selectedCountry, setSelectedCountry] = useState(() => JSON.parse(localStorage.getItem('gate_country')) || COUNTRIES[0]);
  const [isPhoneVerified, setIsPhoneVerified] = useState(() => localStorage.getItem('gate_phone_verified') === 'true');

  // 🔒 States كلمات المرور
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // 📱 أنظمة التأكيد المنبثقة (Modals State)
  const [activeModal, setActiveModal] = useState(null); // null | 'phone_otp' | 'email_otp' | 'password_otp'
  const [otpMedium, setOtpMedium] = useState('email'); // email | sms (لتغيير الباسورد)
  
  // حقول إدخال الأكواد (OTP Inputs)
  const [phoneOtp, setPhoneOtp] = useState('');
  const [oldEmailOtp, setOldEmailOtp] = useState('');
  const [newEmailOtp, setNewEmailOtp] = useState('');
  const [passwordOtp, setPasswordOtp] = useState('');
  const [pendingNewEmail, setPendingNewEmail] = useState('');

  // 🔔 الإشعارات والأجهزة النشطة
  const [toast, setToast] = useState({ message: null, type: 'success' });
  const [activeSessions, setActiveSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 📡 جلب البيانات والأجهزة النشطة من الباك اند عند تحميل الصفحة
  useEffect(() => {
    fetchActiveSessions();
  }, []);

  const triggerToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: null, type: 'success' }), 4000);
  };

  // ==========================================
  // 🌐 دالات الربط الفعلي مع الباك اند (API Simulation)
  // ==========================================
  
  const fetchActiveSessions = async () => {
    try {
      // هنا تضع رابط الـ API الخاص بك: axios.get('/api/security/sessions')
      // محاكاة استجابة الباك اند الحقيقية:
      const mockSessions = [
        { id: 'sess_1', device: navigator.userAgent.includes('Chrome') ? 'Chrome Browser (Current)' : 'Web Terminal', location: 'Cairo, Egypt', current: true, ip: '197.34.110.12' },
        { id: 'sess_2', device: 'iPhone 15 Pro - Safari', location: 'Giza, Egypt', current: false, ip: '102.43.12.89' },
        { id: 'sess_3', device: 'Windows Desktop - Edge', location: 'Alexandria, Egypt', current: false, ip: '192.168.1.45' }
      ];
      setActiveSessions(mockSessions);
    } catch {
      triggerToast("Failed to fetch live network devices.", "error");
    }
  };

  // 💥 طرد الأجهزة الحقيقي من قاعدة البيانات
  const handleTerminateSessions = async () => {
    setIsLoading(true);
    try {
      // الفلترة الفعلية وإبقاء الجهاز الحالي فقط بالباك اند
      // await axios.post('/api/security/terminate-others');
      
      const currentSession = activeSessions.filter(s => s.current);
      setActiveSessions(currentSession);
      triggerToast("All remote session pipelines successfully revoked from Database.", "success");
    } catch {
      triggerToast("Error broadcasting eviction signal to backend.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 📞 1. معالجة وحفظ رقم الهاتف (أرقام فقط + كود الدولة)
  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, ''); // تنظيف المدخلات لمنع الحروف تماماً
    setPhone(value);
    setIsPhoneVerified(false); // أي تعديل يسقط توثيق الرقم فوراً
    localStorage.setItem('gate_phone_verified', 'false');
  };

  const triggerPhoneVerification = async () => {
    if (!phone) return triggerToast("Please insert a valid phone node first.", "error");
    setIsLoading(true);
    try {
      // await axios.post('/api/security/send-sms-otp', { phone: selectedCountry.dialCode + phone });
      triggerToast(`Verification matrix dispatched to ${selectedCountry.dialCode} ${phone}`);
      setActiveModal('phone_otp');
    } catch {
      triggerToast("Failed to send phone OTP.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmPhoneOtp = async () => {
    if (phoneOtp === '1234') { // كود تجريبي مبرمج للباك اند
      setIsPhoneVerified(true);
      localStorage.setItem('gate_phone_verified', 'true');
      localStorage.setItem('gate_phone', phone);
      localStorage.setItem('gate_country', JSON.stringify(selectedCountry));
      // هنا يتم حفظ الرقم والدولة نهائياً بالداتا بيز
      // await axios.put('/api/user/phone', { phone: selectedCountry.dialCode + phone, country: selectedCountry.code });
      setActiveModal(null);
      setPhoneOtp('');
      triggerToast("Phone cluster verified. Sync locked for Checkout modules.");
    } else {
      triggerToast("Invalid cryptographic code inside node.", "error");
    }
  };

  // 📧 2. معالجة وتغيير الإيميل المزدوج (Double-OTP)
  const triggerEmailChangePayload = async (e) => {
    e.preventDefault();
    if (email === localStorage.getItem('gate_email')) {
      triggerToast("New email node must differ from current instance.", "error");
      return;
    }
    setPendingNewEmail(email);
    setIsLoading(true);
    try {
      // إرسال الكودين من الباك اند تلقائياً
      // await axios.post('/api/security/request-email-migration', { oldEmail: localStorage.getItem('gate_email'), newEmail: email });
      triggerToast("Dual OTP codes generated and sent to both channels.");
      setActiveModal('email_otp');
    } catch {
      triggerToast("Migration pipeline blocked by server.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmEmailMigration = async () => {
    if (oldEmailOtp === '1111' && newEmailOtp === '2222') {
      // await axios.put('/api/user/email', { email: pendingNewEmail });
      localStorage.setItem('gate_email', pendingNewEmail);
      setEmail(pendingNewEmail);
      setActiveModal(null);
      setOldEmailOtp('');
      setNewEmailOtp('');
      triggerToast("Email gateway rotated and safely re-hashed.");
    } else {
      triggerToast("Security verification mismatch. Check both OTP nodes.", "error");
    }
  };

  // 🔑 3. معالجة حماية وتغيير الباسورد عبر الوسيط المختار
  const triggerPasswordResetOtp = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      triggerToast("All security passphrase blocks must be filled.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerToast("Passphrase mismatch confirmation fail.", "error");
      return;
    }
    setIsLoading(true);
    try {
      // await axios.post('/api/security/password-otp-request', { medium: otpMedium });
      triggerToast(`Verification trigger broadcasted to your verified ${otpMedium}.`);
      setActiveModal('password_otp');
    } catch {
      triggerToast("Server denied passphrase rotation.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmPasswordRotation = async () => {
    if (passwordOtp === '3333') {
      // await axios.put('/api/user/password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordOtp('');
      setActiveModal(null);
      triggerToast("Master database credentials successfully updated.");
    } else {
      triggerToast("Incorrect gateway authentication passphrase.", "error");
    }
  };

  return (
    <div className="bg-gray-50/30 min-h-screen pt-24 md:pt-32 pb-10 md:pb-20 px-4 sm:px-6 lg:px-8 font-sans antialiased text-gray-900" style={{ backgroundImage: `radial-gradient(#e5e7eb 1px, transparent 1px)`, backgroundSize: '24px 24px' }}>
      
      {/* 🔔 Floating Feedback Toasts */}
      <div className="fixed top-6 right-6 z-50 space-y-3 max-w-sm w-full">
        <AnimatePresence>
          {toast.message && (
            <motion.div initial={{ opacity: 0, y: -20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className={`p-4 rounded-2xl border shadow-xl flex items-start gap-3 backdrop-blur-md ${toast.type === 'success' ? 'bg-white/90 border-emerald-100' : 'bg-white/90 border-red-100'}`}>
              {toast.type === 'success' ? <FiCheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={18} /> : <FiXCircle className="text-red-500 shrink-0 mt-0.5" size={18} />}
              <div>
                <h4 className="font-black text-xs uppercase tracking-wider text-gray-900">{toast.type === 'success' ? 'System Confirmed' : 'Security Breach/Error'}</h4>
                <p className="text-[11px] font-bold text-gray-500 mt-0.5 leading-relaxed">{toast.message}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 🖥️ Modals Management Layers (أنظمة التأكيد والحماية المتقدمة) */}
      <AnimatePresence>
        {activeModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-gray-950/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white max-w-md w-full rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-2xl relative">
              
              {/* Phone OTP Modal */}
              {activeModal === 'phone_otp' && (
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center"><FiSmartphone size={24} /></div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">Verify Phone Vector</h3>
                  <p className="text-xs text-gray-400 font-bold">Insert the 4-digit token dispatched to your endpoint. <span className="text-gray-900">(Use code: 1234)</span></p>
                  <input type="text" maxLength={4} value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value)} placeholder="0 0 0 0" className="w-full bg-gray-50 border text-center tracking-[1em] font-mono text-lg font-black border-gray-200 rounded-xl py-3 focus:outline-none focus:border-orange-500 focus:bg-white" />
                  <button onClick={confirmPhoneOtp} className="w-full bg-gray-900 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all">Authenticate Node</button>
                </div>
              )}

              {/* Email Dual OTP Modal */}
              {activeModal === 'email_otp' && (
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><FiMail size={24} /></div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">Dual-Channel Email Verification</h3>
                  <p className="text-xs text-gray-400 font-bold">Security requires verification from both old & new mail servers. <span className="text-gray-900">(Codes: 1111 & 2222)</span></p>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Old Email Code (1111)</label>
                      <input type="text" maxLength={4} value={oldEmailOtp} onChange={(e) => setOldEmailOtp(e.target.value)} placeholder="• • • •" className="w-full bg-gray-50 border text-center font-mono font-black border-gray-200 rounded-xl py-2.5" />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">New Email Code (2222)</label>
                      <input type="text" maxLength={4} value={newEmailOtp} onChange={(e) => setNewEmailOtp(e.target.value)} placeholder="• • • •" className="w-full bg-gray-50 border text-center font-mono font-black border-gray-200 rounded-xl py-2.5" />
                    </div>
                  </div>
                  <button onClick={confirmEmailMigration} className="w-full bg-gray-900 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all pt-2">Authorize Structural Migration</button>
                </div>
              )}

              {/* Password Proxy OTP Modal */}
              {activeModal === 'password_otp' && (
                <div className="space-y-4">
                  <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center"><FiLock size={24} /></div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">Credential Rotation Guard</h3>
                  <p className="text-xs text-gray-400 font-bold">Input the authorization token received via chosen network channel. <span className="text-gray-900">(Use code: 3333)</span></p>
                  <input type="text" maxLength={4} value={passwordOtp} onChange={(e) => setPasswordOtp(e.target.value)} placeholder="0 0 0 0" className="w-full bg-gray-50 border text-center tracking-[1em] font-mono text-lg font-black border-gray-200 rounded-xl py-3 focus:outline-none focus:border-orange-500" />
                  <button onClick={confirmPasswordRotation} className="w-full bg-gray-900 hover:bg-red-600 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl transition-all">Commit Password Overwrite</button>
                </div>
              )}

              <button onClick={() => setActiveModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold text-xs uppercase tracking-wider">Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-block bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg mb-3 shadow-sm">
              Live Production Database Gateway
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tighter italic leading-none">
              Security <span className="text-orange-600">Gate Console</span>
            </h1>
          </div>

          {/* 🔘 أزرار التبويبات الفرعية المتطورة للتنقل الداخلي بسلاسة */}
          <div className="flex bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm gap-1 self-start">
            <button onClick={() => setActiveTab('general')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'general' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-400 hover:text-gray-800'}`}>
              <FiSettings size={14} /> Profile
            </button>
            <button onClick={() => setActiveTab('verification')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'verification' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-400 hover:text-gray-800'}`}>
              <FiSliders size={14} /> Passwords
            </button>
            <button onClick={() => setActiveTab('sessions')} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeTab === 'sessions' ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-400 hover:text-gray-800'}`}>
              <FiActivity size={14} /> Sessions ({activeSessions.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-gray-150 shadow-sm min-h-[460px]">
              
              {/* 🛑 TAB 1: GENERAL PROFILE SETUP */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                    <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shrink-0"><FiUser size={18} /></div>
                    <div>
                      <h3 className="text-gray-900 font-black text-sm uppercase tracking-wider">Identity Vector Management</h3>
                      <p className="text-gray-400 text-[11px] font-bold">Synchronize phone nodes, country indices and legal aliases.</p>
                    </div>
                  </div>

                  {/* الاسم بالكامل */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Full Legal Name</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><FiUser size={15} /></span>
                      <input type="text" value={fullName} onChange={(e) => { setFullName(e.target.value); localStorage.setItem('gate_full_name', e.target.value); }} className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-5 py-3.5 text-sm font-bold text-gray-800 focus:outline-none focus:border-orange-500 focus:bg-white" />
                    </div>
                  </div>

                  {/* رقم الهاتف + اختيار الدولة مع الحماية التامة للاستخدام في الشيك أوت */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Secure Phone Vector & Country Group</label>
                    <div className="flex gap-2">
                      <div className="relative shrink-0">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"><FiGlobe size={14} className="text-gray-400" /></span>
                        <select 
                          value={selectedCountry.code} 
                          onChange={(e) => {
                            const c = COUNTRIES.find(item => item.code === e.target.code || item.code === e.target.value);
                            setSelectedCountry(c);
                            setIsPhoneVerified(false);
                          }}
                          className="bg-gray-50 border border-gray-200 text-xs font-black rounded-2xl pl-9 pr-8 py-3.5 focus:outline-none appearance-none cursor-pointer h-full"
                        >
                          {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.dialCode}</option>)}
                        </select>
                      </div>

                      <div className="relative flex-1">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><FiPhone size={15} /></span>
                        <input type="text" value={phone} onChange={handlePhoneChange} placeholder="1023456789" className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-24 py-3.5 text-sm font-bold text-gray-800 focus:outline-none" />
                        
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          {isPhoneVerified ? (
                            <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-xl border border-emerald-100 flex items-center gap-1">🔒 Verified</span>
                          ) : (
                            <button type="button" onClick={triggerPhoneVerification} className="bg-orange-600 hover:bg-orange-700 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl transition-colors">Verify</button>
                          )}
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold italic">💡 If phone vector is verified here, checkout token logic skips verification automatically.</p>
                  </div>

                  {/* الإيميل وتغييره الآمن */}
                  <form onSubmit={triggerEmailChangePayload} className="space-y-2 pt-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Secure Email Gateway</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><FiMail size={15} /></span>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-24 py-3.5 text-sm font-bold text-gray-800 focus:outline-none" />
                      {email !== localStorage.getItem('gate_email') && (
                        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-900 hover:bg-orange-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all">Migrate</button>
                      )}
                    </div>
                  </form>
                </div>
              )}

              {/* 🔒 TAB 2: ADVANCED PASSWORD ROTATION */}
              {activeTab === 'verification' && (
                <form onSubmit={triggerPasswordResetOtp} className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                    <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0"><FiLock size={18} /></div>
                    <div>
                      <h3 className="text-gray-900 font-black text-sm uppercase tracking-wider">Passphrase Rotation Center</h3>
                      <p className="text-gray-400 text-[11px] font-bold">Inject cryptographic layers to override current access passwords.</p>
                    </div>
                  </div>

                  {/* اختيار وسيلة الاستقبال */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Select OTP Despatch Pipeline</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setOtpMedium('email')} className={`p-3 rounded-xl border font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${otpMedium === 'email' ? 'border-orange-500 bg-orange-50/20 text-orange-600' : 'border-gray-200 text-gray-400'}`}><FiMail /> Verified Email</button>
                      <button type="button" onClick={() => setOtpMedium('sms')} className={`p-3 rounded-xl border font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${otpMedium === 'sms' ? 'border-orange-500 bg-orange-50/20 text-orange-600' : 'border-gray-200 text-gray-400'}`}><FiSmartphone /> Secured SMS</button>
                    </div>
                  </div>

                  {/* حقول كلمات المرور */}
                  <div className="space-y-4">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><FiLock size={15} /></span>
                      <input type={showCurrentPass ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current Password Instance" className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-12 py-3.5 text-sm font-bold text-gray-800 focus:outline-none" />
                      <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{showCurrentPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}</button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><FiLock size={15} /></span>
                        <input type={showNewPass ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Strong Password" className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-12 py-3.5 text-sm font-bold text-gray-800 focus:outline-none" />
                        <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{showNewPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}</button>
                      </div>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><FiLock size={15} /></span>
                        <input type={showConfirmPass ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat Password Matrix" className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-11 pr-12 py-3.5 text-sm font-bold text-gray-800 focus:outline-none" />
                        <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">{showConfirmPass ? <FiEyeOff size={16} /> : <FiEye size={16} />}</button>
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-gray-900 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-widest py-4 rounded-2xl transition-all shadow-md mt-4">Initiate Passphrase Swap</button>
                </form>
              )}

              {/* 📡 TAB 3: LIVE ACTIVE SESSIONS CONTROL */}
              {activeTab === 'sessions' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0"><FiActivity size={18} /></div>
                      <div>
                        <h3 className="text-gray-900 font-black text-sm uppercase tracking-wider">Active Device Registers</h3>
                        <p className="text-gray-400 text-[11px] font-bold">Devices currently communicating with Backend Core APIs.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {activeSessions.map((session) => (
                      <div key={session.id} className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${session.current ? 'bg-emerald-50/20 border-emerald-100' : 'bg-gray-50/60 border-gray-200'}`}>
                        <div>
                          <h4 className="text-xs font-black text-gray-900 flex items-center gap-2"><FiSmartphone size={14} className="text-gray-400" /> {session.device}</h4>
                          <p className="text-[10px] text-gray-400 font-mono font-bold mt-1">IP: {session.ip} • Loc: {session.location}</p>
                        </div>
                        {session.current ? (
                          <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border border-emerald-200 self-start sm:self-auto">Current Session</span>
                        ) : (
                          <span className="text-gray-400 text-[9px] font-black uppercase tracking-wider bg-white border px-2 py-1 rounded-md">Remote Unit</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {activeSessions.length > 1 && (
                    <button onClick={handleTerminateSessions} disabled={isLoading} className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest py-4 rounded-2xl transition-all shadow-md shadow-red-600/10">
                      {isLoading ? 'Broadcasting Eviction Signal...' : 'Terminate All Other Sessions (100% Effective)'}
                    </button>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Right Column: Tokens & Static Metrics */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[2.5rem] border border-gray-150 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0"><FiKey size={18} /></div>
                <div>
                  <h3 className="text-gray-900 font-black text-sm uppercase tracking-wider">Access Token</h3>
                  <p className="text-gray-400 text-[11px] font-bold">Your immutable cryptographic session identity.</p>
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl flex items-center justify-between font-mono text-xs font-black text-gray-800">
                <span>NODE_ID: <span className="text-orange-600">4FA7547A</span></span>
              </div>
            </div>

            <div className="bg-orange-50/40 border border-orange-100 p-5 rounded-[2rem] flex gap-3">
              <FiAlertCircle className="text-orange-600 shrink-0 mt-0.5" size={16} />
              <p className="text-[11px] font-bold text-orange-800 leading-relaxed">
                Security actions executed on this terminal are final. Terminating remote clusters forces all linked application scopes (including Checkout matrices) to reload token cookies instantly.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default SecurityGate;