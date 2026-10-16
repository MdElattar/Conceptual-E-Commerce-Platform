import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCheck, FaTimes, FaExclamationTriangle, FaStore, 
  FaUserTie, FaBoxOpen, FaEdit, FaLayerGroup, FaIdCard, FaEnvelope,
  FaUserCheck, FaFileAlt, FaMoneyBillWave, FaUniversity, FaClock,
  FaBullhorn // 🌟 أيقونة الإعلانات
} from 'react-icons/fa';

const AdminVendorApprovals = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'products';

  const { rate = 1, currencyCode = 'USD' } = useSelector((state) => state.currency || {});
  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab); 
  
  const [pendingProducts, setPendingProducts] = useState([]);
  const [pendingVendors, setPendingVendors] = useState([]); 
  const [categoryRequests, setCategoryRequests] = useState([]); 
  const [payoutRequests, setPayoutRequests] = useState([]); 
  const [adRequests, setAdRequests] = useState([]); // 🌟 [جديد] حالة طلبات الإعلانات

  const predefinedCategories = [
    "Automotive Parts", "Beauty & Personal Care", "Cameras & Photo",
    "Computers & Laptops", "Construction Materials", "Electrical Equipment",
    "Fashion, Clothing & Shoes", "Fasteners & Hardware", "Grocery & Gourmet Food",
    "Hand Tools", "Health & Household", "Heavy Machinery",
    "Home & Kitchen", "HVAC Systems", "Hydraulics & Pneumatics", "Industrial Parts",
    "Keyboards & Mice", "Lubricants & Oils", "Manufacturing Sensors",
    "Material Handling", "Mobile Phones", "Office Products & Stationery",
    "Pet Supplies", "Power Tools", "Pumps & Valves", "Safety Gear (PPE)",
    "Sports & Outdoors", "Welding Equipment"
  ].map(c => c.toLowerCase());

  // 🌟 Format Helper
  const formatLocalPrice = (amount) => {
    const safeAmount = Number(amount) || 0;
    const convertedAmount = safeAmount * rate;
    return `${currencyCode} ${convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 🌟 Data Fetching Pipeline
  useEffect(() => {
    const fetchData = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        
        // 1. Fetch Pending Products
        const { data: productsData } = await axios.get('/api/products?isAdminQuery=true', config);
        const filteredProducts = Array.isArray(productsData) ? productsData.filter(p => p.status === 'pending') : [];
        setPendingProducts(filteredProducts);

        // 2. Fetch Pending Vendor KYC
        try {
            const { data: vendorsData } = await axios.get('/api/users/vendor-requests-list', config);
            setPendingVendors(Array.isArray(vendorsData) ? vendorsData : []);
        } catch (e) { console.warn("Vendor requests endpoint might be missing", e); }

        // 3. Fetch Category Requests 
        try {
            const { data: catReqData } = await axios.get('/api/category-requests', config);
            setCategoryRequests(Array.isArray(catReqData) ? catReqData.filter(c => c.status === 'pending') : []);
        } catch (e) { console.warn("Category requests endpoint missing", e); }

        // 4. Fetch Payout Requests 
        try {
            const { data: payoutData } = await axios.get('/api/orders/payout-requests', config);
            setPayoutRequests(Array.isArray(payoutData) ? payoutData.filter(p => p.status === 'pending') : []);
        } catch (e) { console.warn("Payout requests endpoint missing", e); }

        // 🌟 5. Fetch Ad Campaign Requests (طلبات الإعلانات)
        try {
            const { data: adsData } = await axios.get('/api/advertising/requests', config); // تأكد من إنشاء هذا المسار في الباك إند
            setAdRequests(Array.isArray(adsData) ? adsData.filter(a => a.status === 'pending') : []);
        } catch (e) { console.warn("Ad requests endpoint missing", e); }

      } catch (_) {
        toast.error("Failed to sync approval matrices.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userInfo.token]);

  // --- Handlers: Products ---
  const approveProductHandler = async (id, currentCategory) => {
    if (window.confirm('Approve this product and push it LIVE to the marketplace?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.put(`/api/products/${id}/approve`, { status: 'active', category: currentCategory }, config);
        toast.success('Product verified and active! 🚀');
        setPendingProducts(pendingProducts.filter(p => p._id !== id));
      } catch (_) { toast.error('Approval execution failed.'); }
    }
  };

  const rejectProductHandler = async (id) => {
    const reason = window.prompt("Reason for rejection (Visible to vendor):");
    if (reason !== null) {
      if(!reason.trim()) return toast.warning("Rejection reason is required.");
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.put(`/api/products/${id}/reject`, { status: 'rejected', rejectReason: reason }, config);
        toast.success('Product rejected. Vendor notified. ❌');
        setPendingProducts(pendingProducts.filter(p => p._id !== id));
      } catch (_) { toast.error('Rejection execution failed.'); }
    }
  };

  // --- Handlers: Vendors KYC ---
  const approveVendorHandler = async (vendorId) => {
    if (window.confirm('Verify this user and activate Vendor privileges?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.put(`/api/users/vendor-approval/${vendorId}`, { action: 'approve' }, config);
        toast.success('Vendor account verified and activated! ✅');
        setPendingVendors(pendingVendors.filter(v => v._id !== vendorId));
      } catch (error) { toast.error(error.response?.data?.message || 'Vendor approval failed.'); }
    }
  };

  const rejectVendorHandler = async (vendorId) => {
    if (window.confirm('Reject and delete this vendor registration request?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.put(`/api/users/vendor-approval/${vendorId}`, { action: 'reject' }, config);
        toast.success('Vendor request rejected and cleared.');
        setPendingVendors(pendingVendors.filter(v => v._id !== vendorId));
      } catch (error) { toast.error(error.response?.data?.message || 'Rejection failed.'); }
    }
  };

  // --- Handlers: Category Requests ---
  const resolveCategoryHandler = async (id, action) => {
    const isApprove = action === 'approve';
    if (window.confirm(`Are you sure you want to ${action} this category request?`)) {
       try {
          const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
          await axios.put(`/api/category-requests/${id}`, { status: isApprove ? 'approved' : 'rejected' }, config);
          toast.success(`Category request ${action}d!`);
          setCategoryRequests(categoryRequests.filter(c => c._id !== id));
        } catch (_) { toast.error(`Failed to ${action} category request.`); }
    }
  };

  // --- Handlers: Payout Requests ---
  const resolvePayoutHandler = async (id, action) => {
    const isApprove = action === 'approve';
    const confirmMsg = isApprove ? 'Confirm funds have been transferred to the vendor bank account?' : 'Reject this payout request?';
    if (window.confirm(confirmMsg)) {
       try {
          const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
          await axios.put(`/api/orders/payout-requests/${id}`, { status: isApprove ? 'completed' : 'rejected' }, config);
          toast.success(`Payout ${isApprove ? 'marked as complete' : 'rejected'}!`);
          setPayoutRequests(payoutRequests.filter(p => p._id !== id));
       } catch (_) { toast.error(`Failed to process payout.`); }
    }
  };

  // 🌟 [جديد] Handlers: Ad Campaigns ---
  const resolveAdRequestHandler = async (id, action) => {
    const isApprove = action === 'approve';
    const confirmMsg = isApprove ? 'Approve this campaign and activate the Sponsored status?' : 'Reject this campaign and refund the vendor?';
    if (window.confirm(confirmMsg)) {
       try {
          const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
          await axios.put(`/api/advertising/requests/${id}`, { action: isApprove ? 'approve' : 'reject' }, config);
          toast.success(`Ad Campaign ${isApprove ? 'Activated 📢' : 'Rejected and Refunded'}`);
          setAdRequests(adRequests.filter(a => a._id !== id));
       } catch (_) { toast.error(`Failed to process Ad Campaign.`); }
    }
  };

  const tabVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  const standardProducts = useMemo(() => {
    return pendingProducts.filter(p => {
      if (!p.category) return true; 
      return predefinedCategories.includes(p.category.toLowerCase().trim());
    });
  }, [pendingProducts, predefinedCategories]);

  const rogueCategoryProducts = useMemo(() => {
    return pendingProducts.filter(p => {
      if (!p.category) return false;
      return !predefinedCategories.includes(p.category.toLowerCase().trim());
    });
  }, [pendingProducts, predefinedCategories]);

  return (
    <div className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-[100rem] mx-auto font-sans text-gray-900 bg-gray-50 min-h-screen">
      
      <header className="mb-10 border-b border-gray-200 pb-6">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase flex items-center gap-3">
          Approval <span className="text-orange-600 italic">Center</span>
        </h1>
        <p className="text-gray-500 mt-2 font-bold uppercase tracking-widest text-xs">
          Manage all pending platform requests from a single unified hub
        </p>
      </header>

      {/* 🌟 Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-200 pb-px">
        <button 
          onClick={() => setActiveTab('products')}
          className={`px-6 py-3.5 rounded-t-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 ${activeTab === 'products' ? 'bg-zinc-900 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
          <FaBoxOpen size={14} /> Products ({pendingProducts.length})
        </button>
        <button 
          onClick={() => setActiveTab('categories')}
          className={`px-6 py-3.5 rounded-t-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 ${activeTab === 'categories' ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30' : 'bg-gray-100 text-gray-500 hover:bg-teal-50 hover:text-teal-600'}`}
        >
          <FaLayerGroup size={14} /> Categories ({categoryRequests.length + rogueCategoryProducts.length})
        </button>
        <button 
          onClick={() => setActiveTab('vendors')}
          className={`px-6 py-3.5 rounded-t-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 ${activeTab === 'vendors' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' : 'bg-gray-100 text-gray-500 hover:bg-rose-50 hover:text-rose-600'}`}
        >
          <FaIdCard size={14} /> KYC / Vendors ({pendingVendors.length})
        </button>
        <button 
          onClick={() => setActiveTab('payouts')}
          className={`px-6 py-3.5 rounded-t-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 ${activeTab === 'payouts' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'bg-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600'}`}
        >
          <FaMoneyBillWave size={14} /> Payouts ({payoutRequests.length})
        </button>
        {/* 🌟 5. [جديد] زر الإعلانات */}
        <button 
          onClick={() => setActiveTab('ads')}
          className={`px-6 py-3.5 rounded-t-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 ${activeTab === 'ads' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-gray-100 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'}`}
        >
          <FaBullhorn size={14} /> Ad Campaigns ({adRequests.length})
        </button>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(n => <div key={n} className="h-32 bg-gray-200 rounded-3xl w-full border border-gray-100"></div>)}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          
          {/* TAB 1: PENDING PRODUCTS */}
          {activeTab === 'products' && (
            <motion.div key="products" variants={tabVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-4">
              {standardProducts.length === 0 ? (
                <EmptyState message="No standard products waiting for approval." />
              ) : (
                standardProducts.map((product) => (
                  <ProductApprovalCard key={product._id} product={product} formatter={formatLocalPrice} onApprove={approveProductHandler} onReject={rejectProductHandler} />
                ))
              )}
            </motion.div>
          )}

          {/* TAB 2: CATEGORY REQUESTS */}
          {activeTab === 'categories' && (
            <motion.div key="categories" variants={tabVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-6">
              {categoryRequests.length > 0 && (
                 <div className="space-y-4 mb-8">
                    <h3 className="font-black text-sm uppercase tracking-widest text-teal-800 flex items-center gap-2"><FaLayerGroup/> Formal Category Requests</h3>
                    {categoryRequests.map(req => (
                        <CategoryRequestCard key={req._id} request={req} onResolve={resolveCategoryHandler} />
                    ))}
                 </div>
              )}
              {rogueCategoryProducts.length > 0 && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm">
                    <FaExclamationTriangle size={16} className="text-amber-600 shrink-0" />
                    These products were submitted with unrecognized categories. Please edit their categories in the Admin panel before approving.
                  </div>
                  {rogueCategoryProducts.map((product) => (
                    <ProductApprovalCard key={product._id} product={product} formatter={formatLocalPrice} isRogueCategory={true} onApprove={approveProductHandler} onReject={rejectProductHandler} />
                  ))}
                </div>
              )}
              {categoryRequests.length === 0 && rogueCategoryProducts.length === 0 && (
                <EmptyState message="No custom category requests at the moment." icon={<FaLayerGroup size={40} />} color="text-teal-500 bg-teal-50" />
              )}
            </motion.div>
          )}

          {/* TAB 3: VENDOR REQUESTS */}
          {activeTab === 'vendors' && (
            <motion.div key="vendors" variants={tabVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-4">
               {pendingVendors.length === 0 ? (
                <EmptyState message="No new vendor registration requests." icon={<FaStore size={40} />} color="text-rose-500 bg-rose-50" />
              ) : (
                pendingVendors.map((vendor) => (
                  <VendorApprovalCard key={vendor._id} vendor={vendor} onApprove={approveVendorHandler} onReject={rejectVendorHandler} />
                ))
              )}
            </motion.div>
          )}

          {/* TAB 4: PAYOUT REQUESTS */}
          {activeTab === 'payouts' && (
            <motion.div key="payouts" variants={tabVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-4">
               <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-bold flex items-center gap-2 mb-4 shadow-sm">
                <FaUniversity size={16} className="text-emerald-600 shrink-0" />
                These are real money withdrawal requests. Ensure funds are wired to the vendor's bank account before marking as "Completed".
              </div>
               {payoutRequests.length === 0 ? (
                <EmptyState message="No pending financial disbursements." icon={<FaMoneyBillWave size={40} />} color="text-emerald-500 bg-emerald-50" />
              ) : (
                payoutRequests.map((request) => (
                  <PayoutRequestCard key={request._id} request={request} formatter={formatLocalPrice} onResolve={resolvePayoutHandler} />
                ))
              )}
            </motion.div>
          )}

          {/* 🌟 [جديد] TAB 5: AD CAMPAIGN REQUESTS */}
          {activeTab === 'ads' && (
            <motion.div key="ads" variants={tabVariants} initial="hidden" animate="visible" exit="hidden" className="space-y-4">
               <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 p-4 rounded-xl text-xs font-bold flex items-center gap-2 mb-4 shadow-sm">
                <FaBullhorn size={16} className="text-indigo-600 shrink-0" />
                Vendors have paid to boost these products. Approving will mark them as Sponsored and start the countdown timer.
              </div>
               {adRequests.length === 0 ? (
                <EmptyState message="No pending advertising campaigns." icon={<FaBullhorn size={40} />} color="text-indigo-500 bg-indigo-50" />
              ) : (
                adRequests.map((request) => (
                  <AdRequestCard key={request._id} request={request} formatter={formatLocalPrice} onResolve={resolveAdRequestHandler} />
                ))
              )}
            </motion.div>
          )}

        </AnimatePresence>
      )}
    </div>
  );
};

