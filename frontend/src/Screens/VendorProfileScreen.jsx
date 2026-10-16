import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { 
  FaStore, FaCamera, FaEnvelope, FaPhoneAlt, 
  FaCheckCircle, FaExclamationTriangle, FaUniversity,
  FaShieldAlt, FaIdCard, FaFileContract, FaBuilding, 
  FaRegCreditCard, FaMoneyCheckAlt, FaInfoCircle, FaSpinner, FaGlobe,
  FaLock, FaStripeS, FaUserSecret, FaHourglassHalf
} from 'react-icons/fa';
import { useGetProfileQuery, useProfileMutation } from '../slices/usersApiSlice';
import { setCredentials } from '../slices/authSlice';

const countryCodes = [
  { code: '+20', country: 'EG' },
  { code: '+966', country: 'SA' },
  { code: '+971', country: 'AE' },
  { code: '+1', country: 'US/CA' },
  { code: '+44', country: 'UK' },
  { code: '+965', country: 'KW' },
  { code: '+974', country: 'QA' },
  { code: '+49', country: 'DE' }
];

const VendorProfileScreen = () => {
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);
  
  // API Hooks
  const { data: profile, isLoading, refetch } = useGetProfileQuery(undefined, { skip: !userInfo });
  const [updateProfile, { isLoading: isUpdating }] = useProfileMutation();

  // Local State: Profile Details
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [email, setEmail] = useState('');
  const [phoneCode, setPhoneCode] = useState('+20');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Local State: Financial & Routing
  const [payoutGateway, setPayoutGateway] = useState('BankTransfer');
  const [bankName, setBankName] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [iban, setIban] = useState('');

  // UI States
  const [activeFormTab, setActiveFormTab] = useState('general');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  
  // 🌟 كشف قفل الحساب: هل توجد مراجعة معلقة من الأدمن؟
  const isProfileLocked = profile?.vendorProfile?.auditStatus === 'Pending';

  // 🌟 تهيئة الفورم من بيانات البروفايل عند تحميلها
  const [prevProfileId, setPrevProfileId] = useState(null);
  if (profile && profile._id !== prevProfileId) {
    setPrevProfileId(profile._id);
    const displayData = isProfileLocked && profile.vendorProfile?.pendingEdits 
      ? profile.vendorProfile.pendingEdits 
      : profile;

    setStoreName(displayData.vendorProfile?.storeName || displayData.storeName || profile.vendorProfile?.storeName || '');
    setStoreDescription(displayData.vendorProfile?.storeDescription || displayData.storeDescription || profile.vendorProfile?.storeDescription || '');
    setEmail(displayData.email || profile.email || '');
    
    const phoneToParse = displayData.phone || profile.phone;
    if (phoneToParse) {
      const foundCode = countryCodes.find(c => phoneToParse.startsWith(c.code));
      if (foundCode) {
        setPhoneCode(foundCode.code);
        setPhoneNumber(phoneToParse.slice(foundCode.code.length).trim());
      } else {
        setPhoneNumber(phoneToParse);
      }
    }
    
    const bankData = displayData.vendorProfile?.bankAccount || displayData.bankAccount || profile.vendorProfile?.bankAccount;
    if (bankData) {
      setPayoutGateway(displayData.vendorProfile?.payoutGateway || displayData.payoutGateway || profile.vendorProfile?.payoutGateway || 'BankTransfer');
      setBankName(bankData.bankName || '');
      setAccountHolderName(bankData.accountHolderName || '');
      setAccountNumber(bankData.accountNumber || '');
      setRoutingNumber(bankData.routingNumber || '');
      setIban(bankData.iban || '');
    }
  }

  // 🌟 فحص التغييرات ومقارنتها بالبيانات الأصلية لطلب موافقة الأدمن
  const needsAdminReview = useMemo(() => {
    if (!profile || isProfileLocked) return false;
    
    const fullPhone = `${phoneCode}${phoneNumber.replace(/\s+/g, '')}`;
    const origPhone = profile.phone || '';
    
    const generalChanged = 
      storeName !== (profile.vendorProfile?.storeName || '') ||
      storeDescription !== (profile.vendorProfile?.storeDescription || '') ||
      email !== (profile.email || '') ||
      fullPhone !== origPhone;

    const finChanged = 
      payoutGateway !== (profile.vendorProfile?.payoutGateway || 'BankTransfer') ||
      bankName !== (profile.vendorProfile?.bankAccount?.bankName || '') ||
      accountHolderName !== (profile.vendorProfile?.bankAccount?.accountHolderName || '') ||
      accountNumber !== (profile.vendorProfile?.bankAccount?.accountNumber || '') ||
      routingNumber !== (profile.vendorProfile?.bankAccount?.routingNumber || '') ||
      iban !== (profile.vendorProfile?.bankAccount?.iban || '');

    return generalChanged || finChanged;
  }, [storeName, storeDescription, email, phoneNumber, phoneCode, payoutGateway, bankName, accountHolderName, accountNumber, routingNumber, iban, profile, isProfileLocked]);

  // 🌟 معالجة ذكية وتنسيق تلقائي للـ IBAN بمسافات بصرية مريحة
  const handleIbanChange = (e) => {
    let rawValue = e.target.value.replace(/\s+/g, '').toUpperCase();
    if (rawValue.length <= 34) {
      const formatted = rawValue.match(/.{1,4}/g)?.join(' ') || '';
      setIban(formatted);
    }
  };

  const executeUpdate = async () => {
    const fullPhone = `${phoneCode}${phoneNumber.replace(/\s+/g, '')}`;

    // تجميع مصفوفة التعديلات المعلقة بانتظار العبور (Admin Audit Access)
    const auditPayload = {
      _id: userInfo._id,
      requestAudit: true, 
      requestedChanges: {
        email,
        phone: fullPhone,
        vendorProfile: {
          storeName,
          storeDescription,
          payoutGateway,
          bankAccount: { bankName, accountHolderName, accountNumber, routingNumber, iban }
        }
      }
    };

    try {
      const res = await updateProfile(auditPayload).unwrap();
      dispatch(setCredentials({ ...res }));
      setIsAuditModalOpen(false);
      
      toast.success('Audit registration complete. Profile secured under validation lock.');
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || err.error || 'Audit request failed.');
    }
  };

  const submitHandler = (e) => {
    e.preventDefault();
    if (isProfileLocked) {
      toast.warning('Profile parameters are currently locked under evaluation.');
      return;
    }
    if (needsAdminReview) {
      setIsAuditModalOpen(true);
    } else {
      toast.info('No variable discrepancies detected.');
    }
  };

  const handleStripeConnect = () => {
    toast.info("Routing securely to Stripe Connect Verification Vault...");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4 shadow-lg"></div>
          <p className="text-zinc-500 font-black tracking-widest uppercase text-xs">Syncing Identity Node...</p>
        </div>
      </div>
    );
  }

  const isVerified = profile?.vendorProfile?.isVerified;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4 sm:px-6 lg:px-8 font-sans selection:bg-orange-500 selection:text-white">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Block */}
        <div className="mb-8 border-b border-gray-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tighter italic">
              Merchant <span className="text-orange-600">Identity</span>
            </h1>
            <p className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-widest flex items-center gap-2">
              <FaShieldAlt className="text-emerald-500" /> Secure Profile Management & Banking Audit
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 self-start md:self-auto">
            {isProfileLocked && (
              <div className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center gap-2 shadow-sm animate-pulse">
                <FaHourglassHalf size={12} /> Pending Access Approval
              </div>
            )}
            <div className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase flex items-center gap-2 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isVerified ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isVerified ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              Status: {isVerified ? 'Active Verified Node' : 'Awaiting Settlement Clearence'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 relative">
          
          {/* Left Column: Metrics & Identification */}
          <div className="xl:col-span-4 space-y-6">
            
            {/* Store Branding Card ( المسافات مظبوطة بالملي لمنع التداخل ) */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm relative">
              <div className="h-32 bg-[#0B132B] relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
              </div>
              
              <div className="px-6 pb-6 relative pt-16 border-t border-gray-50">
                <div className="w-24 h-24 bg-white rounded-2xl border-4 border-white shadow-xl absolute -top-12 left-6 flex items-center justify-center overflow-hidden z-20">
                  {profile?.vendorProfile?.storeLogo ? (
                    <img src={profile.vendorProfile.storeLogo} alt="Store Logo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="bg-gradient-to-br from-orange-100 to-orange-50 w-full h-full flex items-center justify-center text-orange-600 font-black text-4xl uppercase">
                      {storeName ? storeName.charAt(0) : <FaStore />}
                    </div>
                  )}
                </div>
                
                <div>
                  <h2 className="text-xl font-black text-gray-900 truncate tracking-tight uppercase italic">
                    {storeName || 'UNNAMED TERMINAL'}
                  </h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] bg-gray-50 text-gray-400 font-mono font-bold px-2 py-0.5 rounded border border-gray-150">
                      ID: {profile?._id?.substring(0, 12).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Compliance Matrix Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-5 flex items-center gap-2 border-b border-gray-100 pb-3">
                <FaShieldAlt className="text-orange-500" size={14} /> Compliance Matrix
              </h3>
              
              {isVerified ? (
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                  <FaCheckCircle className="text-emerald-600 mt-0.5 shrink-0" size={16} />
                  <div>
                    <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wider">Audit Cleared</h4>
                    <p className="text-[10px] text-emerald-700 mt-1.5 font-bold leading-relaxed">Identity formally signed off. Automated escrow sweeps and liquidity mechanisms are online.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <FaExclamationTriangle className="text-amber-600 mt-0.5 shrink-0" size={16} />
                  <div>
                    <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider">Unverified State</h4>
                    <p className="text-[10px] text-amber-800 mt-1.5 font-bold leading-relaxed">Pending structural KYC profile completion. Payout pipelines are frozen under escrow safeguards.</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column: Secure Data Configuration Tabs */}
          <div className="xl:col-span-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full relative">
              
              {/* Layer Lock Overlay for Pending Reviews */}
              {isProfileLocked && (
                <div className="absolute inset-0 bg-gray-50/40 backdrop-blur-[1.5px] z-40 flex flex-col items-center justify-center p-4">
                   <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-xl flex flex-col items-center max-w-sm text-center border-t-4 border-t-amber-500">
                     <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-4 border border-amber-100">
                       <FaLock className="text-amber-600 text-lg" />
                     </div>
                     <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs mb-1.5">Data Pipeline Suspended</h3>
                     <p className="text-[11px] text-gray-500 font-bold leading-relaxed">
                       Your profile update request is waiting for Admin validation. Editing fields is locked to preserve cryptographic ledger integrity.
                     </p>
                   </div>
                </div>
              )}

              <div className="flex border-b border-gray-200 bg-gray-50/50 overflow-x-auto no-scrollbar relative z-10">
                <button type="button" onClick={() => setActiveFormTab('general')} className={`flex-1 py-4 px-6 text-[11px] sm:text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeFormTab === 'general' ? 'bg-white text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-900'}`}>
                  <FaBuilding size={14} /> Profile Parameters
                </button>
                <button type="button" onClick={() => setActiveFormTab('financial')} className={`flex-1 py-4 px-6 text-[11px] sm:text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 whitespace-nowrap ${activeFormTab === 'financial' ? 'bg-white text-orange-600 border-b-2 border-orange-600' : 'text-gray-500 hover:text-gray-900'}`}>
                  <FaUniversity size={14} /> Settlement Routing
                </button>
              </div>

              <AnimatePresence mode="wait">
              <form onSubmit={submitHandler} className="p-6 md:p-8 flex flex-col flex-grow relative z-10" key={activeFormTab}>
                
                {/* Tab 1: Profile Fields */}
                {activeFormTab === 'general' && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6 flex-grow">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Display Store Name</label>
                      <input readOnly={isProfileLocked} type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent rounded-xl px-4 py-3.5 text-sm font-bold text-gray-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-inner" placeholder="Store Designation" required />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Operational Charter (Bio)</label>
                      <textarea readOnly={isProfileLocked} rows="4" value={storeDescription} onChange={(e) => setStoreDescription(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent rounded-xl px-4 py-3.5 text-sm font-medium text-gray-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all resize-none shadow-inner leading-relaxed" placeholder="Describe core machinery assets and guaranteed deployment terms..."></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Communications Mail</label>
                        <div className="relative">
                          <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input readOnly={isProfileLocked} type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-50 border-2 border-transparent rounded-xl pl-11 pr-4 py-3.5 text-sm font-bold text-gray-900 focus:outline-none focus:border-orange-500 focus:bg-white transition-all shadow-inner" placeholder="node@domain.com" required />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Secure Hotline</label>
                        <div className="flex bg-gray-50 border-2 border-transparent rounded-xl focus-within:border-orange-500 focus-within:bg-white transition-all shadow-inner overflow-hidden">
                          <select 
                            disabled={isProfileLocked}
                            value={phoneCode} 
                            onChange={(e) => setPhoneCode(e.target.value)}
                            className="bg-gray-100 border-none text-xs font-black text-gray-700 py-3.5 pl-3 pr-8 outline-none cursor-pointer border-r border-gray-200"
                          >
                            {countryCodes.map(c => <option key={c.code} value={c.code}>{c.country} ({c.code})</option>)}
                          </select>
                          <input readOnly={isProfileLocked} type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full bg-transparent pl-3 pr-4 py-3.5 text-sm font-bold text-gray-900 outline-none font-mono tracking-widest" placeholder="555-0000" required />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Tab 2: Financial Ingestion (Vault Design) */}
                {activeFormTab === 'financial' && (
                  <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6 flex-grow">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Disbursement Gateway</label>
                      <div className="relative">
                        <FaGlobe className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500 z-10" />
                        <select disabled={isProfileLocked} value={payoutGateway} onChange={(e) => setPayoutGateway(e.target.value)} className="w-full bg-gray-950 border-2 border-gray-900 rounded-xl pl-11 pr-4 py-3.5 text-sm font-black text-white focus:outline-none focus:border-orange-500 transition-all shadow-inner appearance-none cursor-pointer uppercase tracking-wider">
                          <option value="BankTransfer">Direct Corporate Wire (ACH / Swift)</option>
                          <option value="Vesto">Vesto Cryptographic Vault</option>
                          <option value="StripeConnect">Stripe Connect Account</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
                      </div>
                    </div>

                    {payoutGateway === 'StripeConnect' ? (
                      <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-6 flex flex-col items-center justify-center text-center py-10 shadow-inner">
                        <div className="bg-indigo-600 text-white p-4 rounded-2xl mb-4 shadow-lg shadow-indigo-600/20"><FaStripeS size={28} /></div>
                        <h3 className="text-sm font-black text-indigo-950 uppercase tracking-wider">Stripe Identity Clearing</h3>
                        <p className="text-[11px] text-indigo-600 mt-2 font-bold max-w-xs mb-6 leading-relaxed">Automate micro-payout distribution infrastructure through encrypted Stripe parsing channels.</p>
                        <button type="button" onClick={handleStripeConnect} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95 shadow-sm">Initialize Setup <FaLock /></button>
                      </div>
                    ) : (
                      <div className="bg-gray-950 text-white p-6 rounded-2xl border border-gray-900 space-y-6 shadow-inner">
                        <p className="text-[9px] text-orange-500 font-black uppercase tracking-widest flex items-center gap-1.5 border-b border-gray-900 pb-3">
                          <FaLock /> Encrypted Vault Fields - Validation Constraints Engaged
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Institution Node Name</label>
                            <div className="relative">
                              <FaUniversity className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                              <input readOnly={isProfileLocked} type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-11 pr-4 py-3.5 text-sm font-bold text-white focus:outline-none focus:border-orange-500 transition-all" placeholder="e.g. HSBC Clearing" required={payoutGateway !== 'StripeConnect'} />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Beneficiary Legal Entity</label>
                            <div className="relative">
                              <FaIdCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                              <input readOnly={isProfileLocked} type="text" value={accountHolderName} onChange={(e) => setAccountHolderName(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-11 pr-4 py-3.5 text-sm font-bold text-white focus:outline-none focus:border-orange-500 transition-all uppercase" placeholder="Corporate Corp" required={payoutGateway !== 'StripeConnect'} />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Account Number</label>
                            <div className="relative">
                              <FaMoneyCheckAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                              <input readOnly={isProfileLocked} type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-11 pr-4 py-3.5 text-sm font-black font-mono text-white focus:outline-none focus:border-orange-500 transition-all tracking-wider" placeholder="000111222333" required={payoutGateway !== 'StripeConnect'} />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Swift / Routing Parameter</label>
                            <div className="relative">
                              <FaRegCreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" />
                              <input readOnly={isProfileLocked} type="text" value={routingNumber} onChange={(e) => setRoutingNumber(e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-11 pr-4 py-3.5 text-sm font-black font-mono text-white focus:outline-none focus:border-orange-500 transition-all uppercase tracking-wider" placeholder="HSBCUS44" required={payoutGateway !== 'StripeConnect'} />
                            </div>
                          </div>
                          
                          <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">International Bank Account Number (IBAN)</label>
                            <input readOnly={isProfileLocked} type="text" value={iban} onChange={handleIbanChange} maxLength={42} className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3.5 text-sm font-black font-mono text-orange-500 focus:outline-none focus:border-orange-500 transition-all uppercase tracking-widest text-center" placeholder="EG00 0000 0000 0000 0000 0000" required={payoutGateway !== 'StripeConnect'} />
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Action Footer */}
                <div className="mt-auto pt-8 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-gray-100 z-20 relative">
                  <button 
                    type="submit" 
                    disabled={isUpdating || isProfileLocked || !needsAdminReview} 
                    className={`w-full sm:w-auto px-10 py-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 
                      ${isProfileLocked ? 'bg-gray-100 text-gray-400 shadow-none cursor-not-allowed' : needsAdminReview ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20' : 'bg-gray-100 text-gray-400 shadow-none cursor-not-allowed'}`}
                  >
                    {isUpdating ? <><FaSpinner className="animate-spin" /> Transmitting...</> : isProfileLocked ? <><FaLock size={12} /> Audit Locked</> : needsAdminReview ? <><FaUserSecret size={14} /> Submit for Admin Audit Access</> : 'No Discrepancies Detected'}
                  </button>
                </div>

              </form>
              </AnimatePresence>
            </motion.div>
          </div>

        </div>
      </div>
      
      {/* Security Audit Modal Box */}
      <AnimatePresence>
        {isAuditModalOpen && (
          <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="bg-white rounded-3xl w-full max-w-md p-8 relative z-10 shadow-2xl overflow-hidden border border-gray-200">
              <div className="absolute top-0 left-0 w-full h-2 bg-red-600"></div>
              <div className="flex justify-center mb-6"><div className="w-16 h-16 bg-red-50 rounded-full border border-red-100 flex items-center justify-center"><FaShieldAlt className="text-red-600 text-2xl" /></div></div>
              <h2 className="text-xl font-black text-center text-gray-900 uppercase tracking-tight mb-2">Security Audit Entry</h2>
              <p className="text-sm font-medium text-gray-500 text-center mb-6 leading-relaxed">You are introducing sensitive operational parameter changes. These modifications require definitive Administration review and signature before updating on the global database.</p>
              <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700"><FaCheckCircle className="text-orange-500" /> Active operations continue processing.</div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-700"><FaCheckCircle className="text-orange-500" /> System lock activates instantly upon transmission.</div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsAuditModalOpen(false)} className="flex-1 py-3.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="button" onClick={executeUpdate} disabled={isUpdating} className="flex-1 py-3.5 bg-red-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-red-600/20 hover:bg-red-700 transition-colors active:scale-95 flex justify-center items-center gap-2">{isUpdating ? <FaSpinner className="animate-spin" /> : 'Acknowledge & Submit'}</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VendorProfileScreen;