import React, { useState, useRef } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlus, FaTrash, FaImage, FaSpinner, FaTimesCircle, 
  FaPlayCircle, FaPauseCircle, FaLink, FaFont, FaPalette,
  FaDesktop, FaMousePointer, FaBullhorn, FaRocket, FaMagic,
  FaCheckCircle, FaExclamationTriangle, FaCloudUploadAlt
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import Button from '../../components/Button';
import { 
  useGetAdminBannersQuery, 
  useCreateBannerMutation, 
  useDeleteBannerMutation, 
  useToggleBannerStatusMutation 
} from '../../slices/bannersApiSlice';
import Loader from '../../components/Loader';
import Message from '../../components/Message';

// 🌟 Massive, Highly Curated Exotic Color Palette
const COLOR_PALETTE = [
  { label: '✨ Transparent (Pure Image 100%)', value: 'bg-transparent' },
  { label: '🔥 DKTEC Orange (Brand)', value: 'bg-gradient-to-r from-orange-600 to-orange-500' },
  { label: '🌑 DKTEC Dark (Brand)', value: 'bg-gradient-to-r from-zinc-900 to-black' },
  { label: '🌊 Ocean Depth', value: 'bg-gradient-to-r from-blue-900 via-sky-800 to-cyan-600' },
  { label: '🟣 Cyber Purple', value: 'bg-gradient-to-r from-purple-900 via-purple-700 to-fuchsia-600' },
  { label: '💎 Trust Emerald', value: 'bg-gradient-to-r from-emerald-900 to-teal-700' },
  { label: '🌅 Sunset Blaze', value: 'bg-gradient-to-r from-rose-600 to-orange-500' },
  { label: '👑 Royal Gold', value: 'bg-gradient-to-r from-amber-500 to-yellow-400' },
  { label: '🩸 Crimson Blood', value: 'bg-gradient-to-r from-red-900 to-rose-700' },
  { label: '⚙️ Industrial Slate', value: 'bg-gradient-to-r from-slate-800 to-slate-600' },
  { label: '💖 Neon Pink', value: 'bg-gradient-to-r from-pink-600 to-rose-400' },
  { label: '⚡ Electric Lime', value: 'bg-gradient-to-r from-lime-600 to-green-500' },
  { label: '🌌 Deep Space', value: 'bg-gradient-to-r from-indigo-900 via-purple-900 to-black' },
  { label: '🌋 Liquid Lava', value: 'bg-gradient-to-r from-red-600 via-orange-600 to-yellow-500' },
];

