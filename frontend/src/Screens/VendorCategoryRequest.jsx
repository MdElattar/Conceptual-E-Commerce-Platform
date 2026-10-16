import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useRequestCategoryMutation } from '../slices/productsApiSlice'; // Ensure this exists in Redux
import { FaLayerGroup, FaArrowLeft, FaPaperPlane, FaInfoCircle } from 'react-icons/fa';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

const VendorCategoryRequest = () => {
  const navigate = useNavigate();
  const [requestCategory, { isLoading }] = useRequestCategoryMutation();

  const [formData, setFormData] = useState({
    requestedCategoryName: '',
    reason: '',
    exampleProducts: ''
  });

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!formData.requestedCategoryName.trim() || !formData.reason.trim()) {
      return toast.warning("Please provide a category name and reason.");
    }

    try {
      await requestCategory(formData).unwrap();
      toast.success(
        <div className="flex flex-col">
            <span className="font-black text-sm">Request Submitted</span>
            <span className="text-xs">The platform admins will review your new category matrix.</span>
        </div>,
        { icon: "📨" }
      );
      navigate('/vendor/product/create');
    } catch (err) {
      toast.error(err?.data?.message || "Failed to submit request.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4 flex items-center justify-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
        
        <div className="bg-gray-900 p-8 text-white relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-orange-600/20 rounded-full blur-3xl"></div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-[10px] font-black uppercase tracking-widest cursor-pointer">
            <FaArrowLeft /> Back to Setup
          </button>
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 border border-white/20 backdrop-blur-md">
            <FaLayerGroup size={24} className="text-orange-500" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight italic">Category <span className="text-orange-500">Request</span></h1>
          <p className="text-xs text-gray-400 mt-2 font-medium">Propose a new structural division for the marketplace.</p>
        </div>

        <form onSubmit={submitHandler} className="p-8 space-y-6">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex gap-3 text-blue-800 text-xs font-bold leading-relaxed">
            <FaInfoCircle size={16} className="shrink-0 mt-0.5 text-blue-600" />
            <p>New category requests are manually reviewed by the platform administrators to ensure catalog integrity. Approval typically takes 24-48 hours.</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Proposed Name</label>
            <input 
              type="text" 
              value={formData.requestedCategoryName} 
              onChange={(e) => setFormData({...formData, requestedCategoryName: e.target.value})} 
              className="w-full p-4 bg-gray-50 border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl transition-all outline-none font-bold text-gray-900" 
              placeholder="e.g. Smart Industrial Sensors" 
              required 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Business Case / Reason</label>
            <textarea 
              value={formData.reason} 
              onChange={(e) => setFormData({...formData, reason: e.target.value})} 
              className="w-full p-4 bg-gray-50 border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl h-24 transition-all outline-none font-medium resize-none text-sm text-gray-800" 
              placeholder="Explain why this category is necessary..." 
              required 
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Example Products (Optional)</label>
            <input 
              type="text" 
              value={formData.exampleProducts} 
              onChange={(e) => setFormData({...formData, exampleProducts: e.target.value})} 
              className="w-full p-4 bg-gray-50 border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl transition-all outline-none font-bold text-gray-900 text-sm" 
              placeholder="e.g. Temperature Probes, Pressure Switches" 
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 bg-orange-600 hover:bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> : <><FaPaperPlane /> Transmit Request</>}
          </button>
        </form>

      </motion.div>
    </div>
  );
};

export default VendorCategoryRequest;