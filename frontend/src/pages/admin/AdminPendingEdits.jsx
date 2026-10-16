import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaTimesCircle, FaClock, FaSpinner, FaExclamationTriangle, FaBoxOpen, FaUser, FaSearch, FaDollarSign, FaTag, FaLayerGroup } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import Button from '../../components/Button';
import { useGetPendingEditsProductsQuery, useApprovePendingEditsMutation, useRejectPendingEditsMutation } from '../../slices/productsApiSlice';

const fieldLabels = {
  name: 'Name',
  description: 'Description',
  price: 'Price',
  originalPrice: 'Original Price',
  countInStock: 'Stock',
  sku: 'SKU',
  weight: 'Weight',
  category: 'Category',
  brand: 'Brand',
  image: 'Main Image',
  images: 'Additional Images',
  features: 'Features',
  specs: 'Specifications',
  colors: 'Colors',
  sizes: 'Sizes',
  metaTitle: 'Meta Title',
  seoKeywords: 'SEO Keywords',
};

const AdminPendingEdits = () => {
  const { data: pendingProducts, isLoading, refetch } = useGetPendingEditsProductsQuery();
  const [approveEdits, { isLoading: isApproving }] = useApprovePendingEditsMutation();
  const [rejectEdits, { isLoading: isRejecting }] = useRejectPendingEditsMutation();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectTargetId, setRejectTargetId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const currencyState = useSelector((state) => state.currency) || {};
  const currencyCode = currencyState.currencyCode || 'USD';
  const rate = currencyState.rate || 1;

  const formatPrice = (amount) => {
    const safeAmount = Number(amount) || 0;
    return `${currencyCode} ${(safeAmount * rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const filteredProducts = useMemo(() => {
    if (!pendingProducts) return [];
    return pendingProducts.filter(p =>
      !searchTerm ||
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p._id?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pendingProducts, searchTerm]);

  const handleApprove = async (productId) => {
    try {
      await approveEdits({ productId }).unwrap();
      toast.success('Pending edits approved and applied.');
      setSelectedProduct(null);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to approve edits.');
    }
  };

  const handleReject = async () => {
    if (!rejectTargetId) return;
    try {
      await rejectEdits({ productId: rejectTargetId, reason: rejectReason }).unwrap();
      toast.success('Pending edits rejected.');
      setShowRejectModal(false);
      setRejectTargetId(null);
      setRejectReason('');
      setSelectedProduct(null);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to reject edits.');
    }
  };

  const openRejectModal = (productId) => {
    setRejectTargetId(productId);
    setRejectReason('');
    setShowRejectModal(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-24">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading Pending Edits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
              <FaClock className="text-purple-500" />
              Pending Edit Reviews
            </h1>
            <p className="text-sm font-bold text-gray-500 mt-1">
              {pendingProducts?.length || 0} product(s) awaiting edit approval
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              placeholder="Search product or vendor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 pl-10 pr-4 py-3 rounded-xl text-xs font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Empty state */}
        {(!pendingProducts || pendingProducts.length === 0) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
            <FaCheckCircle className="text-5xl text-emerald-400 mx-auto mb-4" />
            <h2 className="text-xl font-black text-gray-900 mb-2">All Caught Up</h2>
            <p className="text-sm text-gray-500">No products currently have pending edits awaiting review.</p>
          </div>
        )}

        {/* Product Cards */}
        {filteredProducts.length > 0 && (
          <div className="space-y-6">
            {filteredProducts.map((product) => {
              const edits = product.pendingEdits || {};
              const editKeys = Object.keys(edits);
              const isSelected = selectedProduct?._id === product._id;

              return (
                <motion.div
                  key={product._id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  {/* Summary bar */}
                  <div className="p-6 flex flex-col sm:flex-row sm:items-center gap-4 border-b border-gray-100">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <FaBoxOpen className="text-gray-400" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link to={`/product/${product._id}`} className="font-bold text-gray-900 hover:text-purple-600 transition-colors truncate block">
                          {product.name}
                        </Link>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><FaUser className="text-gray-400" /> {product.user?.name || 'Unknown Vendor'}</span>
                          <span className="flex items-center gap-1"><FaTag className="text-gray-400" /> {product.category}</span>
                          <span className="flex items-center gap-1"><FaDollarSign className="text-gray-400" /> {formatPrice(product.price)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400 font-bold bg-gray-100 px-3 py-1.5 rounded-lg">
                        {editKeys.length} field(s) changed
                      </span>
                      <span className="text-xs text-purple-600 font-bold bg-purple-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
                        <FaClock size={10} />
                        {product.pendingEditsSubmittedAt
                          ? new Date(product.pendingEditsSubmittedAt).toLocaleDateString()
                          : 'Recently'}
                      </span>
                    </div>
                  </div>

                  {/* Expandable diff */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 bg-gray-50 border-b border-gray-200">
                          <h3 className="text-sm font-black text-gray-900 mb-4 uppercase tracking-wider flex items-center gap-2">
                            <FaLayerGroup className="text-purple-500" />
                            Proposed Changes
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {editKeys.map((key) => (
                              <div key={key} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{fieldLabels[key] || key}</p>
                                <div className="flex items-start gap-3">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-gray-400 mb-1 uppercase">Current</p>
                                    <p className="text-sm font-medium text-gray-700 truncate">
                                      {renderFieldValue(product[key], key)}
                                    </p>
                                  </div>
                                  <div className="text-gray-300 mt-4 shrink-0">
                                    <FaExclamationTriangle size={12} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-purple-500 mb-1 uppercase">Proposed</p>
                                    <p className="text-sm font-medium text-purple-700 truncate">
                                      {renderFieldValue(edits[key], key)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="p-6 bg-white flex flex-wrap gap-3 justify-end">
                          <Button
                            variant="ghost"
                            onClick={() => setSelectedProduct(null)}
                          >
                            Collapse
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => openRejectModal(product._id)}
                            loading={isRejecting}
                          >
                            <FaTimesCircle /> Reject Changes
                          </Button>
                          <Button
                            variant="primary"
                            onClick={() => handleApprove(product._id)}
                            loading={isApproving}
                          >
                            <FaCheckCircle /> Approve & Apply
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Expand button when collapsed */}
                  {!isSelected && (
                    <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                      <Button
                        variant="secondary"
                        onClick={() => setSelectedProduct(product)}
                        className="w-full"
                      >
                        View Changes ({editKeys.length} field(s))
                      </Button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Reject Reason Modal */}
        <AnimatePresence>
          {showRejectModal && (
            <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowRejectModal(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative z-50 p-8"
              >
                <FaTimesCircle className="text-4xl text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-black text-gray-900 mb-2 text-center">Reject Pending Edits</h3>
                <p className="text-sm text-gray-500 mb-6 text-center">
                  The original listing will remain active. Provide a reason for the vendor.
                </p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection (required)..."
                  rows={4}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm mb-6 outline-none focus:border-red-500 transition-all resize-none"
                  required
                />
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setShowRejectModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleReject}
                    disabled={!rejectReason.trim()}
                    loading={isRejecting}
                  >
                    Reject Edits
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const renderFieldValue = (value, key) => {
  if (value === null || value === undefined) return <span className="text-gray-400 italic">empty</span>;
  if (Array.isArray(value)) {
    if (key === 'specs') return value.map(s => `${s.label}: ${s.value}`).join(', ') || 'none';
    if (value.length === 0) return <span className="text-gray-400 italic">none</span>;
    return value.join(', ');
  }
  if (typeof value === 'object') return JSON.stringify(value).slice(0, 50) + '...';
  return String(value);
};

export default AdminPendingEdits;