const AdminBannersScreen = () => {
  const { data: banners, isLoading, error, refetch } = useGetAdminBannersQuery();
  const [createBanner, { isLoading: isCreating }] = useCreateBannerMutation();
  const [deleteBanner, { isLoading: isDeleting }] = useDeleteBannerMutation();
  const [toggleStatus] = useToggleBannerStatusMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState(null); // 🌟 حالة جديدة للعرض اللحظي قبل الرفع
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '', subTitle: '', image: '', bgColor: 'bg-transparent', ctaText: '', ctaLink: '',
  });

  const handleToggle = async (id) => {
    try { 
      await toggleStatus(id).unwrap(); 
      toast.success('Campaign status updated! 🔄'); 
      refetch(); 
    } catch { toast.error('Failed to update visibility'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you absolutely sure you want to permanently delete this campaign?')) {
      try { 
        await deleteBanner(id).unwrap(); 
        toast.success('Banner eradicated successfully 🗑️'); 
        refetch(); 
      } catch { toast.error('Failed to delete banner'); }
    }
  };

  // 🌟 Handle Local Image Upload to Server WITH Instant Preview
  const uploadFileHandler = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 🌟 إنشاء عرض لحظي للصورة بمجرد اختيارها وقبل رفعها للسيرفر
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);

    const uploadData = new FormData();
    uploadData.append('image', file);
    
    setIsUploading(true);

    try {
      const res = await axios.post('/api/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData({ ...formData, image: res.data.image });
      toast.success('Image processed and cached securely! 🖼️');
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || 'Image upload failed');
      setLocalPreview(null); // مسح العرض لو حصل خطأ
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 🌟 تنظيف الرابط اللحظي عند إغلاق المودال عشان مياخدش مساحة من الميموري
  const closeModal = () => {
    setIsModalOpen(false);
    if (localPreview) {
      URL.revokeObjectURL(localPreview);
      setLocalPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image && !localPreview && !formData.title && !formData.subTitle) {
      return toast.warning("Provide at least an Image or a Headline to launch a banner!");
    }
    try {
      await createBanner({ ...formData, ctaLink: formData.ctaLink || '/products' }).unwrap();
      toast.success('Campaign Launched Successfully! 🚀');
      closeModal();
      setFormData({ title: '', subTitle: '', image: '', bgColor: 'bg-transparent', ctaText: '', ctaLink: '' });
      refetch();
    } catch { toast.error('Failed to create banner'); }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-orange-600 mb-4 shadow-lg"></div>
        <p className="text-zinc-500 font-black uppercase tracking-widest text-xs animate-pulse">Initializing Ad Engine...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-20 px-4 max-w-7xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-8 rounded-3xl flex flex-col items-center text-center shadow-sm">
            <FaExclamationTriangle className="text-5xl mb-4" />
            <h3 className="text-2xl font-black uppercase tracking-tight">System Error</h3>
            <p className="font-medium mt-2">{error?.data?.message || error.error}</p>
        </div>
      </div>
    );
  }

  const activeCount = banners?.filter(b => b.isActive).length || 0;

  // تحديد مصدر الصورة الفعلي للـ Preview (اللحظية أو من رابط النت)
  const displayImage = localPreview || formData.image;

  return (
    <div className="py-10 px-4 md:px-10 max-w-[100rem] mx-auto mt-16 text-left font-sans bg-[#F8F9FA] min-h-[calc(100vh-100px)]" dir="ltr">
      
      {/* 🌟 Professional Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 border-b border-zinc-200 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm">
              <FaBullhorn /> DKTEC Advertising
            </span>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
               <span className={`w-2 h-2 rounded-full shadow-sm ${activeCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
               {activeCount} Active Campaigns
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-zinc-900 tracking-tight uppercase">
            Banner <span className="text-orange-600 italic">Studio</span>
          </h1>
          <p className="text-sm font-bold text-zinc-500 mt-2">Design, deploy, and manage your global homepage carousel.</p>
        </div>
        
        <Button 
          variant="primary"
          onClick={() => setIsModalOpen(true)}
          className="w-full md:w-auto"
        >
          <FaPlus size={14} /> New Campaign
        </Button>
      </div>

      {/* 🌟 Banners Grid */}
      {banners?.length === 0 ? (
        <div className="bg-white p-16 text-center rounded-[2.5rem] border border-zinc-200 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
           <div className="bg-orange-50 p-6 rounded-full mb-6 border border-orange-100 shadow-inner">
               <FaImage className="text-orange-300 text-6xl" />
           </div>
           <h3 className="text-2xl font-black text-zinc-900 uppercase tracking-tight">Blank Canvas</h3>
           <p className="text-sm font-bold text-zinc-500 mt-2 max-w-md leading-relaxed">Your homepage hero section is currently empty. Create a striking banner to guide your customers to top deals.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {banners?.map((banner) => {
            const bHasText = banner.title || banner.subTitle || banner.ctaText;
            const bIsPureImage = !bHasText && banner.image;

            return (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              key={banner._id} 
              className={`bg-white rounded-[2rem] border overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl ${banner.isActive ? 'border-zinc-200 shadow-md' : 'border-zinc-200 opacity-70 grayscale-[30%] hover:grayscale-0'}`}
            >
              
              {/* 📺 Mini Mockup Header */}
              <div className="p-4 bg-zinc-100 border-b border-zinc-200 flex items-center gap-2 shrink-0">
                 <div className="w-3 h-3 rounded-full bg-rose-400 shadow-inner"></div>
                 <div className="w-3 h-3 rounded-full bg-amber-400 shadow-inner"></div>
                 <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-inner"></div>
                 <div className="ml-auto text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5 bg-white px-2 py-1 rounded-md shadow-sm">
                     <FaDesktop className="text-zinc-300"/> Homepage View
                 </div>
              </div>

              {/* Banner Render Engine (Mockup) */}
              <div className={`h-64 relative flex flex-col items-center justify-center p-6 text-center overflow-hidden group ${bIsPureImage ? 'bg-zinc-100' : banner.bgColor || 'bg-gray-900'}`}>
                
                {/* Image Layer */}
                {banner.image && (
                  <div 
                    className={`absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110 ${bIsPureImage ? 'opacity-100' : 'mix-blend-overlay opacity-60'}`} 
                    style={{ backgroundImage: `url('${banner.image}')` }}
                  />
                )}
                
                {/* Fallback Gradient if no image and not transparent */}
                {!banner.image && banner.bgColor !== 'bg-transparent' && (
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none"></div>
                )}
                
                {/* Text Content Layer */}
                {bHasText && (
                  <div className={`relative z-10 w-full max-w-lg transition-all duration-500 ${banner.bgColor === 'bg-transparent' && banner.image ? 'bg-black/50 backdrop-blur-md p-5 rounded-2xl border border-white/10 shadow-2xl group-hover:bg-black/60' : ''}`}>
                    {banner.title && <h3 className="text-2xl md:text-4xl font-black text-white drop-shadow-xl tracking-tight leading-tight mb-2">{banner.title}</h3>}
                    {banner.subTitle && <p className="text-sm md:text-lg font-black text-yellow-300 drop-shadow-md mb-5">{banner.subTitle}</p>}
                    {banner.ctaText && <div className="inline-block bg-white text-zinc-900 px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl">{banner.ctaText}</div>}
                  </div>
                )}
                
                {/* Status Badge overlay */}
                <div className="absolute top-4 right-4 z-20">
                   {banner.isActive ? (
                     <span className="bg-emerald-500 text-white text-[9px] font-black px-3 py-1.5 rounded-full shadow-lg uppercase tracking-wider flex items-center gap-1.5 border border-emerald-400">
                         <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span> Live
                     </span>
                   ) : (
                     <span className="bg-zinc-800/80 backdrop-blur-sm text-zinc-300 text-[9px] font-black px-3 py-1.5 rounded-full shadow-lg uppercase tracking-wider flex items-center gap-1.5 border border-zinc-600">
                         <FaPauseCircle/> Paused
                     </span>
                   )}
                </div>
              </div>

              {/* 🎛️ Action Panel */}
              <div className="p-6 flex flex-col gap-4 bg-white shrink-0 border-t border-zinc-100">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 shadow-sm flex flex-col justify-center">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><FaLink/> Target Route</p>
                    <p className="text-xs font-mono font-bold text-orange-600 truncate">{banner.ctaLink || 'N/A'}</p>
                  </div>
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 shadow-sm flex flex-col justify-center">
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><FaMousePointer/> Button Text</p>
                    <p className="text-xs font-bold text-zinc-800 truncate">{banner.ctaText || 'No Button'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 pt-3 mt-2">
                  <Button 
                    variant="secondary"
                    onClick={() => handleToggle(banner._id)}
                  >
                    {banner.isActive ? <><FaPauseCircle size={16}/> Pause Campaign</> : <><FaPlayCircle size={16}/> Activate Now</>}
                  </Button>
                  <button 
                    onClick={() => handleDelete(banner._id)}
                    disabled={isDeleting}
                    className="p-4 bg-white border border-zinc-200 text-rose-500 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm active:scale-95"
                    title="Delete Permanently"
                  >
                    <FaTrash size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          )})}
        </div>
      )}

      {/* 🌟 Master Creator Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-md z-[3000] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-6xl overflow-hidden shadow-2xl flex flex-col lg:flex-row my-auto border border-zinc-200"
            >
              
              {/* Form Side */}
              <div className="flex-1 p-8 md:p-10 border-b lg:border-b-0 lg:border-r border-zinc-200 bg-white">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-2xl md:text-3xl tracking-tight text-zinc-900">Campaign Builder</h3>
                  <button onClick={closeModal} className="text-zinc-400 hover:text-rose-500 transition-colors bg-zinc-50 p-3 rounded-full hover:bg-rose-50"><FaTimesCircle size={24}/></button>
                </div>
                
                <div className="bg-orange-50 text-orange-800 p-4 rounded-xl mb-8 text-xs font-bold border border-orange-100 flex items-start gap-3 shadow-sm">
                   <FaExclamationTriangle className="text-orange-500 mt-0.5 shrink-0" size={16} /> 
                   <p className="leading-relaxed">For a full image banner (like Amazon), upload an image, set color to <strong>Transparent</strong>, and leave text fields <strong>blank</strong>.</p>
                </div>
                
                <form id="bannerForm" onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* 🌟 Polished Image Input Section */}
                  <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 shadow-sm">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><FaImage className="text-orange-500"/> Background Image Asset</label>
                    <div className="flex flex-col gap-3">
                        <input 
                            type="text" 
                            value={formData.image} 
                            onChange={(e)=> {
                              setFormData({...formData, image: e.target.value});
                              if(!e.target.value && localPreview) setLocalPreview(null); // مسح البريفيو لو شال الرابط
                            }} 
                            className="w-full bg-white border border-zinc-200 rounded-xl p-3.5 text-sm font-mono outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:font-sans placeholder:text-zinc-400" 
                            placeholder="Enter external image URL..." 
                        />
                        <div className="flex items-center gap-3">
                            <hr className="flex-1 border-zinc-200" />
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Or Upload Local File</span>
                            <hr className="flex-1 border-zinc-200" />
                        </div>
                        <div className="relative">
                            <input 
                                type="file" 
                                id="image-file" 
                                ref={fileInputRef}
                                onChange={uploadFileHandler} 
                                className="hidden" 
                                accept="image/*"
                            />
                            <label 
                                htmlFor="image-file" 
                                className={`w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${isUploading ? 'border-orange-500 bg-orange-50' : 'border-zinc-300 hover:border-orange-500 hover:bg-orange-50 bg-white group'}`}
                            >
                                {isUploading ? (
                                    <div className="flex flex-col items-center gap-3 text-orange-600">
                                        <FaSpinner className="animate-spin text-3xl" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Uploading to Server...</span>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3 text-zinc-500 group-hover:text-orange-600 transition-colors">
                                        <FaCloudUploadAlt className="text-3xl" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Click to browse files</span>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><FaFont className="text-orange-500"/> Primary Headline <span className="text-zinc-300 font-normal">(Optional)</span></label>
                      <input type="text" value={formData.title} onChange={(e)=>setFormData({...formData, title: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm" placeholder="e.g. Mega Clearance" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><FaFont className="text-orange-500"/> Subtext / Offer <span className="text-zinc-300 font-normal">(Optional)</span></label>
                      <input type="text" value={formData.subTitle} onChange={(e)=>setFormData({...formData, subTitle: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm" placeholder="e.g. Up to 40% Off" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><FaMousePointer className="text-orange-500"/> Button Text <span className="text-zinc-300 font-normal">(Optional)</span></label>
                      <input type="text" value={formData.ctaText} onChange={(e)=>setFormData({...formData, ctaText: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm" placeholder="Shop Deals" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><FaLink className="text-orange-500"/> Target Route URL</label>
                      <input type="text" value={formData.ctaLink} onChange={(e)=>setFormData({...formData, ctaLink: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-sm font-mono outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all shadow-sm" placeholder="/products" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><FaPalette className="text-orange-500"/> Color Theme / Overlay Mode</label>
                    <div className="relative">
                        <select value={formData.bgColor} onChange={(e)=>setFormData({...formData, bgColor: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10 cursor-pointer appearance-none shadow-sm">
                        {COLOR_PALETTE.map((color, idx) => (
                            <option key={idx} value={color.value}>{color.label}</option>
                        ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">▼</div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Live Preview Side */}
              <div className="w-full lg:w-[45%] bg-zinc-950 p-8 flex flex-col justify-center items-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.1),_transparent_50%)] pointer-events-none"></div>
                
                <div className="w-full flex justify-between items-center mb-6 relative z-10">
                    <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-full border border-white/10"><FaDesktop/> Live Output Preview</h4>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5"><FaCheckCircle/> Syncing</span>
                </div>
                
                {/* Preview Frame */}
                {(() => {
                  const formHasText = formData.title || formData.subTitle || formData.ctaText;
                  const formIsPureImage = !formHasText && displayImage;
                  const formIsTransparent = formData.bgColor === 'bg-transparent';

                  return (
                  <div className={`w-full aspect-video rounded-3xl shadow-2xl relative flex flex-col items-center justify-center p-6 text-center overflow-hidden border border-white/10 z-10 transform scale-105 ${formIsPureImage ? 'bg-zinc-800' : formData.bgColor}`}>
                    
                    {displayImage && (
                      <div 
                        className={`absolute inset-0 bg-cover bg-center transition-all duration-500 ${formIsTransparent ? 'opacity-100' : 'mix-blend-overlay opacity-60'}`} 
                        style={{ backgroundImage: `url('${displayImage}')` }}
                      />
                    )}
                    
                    {formHasText && (
                      <div className={`relative z-10 w-full max-w-md transition-all duration-300 ${formIsTransparent && displayImage ? 'bg-black/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl' : ''}`}>
                        {formData.title && <h3 className="text-2xl md:text-4xl font-black text-white drop-shadow-xl tracking-tight leading-tight mb-2 break-words">{formData.title}</h3>}
                        {formData.subTitle && <h4 className="text-sm md:text-lg font-black text-yellow-300 drop-shadow-md mb-6 break-words">{formData.subTitle}</h4>}
                        {formData.ctaText && <div className="inline-block bg-white text-zinc-900 px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl">{formData.ctaText}</div>}
                      </div>
                    )}

                    {!formHasText && !displayImage && (
                       <div className="relative z-10 flex flex-col items-center text-white/30 bg-black/20 p-6 rounded-3xl backdrop-blur-sm border border-white/5">
                          <FaMagic className="text-4xl mb-3" />
                          <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Input Data</p>
                       </div>
                    )}
                  </div>
                  )
                })()}

                <div className="mt-12 w-full relative z-10">
                  <Button 
                    type="submit" 
                    variant="primary"
                    form="bannerForm" 
                    loading={isCreating || isUploading}
                    className="w-full"
                  >
                    <FaRocket className="text-lg" /> Deploy to Production
                  </Button>
                  <p className="text-[9px] font-bold text-zinc-500 text-center mt-4 uppercase tracking-widest">Updates instantly reflect on the global storefront.</p>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminBannersScreen;