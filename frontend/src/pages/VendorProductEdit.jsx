import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import {
  FaArrowLeft, FaSave, FaEye, FaArchive, FaBan, FaPaperPlane,
  FaSpinner, FaExclamationTriangle, FaCheckCircle, FaClock,
  FaTag, FaBoxOpen, FaDollarSign, FaWeightHanging, FaImage,
  FaPlus, FaTrash, FaEdit, FaBarcode, FaSearch
} from 'react-icons/fa';
import Button from '../components/Button';
import axiosInstance from '../utils/axios';
import {
  useGetProductDetailsQuery,
  useUpdateProductMutation,
  useUploadProductImageMutation
} from '../slices/productsApiSlice';

const useVendorEditProductMutation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const editProduct = async (data) => {
    setIsLoading(true);
    try {
      const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
      const { data: resData } = await axiosInstance.put(
        `/api/products/${data.productId}/vendor-edit`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return resData;
    } catch (err) {
      throw new Error(err?.response?.data?.message || 'Failed to update');
    } finally {
      setIsLoading(false);
    }
  };
  return [editProduct, { isLoading }];
};

const useVendorArchiveMutation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const archiveProduct = async (productId) => {
    setIsLoading(true);
    try {
      const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
      const { data: resData } = await axiosInstance.put(
        `/api/products/${productId}/archive`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return resData;
    } catch (err) {
      throw new Error(err?.response?.data?.message || 'Failed to archive');
    } finally {
      setIsLoading(false);
    }
  };
  return [archiveProduct, { isLoading }];
};

const useVendorHideMutation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const hideProduct = async (productId, reason = '') => {
    setIsLoading(true);
    try {
      const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
      const { data: resData } = await axiosInstance.put(
        `/api/products/${productId}/hide`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return resData;
    } catch (err) {
      throw new Error(err?.response?.data?.message || 'Failed to hide');
    } finally {
      setIsLoading(false);
    }
  };
  return [hideProduct, { isLoading }];
};

const useVendorSubmitMutation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const submitProduct = async (productId) => {
    setIsLoading(true);
    try {
      const token = JSON.parse(localStorage.getItem('userInfo'))?.token;
      const { data: resData } = await axiosInstance.put(
        `/api/products/${productId}/submit`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return resData;
    } catch (err) {
      throw new Error(err?.response?.data?.message || 'Failed to submit');
    } finally {
      setIsLoading(false);
    }
  };
  return [submitProduct, { isLoading }];
};

const StatusBadge = ({ status, reason }) => {
  const config = {
    draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft', icon: FaEdit },
    pending: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Pending Review', icon: FaClock },
    pending_review: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Changes Pending', icon: FaClock },
    active: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Active', icon: FaCheckCircle },
    rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Rejected', icon: FaBan },
    hidden: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Hidden', icon: FaEye },
    suspended: { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Suspended', icon: FaExclamationTriangle },
    archived: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Archived', icon: FaArchive },
  };
  const c = config[status] || config.draft;
  const Icon = c.icon;
  return (
    <div className="space-y-1">
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${c.bg} ${c.text}`}>
        <Icon size={12} /> {c.label}
      </span>
      {reason && <p className="text-xs text-gray-500">{reason}</p>}
    </div>
  );
};

const VendorProductEdit = () => {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  const { data: product, isLoading: isLoadingProduct, error: loadError } = useGetProductDetailsQuery(productId);
  const [uploadProductImage] = useUploadProductImageMutation();

  const [editProduct, { isLoading: isSaving }] = useVendorEditProductMutation();
  const [archiveProduct, { isLoading: isArchiving }] = useVendorArchiveMutation();
  const [hideProduct, { isLoading: isHiding }] = useVendorHideMutation();
  const [submitProduct, { isLoading: isSubmitting }] = useVendorSubmitMutation();

  const [form, setForm] = useState({
    name: '', description: '', image: '', images: [],
    price: '', originalPrice: '', countInStock: '', sku: '',
    weight: '', category: '', brand: '',
    features: [], specs: [], colors: [], sizes: [],
    metaTitle: '', seoKeywords: '',
  });

  const [newFeature, setNewFeature] = useState('');
  const [newSpec, setNewSpec] = useState({ label: '', value: '' });
  const [newColor, setNewColor] = useState('');
  const [newSize, setNewSize] = useState('');
  const [newImage, setNewImage] = useState('');
  const [hideReason, setHideReason] = useState('');
  const [confirmArchive, setConfirmArchive] = useState(false);

  // Security check
  const isOwner = product && userInfo && (
    (typeof product.user === 'object' && product.user._id === userInfo._id) ||
    product.user === userInfo._id
  );

  useEffect(() => {
    if (product && isOwner) {
      setForm({
        name: product.name || '',
        description: product.description || '',
        image: product.image || '',
        images: product.images || [],
        price: product.price || '',
        originalPrice: product.originalPrice || '',
        countInStock: product.countInStock || '',
        sku: product.sku || '',
        weight: product.weight || '',
        category: product.category || '',
        brand: product.brand || '',
        features: product.features || [],
        specs: product.specs || [],
        colors: product.colors || [],
        sizes: product.sizes || [],
        metaTitle: product.metaTitle || '',
        seoKeywords: product.seoKeywords || '',
      });
    }
  }, [product, isOwner]);

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const addFeature = () => {
    if (newFeature.trim()) {
      updateField('features', [...form.features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const removeFeature = (index) => {
    updateField('features', form.features.filter((_, i) => i !== index));
  };

  const addSpec = () => {
    if (newSpec.label.trim() && newSpec.value.trim()) {
      updateField('specs', [...form.specs, { ...newSpec }]);
      setNewSpec({ label: '', value: '' });
    }
  };

  const removeSpec = (index) => {
    updateField('specs', form.specs.filter((_, i) => i !== index));
  };

  const addColor = () => {
    if (newColor.trim() && !form.colors.includes(newColor.trim())) {
      updateField('colors', [...form.colors, newColor.trim()]);
      setNewColor('');
    }
  };

  const addSize = () => {
    if (newSize.trim() && !form.sizes.includes(newSize.trim())) {
      updateField('sizes', [...form.sizes, newSize.trim()]);
      setNewSize('');
    }
  };

  const addImage = () => {
    if (newImage.trim() && !form.images.includes(newImage.trim())) {
      updateField('images', [...form.images, newImage.trim()]);
      setNewImage('');
    }
  };

  const removeImage = (index) => {
    updateField('images', form.images.filter((_, i) => i !== index));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      return toast.error('Product name and price are required.');
    }
    try {
      const result = await editProduct({
        productId,
        ...form,
        price: Number(form.price),
        originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        countInStock: Number(form.countInStock) || 0,
        weight: Number(form.weight) || 0,
      });
      if (result.pendingReview) {
        toast.success('Changes submitted for admin review. Live listing remains active.');
      } else {
        toast.success('Product updated successfully.');
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to update product.');
    }
  };

  const handleSubmitForReview = async () => {
    try {
      await submitProduct(productId);
      toast.success('Product submitted for review.');
      navigate('/vendor/dashboard');
    } catch (err) {
      toast.error(err?.message || 'Failed to submit.');
    }
  };

  const handleArchive = async () => {
    try {
      await archiveProduct(productId);
      toast.success('Product archived.');
      navigate('/vendor/dashboard');
    } catch (err) {
      toast.error(err?.message || 'Failed to archive.');
    }
  };

  const handleHide = async () => {
    try {
      await hideProduct(productId, hideReason);
      toast.success('Product hidden from marketplace.');
      navigate('/vendor/dashboard');
    } catch (err) {
      toast.error(err?.message || 'Failed to hide.');
    }
  };

  // Loading state
  if (isLoadingProduct) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading Product...</p>
        </div>
      </div>
    );
  }

  // Error / Not found
  if (loadError || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="text-4xl text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Product Not Found</h2>
          <p className="text-sm text-gray-500 mt-2">This product does not exist or has been removed.</p>
          <Link to="/vendor/dashboard" className="mt-4 inline-block text-orange-600 font-bold text-sm hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  // Security: not owner
  if (!isOwner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaBan className="text-4xl text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900">Unauthorized</h2>
          <p className="text-sm text-gray-500 mt-2">You do not have permission to edit this product.</p>
          <Link to="/vendor/dashboard" className="mt-4 inline-block text-orange-600 font-bold text-sm hover:underline">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const isEditable = !['suspended', 'archived'].includes(product.status);
  const isActive = product.status === 'active';

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/vendor/dashboard" className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <FaArrowLeft className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Edit Product</h1>
              <div className="flex items-center gap-3 mt-1">
                <StatusBadge status={product.status} reason={product.rejectReason || product.suspendedReason} />
                {product.hasPendingEdits && (
                  <span className="text-xs text-purple-600 font-bold flex items-center gap-1">
                    <FaClock size={11} /> Edits Awaiting Review
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {!isEditable && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 mb-8 flex items-start gap-4">
            <FaBan className="text-rose-400 mt-1 shrink-0" />
            <div>
              <h3 className="font-bold text-rose-800 text-sm">Product is {product.status}</h3>
              <p className="text-xs text-rose-600 mt-1">This product cannot be edited in its current state.</p>
            </div>
          </div>
        )}

        {isActive && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8 flex items-start gap-4">
            <FaClock className="text-amber-500 mt-1 shrink-0" />
            <div>
              <h3 className="font-bold text-amber-800 text-sm">Changes Will Be Reviewed</h3>
              <p className="text-xs text-amber-600 mt-1">
                Since this product is live, your edits will be submitted for admin review. 
                The current listing remains active until changes are approved.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSave} className="space-y-8">
          
          {/* Basic Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2"><FaTag className="text-orange-500" /> Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Product Name *</label>
                <input type="text" value={form.name} onChange={(e) => updateField('name', e.target.value)} required disabled={!isEditable}
                  className="w-full p-3 bg-white border border-gray-300 rounded-xl text-sm font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Description *</label>
                <textarea value={form.description} onChange={(e) => updateField('description', e.target.value)} rows={5} disabled={!isEditable}
                  className="w-full p-3 bg-white border border-gray-300 rounded-xl text-sm font-medium focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none transition-all resize-y disabled:bg-gray-50 disabled:text-gray-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Category *</label>
                <input type="text" value={form.category} onChange={(e) => updateField('category', e.target.value)} disabled={!isEditable}
                  className="w-full p-3 bg-white border border-gray-300 rounded-xl text-sm font-medium focus:border-orange-500 outline-none transition-all disabled:bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Brand</label>
                <input type="text" value={form.brand} onChange={(e) => updateField('brand', e.target.value)} disabled={!isEditable}
                  className="w-full p-3 bg-white border border-gray-300 rounded-xl text-sm font-medium focus:border-orange-500 outline-none transition-all disabled:bg-gray-50" />
              </div>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2"><FaDollarSign className="text-emerald-500" /> Pricing & Inventory</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Price *</label>
                <input type="number" step="0.01" value={form.price} onChange={(e) => updateField('price', e.target.value)} required disabled={!isEditable}
                  className="w-full p-3 bg-white border border-gray-300 rounded-xl text-sm font-medium focus:border-orange-500 outline-none transition-all disabled:bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Original Price</label>
                <input type="number" step="0.01" value={form.originalPrice} onChange={(e) => updateField('originalPrice', e.target.value)} disabled={!isEditable}
                  className="w-full p-3 bg-white border border-gray-300 rounded-xl text-sm font-medium focus:border-orange-500 outline-none transition-all disabled:bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Stock (units)</label>
                <input type="number" value={form.countInStock} onChange={(e) => updateField('countInStock', e.target.value)} disabled={!isEditable}
                  className="w-full p-3 bg-white border border-gray-300 rounded-xl text-sm font-medium focus:border-orange-500 outline-none transition-all disabled:bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5"><FaBarcode className="inline mr-1" /> SKU</label>
                <input type="text" value={form.sku} onChange={(e) => updateField('sku', e.target.value)} disabled={!isEditable}
                  className="w-full p-3 bg-white border border-gray-300 rounded-xl text-sm font-medium focus:border-orange-500 outline-none transition-all disabled:bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5"><FaWeightHanging className="inline mr-1" /> Weight (kg)</label>
                <input type="number" step="0.1" value={form.weight} onChange={(e) => updateField('weight', e.target.value)} disabled={!isEditable}
                  className="w-full p-3 bg-white border border-gray-300 rounded-xl text-sm font-medium focus:border-orange-500 outline-none transition-all disabled:bg-gray-50" />
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2"><FaImage className="text-blue-500" /> Media</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Main Image URL</label>
                <input type="url" value={form.image} onChange={(e) => updateField('image', e.target.value)} disabled={!isEditable}
                  className="w-full p-3 bg-white border border-gray-300 rounded-xl text-sm font-medium focus:border-orange-500 outline-none transition-all disabled:bg-gray-50" />
                {form.image && (
                  <img src={form.image} alt="Preview" className="mt-2 w-24 h-24 object-cover rounded-lg border border-gray-200"
                    onError={(e) => { e.target.style.display = 'none' }} />
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Additional Images</label>
                <div className="flex gap-2 mb-2">
                  <input type="url" value={newImage} onChange={(e) => setNewImage(e.target.value)} placeholder="Paste image URL" disabled={!isEditable}
                    className="flex-1 p-3 bg-white border border-gray-300 rounded-xl text-sm focus:border-orange-500 outline-none transition-all disabled:bg-gray-50" />
                  <button type="button" onClick={addImage} disabled={!isEditable || !newImage}
                    className="px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-orange-600 disabled:bg-gray-300 transition-colors cursor-pointer">
                    <FaPlus />
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={img} alt={`Image ${i+1}`} className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                        onError={(e) => { e.target.style.display = 'none' }} />
                      {isEditable && (
                        <button type="button" onClick={() => removeImage(i)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Variations */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h2 className="text-lg font-black text-gray-900 mb-6">Variations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Colors */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Colors</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={newColor} onChange={(e) => setNewColor(e.target.value)} placeholder="Add color" disabled={!isEditable}
                    className="flex-1 p-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:border-orange-500 outline-none transition-all disabled:bg-gray-50" />
                  <button type="button" onClick={addColor} disabled={!isEditable}
                    className="px-3 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-orange-600 disabled:bg-gray-300 transition-colors cursor-pointer"><FaPlus /></button>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {form.colors.map((c, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-bold">
                      {c}
                      {isEditable && <button type="button" onClick={() => updateField('colors', form.colors.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700 cursor-pointer"><FaTrash size={10}/></button>}
                    </span>
                  ))}
                </div>
              </div>
              {/* Sizes */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Sizes</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={newSize} onChange={(e) => setNewSize(e.target.value)} placeholder="Add size" disabled={!isEditable}
                    className="flex-1 p-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:border-orange-500 outline-none transition-all disabled:bg-gray-50" />
                  <button type="button" onClick={addSize} disabled={!isEditable}
                    className="px-3 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-orange-600 disabled:bg-gray-300 transition-colors cursor-pointer"><FaPlus /></button>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {form.sizes.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 rounded-lg text-xs font-bold">
                      {s}
                      {isEditable && <button type="button" onClick={() => updateField('sizes', form.sizes.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700 cursor-pointer"><FaTrash size={10}/></button>}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Features & Specs */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h2 className="text-lg font-black text-gray-900 mb-6">Features & Specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Features</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={newFeature} onChange={(e) => setNewFeature(e.target.value)} placeholder="Add feature" disabled={!isEditable}
                    className="flex-1 p-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:border-orange-500 outline-none transition-all disabled:bg-gray-50" />
                  <button type="button" onClick={addFeature} disabled={!isEditable || !newFeature}
                    className="px-3 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-orange-600 disabled:bg-gray-300 transition-colors cursor-pointer"><FaPlus /></button>
                </div>
                <div className="space-y-1.5">
                  {form.features.map((f, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                      <span className="text-sm font-medium">{f}</span>
                      {isEditable && <button type="button" onClick={() => removeFeature(i)} className="text-red-500 hover:text-red-700 cursor-pointer"><FaTrash size={12}/></button>}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Specifications</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={newSpec.label} onChange={(e) => setNewSpec({...newSpec, label: e.target.value})} placeholder="Label" disabled={!isEditable}
                    className="flex-1 p-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:border-orange-500 outline-none transition-all disabled:bg-gray-50" />
                  <input type="text" value={newSpec.value} onChange={(e) => setNewSpec({...newSpec, value: e.target.value})} placeholder="Value" disabled={!isEditable}
                    className="flex-1 p-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:border-orange-500 outline-none transition-all disabled:bg-gray-50" />
                  <button type="button" onClick={addSpec} disabled={!isEditable}
                    className="px-3 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-orange-600 disabled:bg-gray-300 transition-colors cursor-pointer"><FaPlus /></button>
                </div>
                <div className="space-y-1.5">
                  {form.specs.map((s, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                      <span className="text-sm"><strong>{s.label}:</strong> {s.value}</span>
                      {isEditable && <button type="button" onClick={() => removeSpec(i)} className="text-red-500 hover:text-red-700 cursor-pointer"><FaTrash size={12}/></button>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2"><FaSearch className="text-gray-400" /> SEO Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Meta Title</label>
                <input type="text" value={form.metaTitle} onChange={(e) => updateField('metaTitle', e.target.value)} disabled={!isEditable}
                  className="w-full p-3 bg-white border border-gray-300 rounded-xl text-sm font-medium focus:border-orange-500 outline-none transition-all disabled:bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">SEO Keywords</label>
                <input type="text" value={form.seoKeywords} onChange={(e) => updateField('seoKeywords', e.target.value)} disabled={!isEditable}
                  className="w-full p-3 bg-white border border-gray-300 rounded-xl text-sm font-medium focus:border-orange-500 outline-none transition-all disabled:bg-gray-50" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              {isEditable && (
                <Button type="submit" variant="primary" loading={isSaving}>
                  <FaSave /> Save Changes
                </Button>
              )}
              {(product.status === 'draft' || product.status === 'rejected') && (
                <Button variant="primary" onClick={handleSubmitForReview} loading={isSubmitting}>
                  <FaPaperPlane /> Submit for Review
                </Button>
              )}
              {isEditable && product.status !== 'archived' && (
                <Button variant="danger" onClick={() => setConfirmArchive(true)}>
                  <FaArchive /> Archive
                </Button>
              )}
              {isEditable && product.status === 'active' && (
                <Button variant="secondary" onClick={() => document.getElementById('hideModal')?.classList.remove('hidden')}>
                  <FaEye /> Hide from Marketplace
                </Button>
              )}
              <Link to="/vendor/dashboard"
                className="px-6 py-3.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl font-bold text-sm transition-all">
                Cancel
              </Link>
            </div>
          </div>

        </form>

        {/* Archive Confirmation Modal */}
        {confirmArchive && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" onClick={() => setConfirmArchive(false)} />
            <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
              <h3 className="font-bold text-lg text-gray-900 mb-2">Archive Product?</h3>
              <p className="text-sm text-gray-500 mb-6">Archiving will remove this product from the marketplace and vendor dashboard.</p>
              <div className="flex gap-3 justify-end">
                <Button variant="secondary" onClick={() => setConfirmArchive(false)}>Cancel</Button>
                <Button variant="danger" loading={isArchiving} onClick={handleArchive}>Archive</Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default VendorProductEdit;