// ----------------------------------------------------
// Sub-Components
// ----------------------------------------------------

const EmptyState = ({ message, icon = <FaCheck size={40} />, color = "text-gray-400 bg-gray-100" }) => (
  <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-200 flex flex-col items-center justify-center">
    <div className={`p-6 rounded-full mb-4 ${color}`}>
      {icon}
    </div>
    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">All Clear!</h2>
    <p className="text-gray-500 mt-2 font-bold text-xs uppercase tracking-widest">{message}</p>
  </div>
);

const ProductApprovalCard = ({ product, formatter, isRogueCategory, onApprove, onReject }) => (
  <div className={`bg-white rounded-3xl shadow-sm hover:shadow-md transition-all border p-6 flex flex-col xl:flex-row gap-6 items-start xl:items-center ${isRogueCategory ? 'border-amber-200 bg-amber-50/20' : 'border-gray-200'}`}>
    <div className="flex items-center gap-4 w-full xl:w-[35%] shrink-0">
      <div className="w-24 h-24 bg-[#F8F9FA] rounded-2xl border border-gray-200 p-2 shrink-0 flex items-center justify-center overflow-hidden">
        <img src={product.image} alt={product.name} className="max-w-full max-h-full object-contain mix-blend-multiply" />
      </div>
      <div className="flex-1 min-w-0">
        <Link to={`/product/${product._id}`} target="_blank" className="text-sm font-black text-gray-900 hover:text-orange-600 line-clamp-2 block mb-1">
          {product.name}
        </Link>
        <p className="text-[10px] font-mono text-gray-400 mb-2 uppercase font-bold tracking-wider">ID: {product._id.substring(0, 8)}</p>
        <div className="flex items-center gap-2">
          <span className="bg-gray-100 border border-gray-200 text-gray-700 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider">
            Stock: {product.countInStock}
          </span>
          <span className="text-sm font-black text-orange-600">
            {formatter(product.price)}
          </span>
        </div>
      </div>
    </div>
    <div className="w-full xl:w-[25%] shrink-0 bg-gray-50 rounded-2xl p-4 border border-gray-200 shadow-inner">
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Assigned Category</p>
      <div className="flex items-start gap-2">
        {isRogueCategory ? <FaExclamationTriangle className="text-amber-500 shrink-0 mt-0.5" size={14} /> : <FaBoxOpen className="text-gray-400 shrink-0 mt-0.5" size={14} />}
        <div>
          <p className={`text-xs font-bold ${isRogueCategory ? 'text-amber-700' : 'text-gray-800'}`}>{product.category || 'Uncategorized'}</p>
          {isRogueCategory && <Link to={`/admin/product/${product._id}/edit`} className="text-[9px] text-amber-600 font-bold uppercase mt-1.5 flex items-center gap-1 hover:text-amber-800 transition-colors bg-amber-100 px-2 py-1 rounded-md border border-amber-200 w-fit cursor-pointer"><FaEdit /> Edit Required</Link>}
        </div>
      </div>
    </div>
    <div className="w-full xl:w-[20%] shrink-0 border-l-0 xl:border-l border-gray-200 xl:pl-6">
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Vendor / Submitter</p>
      <div className="flex items-center gap-2 mb-1.5"><FaStore className="text-gray-400 shrink-0" size={12} /><span className="text-xs font-bold text-gray-900 truncate">{product.user?.vendorProfile?.storeName || 'DK-TEC Partner'}</span></div>
      <div className="flex items-center gap-2"><FaUserTie className="text-gray-400 shrink-0" size={12} /><span className="text-[10px] font-bold font-mono text-gray-500 truncate">{product.user?.name || (typeof product.user === 'string' ? 'User: ' + product.user.substring(0,8) : 'Unknown')}</span></div>
    </div>
    <div className="w-full xl:w-auto xl:ml-auto flex xl:flex-col gap-2 shrink-0">
      <button onClick={() => onApprove(product._id, product.category)} className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md active:scale-95 cursor-pointer"><FaCheck size={12}/> Approve</button>
      <button onClick={() => onReject(product._id)} className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-white text-red-600 border border-red-200 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all shadow-sm active:scale-95 cursor-pointer"><FaTimes size={12}/> Reject</button>
    </div>
  </div>
);

