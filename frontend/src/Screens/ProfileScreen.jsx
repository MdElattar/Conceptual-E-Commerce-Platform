import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../slices/authSlice';
import { toast } from 'react-toastify';
import {
  FaBox, FaUserShield, FaMapMarkerAlt,
  FaCreditCard, FaSignOutAlt, FaIdBadge, FaChevronRight,
  FaHandshake, FaStore, FaLock // 🌟 أيقونات جديدة للماركت بليس
} from 'react-icons/fa';

const ProfileScreen = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userInfo } = useSelector((state) => state.auth);

  const logoutHandler = () => {
    dispatch(logout());
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const menuItems = [
    {
      title: 'Your Orders',
      desc: 'Track, return, or procure industrial units again',
      icon: <FaBox size={24} className="text-orange-500 transition-all duration-500 group-hover:rotate-12" />,
      path: '/orders',
      accentColor: '#f97316'
    },
    {
      title: 'Security Gate',
      desc: 'Update credentials and cryptographic passwords',
      icon: <FaUserShield size={24} className="text-orange-500 transition-all duration-500 group-hover:scale-110" />,
      path: '/forgot-password',
      accentColor: '#f97316'
    },
    {
      title: 'Two-Factor Auth',
      desc: 'Enable 2FA for enhanced account protection',
      icon: <FaLock size={24} className="text-purple-500 transition-all duration-500 group-hover:scale-110" />,
      path: '/2fa',
      accentColor: '#8b5cf6'
    },
    {
      title: 'Logistics Addresses',
      desc: 'Manage shipping terminals for parts and manifests',
      icon: <FaMapMarkerAlt size={24} className="text-orange-500 transition-all duration-500 group-hover:translate-y-[-2px]" />,
      path: '/addresses',
      accentColor: '#f97316'
    },
    {
      title: 'Wallet History',
      desc: 'Review hardware credit ledger and total balance',
      icon: <FaCreditCard size={24} className="text-orange-500 transition-all duration-500 group-hover:-skew-x-6" />,
      path: '/walletHistory',
      accentColor: '#f97316'
    },
    // 🌟 [تريكة العرض الذكي] عرض لوحة التاجر إذا كان الحساب تاجر، أو عرض التقديم إذا كان يوزر عادي
    ...(userInfo?.role === 'vendor' ? [
      {
        title: 'Vendor Command',
        desc: 'Access your merchant dashboard and global logistics',
        icon: <FaStore size={24} className="text-emerald-500 transition-all duration-500 group-hover:scale-110" />,
        path: '/vendor/dashboard',
        accentColor: '#10b981' // Emerald Green لتمييز لوحة القيادة
      }
    ] : [
      {
        title: 'Vendor Partnership',
        desc: 'Submit official documents to become a verified merchant',
        icon: <FaHandshake size={24} className="text-blue-500 transition-all duration-500 group-hover:scale-110" />,
        path: '/become-vendor', // 🔗 مسار نموذج تقديم الوثائق اللي هنعمله
        accentColor: '#3b82f6' // Blue لتمييز الطلبات الرسمية والشراكة
      }
    ]),
    {
      title: 'Terminate Session',
      desc: 'Safely de-authorize and flush current credentials',
      icon: <FaSignOutAlt size={24} className="text-red-500 transition-all duration-500 group-hover:translate-x-1" />,
      action: logoutHandler,
      accentColor: '#ef4444'
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-8 antialiased box-border">
      
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black uppercase italic text-gray-900 tracking-tighter leading-none mb-2">
            Your <span className="text-orange-600">Account</span>
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-wider">Manage terminal profile and deployment variables</p>
        </div>

        {/* Access Key Badge & Role Status */}
        <div className="flex flex-col sm:flex-row gap-3 self-start md:self-auto">
          
          {/* 🌟 تريكة عرض حالة الحساب (Vendor / User) لتعزيز هوية المنصة */}
          {userInfo?.role === 'vendor' && (
            <div className="inline-flex items-center bg-emerald-50 border border-emerald-200 px-4 py-2 shadow-sm rounded-xl">
              <FaStore className="text-emerald-600 mr-2" size={14} />
              <span className="text-emerald-600 font-black text-[10px] uppercase tracking-widest">Verified Merchant</span>
            </div>
          )}

          <div className="inline-flex items-center bg-white border border-gray-200 px-4 py-2 shadow-sm rounded-xl max-w-max">
            <div className="relative flex items-center justify-center mr-3">
              <div className="absolute inset-0 bg-orange-500 rounded-full animate-ping opacity-15"></div>
              <FaIdBadge className="text-orange-600 relative z-10" size={14} />
            </div>
            <span className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mr-2">Access Key:</span>
            <span className="font-mono font-black text-xs text-gray-800 tracking-tight">{userInfo?._id?.slice(-8).toUpperCase() || 'GUEST_MODE'}</span>
          </div>
        </div>
      </div>

      {/* Pure Tailwind Responsive Grid System */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full box-border">
        {menuItems.map((item, index) => (
          <div
            key={index}
            onClick={item.action ? item.action : () => navigate(item.path)}
            className="group relative bg-white rounded-2xl border border-gray-200/80 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer overflow-hidden p-6 flex flex-col justify-between min-h-[170px] box-border"
          >
            {/* Top Indicator Accent Stripe */}
            <div
              className="absolute top-0 left-0 h-[3px] w-0 group-hover:w-full transition-all duration-500 ease-in-out"
              style={{ backgroundColor: item.accentColor }}
            ></div>

            <div className="flex items-start justify-between w-full mb-4">
              {/* Dynamic Icon Container */}
              <div className="relative w-12 h-12 flex items-center justify-center bg-gray-50 rounded-xl group-hover:bg-gray-950 transition-colors duration-300 overflow-hidden">
                <span className="relative z-10 group-hover:text-white transition-colors duration-300">{item.icon}</span>
              </div>
              <div className="text-gray-300 group-hover:text-gray-950 transition-all duration-300 transform group-hover:translate-x-0.5">
                <FaChevronRight size={12} />
              </div>
            </div>

            <div className="mt-auto">
              {/* تطبيق تلوين النص عند الـ Hover بناءً على الـ accentColor للتناسق */}
              <h2 
                className="font-black text-lg text-gray-900 transition-colors duration-200 mb-1 uppercase italic tracking-tight"
                style={{ '--hover-color': item.accentColor }}
                onMouseEnter={(e) => e.target.style.color = item.accentColor}
                onMouseLeave={(e) => e.target.style.color = '#111827'} // gray-900
              >
                {item.title}
              </h2>
              <p className="text-gray-400 font-medium text-xs leading-normal group-hover:text-gray-600 transition-colors duration-200">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Corporate Identity Footer */}
      <div className="mt-16 text-center pt-8 border-t border-gray-200/60 flex flex-col items-center gap-1.5 w-full">
        <div className="flex items-center gap-3 opacity-20 hover:opacity-80 transition-opacity">
          <div className="h-[1px] w-10 bg-gray-400"></div>
          <span className="text-gray-900 font-black italic tracking-widest text-md">DK-TEC</span>
          <div className="h-[1px] w-10 bg-gray-400"></div>
        </div>
        <p className="text-gray-400 text-[9px] font-bold uppercase tracking-[0.25em] leading-relaxed">
          Professional Engineering Services <br />
          <span className="text-orange-500">© 2026</span> Precision in Motion
        </p>
      </div>
    </div>
  );
};

export default ProfileScreen;