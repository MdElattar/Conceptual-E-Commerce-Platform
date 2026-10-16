import { useState } from 'react';
import { 
  FaDollarSign, FaUsers, FaShoppingBag, FaTruck, FaTimesCircle, 
  FaUndoAlt, FaBoxes, FaHeadset, FaShippingFast, FaArrowUp, 
  FaSyncAlt, FaTicketAlt, FaShieldAlt, FaSearch, FaWallet, FaFileExcel,
  FaUserCheck, FaLayerGroup, FaCogs,
  FaImage , FaClock // 🌟 Added icon for Banners
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import Loader from '../../components/Loader';
import Message from '../../components/Message';
import { useGetDashboardStatsQuery, useGetOrdersQuery } from '../../slices/orderApiSlice';
import { useGetPendingEditsProductsQuery } from '../../slices/productsApiSlice';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

const DashboardScreen = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading, error: statsError } = useGetDashboardStatsQuery();
  const { data: orders, isLoading: ordersLoading } = useGetOrdersQuery();

  // Financial Audit Modal Controller
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [searchOrderId, setSearchOrderId] = useState('');
  const [greeting] = useState(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  });

  const { data: pendingEditsData } = useGetPendingEditsProductsQuery();
  const pendingEditsCount = pendingEditsData?.length || 0;

  const isLoading = statsLoading || ordersLoading;

  const actualPending = orders?.filter(o => !o.isDelivered && !o.isCancelled).length || 0;
  const actualCancelled = orders?.filter(o => o.isCancelled).length || 0;
  const actualTotalOrders = orders?.length || 0;
  
  const netRevenue = orders?.filter(o => o.isPaid && !o.isCancelled)
    .reduce((acc, item) => acc + item.totalPrice, 0) || 0;

  const handleExportExcel = (ordersData) => {
    try {
      if (!ordersData || !Array.isArray(ordersData) || ordersData.length === 0) {
        alert("⚠️ لا توجد بيانات مبيعات متاحة حالياً للتصدير في لوحة التحكم!");
        return;
      }

      const reportRows = ordersData.map((order, index) => ({
        "المسلسل": index + 1,
        "رقم الطلب (ID)": order._id || "N/A",
        "اسم العميل": order.user?.name || order.customerName || "عميل نظام",
        "حساب العميل (Email)": order.user?.email || "N/A",
        "تاريخ الطلب": order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-EG') : "N/A",
        "طريقة الدفع": order.paymentMethod || "N/A",
        "حالة السداد": order.isPaid ? "مدفوع ✅" : "غير مدفوع ❌",
        "حالة الشحن": order.isDelivered ? "تم التوصيل" : order.isOnWay ? "في الطريق" : "قيد المعالجة",
        "العملة المستخدمة": "USD",
        "إجمالي المبلغ بالعملة المحلية": order.totalPrice || 0
      }));

      const worksheet = XLSX.utils.json_to_sheet(reportRows);
      worksheet['!dir'] = "rtl";

      worksheet['!cols'] = [
        { wch: 8 }, { wch: 28 }, { wch: 20 }, { wch: 25 }, { wch: 15 },
        { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 22 }
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "تقرير المبيعات الشامل");

      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `DKTEC-Full-Sales-${dateStr}.xlsx`);

    } catch (error) {
      console.error("Excel Export Error:", error);
      alert("حدث خطأ تقني أثناء تصدير ملف الإكسيل: " + error.message);
    }
  };

  const cards = [
    {
      title: 'Net Revenue',
      value: `USD ${netRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: <FaDollarSign />,
      color: 'bg-emerald-600',
      link: '/admin/orderlist',
      subtitle: 'Net USD/EGP Profit',
      trend: '+12.5%'
    },
    {
      title: 'Total Orders',
      value: actualTotalOrders,
      icon: <FaShoppingBag />,
      color: 'bg-blue-600',
      link: '/admin/orderlist',
      subtitle: 'All system nodes',
      trend: '+5.2%'
    },
    {
      title: 'Pending Cargo',
      value: actualPending,
      icon: <FaTruck />,
      color: 'bg-orange-500',
      link: '/admin/orderlist?filter=pending',
      subtitle: 'Awaiting dispatch',
      trend: 'Active Now'
    },
    {
      title: 'Cancelled Nodes',
      value: actualCancelled,
      icon: <FaTimesCircle />,
      color: 'bg-rose-600',
      link: '/admin/orderlist?filter=cancelled',
      subtitle: 'Manual refund desk',
      trend: 'Review Needed'
    },
    {
      title: 'Active Clients',
      value: stats?.usersCount || 0,
      icon: <FaUsers />,
      color: 'bg-zinc-950',
      link: '/admin/userlist',
      subtitle: 'Registered accounts',
      trend: '+2.1%'
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { y: 25, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 80 } }
  };

  const handleAuditSearch = (e) => {
    e.preventDefault();
    if (searchOrderId.trim()) {
      navigate(`/order/${searchOrderId.trim()}`);
      setIsAuditModalOpen(false);
    }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="py-10 px-4 md:px-10 max-w-7xl mx-auto mt-16 text-left"
      dir="ltr"
    >
      {/* Upper Header Module */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-4 border-b border-zinc-100 pb-6">
        <div>
          <h3 className="text-orange-600 font-bold text-sm tracking-widest uppercase mb-1">{greeting}, Admin 👋</h3>
          <h1 className="text-3xl md:text-4xl font-black text-zinc-900 tracking-tight uppercase italic">
            Command <span className="text-orange-600">Center</span>
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <p className="text-[11px] font-bold text-zinc-400 tracking-widest uppercase">System Core Engine Running Smoothly</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          <button 
            onClick={() => window.location.reload()} 
            className="p-3.5 bg-white border border-zinc-200/60 rounded-xl shadow-sm hover:rotate-180 transition-all duration-500 text-zinc-400 hover:text-orange-600 active:scale-95 shrink-0"
            title="Refresh System Stats"
          >
            <FaSyncAlt size={14} />
          </button>
          
          <button
            onClick={() => handleExportExcel(orders)}
            className="relative flex items-center justify-center gap-2.5 bg-zinc-900 hover:bg-emerald-600 text-white font-black uppercase text-xs tracking-wider py-3.5 px-5 rounded-xl shadow-md hover:shadow-emerald-900/20 transition-all duration-300 active:scale-95 flex-1 lg:flex-none"
          >
            <FaFileExcel size={14} className="text-emerald-500 bg-white/10 p-0.5 rounded shrink-0" />
            <span className="whitespace-nowrap">Export Sales (Excel)</span>
            
            {orders && orders.length > 0 && (
              <span className="absolute -top-2 -left-2 bg-emerald-500 text-white font-mono text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                {orders.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {isLoading ? <Loader /> : statsError ? (
        <Message variant='danger'>{statsError?.data?.message || statsError.error}</Message>
      ) : (
        /* Top Analytics 5-Column Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {cards.map((card, index) => (
            <motion.div variants={itemVariants} key={index}>
              <Link
                to={card.link}
                className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-[0_12px_35px_rgba(0,0,0,0.015)] flex flex-col justify-between hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group relative overflow-hidden"
              >
                <div className={`absolute -right-4 -top-4 w-16 h-16 ${card.color} opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-700`}></div>
                <div className="flex justify-between items-start mb-6">
                  <div className={`${card.color} text-white p-3.5 rounded-2xl shadow-md group-hover:scale-105 transition-transform duration-300`}>
                    {card.icon}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tight">{card.subtitle}</span>
                    <span className={`flex items-center gap-1 text-[10px] font-bold ${index === 3 ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50'} px-2 py-0.5 rounded-full mt-1.5`}>
                      {index === 3 ? <FaShieldAlt size={8} /> : <FaArrowUp size={8} />} {card.trend}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-400 mb-1 group-hover:text-orange-600 transition-colors uppercase tracking-tight">
                    {card.title}
                  </p>
                  <h2 className="text-2xl font-black text-zinc-900 tracking-tight">{card.value}</h2>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* 🚀 Advanced Power Tools Control Center */}
      {/* 🌟 Updated to grid-cols-4 for xl screens to fit the new Banner Manager card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-10">
        
        {/* 1. Inventory Control */}
        <motion.div variants={itemVariants}>
          <Link to="/admin" className="bg-zinc-950 text-white p-6 rounded-[2.2rem] flex flex-col justify-between group hover:bg-orange-600 transition-all duration-500 relative overflow-hidden h-48 shadow-lg border border-transparent hover:border-orange-500/50">
            <FaBoxes className="absolute -bottom-6 -right-6 text-8xl text-white opacity-5 group-hover:scale-125 group-hover:-rotate-12 transition-all duration-700 z-0" />
            <div className="bg-white/10 p-3.5 rounded-2xl group-hover:bg-white group-hover:text-orange-600 transition-all relative z-10 w-fit shadow-md">
              <FaBoxes size={22} />
            </div>
            <div className="relative z-10">
              <h3 className="font-black text-xl mb-0.5 tracking-tight">Inventory</h3>
              <p className="text-zinc-400 text-xs group-hover:text-white/80 transition-colors">Products & Warehouse</p>
            </div>
          </Link>
        </motion.div>

        {/* 2. Approvals Hub */}
        <motion.div variants={itemVariants}>
          <Link to="/admin/vendor-approvals" className="bg-zinc-950 text-white p-6 rounded-[2.2rem] flex flex-col justify-between group hover:bg-orange-600 transition-all duration-500 relative overflow-hidden h-48 shadow-lg border border-transparent hover:border-orange-500/50">
            <div className="absolute top-5 right-5 flex items-center gap-2 z-20 bg-zinc-900/50 backdrop-blur-md px-2 py-1 rounded-full group-hover:bg-white/20 transition-colors">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
              </span>
              <span className="text-[9px] font-black text-orange-400 uppercase tracking-wider group-hover:text-white transition-colors">Action Required</span>
            </div>

            <FaUserCheck className="absolute -bottom-6 -right-6 text-8xl text-white opacity-5 group-hover:scale-125 group-hover:-rotate-12 transition-all duration-700 z-0" />
            <div className="bg-white/10 p-3.5 rounded-2xl group-hover:bg-white group-hover:text-orange-600 transition-all relative z-10 w-fit shadow-md">
              <FaUserCheck size={22} />
            </div>
            <div className="relative z-10">
              <div className="bg-orange-500/20 text-orange-400 text-[9px] font-black px-2 py-0.5 rounded border border-orange-500/20 mb-1 w-fit group-hover:bg-white group-hover:text-orange-600 transition-all uppercase tracking-wider">Unified Requests</div>
              <h3 className="font-black text-xl mb-0.5 tracking-tight">Approvals Hub</h3>
              <p className="text-zinc-400 text-xs group-hover:text-white/80 transition-colors">Ads, Products & KYC</p>
            </div>
          </Link>
        </motion.div>

        {/* 3. Global Wallets */}
        <motion.div variants={itemVariants}>
          <Link to="/admin/AdminWalletHistory" className="bg-zinc-950 text-white p-6 rounded-[2.2rem] flex flex-col justify-between group hover:bg-emerald-600 transition-all duration-500 relative overflow-hidden h-48 shadow-lg border border-transparent hover:border-emerald-500/50">
            <FaWallet className="absolute -bottom-6 -right-6 text-8xl text-white opacity-5 group-hover:scale-125 group-hover:rotate-12 transition-all duration-700 z-0" />
            <div className="bg-white/10 p-3.5 rounded-2xl group-hover:bg-white group-hover:text-emerald-600 transition-all relative z-10 w-fit shadow-md">
              <FaWallet size={22} />
            </div>
            <div className="relative z-10">
              <div className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded border border-emerald-500/20 mb-1 w-fit group-hover:bg-white group-hover:text-emerald-600 transition-all uppercase tracking-wider">FinTech Hub</div>
              <h3 className="font-black text-xl mb-0.5 tracking-tight">Wallet Logs</h3>
              <p className="text-zinc-400 text-xs group-hover:text-white/80 transition-colors">Global user balances & audit</p>
            </div>
          </Link>
        </motion.div>

        {/* 🌟 4. [NEW] Banners Manager */}
        <motion.div variants={itemVariants}>
          <Link to="/admin/banners" className="bg-zinc-950 text-white p-6 rounded-[2.2rem] flex flex-col justify-between group hover:bg-indigo-600 transition-all duration-500 relative overflow-hidden h-48 shadow-lg border border-transparent hover:border-indigo-500/50">
            <FaImage className="absolute -bottom-6 -right-6 text-8xl text-white opacity-5 group-hover:scale-125 group-hover:rotate-12 transition-all duration-700 z-0" />
            <div className="bg-white/10 p-3.5 rounded-2xl group-hover:bg-white group-hover:text-indigo-600 transition-all relative z-10 w-fit shadow-md">
              <FaImage size={22} />
            </div>
            <div className="relative z-10">
              <div className="bg-indigo-500/20 text-indigo-400 text-[9px] font-black px-2 py-0.5 rounded border border-indigo-500/20 mb-1 w-fit group-hover:bg-white group-hover:text-indigo-600 transition-all uppercase tracking-wider">CMS Control</div>
              <h3 className="font-black text-xl mb-0.5 tracking-tight">Banner Engine</h3>
              <p className="text-zinc-400 text-xs group-hover:text-white/80 transition-colors">Manage Homepage Carousel</p>
            </div>
          </Link>
        </motion.div>

        {/* 5. Promotional Discounts */}
        <motion.div variants={itemVariants}>
          <Link to="/admin/coupons-manger" className="bg-zinc-950 text-white p-6 rounded-[2.2rem] flex flex-col justify-between group hover:bg-pink-600 transition-all duration-500 relative overflow-hidden h-48 shadow-lg border border-transparent hover:border-pink-500/50">
            <FaTicketAlt className="absolute -bottom-6 -right-6 text-8xl text-white opacity-5 group-hover:scale-125 group-hover:rotate-12 transition-all duration-700 z-0" />
            <div className="bg-white/10 p-3.5 rounded-2xl group-hover:bg-white group-hover:text-pink-600 transition-all relative z-10 w-fit shadow-md">
              <FaTicketAlt size={22} />
            </div>
            <div className="relative z-10">
              <h3 className="font-black text-xl mb-0.5 tracking-tight">Coupons</h3>
              <p className="text-zinc-400 text-xs group-hover:text-white/80 transition-colors">Promos & Marketing campaigns</p>
            </div>
          </Link>
        </motion.div>

        {/* 6. Shipping & Logistics */}
        <motion.div variants={itemVariants}>
          <Link to="/admin/shipping" className="bg-zinc-950 text-white p-6 rounded-[2.2rem] flex flex-col justify-between group hover:bg-blue-600 transition-all duration-500 relative overflow-hidden h-48 shadow-lg border border-transparent hover:border-blue-500/50">
            <FaShippingFast className="absolute -bottom-6 -right-6 text-8xl text-white opacity-5 group-hover:translate-x-[15px] transition-all duration-700 z-0" />
            <div className="bg-white/10 p-3.5 rounded-2xl group-hover:bg-white group-hover:text-blue-600 transition-all relative z-10 w-fit shadow-md">
              <FaShippingFast size={22} />
            </div>
            <div className="relative z-10">
              <h3 className="font-black text-xl mb-0.5 tracking-tight">Logistics</h3>
              <p className="text-zinc-400 text-xs group-hover:text-white/80 transition-colors">Zone parameters & rates</p>
            </div>
          </Link>
        </motion.div>

        {/* 7. Client Communications */}
        <motion.div variants={itemVariants}>
          <Link to="/admin/inquirylist" className="bg-zinc-950 text-white p-6 rounded-[2.2rem] flex flex-col justify-between group hover:bg-purple-600 transition-all duration-500 relative overflow-hidden h-48 shadow-lg border border-transparent hover:border-purple-500/50">
            <FaHeadset className="absolute -bottom-6 -right-6 text-8xl text-white opacity-5 group-hover:scale-125 transition-all duration-700 z-0" />
            <div className="bg-white/10 p-3.5 rounded-2xl group-hover:bg-white group-hover:text-purple-600 transition-all relative z-10 w-fit shadow-md">
              <FaHeadset size={22} />
            </div>
            <div className="relative z-10">
              <h3 className="font-black text-xl mb-0.5 tracking-tight">Support Desk</h3>
              <p className="text-zinc-400 text-xs group-hover:text-white/80 transition-colors">Customer tickets & inquiries</p>
            </div>
          </Link>
        </motion.div>

        {/* 8. Pending Edits Review */}
        <motion.div variants={itemVariants}>
          <Link to="/admin/pending-edits" className="bg-zinc-950 text-white p-6 rounded-[2.2rem] flex flex-col justify-between group hover:bg-purple-600 transition-all duration-500 relative overflow-hidden h-48 shadow-lg border border-transparent hover:border-purple-500/50">
            {pendingEditsCount > 0 && (
              <div className="absolute top-5 right-5 flex items-center gap-2 z-20 bg-zinc-900/50 backdrop-blur-md px-2 py-1 rounded-full group-hover:bg-white/20 transition-colors">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-purple-500"></span>
                </span>
                <span className="text-[9px] font-black text-purple-400 uppercase tracking-wider group-hover:text-white transition-colors">{pendingEditsCount} Pending</span>
              </div>
            )}
            <FaClock className="absolute -bottom-6 -right-6 text-8xl text-white opacity-5 group-hover:scale-125 group-hover:rotate-12 transition-all duration-700 z-0" />
            <div className="bg-white/10 p-3.5 rounded-2xl group-hover:bg-white group-hover:text-purple-600 transition-all relative z-10 w-fit shadow-md">
              <FaClock size={22} />
            </div>
            <div className="relative z-10">
              <div className="bg-purple-500/20 text-purple-400 text-[9px] font-black px-2 py-0.5 rounded border border-purple-500/20 mb-1 w-fit group-hover:bg-white group-hover:text-purple-600 transition-all uppercase tracking-wider">Product Edits</div>
              <h3 className="font-black text-xl mb-0.5 tracking-tight">Pending Edits</h3>
              <p className="text-zinc-400 text-xs group-hover:text-white/80 transition-colors">Approve or reject vendor changes</p>
            </div>
          </Link>
        </motion.div>

        {/* 9. Returns Management */}
        <motion.div variants={itemVariants}>
          <Link to="/admin/returns" className="bg-zinc-950 text-white p-6 rounded-[2.2rem] flex flex-col justify-between group hover:bg-amber-600 transition-all duration-500 relative overflow-hidden h-48 shadow-lg border border-transparent hover:border-amber-500/50">
            <FaUndoAlt className="absolute -bottom-6 -right-6 text-8xl text-white opacity-5 group-hover:scale-125 group-hover:rotate-12 transition-all duration-700 z-0" />
            <div className="bg-white/10 p-3.5 rounded-2xl group-hover:bg-white group-hover:text-amber-600 transition-all relative z-10 w-fit shadow-md">
              <FaUndoAlt size={22} />
            </div>
            <div className="relative z-10">
              <h3 className="font-black text-xl mb-0.5 tracking-tight">Returns</h3>
              <p className="text-zinc-400 text-xs group-hover:text-white/80 transition-colors">Customer return requests & refunds</p>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Bottom Action Smart Financial Audit Desk */}
      <motion.div 
        variants={itemVariants}
        className="mt-10 p-8 bg-zinc-900 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden border border-white/5 shadow-2xl"
      >
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-rose-500 via-orange-500 to-emerald-500"></div>
        <div className="flex items-center gap-5 relative z-10">
          <div className="bg-orange-600/20 p-4 rounded-2xl border border-orange-600/30 shrink-0">
            <FaUndoAlt className="text-orange-500 text-3xl animate-spin" style={{ animationDuration: '10s' }} />
          </div>
          <div>
            <h3 className="font-black text-xl tracking-tight flex items-center gap-2 uppercase italic">
              Financial Audit & Safe Deduct Desk
            </h3>
            <p className="text-zinc-400 text-xs max-w-xl mt-1 leading-relaxed">
              Strict cryptographic verification protocol to prevent double-spending or human errors. Instantly adjust credit lines and pull values for cancelled nodes securely tied to specific order tokens.
            </p>
          </div>
        </div>
        <button 
          onClick={() => setIsAuditModalOpen(true)} 
          className="bg-white text-zinc-950 px-8 py-3.5 rounded-xl font-black text-xs hover:bg-orange-600 hover:text-white transition-all duration-300 shadow-xl relative z-10 active:scale-95 whitespace-nowrap uppercase tracking-wider"
        >
          Initialize Refund Audit
        </button>
      </motion.div>

      {/* Cryptographically Secure Audit Modal Layer */}
      <AnimatePresence>
        {isAuditModalOpen && (
          <div className="fixed inset-0 bg-zinc-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="ltr">
            <motion.div 
              initial={{ scale: 0.93, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.93, opacity: 0 }}
              className="bg-white rounded-[2.2rem] w-full max-w-md p-8 border border-zinc-100 shadow-2xl relative text-left"
            >
              <div className="flex items-center gap-3 text-rose-600 mb-4">
                <div className="bg-rose-50 p-3 rounded-xl"><FaShieldAlt size={18} /></div>
                <h3 className="font-black text-lg text-zinc-900 tracking-tight uppercase">Deduction Gateway</h3>
              </div>
              
              <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
                To protect both client ledger integrity and admin accountability, loose arbitrary manual deductions are disabled. Please input the targeted **Order ID token** to parse systemic value and zero balances matching the original log.
              </p>

              <form onSubmit={handleAuditSearch} className="space-y-4">
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Enter unique Order Token (e.g. 64f2a1...)" 
                    value={searchOrderId}
                    onChange={(e) => setSearchOrderId(e.target.value)}
                    required
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3.5 pl-11 pr-4 font-mono text-xs focus:outline-none focus:border-orange-500 focus:bg-white transition-all text-zinc-950 placeholder:font-sans placeholder:text-zinc-400"
                  />
                  <FaSearch className="absolute left-4 top-4 text-zinc-400" size={13} />
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setIsAuditModalOpen(false)}
                    className="w-1/2 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-all uppercase"
                  >
                    Abort & Return
                  </button>
                  <button 
                    type="submit"
                    className="w-1/2 py-3 bg-zinc-950 hover:bg-rose-600 text-white rounded-xl text-xs font-black transition-all shadow-md uppercase tracking-wide"
                  >
                    Verify & Parse
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DashboardScreen;