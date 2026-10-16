import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import Button from '../../components/Button';
import {
  FaPlus, FaTrash, FaArrowLeft, FaCloudUploadAlt,
  FaPalette, FaRulerCombined, FaBalanceScale, FaImage, FaTag, FaInfoCircle,
  FaBarcode, FaLayerGroup, FaClock, FaExclamationTriangle, FaShieldAlt
} from 'react-icons/fa';

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const { rate = 1, currencyCode = 'USD' } = useSelector((state) => state.currency || {});
  const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [image, setImage] = useState('');
  const [brand, setBrand] = useState('');
  const [countInStock, setCountInStock] = useState(0);
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState(0);
  const [features, setFeatures] = useState('');
  const [colors, setColors] = useState('');
  const [sizes, setSizes] = useState('');
  const [specs, setSpecs] = useState([{ label: '', value: '' }]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const [images, setImages] = useState([]);
  const [sku, setSku] = useState('');
  
  // 🌟 Admin Only Status Control
  const [status, setStatus] = useState('active');
  
  const [dynamicAttributes, setDynamicAttributes] = useState([{ key: '', value: '' }]);

  const [category, setCategory] = useState('');
  // 🌟 Admin Creates Category Directly
  const [newCategoryInput, setNewCategoryInput] = useState(''); 

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
  ].sort(); 
  
  const categoriesWithNew = [...predefinedCategories, "Create New Category (+)"];

  useEffect(() => {
    if (isEditMode) {
      const fetchProduct = async () => {
        try {
          const { data } = await axios.get(`/api/products/${id}`);
          setName(data.name);
          setPrice(data.price);
          setImage(data.image);
          setBrand(data.brand);
          setCountInStock(data.countInStock);
          setDescription(data.description);
          setWeight(data.weight || 0);
          if (data.features) setFeatures(data.features.join(', '));
          if (data.colors) setColors(data.colors.join(', '));
          if (data.sizes) setSizes(data.sizes.join(', '));
          setSpecs(data.specs && data.specs.length > 0 ? data.specs : [{ label: '', value: '' }]);

          setImages(data.images || []);
          setSku(data.sku || '');
          setStatus(data.status || 'active');
          setDynamicAttributes(data.dynamicAttributes && data.dynamicAttributes.length > 0 ? data.dynamicAttributes : [{ key: '', value: '' }]);

          if (data.category) {
            if (!predefinedCategories.includes(data.category)) {
              setCategory("Create New Category (+)");
              setNewCategoryInput(data.category);
            } else {
              setCategory(data.category);
            }
          }
        } catch {
          toast.error("Failed to load product details.");
        }
      };
      fetchProduct();
    }
  }, [id, isEditMode, predefinedCategories]);

  const generateAutoSKU = () => {
    if (!name || !brand) {
      toast.info("Please fill Name and Brand first to generate a professional SKU");
      return;
    }
    const cleanBrand = brand.toUpperCase().replace(/\s+/g, '-').slice(0, 3);
    const cleanName = name.toUpperCase().replace(/\s+/g, '-').slice(0, 4);
    const randomId = Math.floor(1000 + Math.random() * 9000);
    setSku(`${cleanBrand}-${cleanName}-${randomId}`);
    toast.success("Amazon-style SKU generated! 🎯");
  };

  const formatLocalPrice = (amount) => {
    const safeAmount = Number(amount) || 0;
    const convertedAmount = safeAmount * rate;
    return `${currencyCode} ${convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const uploadFileHandler = async (e, isGallery = false) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);

    const uploadToastId = toast.loading(isGallery ? "Adding to gallery..." : "Uploading primary image...");

    try {
      const config = { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${userInfo.token}` } };
      const { data } = await axios.post('/api/upload', formData, config);

      if (isGallery) { setImages([...images, data]); } 
      else { setImage(data); }

      setUploading(false);
      toast.update(uploadToastId, { render: "Image uploaded successfully!", type: "success", isLoading: false, autoClose: 3000 });
    } catch {
      setUploading(false);
      toast.update(uploadToastId, { render: "Image upload failed.", type: "error", isLoading: false, autoClose: 4000 });
    }
  };

  const removeGalleryImage = (indexToRemove) => {
    setImages(images.filter((_, idx) => idx !== indexToRemove));
    toast.info("Image removed from gallery grid.");
  };

  const deleteHandler = async () => {
    if (window.confirm('🚨 WARNING: Are you entirely sure you want to permanently delete this product?')) {
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.delete(`/api/products/${id}`, config);
        toast.success('Product deleted from database ✅');
        navigate('/admin/productlist');
      } catch {
        toast.error('Failed to delete product.');
      }
    }
  };

  const handleSpecChange = (index, field, value) => {
    const newSpecs = [...specs];
    newSpecs[index][field] = value;
    setSpecs(newSpecs);
  };
  const addSpecField = () => setSpecs([...specs, { label: '', value: '' }]);
  const removeSpecField = (index) => setSpecs(specs.filter((_, i) => i !== index));

  const handleDynamicAttrChange = (index, field, value) => {
    const newAttrs = [...dynamicAttributes];
    newAttrs[index][field] = value;
    setDynamicAttributes(newAttrs);
  };
  const addDynamicAttrField = () => setDynamicAttributes([...dynamicAttributes, { key: '', value: '' }]);
  const removeDynamicAttrField = (index) => setDynamicAttributes(dynamicAttributes.filter((_, i) => i !== index));

  const submitHandler = async (e) => {
    e.preventDefault();
    if (price < 0 || countInStock < 0 || weight < 0) { toast.warning("Numeric values cannot be negative!"); return; }
    if (!category || category.trim() === '') { toast.warning("Please select a category!"); return; }
    if (!image) { toast.warning("A primary product image is required!"); return; }

    setLoading(true);
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userInfo.token}`,
        },
      };

      const formatArray = (str) => str.split(',').map(item => item.trim()).filter(item => item !== "");

      let finalCategory = category;
      if (category === "Create New Category (+)") {
        if (!newCategoryInput.trim()) {
          toast.warning("Please specify the new category name!");
          setLoading(false);
          return;
        }
        finalCategory = newCategoryInput.trim().replace(/\s+/g, ' ').split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }

      const productData = {
        name, 
        price: Number(price), // USD Base
        image, brand,
        category: finalCategory, description,
        countInStock: Number(countInStock), 
        weight: Number(weight),
        features: formatArray(features), colors: formatArray(colors),
        sizes: formatArray(sizes),
        specs: specs.filter(s => s.label.trim() !== "" && s.value.trim() !== ""),
        images, sku,
        status, // 🌟 Admin sends explicit status
        dynamicAttributes: dynamicAttributes.filter(a => a.key.trim() !== "" && a.value.trim() !== ""),
      };

      if (isEditMode) {
        await axios.put(`/api/products/${id}`, productData, config);
        toast.success('Listing updated successfully ✅');
        navigate(`/product/${id}`);
      } else {
        const { data } = await axios.post('/api/products', productData, config);
        toast.success('New product published 🚀');
        navigate(`/product/${data._id}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-[100rem] mx-auto font-sans text-gray-900 bg-gray-50 min-h-screen">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-orange-600 font-bold transition-all group px-2 py-1 rounded-lg cursor-pointer">
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          <span className="uppercase text-xs tracking-widest">Back to Hub</span>
        </button>

        {isEditMode && (
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button variant="danger" onClick={deleteHandler}>
              <FaTrash size={12} /> Purge Product
            </Button>
          </div>
        )}
      </div>

      <header className="mb-10 text-center sm:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-block bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg mb-3 shadow-sm">
              Admin Product Control
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase">
            {isEditMode ? 'Edit' : 'New'} <span className="text-orange-600 italic">Listing</span>
          </h1>
          <p className="text-gray-500 mt-2 font-bold uppercase tracking-widest text-xs">Direct database manipulation & catalog management</p>
        </div>

        {/* 🌟 Admin Status Control Box */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm w-full md:w-64 shrink-0">
           <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-2 flex items-center gap-1"><FaShieldAlt/> Publish Status</label>
           <select 
             value={status} 
             onChange={(e) => setStatus(e.target.value)}
             className={`w-full p-2.5 rounded-xl font-black text-xs uppercase tracking-widest outline-none border-2 cursor-pointer transition-colors
               ${status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                 status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                 status === 'draft' ? 'bg-gray-100 text-gray-700 border-gray-300' : 'bg-red-50 text-red-700 border-red-200'}`}
           >
             <option value="active">🟢 Active (Live)</option>
             <option value="pending">🟡 Pending Review</option>
             <option value="draft">⚪ Draft (Hidden)</option>
             <option value="rejected">🔴 Rejected</option>
           </select>
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
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl transition-all outline-none font-bold text-gray-900" placeholder="e.g. Industrial Concrete Mixer" required />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Category Hub</label>
                <div className="relative">
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-4 pr-10 bg-gray-50 border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl transition-all outline-none font-bold text-gray-900 cursor-pointer appearance-none" required>
                    <option value="" disabled>Select a predefined category...</option>
                    {categoriesWithNew.map((cat, index) => (
                      <option key={index} value={cat} className={cat.includes("Create") ? "font-bold text-blue-600" : ""}>{cat}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
                </div>

                {/* 🌟 Admin Create New Category Input */}
                {category === "Create New Category (+)" && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3 p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-3 overflow-hidden">
                    <label className="text-[10px] font-black text-blue-800 uppercase tracking-widest flex items-center gap-1.5">
                      <FaPlus size={10} /> Define New Category Matrix
                    </label>
                    <input type="text" value={newCategoryInput} onChange={(e) => setNewCategoryInput(e.target.value)} className="w-full p-3 bg-white border border-blue-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none font-bold text-gray-900 shadow-sm" placeholder="e.g. Smart Home Devices..." required />
                  </motion.div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Brand Manufacturer</label>
                <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl transition-all outline-none font-bold text-gray-900" placeholder="e.g. Caterpillar" required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex justify-between items-center">
                  <span>Unique SKU Code</span>
                  <button type="button" onClick={generateAutoSKU} className="text-orange-600 hover:text-orange-800 font-black text-[9px] uppercase tracking-wider bg-orange-50 px-2 py-1 rounded border border-orange-200 transition-colors cursor-pointer active:scale-95">Auto Generate</button>
                </label>
                <div className="relative group">
                  <FaBarcode className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm group-focus-within:text-orange-500 transition-colors" />
                  <input type="text" value={sku} onChange={(e) => setSku(e.target.value.toUpperCase())} className="w-full p-4 pl-11 bg-gray-50 border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl transition-all outline-none font-mono text-xs font-black text-gray-900 uppercase" placeholder="e.g. CAT-MIXR-4920" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Full Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-4 bg-gray-50 border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl h-40 transition-all outline-none font-medium resize-none leading-relaxed text-sm text-gray-800" placeholder="Write comprehensive details..." required></textarea>
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
                <button type="button" onClick={addSpecField} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg text-[10px] font-black hover:bg-orange-600 transition-all active:scale-95 shadow-sm uppercase tracking-widest cursor-pointer">
                  <FaPlus size={10} /> Add Field
                </button>
              </div>
              <div className="space-y-3">
                {specs.map((spec, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl relative group focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                    <div className="flex-1 relative">
                      <FaTag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                      <input type="text" placeholder="Label (e.g. Engine)" value={spec.label} onChange={(e) => handleSpecChange(index, 'label', e.target.value)} className="w-full p-3 pl-10 bg-white border border-gray-200 rounded-lg text-xs font-bold focus:border-orange-500 outline-none text-gray-900 shadow-sm transition-all" />
                    </div>
                    <div className="flex-1 relative">
                      <FaInfoCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                      <input type="text" placeholder="Spec Value (e.g. V8 500HP)" value={spec.value} onChange={(e) => handleSpecChange(index, 'value', e.target.value)} className="w-full p-3 pl-10 bg-white border border-gray-200 rounded-lg text-xs font-bold focus:border-orange-500 outline-none text-gray-900 shadow-sm transition-all" />
                    </div>
                    <button type="button" onClick={() => removeSpecField(index)} className="absolute -top-2 -right-2 sm:static bg-white border border-red-200 text-red-500 w-8 h-8 sm:w-auto sm:h-auto sm:px-4 sm:py-3 rounded-full sm:rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center justify-center cursor-pointer">
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
                <button type="button" onClick={addDynamicAttrField} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-orange-50 text-orange-700 border border-orange-200 px-5 py-2.5 rounded-lg text-[10px] font-black hover:bg-orange-600 hover:text-white transition-all active:scale-95 shadow-sm uppercase tracking-widest cursor-pointer">
                  <FaPlus size={10} /> Add Custom
                </button>
              </div>

              <div className="space-y-3">
                {dynamicAttributes.map((attr, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-3 p-3 bg-orange-50/50 border border-orange-100 rounded-xl relative group focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                    <div className="flex-1 relative">
                      <FaTag className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400/70 text-xs" />
                      <input type="text" placeholder="Key (e.g. Warranty)" value={attr.key} onChange={(e) => handleDynamicAttrChange(index, 'key', e.target.value)} className="w-full p-3 pl-10 bg-white border border-gray-200 rounded-lg text-xs font-bold focus:border-orange-500 outline-none text-gray-900 shadow-sm transition-all" />
                    </div>
                    <div className="flex-1 relative">
                      <FaInfoCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400/70 text-xs" />
                      <input type="text" placeholder="Value (e.g. 3 Years)" value={attr.value} onChange={(e) => handleDynamicAttrChange(index, 'value', e.target.value)} className="w-full p-3 pl-10 bg-white border border-gray-200 rounded-lg text-xs font-bold focus:border-orange-500 outline-none text-gray-900 shadow-sm transition-all" />
                    </div>
                    <button type="button" onClick={() => removeDynamicAttrField(index)} className="absolute -top-2 -right-2 sm:static bg-white border border-red-200 text-red-500 w-8 h-8 sm:w-auto sm:h-auto sm:px-4 sm:py-3 rounded-full sm:rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center justify-center cursor-pointer">
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
              {image ? (
                <img src={image} alt="Product" className="w-full h-full object-contain mix-blend-multiply p-2" />
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

            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-4 p-2 bg-gray-50 border border-gray-200 rounded-xl">
                {images.map((imgUrl, idx) => (
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
              <input type="text" value={image} onChange={(e) => setImage(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl text-xs border border-gray-200 text-gray-600 font-mono focus:border-orange-500 outline-none transition-all shadow-inner" placeholder="Or paste secure image URL..." />

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
                <input type="number" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} className="w-full p-4 pr-12 bg-gray-50 text-gray-900 rounded-xl font-black text-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all shadow-inner font-mono" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400 group-focus-within:text-orange-500 transition-colors">KG</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div className="col-span-2">
                {/* 🌟 Ensure Admin understands pricing is USD Base */}
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block flex justify-between">
                  <span>System Base Price (USD)</span>
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold group-focus-within:text-orange-500 transition-colors">$</span>
                  <input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full p-3 pl-8 bg-gray-50 rounded-xl font-black text-gray-900 border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none font-mono transition-all shadow-inner" />
                </div>
                <div className="mt-3 p-2 bg-blue-50 border border-blue-100 rounded-lg text-right">
                    <p className="text-[9px] font-black text-blue-800 uppercase tracking-widest">Local View: {formatLocalPrice(Number(price) || 0)}</p>
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 mb-2 block">Warehouse Stock Limit</label>
                <div className="relative">
                  <input type="number" value={countInStock} onChange={(e) => setCountInStock(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl font-black text-gray-900 border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none font-mono transition-all shadow-inner" />
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
                <input type="text" value={colors} onChange={(e) => setColors(e.target.value)} placeholder="e.g. Red, Matte Black, Yellow" className="bg-transparent border-none w-full text-xs font-bold text-gray-900 outline-none placeholder:text-gray-400" />
              </div>
              <div className="flex items-center gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-200 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all shadow-inner">
                <FaRulerCombined className="text-orange-500 shrink-0" size={14} />
                <input type="text" value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="e.g. XL, 20-inch, Heavy-Duty" className="bg-transparent border-none w-full text-xs font-bold text-gray-900 outline-none placeholder:text-gray-400" />
              </div>
            </div>
          </section>

          <div className="sticky bottom-6 lg:relative lg:bottom-0 z-40 mt-6 pt-2">
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full"
            >
              {isEditMode ? 'Commit System Overrides' : 'Publish Admin Listing'}
            </Button>
          </div>

        </div>
      </form>
    </div>
  );
};

export default ProductEdit;