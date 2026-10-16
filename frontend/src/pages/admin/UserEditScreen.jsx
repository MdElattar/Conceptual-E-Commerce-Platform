import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaUserShield, FaUser, FaEnvelope, FaLock, FaPhoneAlt } from 'react-icons/fa';
import Button from '../../components/Button';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import { toast } from 'react-toastify';
import { useGetUserDetailsQuery, useUpdateUserMutation } from '../../slices/usersApiSlice';
import { useSelector } from 'react-redux';

const UserEditScreen = () => {
  const { id: userId } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(''); 
  const [isAdmin, setIsAdmin] = useState(false);

  const { userInfo } = useSelector((state) => state.auth);

  const { data: user, isLoading, error, refetch } = useGetUserDetailsQuery(userId);
  const [updateUser, { isLoading: loadingUpdate }] = useUpdateUserMutation();

  const [prevUserId, setPrevUserId] = useState(null);
  if (user && user._id !== prevUserId) {
    setPrevUserId(user._id);
    setName(user.name || '');
    setEmail(user.email || '');
    setPhone(user.phone === 'N/A' || user.phone === 'Not Specified' ? '' : user.phone || '');
    setIsAdmin(user.isAdmin || false);
  }

  const submitHandler = async (e) => {
    e.preventDefault();
    
    // تريكة تجاوز الـ ValidationError لو الأدمن ساب الحقل فاضي وعايزه اختياري
    const finalizedPhone = phone.trim() === '' ? 'N/A' : phone.trim();

    try {
      // بنمرر الـ phone هنا عشان الـ Slice يلقطه ويبعته للسيرفر
      await updateUser({ userId, name, email, phone: finalizedPhone, isAdmin }).unwrap();
      toast.success('Identity node updated successfully ✅');
      refetch();
      navigate('/admin/userlist');
    } catch (err) {
      // عشان لو السيرفر رجع خطأ HTML أو JSON يتقرأ صح بدون كراش
      toast.error(err?.data?.message || err.error || 'Syntax or validation bypass failed');
    }
  };

  const getInitials = (fullName) => {
    if (!fullName) return 'U';
    return fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const isSelf = userInfo?._id === userId;
  const isSuperAdmin = userInfo?.email === 'tvninjagames@gmail.com';

  return (
    <div className="bg-gray-50/30 min-h-screen pt-24 md:pt-32 pb-10 md:pb-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto font-sans antialiased text-gray-900">
      
      <button 
        onClick={() => navigate('/admin/userlist')} 
        className="inline-flex items-center gap-2 text-gray-400 hover:text-orange-600 font-black uppercase text-xs tracking-widest transition-all mb-8 group"
      >
        <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" /> 
        <span>Back to Directory</span>
      </button>

      <div className="bg-white rounded-[2.5rem] border border-gray-150 shadow-xl shadow-gray-100/40 p-6 md:p-10 relative overflow-hidden">
        
        <div className="mb-8 border-b border-gray-100 pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase italic tracking-tight">
              Modify <span className="text-orange-600">Profile</span>
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              Cryptographic Identity & Access Level Overrides
            </p>
          </div>

          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200/60 p-3 rounded-2xl w-full sm:w-auto">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-inner ${isAdmin ? 'bg-orange-600 text-white' : 'bg-gray-900 text-white'}`}>
              {getInitials(name)}
            </div>
            <div>
              <span className="text-[9px] font-black uppercase text-gray-400 tracking-wider block">Live Node Role</span>
              <span className={`text-xs font-black uppercase tracking-wider ${isAdmin ? 'text-orange-600' : 'text-gray-900'}`}>
                {isAdmin ? 'System Admin' : 'Regular Client'}
              </span>
            </div>
          </div>
        </div>

        {isSelf && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl text-xs font-semibold text-blue-700 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shrink-0"></span>
            <span>Advisory: You are modifying your active session node. Changes will apply immediately upon commit.</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-12"><Loader /></div>
        ) : error ? (
          <Message variant='danger'>{error?.data?.message || error.error}</Message>
        ) : (
          <form onSubmit={submitHandler} className="space-y-6">
            
            {/* Input Name Field */}
            <div className="space-y-2">
              <label className="block text-[10px] uppercase font-black text-gray-400 tracking-widest ml-1">Full Legal Name</label>
              <div className="relative">
                <input
                  type="text"
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl py-4 pl-12 pr-6 outline-none transition-all font-bold text-gray-800 shadow-inner"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={12} />
              </div>
            </div>

            {/* Input Email Field */}
            <div className="space-y-2">
              <label className="block text-[10px] uppercase font-black text-gray-400 tracking-widest ml-1">Secure Email Gateway</label>
              <div className="relative">
                <input
                  type="email"
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl py-4 pl-12 pr-6 outline-none transition-all font-bold text-gray-800 shadow-inner font-mono text-sm"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={12} />
              </div>
            </div>

            {/* حقل الهاتف الاختياري ذكي الإرسال */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="block text-[10px] uppercase font-black text-gray-400 tracking-widest">Contact Phone Vector</label>
                <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md uppercase tracking-wider">Optional Field</span>
              </div>
              <div className="relative">
                <input
                  type="tel"
                  className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl py-4 pl-12 pr-6 outline-none transition-all font-bold text-gray-800 shadow-inner font-mono text-sm"
                  placeholder="e.g. +20 123 456 7890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <FaPhoneAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={11} />
              </div>
            </div>

            {/* حاجز الأمان البصري للـ Super Admin */}
            {isSuperAdmin ? (
              <div className="p-4 bg-amber-50 border-2 border-dashed border-amber-200 rounded-2xl flex items-start gap-4 transition-all hover:bg-amber-100/40">
                <div className="p-2.5 bg-white border border-amber-200 rounded-xl text-amber-600 shadow-xs shrink-0 mt-0.5">
                  <FaLock size={12} />
                </div>
                <div className="space-y-1.5 cursor-pointer select-none flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isAdmin"
                      className="w-4 h-4 accent-orange-600 rounded cursor-pointer"
                      checked={isAdmin}
                      disabled={isSelf} 
                      onChange={(e) => setIsAdmin(e.target.checked)}
                    />
                    <label htmlFor="isAdmin" className="font-black uppercase tracking-wider text-xs text-amber-900 cursor-pointer">
                      Root Administrator Clearance
                    </label>
                  </div>
                  <p className="text-[10px] font-medium text-amber-700/80 leading-relaxed">
                    Checking this grants full database mutational permissions, financial pipeline controls, and infrastructure overrides.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-center gap-3 opacity-60">
                <FaUserShield className="text-gray-400" size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Privilege Matrix Locked by Root Authority
                </span>
              </div>
            )}

            {/* زر الحفظ المعدل هندسياً */}
            <div className="pt-4 border-t border-gray-50">
              <Button
                type="submit"
                loading={loadingUpdate}
                className="w-full"
              >
                {loadingUpdate ? (
                  'Syncing Database Node...'
                ) : (
                  <><FaSave size={11} className='p-5' /> Commit Structural Changes</>
                )}
              </Button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
};

export default UserEditScreen;