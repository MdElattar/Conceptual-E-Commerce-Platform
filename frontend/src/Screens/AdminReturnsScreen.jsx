import { useState } from 'react';
import { useGetAllReturnsQuery, useUpdateReturnStatusMutation } from '../slices/returnsApiSlice';
import { FaBoxOpen, FaUser, FaCalendar, FaCheck, FaTimes, FaUndo } from 'react-icons/fa';
import { toast } from 'react-toastify';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

const statusStyles = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  approved: 'bg-blue-100 text-blue-800 border-blue-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  received: 'bg-purple-100 text-purple-800 border-purple-200',
  refunded: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

const AdminReturnsScreen = () => {
  const [filter, setFilter] = useState('all');
  const { data: returns, isLoading, refetch } = useGetAllReturnsQuery();
  const [updateStatus] = useUpdateReturnStatusMutation();

  const filteredReturns = returns?.filter(r => filter === 'all' || r.status === filter) || [];

  const handleStatus = async (id, status) => {
    if (!window.confirm(`Set this return to "${status}"?`)) return;
    try {
      await updateStatus({ id, status }).unwrap();
      toast.success(`Return ${status} successfully`);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update return');
    }
  };

  return (
    <div className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-[100rem] mx-auto font-sans bg-gray-50 min-h-screen">
      <header className="mb-8 border-b border-gray-200 pb-6">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase flex items-center gap-3">
          Return <span className="text-orange-600 italic">Requests</span>
        </h1>
        <p className="text-gray-500 mt-2 font-bold uppercase tracking-widest text-xs">Manage customer returns and refunds</p>
      </header>

      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'pending', 'approved', 'rejected', 'received', 'refunded'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${filter === s ? 'bg-zinc-900 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{s} ({filter === 'all' ? (returns?.length || 0) : (returns?.filter(r => r.status === s).length || 0)})</button>
        ))}
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">{[1,2,3].map(n => <div key={n} className="h-28 bg-gray-200 rounded-3xl w-full border border-gray-100"></div>)}</div>
      ) : filteredReturns.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center shadow-sm border border-gray-200">
          <div className="p-6 rounded-full bg-gray-100 w-fit mx-auto mb-4"><FaUndo size={40} className="text-gray-400" /></div>
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">No Returns Found</h2>
          <p className="text-gray-500 mt-2 font-bold text-xs uppercase tracking-widest">No return requests match this filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredReturns.map((r) => (
              <motion.div key={r._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-sm border border-gray-200 p-6 flex flex-col xl:flex-row gap-6 items-start xl:items-center">
                <div className="flex items-center gap-4 w-full xl:w-[30%] shrink-0">
                  <div className="w-16 h-16 bg-[#F8F9FA] rounded-2xl border border-gray-200 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                    <img src={r.product?.image || '/images/sample.jpg'} alt={r.product?.name} className="max-w-full max-h-full object-contain" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-900 line-clamp-2 mb-1">{r.product?.name || 'Unknown Product'}</p>
                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border ${statusStyles[r.status] || statusStyles.pending}`}>{r.status}</span>
                  </div>
                </div>
                <div className="w-full xl:w-[25%] shrink-0 space-y-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Customer</p>
                  <p className="text-xs font-bold flex items-center gap-1"><FaUser className="text-gray-400" size={11} /> {r.user?.name || 'Unknown'}</p>
                  <p className="text-[10px] font-mono text-gray-500 break-all">{r.user?.email}</p>
                </div>
                <div className="w-full xl:w-[20%] shrink-0 space-y-1">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Reason</p>
                  <p className="text-xs font-medium text-gray-700 line-clamp-2">{r.reason}</p>
                  <p className="text-[9px] font-mono text-gray-400 flex items-center gap-1 mt-1"><FaCalendar /> {new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="w-full xl:w-auto xl:ml-auto flex gap-2 shrink-0 flex-wrap">
                  {r.status === 'pending' && (
                    <>
                      <button onClick={() => handleStatus(r._id, 'approved')} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-sm cursor-pointer"><FaCheck size={11} /> Approve</button>
                      <button onClick={() => handleStatus(r._id, 'rejected')} className="flex items-center gap-2 bg-white text-red-600 border border-red-200 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all shadow-sm cursor-pointer"><FaTimes size={11} /> Reject</button>
                    </>
                  )}
                  {r.status === 'approved' && (
                    <button onClick={() => handleStatus(r._id, 'received')} className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-sm cursor-pointer"><FaBoxOpen size={11} /> Mark Received</button>
                  )}
                  {r.status === 'received' && (
                    <button onClick={() => handleStatus(r._id, 'refunded')} className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-sm cursor-pointer"><FaUndo size={11} /> Issue Refund</button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default AdminReturnsScreen;