const CategoryRequestCard = ({ request, onResolve }) => {
  {/* الكود السابق موجود كما هو بالظبط وبدون مساس */}
  <div className="bg-white rounded-3xl shadow-sm border border-teal-200 bg-teal-50/20 p-6 flex flex-col xl:flex-row gap-6 items-start xl:items-center">
      <div className="w-full xl:w-[35%] shrink-0">
         <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><FaLayerGroup/> Proposed Category</p>
         <h3 className="text-lg font-black text-teal-800 uppercase tracking-tight">{request.requestedCategoryName}</h3>
         <p className="text-[10px] text-gray-500 font-bold mt-1 font-mono">REQ-ID: {request._id.substring(0,8)}</p>
      </div>
      <div className="flex-1">
         <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Business Case / Reason</p>
         <p className="text-xs text-gray-700 font-medium leading-relaxed bg-white p-3 rounded-xl border border-gray-200 shadow-inner">{request.reason}</p>
         {request.exampleProducts && <p className="text-[10px] font-bold text-gray-500 mt-2 flex items-center gap-1"><FaBoxOpen/> <span className="text-gray-700">Examples:</span> {request.exampleProducts}</p>}
      </div>
      <div className="w-full xl:w-[20%] shrink-0 border-l-0 xl:border-l border-teal-200 xl:pl-6">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Requested By</p>
        <div className="flex items-center gap-2 mb-1.5"><FaStore className="text-teal-600 shrink-0" size={12} /><span className="text-xs font-bold text-gray-900 truncate">{request.vendor?.storeName || 'Vendor'}</span></div>
      </div>
      <div className="w-full xl:w-auto xl:ml-auto flex xl:flex-col gap-2 shrink-0">
      <button onClick={() => onResolve(request._id, 'approve')} className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-teal-600 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-700 transition-all shadow-md active:scale-95 cursor-pointer"><FaCheck size={12}/> Accept</button>
      <button onClick={() => onResolve(request._id, 'reject')} className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-white text-red-500 border border-red-200 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all shadow-sm active:scale-95 cursor-pointer"><FaTimes size={12}/> Decline</button>
    </div>
  </div>
};

