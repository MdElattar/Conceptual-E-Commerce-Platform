import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaSpinner, FaCheckCircle, FaTimesCircle, FaUndo, FaExclamationCircle, FaBoxOpen } from 'react-icons/fa';
import { useGetVendorReturnsQuery, useVendorUpdateReturnStatusMutation } from '../slices/returnsApiSlice';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Button from './Button';

const statusColors = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-blue-100 text-blue-800 border-blue-200',
  rejected: 'bg-rose-100 text-rose-800 border-rose-200',
  received: 'bg-purple-100 text-purple-800 border-purple-200',
  refunded: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  completed: 'bg-gray-100 text-gray-800 border-gray-200',
};

const statusIcons = {
  pending: FaUndo,
  approved: FaCheckCircle,
  rejected: FaTimesCircle,
  received: FaBoxOpen,
  refunded: FaCheckCircle,
  completed: FaCheckCircle,
};

export default function ReturnsTab() {
  const [filter, setFilter] = useState('all');
  const [actionModal, setActionModal] = useState({ open: false, returnReq: null, action: '' });
  const [reason, setReason] = useState('');

  const currencyState = useSelector((state) => state.currency) || {};
  const currencyCode = currencyState.currencyCode || 'USD';
  const rate = currencyState.rate || 1;

  const formatLocalPrice = (amount) => {
    const safeAmount = Number(amount) || 0;
    const convertedAmount = safeAmount * rate;
    return `${currencyCode} ${convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const { data: returns = [], isLoading, error } = useGetVendorReturnsQuery();
  const [updateStatus, { isLoading: isUpdating }] = useVendorUpdateReturnStatusMutation();

  const filteredReturns = filter === 'all'
    ? returns
    : returns.filter(r => r.status === filter);

  const summary = {
    pending: returns.filter(r => r.status === 'pending').length,
    approved: returns.filter(r => r.status === 'approved').length,
    rejected: returns.filter(r => r.status === 'rejected').length,
    refunded: returns.filter(r => r.status === 'refunded').length,
  };

  const handleOpenAction = (returnReq, action) => {
    setReason('');
    setActionModal({ open: true, returnReq, action });
  };

  const handleSubmitAction = async () => {
    const { returnReq, action } = actionModal;
    try {
      await updateStatus({
        returnId: returnReq._id,
        status: action,
        reason: action === 'rejected' ? reason : undefined,
      }).unwrap();
      toast.success(`Return ${action} successfully.`);
      setActionModal({ open: false, returnReq: null, action: '' });
    } catch (err) {
      toast.error(err?.data?.message || `Failed to ${action} return.`);
    }
  };

  const filterTabs = [
    { id: 'all', label: `All (${returns.length})` },
    { id: 'pending', label: `Pending (${summary.pending})` },
    { id: 'approved', label: `Approved (${summary.approved})` },
    { id: 'rejected', label: `Rejected (${summary.rejected})` },
    { id: 'refunded', label: `Refunded (${summary.refunded})` },
  ];

  if (isLoading) {
    return <div className="flex justify-center py-20"><FaSpinner className="animate-spin text-4xl text-gray-300" /></div>;
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <FaExclamationCircle className="text-amber-500 text-5xl mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900">Could not load returns</h3>
        <p className="text-sm text-gray-500 mt-2">{error?.data?.message || 'Please check backend connection.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{summary.pending}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Approved</p>
          <p className="text-2xl font-black text-blue-600 mt-1">{summary.approved}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Rejected</p>
          <p className="text-2xl font-black text-rose-600 mt-1">{summary.rejected}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Refunded</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{summary.refunded}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filterTabs.map(tab => (
          <button key={tab.id} onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${filter === tab.id ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {filteredReturns.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <FaUndo className="text-gray-200 text-6xl mx-auto mb-4" />
          <p className="text-gray-500 font-bold">No return requests found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReturns.map((ret) => {
            const StatusIcon = statusIcons[ret.status] || FaUndo;
            return (
              <motion.div key={ret._id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                      {ret.product?.image ? <img src={ret.product.image} alt={ret.product.name} className="w-full h-full object-cover mix-blend-multiply" /> : <FaBoxOpen className="text-gray-400" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">{ret.product?.name || 'Unknown Product'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[ret.status] || 'bg-gray-100 text-gray-600'}`}>
                          <StatusIcon size={10} />
                          {ret.status}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400">{new Date(ret.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2">{ret.reason}</p>
                      {ret.adminNote && (
                        <p className="text-xs text-gray-500 mt-1 italic">Note: {ret.adminNote}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-black text-gray-900">{formatLocalPrice(ret.refundAmount || 0)}</p>
                    <p className="text-[10px] text-gray-400 font-bold">{ret.refundMethod || 'wallet'}</p>
                  </div>
                </div>
                {ret.status === 'pending' && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                    <Button onClick={() => handleOpenAction(ret, 'approved')} variant="success" className="flex-1">
                      <FaCheckCircle /> Approve
                    </Button>
                    <Button onClick={() => handleOpenAction(ret, 'rejected')} variant="danger" className="flex-1">
                      <FaTimesCircle /> Reject
                    </Button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {actionModal.open && (
          <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActionModal({ open: false, returnReq: null, action: '' })} className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden relative z-50 p-8">
              {actionModal.action === 'approved' ? (
                <FaCheckCircle className="text-5xl text-emerald-500 mx-auto mb-4" />
              ) : (
                <FaTimesCircle className="text-5xl text-rose-500 mx-auto mb-4" />
              )}
              <h3 className="text-xl font-black text-gray-900 mb-2 text-center">
                {actionModal.action === 'approved' ? 'Approve Return' : 'Reject Return'}
              </h3>
              <p className="text-sm text-gray-500 mb-6 text-center">
                {actionModal.returnReq?.product?.name}
              </p>
              <p className="text-sm text-gray-600 mb-4"><strong>Reason:</strong> {actionModal.returnReq?.reason}</p>
              {actionModal.action === 'rejected' && (
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for rejection..."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold outline-none focus:border-rose-500 transition-all mb-4 resize-none" rows={3} />
              )}
              <div className="flex gap-3">
                <Button onClick={() => setActionModal({ open: false, returnReq: null, action: '' })} variant="secondary" className="flex-1">Cancel</Button>
                <Button onClick={handleSubmitAction} disabled={isUpdating || (actionModal.action === 'rejected' && !reason.trim())}
                  variant={actionModal.action === 'approved' ? 'success' : 'danger'} className="flex-1"
                  loading={isUpdating}>
                  {actionModal.action === 'approved' ? 'Approve' : 'Reject'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
