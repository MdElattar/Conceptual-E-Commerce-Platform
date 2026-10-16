import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPlus, FaTrash, FaArrowLeft, FaCloudUploadAlt,
  FaPalette, FaRulerCombined, FaBalanceScale, FaImage, FaTag, FaInfoCircle,
  FaBarcode, FaLayerGroup, FaExclamationTriangle, FaSave, FaMagic,
  FaSearch, FaClock
} from 'react-icons/fa';
import { useCreateProductMutation } from '../slices/productsApiSlice';

// 🌟 Local Storage Key for Smart Draft
const DRAFT_KEY = 'vendor_product_draft';

const VendorProductCreate = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const { rate = 1, symbol = '$', currencyCode = 'USD' } = useSelector((state) => state.currency || {});

  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();

  // --- Form State ---
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: '',
    price: '',
    countInStock: '',
    weight: '',
    description: '',
    sku: '',
    colors: '',
    sizes: '',
    features: '',
    image: '',
    images: [],
    specs: [{ label: '', value: '' }],
    dynamicAttributes: [{ key: '', value: '' }],
    // SEO Fields
    metaTitle: '',
    metaDescription: '',
    seoKeywords: ''
  });

  const [uploading, setUploading] = useState(false);
  const [showDraftNotice, setShowDraftNotice] = useState(false);

  const predefinedCategories = [
    "Automotive Parts", "Beauty & Personal Care", "Cameras & Photo",
    "Computers & Laptops", "Construction Materials", "Electrical Equipment",
    "Fashion, Clothing & Shoes", "Fasteners & Hardware", "Grocery & Gourmet Food",
    "Hand Tools", "Health & Household", "Heavy Machinery",
    "Home & Kitchen", "HVAC Systems", "Hydraulics & Pneumatics", "Industrial Parts"
  ].sort(); 

  // --- 🌟 Smart Draft System ---
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      setShowDraftNotice(true);
    }
  }, []);

  // Auto-save debounced
  useEffect(() => {
    const handler = setTimeout(() => {
      if (formData.name.trim().length > 0) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
      }
    }, 1500);
    return () => clearTimeout(handler);
  }, [formData]);

  const loadDraft = () => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      setFormData(JSON.parse(savedDraft));
      toast.success("Draft restored successfully!");
    }
    setShowDraftNotice(false);
  };

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setShowDraftNotice(false);
    toast.info("Draft discarded.");
  };

  // --- 🌟 Product Quality Score Engine ---
  const qualityScore = useMemo(() => {
    let score = 0;
    if (formData.name.length > 10) score += 15;
    if (formData.description.length > 50) score += 20;
    if (formData.image) score += 15;
    if (formData.images.length >= 2) score += 10;
    if (formData.brand && formData.sku) score += 10;
    if (formData.specs[0].label !== '') score += 10;
    if (formData.metaTitle && formData.seoKeywords) score += 20;
    return Math.min(score, 100);
  }, [formData]);

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // --- Handlers ---
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const generateAutoSKU = () => {
    if (!formData.name || !formData.brand) {
      toast.info("Please fill Name and Brand first to generate a SKU");
      return;
    }
    const cleanBrand = formData.brand.toUpperCase().replace(/\s+/g, '-').slice(0, 3);
    const cleanName = formData.name.toUpperCase().replace(/\s+/g, '-').slice(0, 4);
    const randomId = Math.floor(1000 + Math.random() * 9000);
    handleInputChange('sku', `${cleanBrand}-${cleanName}-${randomId}`);
    toast.success("Professional SKU generated! 🎯");
  };

  const formatLocalPrice = (amount) => {
    const safeAmount = Number(amount) || 0;
    const convertedAmount = safeAmount * rate;
    return `${currencyCode} ${convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const uploadFileHandler = async (e, isGallery = false) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      return toast.error("File size exceeds 5MB limit.");
    }

    const uploadData = new FormData();
    uploadData.append('image', file);
    setUploading(true);
    const uploadToastId = toast.loading(isGallery ? "Adding to gallery..." : "Uploading primary image...");

    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.post('/api/upload', uploadData, config);

      if (isGallery) {
        setFormData(prev => ({ ...prev, images: [...prev.images, data] }));
      } else {
        handleInputChange('image', data);
      }
      toast.update(uploadToastId, { render: "Image uploaded successfully!", type: "success", isLoading: false, autoClose: 3000 });
    } catch {
      toast.update(uploadToastId, { render: "Image upload failed.", type: "error", isLoading: false, autoClose: 4000 });
    } finally {
      setUploading(false);
    }
  };

  const removeGalleryImage = (indexToRemove) => {
    setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const updateDynamicArray = (arrayName, index, field, value) => {
    setFormData(prev => {
        const newArray = [...prev[arrayName]];
        newArray[index][field] = value;
        return { ...prev, [arrayName]: newArray };
    });
  };
  
  const addDynamicField = (arrayName, emptyObj) => {
    setFormData(prev => ({ ...prev, [arrayName]: [...prev[arrayName], emptyObj] }));
  };

  const removeDynamicField = (arrayName, index) => {
    setFormData(prev => ({ ...prev, [arrayName]: prev[arrayName].filter((_, i) => i !== index) }));
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (qualityScore < 50) {
        if(!window.confirm("Product quality score is low. This might delay admin approval. Submit anyway?")) return;
    }

    if (!formData.category) return toast.warning("Please select a category.");
    if (!formData.image) return toast.warning("A primary product image is required.");

    try {
      const formatArray = (str) => str.split(',').map(item => item.trim()).filter(item => item !== "");

      // 🌟 Send Exact USD Base Values, Backend enforces status 'pending'
      const productPayload = {
        name: formData.name, 
        price: Number(formData.price), // USD Base
        image: formData.image, 
        brand: formData.brand,
        category: formData.category, 
        description: formData.description,
        countInStock: Number(formData.countInStock), 
        weight: Number(formData.weight),
        features: formatArray(formData.features), 
        colors: formatArray(formData.colors),
        sizes: formatArray(formData.sizes),
        specs: formData.specs.filter(s => s.label.trim() !== "" && s.value.trim() !== ""),
        images: formData.images, 
        sku: formData.sku,
        dynamicAttributes: formData.dynamicAttributes.filter(a => a.key.trim() !== "" && a.value.trim() !== ""),
        // Send SEO data if backend supports it, otherwise it's just UX
      };

      await createProduct(productPayload).unwrap();
      
      localStorage.removeItem(DRAFT_KEY);
      
      toast.success(
        <div className="flex flex-col">
            <span className="font-black text-sm">Transmission Complete</span>
            <span className="text-xs">Product sent to Admin for review.</span>
        </div>,
        { icon: "🚀" }
      );
      
      navigate('/vendor/dashboard'); 
    } catch (error) {
      toast.error(error?.data?.message || "Deployment failed.");
    }
  };

  return (
    <div className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-[100rem] mx-auto font-sans text-gray-900 bg-gray-50 min-h-screen">
      
      {/* 🌟 Smart Draft Notice */}
      <AnimatePresence>
        {showDraftNotice && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-6 bg-blue-50 border border-blue-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3 text-blue-800">
                <FaSave size={20} className="shrink-0" />
                <div>
                    <h4 className="font-bold text-sm">Unsaved Draft Detected</h4>
                    <p className="text-xs">You have an incomplete product submission. Restore it to continue?</p>
                </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto shrink-0">
                <button type="button" onClick={discardDraft} className="px-5 py-2.5 bg-white text-gray-700 rounded-xl text-xs font-bold shadow-sm hover:bg-gray-100 transition-colors border border-gray-200 cursor-pointer">Discard</button>
                <button type="button" onClick={loadDraft} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm hover:bg-blue-700 transition-colors cursor-pointer">Restore Data</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <Link to="/vendor/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-orange-600 font-bold transition-all group px-2 py-1 rounded-lg no-underline cursor-pointer">
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          <span className="uppercase text-xs tracking-widest">Vendor Central</span>
        </Link>
        <span className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <FaClock className="animate-pulse" /> Creates as Pending
        </span>
      </div>

      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase">
                New <span className="text-orange-600 italic">Listing</span>
            </h1>
            <p className="text-gray-500 mt-2 font-bold uppercase tracking-widest text-xs">Submit payload for administrative review</p>
        </div>
        
        {/* 🌟 Product Quality Score Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm w-full md:w-72 shrink-0">
            <div className="flex justify-between items-end mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Listing Quality</span>
                <span className={`text-sm font-black ${qualityScore >= 80 ? 'text-emerald-500' : qualityScore >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{qualityScore}%</span>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${qualityScore}%` }} className={`h-full ${getScoreColor(qualityScore)} transition-all duration-500`} />
            </div>
            {qualityScore < 80 && <p className="text-[9px] text-gray-400 mt-2 font-bold leading-relaxed">Add images, specs, and SEO keywords to improve score.</p>}
        </div>
      </header>

      <form onSubmit={submitHandler} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN - CORE INFO */}
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 space-y-6">
            <h2 className="text-sm font-black uppercase tracking-widest border-b border-gray-100 pb-4 mb-6 flex items-center gap-2 text-gray-900">
                <FaInfoCircle className="text-orange-500"/> Core Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Product Title</label>
                <input type="text" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl transition-all outline-none font-bold text-gray-900" placeholder="e.g. Industrial Concrete Mixer" required />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1 ml-1">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Category Hub</label>
                  {/* 🌟 VENDOR ONLY: Routes to new category request page */}
                  <Link to="/vendor/category/request" target="_blank" className="text-[9px] font-black uppercase tracking-wider text-orange-600 hover:underline cursor-pointer">Request New?</Link>
                </div>
                <div className="relative">
                  <select value={formData.category} onChange={(e) => handleInputChange('category', e.target.value)} className="w-full p-4 pr-10 bg-gray-50 border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl transition-all outline-none font-bold text-gray-900 cursor-pointer appearance-none" required>
                    <option value="" disabled>Select approved category...</option>
                    {predefinedCategories.map((cat, index) => (
                      <option key={index} value={cat}>{cat}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Brand Manufacturer</label>
                <input type="text" value={formData.brand} onChange={(e) => handleInputChange('brand', e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl transition-all outline-none font-bold text-gray-900" placeholder="e.g. Caterpillar" required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex justify-between items-center">
                  <span>Unique SKU Code</span>
                  <button type="button" onClick={generateAutoSKU} className="text-orange-600 hover:text-orange-800 font-black text-[9px] uppercase tracking-wider bg-orange-50 px-2 py-1 rounded border border-orange-200 transition-colors cursor-pointer active:scale-95">Auto Generate</button>
                </label>
                <div className="relative group">
                  <FaBarcode className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm group-focus-within:text-orange-500 transition-colors" />
                  <input type="text" value={formData.sku} onChange={(e) => handleInputChange('sku', e.target.value.toUpperCase())} className="w-full p-4 pl-11 bg-gray-50 border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl transition-all outline-none font-mono text-xs font-black text-gray-900 uppercase" placeholder="e.g. CAT-MIXR-4920" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Full Description</label>
              <textarea value={formData.description} onChange={(e) => handleInputChange('description', e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl h-40 transition-all outline-none font-medium resize-none leading-relaxed text-sm text-gray-800" placeholder="Write comprehensive details..." required></textarea>
            </div>
          </section>

          {/* 🌟 SEO Section */}
          <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 space-y-6">
            <h2 className="text-sm font-black uppercase tracking-widest border-b border-gray-100 pb-4 mb-6 flex items-center gap-2 text-gray-900">
                <FaSearch className="text-blue-500"/> SEO Optimization
            </h2>
            <div className="space-y-4">
               <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Meta Title</label>
                  <input type="text" value={formData.metaTitle} onChange={(e) => handleInputChange('metaTitle', e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-sm font-bold text-gray-900 outline-none transition-all" placeholder="Catchy title for Google..." />
               </div>
               <div>
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Meta Keywords (Comma separated)</label>
                  <input type="text" value={formData.seoKeywords} onChange={(e) => handleInputChange('seoKeywords', e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-sm font-bold text-gray-900 outline-none transition-all" placeholder="e.g. concrete mixer, heavy duty, tools" />
               </div>
            </div>
          </section>

          {/* Specs & Attributes */}
          <section className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-200 space-y-8">
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="font-black text-lg text-gray-900 uppercase tracking-tight">Tech Specifications</h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Detailed hardware metrics</p>
                </div>
                <button type="button" onClick={() => addDynamicField('specs', {label:'', value:''})} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg text-[10px] font-black hover:bg-orange-600 transition-all active:scale-95 shadow-sm uppercase tracking-widest cursor-pointer">
                  <FaPlus size={10} /> Add Field
                </button>
              </div>
              <div className="space-y-3">
                {formData.specs.map((spec, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl relative group focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                    <div className="flex-1 relative">
                      <FaTag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                      <input type="text" placeholder="Label (e.g. Engine)" value={spec.label} onChange={(e) => updateDynamicArray('specs', index, 'label', e.target.value)} className="w-full p-3 pl-10 bg-white border border-gray-200 rounded-lg text-xs font-bold focus:border-orange-500 outline-none text-gray-900 shadow-sm transition-all" />
                    </div>
                    <div className="flex-1 relative">
                      <FaInfoCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                      <input type="text" placeholder="Value (e.g. V8 500HP)" value={spec.value} onChange={(e) => updateDynamicArray('specs', index, 'value', e.target.value)} className="w-full p-3 pl-10 bg-white border border-gray-200 rounded-lg text-xs font-bold focus:border-orange-500 outline-none text-gray-900 shadow-sm transition-all" />
                    </div>
                    <button type="button" onClick={() => removeDynamicField('specs', index)} className="absolute -top-2 -right-2 sm:static bg-white border border-red-200 text-red-500 w-8 h-8 sm:w-auto sm:h-auto sm:px-4 sm:py-3 rounded-full sm:rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center justify-center cursor-pointer">
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h3 className="font-black text-lg text-gray-900 uppercase tracking-tight flex items-center gap-2">
                    <FaLayerGroup className="text-orange-600" size={16} /> Category Attributes
                  </h3>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Custom fields specific to this product variant type</p>
                </div>
                <button type="button" onClick={() => addDynamicField('dynamicAttributes', {key:'', value:''})} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-orange-50 text-orange-700 border border-orange-200 px-5 py-2.5 rounded-lg text-[10px] font-black hover:bg-orange-600 hover:text-white transition-all active:scale-95 shadow-sm uppercase tracking-widest cursor-pointer">
                  <FaPlus size={10} /> Add Custom
                </button>
              </div>

              <div className="space-y-3">
                {formData.dynamicAttributes.map((attr, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-3 p-3 bg-orange-50/50 border border-orange-100 rounded-xl relative group focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                    <div className="flex-1 relative">
                      <FaTag className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400/70 text-xs" />
                      <input type="text" placeholder="Key (e.g. Warranty)" value={attr.key} onChange={(e) => updateDynamicArray('dynamicAttributes', index, 'key', e.target.value)} className="w-full p-3 pl-10 bg-white border border-gray-200 rounded-lg text-xs font-bold focus:border-orange-500 outline-none text-gray-900 shadow-sm transition-all" />
                    </div>
                    <div className="flex-1 relative">
                      <FaInfoCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400/70 text-xs" />
                      <input type="text" placeholder="Value (e.g. 3 Years)" value={attr.value} onChange={(e) => updateDynamicArray('dynamicAttributes', index, 'value', e.target.value)} className="w-full p-3 pl-10 bg-white border border-gray-200 rounded-lg text-xs font-bold focus:border-orange-500 outline-none text-gray-900 shadow-sm transition-all" />
                    </div>
                    <button type="button" onClick={() => removeDynamicField('dynamicAttributes', index)} className="absolute -top-2 -right-2 sm:static bg-white border border-red-200 text-red-500 w-8 h-8 sm:w-auto sm:h-auto sm:px-4 sm:py-3 rounded-full sm:rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center justify-center cursor-pointer">
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN - MEDIA & LOGISTICS */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
            <h3 className="font-black text-sm mb-4 flex items-center gap-2 text-gray-900 uppercase tracking-widest">
              <FaImage className="text-orange-500" size={16} /> Visual Media
            </h3>
            <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 mb-5 relative group flex items-center justify-center transition-all hover:border-orange-400 hover:bg-orange-50/30">
              {formData.image ? (
                <img src={formData.image} alt="Product" className="w-full h-full object-contain mix-blend-multiply p-2" />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400 gap-3 p-4 text-center">
                  <div className="bg-white p-4 rounded-full shadow-sm border border-gray-200"><FaCloudUploadAlt size={30} className="text-gray-300 group-hover:text-orange-400 transition-colors" /></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-orange-500 transition-colors">Primary Display Image</span>
                </div>
              )}
              {uploading && <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center font-black text-white text-xs tracking-widest uppercase gap-3">
                <span className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></span> Processing...
              </div>}
            </div>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-4 p-2 bg-gray-50 border border-gray-200 rounded-xl">
                {formData.images.map((imgUrl, idx) => (
                  <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group/img bg-white shadow-sm flex items-center justify-center p-1">
                    <img src={imgUrl} alt="gallery-item" className="w-full h-full object-contain mix-blend-multiply" />
                    <button type="button" onClick={() => removeGalleryImage(idx)} className="absolute inset-0 bg-red-600/90 text-white flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity text-[10px] cursor-pointer backdrop-blur-sm">
                      <FaTrash size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <input type="text" value={formData.image} onChange={(e) => handleInputChange('image', e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl text-xs border border-gray-200 text-gray-600 font-mono focus:border-orange-500 outline-none transition-all shadow-inner" placeholder="Or paste secure image URL..." />

              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input type="file" onChange={(e) => uploadFileHandler(e, false)} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <button type="button" className="w-full py-3 bg-gray-900 text-white rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-orange-600 transition-all shadow-sm">
                    Main Image
                  </button>
                </div>
                <div className="relative">
                  <input type="file" onChange={(e) => uploadFileHandler(e, true)} accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  <button type="button" className="w-full py-3 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 hover:bg-orange-600 hover:text-white transition-all shadow-sm">
                    + Gallery
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-5">
            <div>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1.5 mb-2">
                <FaBalanceScale className="text-orange-500" /> Cargo Weight (KG)
              </label>
              <div className="relative group">
                <input type="number" step="0.1" value={formData.weight} onChange={(e) => handleInputChange('weight', e.target.value)} className="w-full p-4 pr-12 bg-gray-50 text-gray-900 rounded-xl font-black text-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all shadow-inner font-mono" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400 group-focus-within:text-orange-500 transition-colors">KG</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div className="col-span-2">
                {/* 🌟 Ensure Vendor understands pricing is USD Base */}
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block flex justify-between">
                  <span>System Base Price (USD)</span>
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold group-focus-within:text-orange-500 transition-colors">$</span>
                  <input type="number" step="0.01" value={formData.price} onChange={(e) => handleInputChange('price', e.target.value)} className="w-full p-3 pl-8 bg-gray-50 rounded-xl font-black text-gray-900 border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none font-mono transition-all shadow-inner" />
                </div>
                {/* 🌟 Dynamic Vendor Profit Calculator based on Local Rate */}
                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest mb-1">Local Payout Estimate (-10% Fee)</p>
                  <p className="font-mono font-black text-emerald-600 text-sm">
                    {formatLocalPrice((Number(formData.price) || 0) * 0.9)}
                  </p>
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Warehouse Stock Limit</label>
                <div className="relative">
                  <input type="number" value={formData.countInStock} onChange={(e) => handleInputChange('countInStock', e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl font-black text-gray-900 border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none font-mono transition-all shadow-inner" />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 space-y-4">
            <div>
              <h3 className="font-black text-gray-900 text-sm flex items-center gap-2 uppercase tracking-widest mb-1">Variant Matrix</h3>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4">Separate values with commas (,)</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all shadow-inner">
                <FaPalette className="text-orange-500 shrink-0" size={14} />
                <input type="text" value={formData.colors} onChange={(e) => handleInputChange('colors', e.target.value)} placeholder="e.g. Red, Matte Black, Yellow" className="bg-transparent border-none w-full text-xs font-bold text-gray-900 outline-none placeholder:text-gray-400" />
              </div>
              <div className="flex items-center gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all shadow-inner">
                <FaRulerCombined className="text-orange-500 shrink-0" size={14} />
                <input type="text" value={formData.sizes} onChange={(e) => handleInputChange('sizes', e.target.value)} placeholder="e.g. XL, 20-inch, Heavy-Duty" className="bg-transparent border-none w-full text-xs font-bold text-gray-900 outline-none placeholder:text-gray-400" />
              </div>
            </div>
          </section>

          <div className="sticky bottom-6 lg:relative lg:bottom-0 z-40 mt-6 pt-2">
            <button
              type="submit"
              disabled={isCreating}
              className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 border border-transparent cursor-pointer
                ${isCreating ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-orange-600 text-white hover:bg-gray-900 shadow-orange-600/30'}`}
            >
              {isCreating ? (
                <><span className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent"></span> Processing Data...</>
              ) : 'Submit For Review'}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
};

export default VendorProductCreate;