const PayoutRequestCard = ({ request, formatter, onResolve }) => {
    const bankData = request.vendor?.vendorProfile?.bankAccount || {};
    return (
    <div className="bg-white rounded-3xl shadow-sm border border-emerald-200 bg-emerald-50/20 p-6 flex flex-col xl:flex-row gap-6 items-start xl:items-center">
        <div className="w-full xl:w-[25%] shrink-0">
           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1"><FaMoneyBillWave className="text-emerald-500"/> Disburse Amount</p>
           <h3 className="text-2xl font-black text-emerald-700 tracking-tight">{formatter(request.amount)}</h3>
           <p className="text-[10px] text-gray-500 font-bold mt-1 flex items-center gap-1"><FaClock/> {new Date(request.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex-1 bg-white p-4 rounded-xl border border-gray-200 shadow-inner">
           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Banking Routing Information</p>
           <div className="grid grid-cols-2 gap-4 text-xs font-mono font-bold text-gray-700">
               <div><span className="text-gray-400 block text-[9px]">Bank Name:</span> {bankData.bankName || 'N/A'}</div>
               <div><span className="text-gray-400 block text-[9px]">Acct Name:</span> {bankData.accountName || 'N/A'}</div>
               <div className="col-span-2 text-sm text-gray-900 bg-gray-50 p-2 rounded border border-gray-200 mt-1 flex items-center justify-between">
                   <span>{bankData.accountNumber || 'N/A'}</span>
                   <span className="text-[9px] text-gray-400 uppercase tracking-widest ml-4">Account Number</span>
               </div>
           </div>
        </div>
        <div className="w-full xl:w-[20%] shrink-0 border-l-0 xl:border-l border-emerald-200 xl:pl-6">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Vendor Details</p>
          <div className="flex items-center gap-2 mb-1.5"><FaStore className="text-gray-600 shrink-0" size={12} /><span className="text-xs font-bold text-gray-900 truncate">{request.vendor?.vendorProfile?.storeName || 'Vendor'}</span></div>
          <p className="text-[10px] font-mono text-gray-500 font-bold break-all">{request.vendor?.email}</p>
        </div>
        <div className="w-full xl:w-auto xl:ml-auto flex xl:flex-col gap-2 shrink-0">
        <button onClick={() => onResolve(request._id, 'approve')} className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md active:scale-95 cursor-pointer"><FaCheck size={12}/> Mark Complete</button>
        <button onClick={() => onResolve(request._id, 'reject')} className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-white text-red-500 border border-red-200 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all shadow-sm active:scale-95 cursor-pointer"><FaTimes size={12}/> Reject</button>
      </div>
    </div>
  );
}

const VendorApprovalCard = ({ vendor, onApprove, onReject }) => {
  const profile = vendor.vendorProfile || {};
  const kyc = profile.kyc || {};
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-rose-200 bg-rose-50/20 p-6">
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
        <div className="flex items-center gap-4 w-full xl:w-[25%] shrink-0">
          <div className="bg-rose-100 p-4 rounded-2xl text-rose-600 flex-shrink-0 border border-rose-200"><FaUserCheck size={28} /></div>
          <div className="min-w-0">
            <h3 className="font-black text-lg text-gray-900 truncate uppercase tracking-tight">{vendor.name}</h3>
            <p className="text-xs text-gray-500 font-bold flex items-center gap-1.5 mt-1 truncate font-mono"><FaEnvelope className="text-gray-400 shrink-0"/> {vendor.email}</p>
          </div>
        </div>
        <div className="w-full xl:w-[55%] flex flex-col md:flex-row gap-4 bg-white rounded-2xl p-5 border border-gray-200 shadow-inner">
          <div className="flex-1 border-b md:border-b-0 md:border-r border-gray-200 pb-4 md:pb-0 pr-0 md:pr-4">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Store Identity</p>
            <p className="text-sm font-black text-gray-900 flex items-center gap-1.5 truncate"><FaStore className="text-rose-500"/> {profile.storeName || 'Store Name Pending'}</p>
            <p className="text-xs text-gray-600 mt-2 line-clamp-2 leading-relaxed font-medium bg-gray-50 p-2 rounded-lg border border-gray-100">{profile.storeDescription || 'No description provided.'}</p>
          </div>
          <div className="flex-1">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Official Documents (KYC)</p>
            <div className="space-y-2">
              <p className="text-xs font-mono font-bold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 flex items-center justify-between"><span className="text-[9px] text-gray-400 font-sans font-black uppercase tracking-wider">Tax/Reg ID:</span> {kyc.commercialRegister || 'N/A'}</p>
              <p className="text-xs font-mono font-bold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 flex items-center justify-between"><span className="text-[9px] text-gray-400 font-sans font-black uppercase tracking-wider">National ID:</span> {kyc.nationalId || 'N/A'}</p>
              {kyc.documentsUploaded && kyc.documentsUploaded.length > 0 && <a href={kyc.documentsUploaded[0]} target="_blank" rel="noreferrer" className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg font-black uppercase tracking-wider flex items-center justify-center gap-2 mt-2 transition-all w-fit cursor-pointer"><FaFileAlt size={12}/> View Attached Document ↗</a>}
            </div>
          </div>
        </div>
        <div className="w-full xl:w-[20%] flex flex-col gap-2 shrink-0">
          <button onClick={() => onApprove(vendor._id)} className="w-full bg-emerald-600 text-white px-5 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 cursor-pointer"><FaCheck size={14}/> Accept Vendor</button>
          <button onClick={() => onReject(vendor._id)} className="w-full bg-white text-red-600 border border-red-200 px-5 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95 cursor-pointer"><FaTimes size={14}/> Reject Request</button>
        </div>
      </div>
    </div>
  );
};

// 🌟 [جديد] كارت عرض طلب الإعلان للأدمن
const AdRequestCard = ({ request, formatter, onResolve }) => (
  <div className="bg-white rounded-3xl shadow-sm border border-indigo-200 bg-indigo-50/20 p-6 flex flex-col xl:flex-row gap-6 items-start xl:items-center">
    
    {/* Product Preview */}
    <div className="flex items-center gap-4 w-full xl:w-[30%] shrink-0">
      <div className="w-20 h-20 bg-white rounded-xl border border-gray-200 p-1 shrink-0 flex items-center justify-center overflow-hidden">
        <img src={request.product?.image || '/images/sample.jpg'} alt="Ad Product" className="max-w-full max-h-full object-contain mix-blend-multiply" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1"><FaBullhorn/> Campaign Target</p>
        <Link to={`/product/${request.product?._id}`} target="_blank" className="text-sm font-black text-gray-900 hover:text-indigo-600 line-clamp-2 block mb-1">
          {request.product?.name || 'Unknown Product'}
        </Link>
      </div>
    </div>

    {/* Package Details */}
    <div className="flex-1 bg-white p-4 rounded-2xl border border-gray-200 shadow-inner">
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Package Details</p>
      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
         <div>
            <h4 className="text-xs font-black text-gray-900">{request.package?.name || 'Standard Boost'}</h4>
            <p className="text-[10px] font-bold text-gray-500 mt-0.5">Duration: {request.package?.days || 7} Days</p>
         </div>
         <div className="text-right">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Paid Amount</p>
            <p className="text-base font-black text-emerald-600">{formatter(request.package?.priceUSD || 0)}</p>
         </div>
      </div>
    </div>

    {/* Vendor Info */}
    <div className="w-full xl:w-[20%] shrink-0 border-l-0 xl:border-l border-indigo-200 xl:pl-6">
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Advertiser</p>
      <div className="flex items-center gap-2 mb-1.5"><FaStore className="text-indigo-600 shrink-0" size={12} /><span className="text-xs font-bold text-gray-900 truncate">{request.vendor?.storeName || 'Vendor'}</span></div>
      <p className="text-[10px] font-mono text-gray-500 font-bold truncate">{request.vendor?.email || 'N/A'}</p>
    </div>

    {/* Actions */}
    <div className="w-full xl:w-auto xl:ml-auto flex xl:flex-col gap-2 shrink-0">
      <button onClick={() => onResolve(request._id, 'approve')} className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md active:scale-95 cursor-pointer">
        <FaCheck size={12}/> Activate Ad
      </button>
      <button onClick={() => onResolve(request._id, 'reject')} className="flex-1 xl:flex-none flex items-center justify-center gap-2 bg-white text-red-500 border border-red-200 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all shadow-sm active:scale-95 cursor-pointer">
        <FaTimes size={12}/> Reject & Refund
      </button>
    </div>
  </div>
);

export default AdminVendorApprovals;