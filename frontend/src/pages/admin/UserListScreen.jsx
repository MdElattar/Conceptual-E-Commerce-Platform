import { useState } from 'react';
import { FaTrash, FaEdit, FaCheck, FaTimes, FaSearch, FaUserShield, FaUsers, FaUser, FaEnvelope } from 'react-icons/fa';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import { toast } from 'react-toastify';
import { 
    useDeleteUserMutation, 
    useGetUsersQuery, 
    useUpdateUserMutation 
} from '../../slices/usersApiSlice';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const UserListScreen = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { data: users, refetch, isLoading, error } = useGetUsersQuery();
    const [deleteUser, { isLoading: loadingDelete }] = useDeleteUserMutation();
    const [updateUser, { isLoading: loadingUpdate }] = useUpdateUserMutation();

    const { userInfo } = useSelector((state) => state.auth);

    // ستايت البحث الداخلي السريع
    const [searchTerm, setSearchTerm] = useState('');

    // قراءة الفلتر الحالي من الرابط (?filter=...)
    const sp = new URLSearchParams(location.search);
    const currentFilter = sp.get('filter') || 'all'; 

    // دالة تغيير الفلتر بسلاسة في الرابط
    const handleFilterChange = (filterType) => {
        if (filterType === 'all') {
            navigate('/admin/userlist');
        } else {
            navigate(`/admin/userlist?filter=${filterType}`);
        }
    };

    // حساب العدادات الحقيقية ديناميكياً
    const countAll = users?.length || 0;
    const countAdmins = users?.filter(u => u.isAdmin).length || 0;
    const countRegular = users?.filter(u => !u.isAdmin).length || 0;

    // منطق الفلترة المزدوج (نوع الفلتر + كلمة البحث)
    const displayedUsers = users?.filter((user) => {
        // 1. تصفية حسب الفئة
        if (currentFilter === 'admins' && !user.isAdmin) return false;
        if (currentFilter === 'regular' && user.isAdmin) return false;

        // 2. تصفية حسب البحث (الاسم أو البريد)
        const matchesSearch = 
            user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
            
        return matchesSearch;
    }) || [];

    const deleteHandler = async (id) => {
        if (window.confirm('🚨 Action irreversible! Are you sure you want to permanently delete this user node?')) {
            try {
                await deleteUser(id).unwrap();
                toast.success('User cleared from database');
                refetch();
            } catch (err) {
                toast.error(err?.data?.message || err.error || 'Delete process failed');
            }
        }
    };

    const toggleAdminHandler = async (user) => {
        // حماية تمنع الأدمن الخارق من إلغاء صلاحية نفسه بالخطأ من اللوحة
        if (user._id === userInfo._id) {
            toast.warning('Security Lock: You cannot revoke your own admin rights from this panel.');
            return;
        }

        try {
            await updateUser({
                userId: user._id,
                name: user.name,
                email: user.email,
                isAdmin: !user.isAdmin,
            }).unwrap();
            toast.success(`Role shifted to ${!user.isAdmin ? 'Admin' : 'Regular User'}`);
            refetch();
        } catch (err) {
            toast.error(err?.data?.message || err.error);
        }
    };

    // المطور الأساسي أو السوبر أدمن المسموح له بالتحكم الفائق
    const isSuperAdmin = userInfo.email === 'tvninjapames@gmail.com' || userInfo.isAdmin;

    return (
        <div className="py-10  px-4 md:px-10 max-w-7xl mx-auto mt-16 font-sans antialiased text-gray-900">
            
            {/* Header Block */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tight">
                        Clientele <span className="text-orange-600">Terminal</span>
                    </h1>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                        System User Nodes & Cryptographic Identity Logs
                    </p>
                </div>
                
                {/* شريط البحث المدمج الذكي */}
                <div className="relative w-full md:w-80">
                    <input 
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-gray-200 focus:border-orange-500 rounded-2xl py-3.5 pl-11 pr-4 text-xs font-semibold focus:outline-none transition-all shadow-sm placeholder:text-gray-400"
                    />
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={13} />
                </div>
            </div>

            {/* 💎 تريكة لوحة التحكم في الفلترة الاحترافية (SaaS Filter Controls) */}
            <div className="flex flex-wrap items-center gap-2 mb-8 bg-gray-100/60 p-1.5 rounded-2xl w-fit border border-gray-200/40">
                <button 
                    onClick={() => handleFilterChange('all')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${currentFilter === 'all' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
                >
                    <FaUsers size={12} /> All ({countAll})
                </button>
                <button 
                    onClick={() => handleFilterChange('admins')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${currentFilter === 'admins' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-orange-600'}`}
                >
                    <FaUserShield size={12} /> Admins ({countAdmins})
                </button>
                <button 
                    onClick={() => handleFilterChange('regular')}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${currentFilter === 'regular' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-black'}`}
                >
                    <FaUser size={12} /> Regulars ({countRegular})
                </button>
            </div>

            {/* الحالات التقنية للـ Mutations */}
            {(loadingDelete || loadingUpdate) && (
                <div className="fixed inset-0 bg-gray-950/20 backdrop-blur-xs z-50 flex items-center justify-center">
                    <Loader />
                </div>
            )}

            {isLoading ? (
                <Loader />
            ) : error ? (
                <Message variant='danger'>{error?.data?.message || error.error}</Message>
            ) : displayedUsers.length === 0 ? (
                <div className="bg-white rounded-[2.5rem] border border-gray-200/60 p-12 text-center shadow-xs">
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No records match the active criteria.</p>
                </div>
            ) : (
                <>
                    {/* 🖥️ العرض الخاص بالشاشات الكبيرة: جدول فخم متكامل البيانات */}
                    <div className="hidden p-4 lg:block bg-white rounded-[2.5rem] border border-gray-150 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/70 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4.5 text-[10px] uppercase font-black text-gray-400 tracking-wider">Identity Profile</th>
                                    <th className="px-6 py-4.5 text-[10px] uppercase font-black text-gray-400 tracking-wider">Node Token (ID)</th>
                                    <th className="px-6 py-4.5 text-[10px] uppercase font-black text-gray-400 tracking-wider">Secure Email Address</th>
                                    <th className="px-6 py-4.5 text-[10px] uppercase font-black text-gray-400 tracking-wider">Privilege Matrix</th>
                                    <th className="px-6 py-4.5 text-[10px] uppercase font-black text-gray-400 tracking-wider text-center">Terminal Operations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {displayedUsers.map((user) => {
                                    const isSelf = user._id === userInfo._id;
                                    const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                                    return (
                                        <tr key={user._id} className="hover:bg-orange-50/20  transition-all duration-200">
                                            {/* الاسم و الرمز التعريفي البصري */}
                                            <td className="px-6 py-4.5">
                                                <div className="flex items-center gap-3 p-3">
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shadow-inner tracking-tighter ${user.isAdmin ? 'bg-orange-600 text-white' : 'bg-gray-900 text-white'}`}>
                                                        {initials}
                                                    </div>
                                                    <div>
                                                        <span className="font-black text-gray-900 block text-sm">{user.name}</span>
                                                        {isSelf && <span className="bg-orange-50 text-orange-600 border border-orange-200/50 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded mt-0.5 inline-block">Your Account</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            {/* الـ ID الكامل */}
                                            <td className="px-6 py-4.5">
                                                <span className="font-mono text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200/40">
                                                    {user._id}
                                                </span>
                                            </td>
                                            {/* البريد الإلكتروني مع أيقونة اتصال سريعة */}
                                            <td className="px-6 py-4.5">
                                                <div className="flex items-center gap-2 text-sm text-gray-600 group">
                                                    <FaEnvelope className="text-gray-300 group-hover:text-orange-500 transition-colors" size={12} />
                                                    <a href={`mailto:${user.email}`} className="hover:text-orange-600 transition-colors font-semibold underline decoration-transparent hover:decoration-orange-300">
                                                        {user.email}
                                                    </a>
                                                </div>
                                            </td>
                                            {/* حالة الصلاحيات بزر تبديل تفاعلي رائع */}
                                            <td className="px-6 py-4.5">
                                                <button
                                                    onClick={() => toggleAdminHandler(user)}
                                                    disabled={!isSuperAdmin}
                                                    className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border shadow-xs active:scale-95
                                                        ${user.isAdmin 
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200/60 hover:bg-emerald-600 hover:text-white' 
                                                            : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-900 hover:text-white'
                                                        } ${!isSuperAdmin ? 'opacity-50 cursor-not-allowed hover:bg-gray-50 hover:text-gray-400' : ''}`}
                                                    title={!isSuperAdmin ? "Access Denied" : "Click to toggle authority structure"}
                                                >
                                                    {user.isAdmin ? (
                                                        <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span><FaCheck size={8} /> Admin Profile</>
                                                    ) : (
                                                        <><FaTimes size={8} /> Regular Node</>
                                                    )}
                                                </button>
                                            </td>
                                            {/* العمليات البرمجية */}
                                            <td className="px-6 py-4.5 text-center">
                                                <div className="flex justify-center items-center gap-2">
                                                    <Link to={`/admin/user/${user._id}/edit`}>
                                                        <button className="p-3 bg-gray-900 text-white rounded-xl hover:bg-orange-600 transition-all active:scale-90 shadow-md shadow-gray-200 hover:shadow-orange-200">
                                                            <FaEdit size={12} />
                                                        </button>
                                                    </Link>
                                                    
                                                    {!isSelf && (
                                                        <button
                                                            onClick={() => deleteHandler(user._id)}
                                                            className="p-3 bg-red-50 text-red-500 border border-red-100 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-90 shadow-xs"
                                                        >
                                                            <FaTrash size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* 📱 العرض المخصص لشاشات الموبايل (Responsive Grid Switch) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
                        {displayedUsers.map((user) => {
                            const isSelf = user._id === userInfo._id;
                            const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                            return (
                                <div key={user._id} className="bg-white p-5 rounded-[2rem] border border-gray-150 shadow-xs flex flex-col justify-between gap-4 relative overflow-hidden">
                                    {isSelf && <div className="absolute top-0 right-0 bg-orange-600 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl">YOU</div>}
                                    
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shadow-inner tracking-tighter shrink-0 ${user.isAdmin ? 'bg-orange-600 text-white' : 'bg-gray-900 text-white'}`}>
                                            {initials}
                                        </div>
                                        <div className="space-y-1 min-w-0 break-words">
                                            <h3 className="font-black text-gray-900 text-base leading-tight">{user.name}</h3>
                                            <a href={`mailto:${user.email}`} className="text-xs text-gray-500 font-medium block hover:text-orange-600 underline decoration-gray-150 truncate">
                                                {user.email}
                                            </a>
                                            <span className="font-mono text-[9px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 inline-block mt-1">
                                                ID: {user._id.slice(-8).toUpperCase()}...
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-2 pt-4 border-t border-gray-50 mt-2">
                                        {/* زر تبديل الصلاحيات متجاوب للموبايل */}
                                        <button
                                            onClick={() => toggleAdminHandler(user)}
                                            disabled={!isSuperAdmin}
                                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border
                                                ${user.isAdmin 
                                                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                                    : 'bg-gray-50 text-gray-400 border-gray-200'
                                                } ${!isSuperAdmin ? 'opacity-50' : ''}`}
                                        >
                                            {user.isAdmin ? <><FaCheck size={8} /> Admin</> : <><FaTimes size={8} /> User</>}
                                        </button>

                                        {/* أزرار العمليات للموبايل مساحتها ممتازة للضغط باليد */}
                                        <div className="flex items-center gap-1.5">
                                            <Link to={`/admin/user/${user._id}/edit`} className="flex-1">
                                                <button className="p-2.5 bg-gray-900 text-white rounded-xl hover:bg-orange-600 transition-all flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-4">
                                                    <FaEdit size={10} /> Edit
                                                </button>
                                            </Link>
                                            {!isSelf && (
                                                <button
                                                    onClick={() => deleteHandler(user._id)}
                                                    className="p-2.5 bg-red-50 text-red-500 border border-red-100 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                                >
                                                    <FaTrash size={10} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

export default UserListScreen;