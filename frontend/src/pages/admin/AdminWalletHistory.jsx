import React, { useState, useMemo } from 'react';
import { useGetAllWalletHistoryQuery } from '../../slices/orderApiSlice';
import {
  FiLock, FiSearch, FiActivity, FiTag, FiCalendar, FiArrowUpRight, FiArrowDownLeft, FiChevronDown, FiCopy, FiCheck
} from 'react-icons/fi';

const AdminWalletHistory = () => {
  const { data: globalTransactions, isLoading, error } = useGetAllWalletHistoryQuery();
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [copiedText, setCopiedText] = useState(null);

  const toggleRow = (id) => {
    setExpandedRow(prev => (prev === id ? null : id));
  };

  // 🔄 محرك الترجمة والتحليل المالي الذكي (Premium Fintech Parser)
  const translateLogDescription = (description) => {
    if (!description) return 'System Ledger Entry';
    if (/[\u0600-\u06FF]/.test(description)) {
      const extractedNumbers = description.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).match(/[\d.]+/g) || [];
      const amount = extractedNumbers[0] || '0.00';
      const orderId = extractedNumbers[1] || '';

      if (description.includes('سحب') || description.includes('خصم')) {
        return `An amount of EGP ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} was manually deducted from the customer's wallet assets by admin command.`;
      }
      if (description.includes('مرتجع') || description.includes('إلغاله') || description.includes('لإلغائه')) {
        return `Refunded EGP ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} credited back to wallet by admin for order cancellation #${orderId || 'N/A'}`;
      }
      return description;
    }
    return description;
  };

  const handleCopy = (text, e) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // حساب الإحصائيات المالية الشاملة للنظام بأمان عالي (Global Stats Layer)
  const globalStats = useMemo(() => {
    if (!globalTransactions || !Array.isArray(globalTransactions)) {
      return { totalDeposits: 0, totalDeductions: 0, totalActions: 0 };
    }
    return globalTransactions.reduce((acc, tx) => {
      if (tx.transactionType === 'Deposit') acc.totalDeposits += tx.amount || 0;
      if (tx.transactionType === 'Deduction') acc.totalDeductions += tx.amount || 0;
      acc.totalActions += 1;
      return acc;
    }, { totalDeposits: 0, totalDeductions: 0, totalActions: 0 });
  }, [globalTransactions]);

  // الفلترة والبحث المتقدم للأدمن بمميزات الحماية والـ Null-Safety
  const filteredTransactions = useMemo(() => {
    if (!globalTransactions || !Array.isArray(globalTransactions)) return [];
    return globalTransactions.filter((tx) => {
      const matchesTab = activeTab === 'All' || tx.transactionType === activeTab;
      const translatedDesc = translateLogDescription(tx.description).toLowerCase();
      const userIdStr = tx.user && typeof tx.user === 'object' ? tx.user._id : tx.user;
      
      const matchesSearch = 
        translatedDesc.includes(searchTerm.toLowerCase()) || 
        (tx._id && tx._id.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (userIdStr && userIdStr.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tx.userName && tx.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tx.userEmail && tx.userEmail.toLowerCase().includes(searchTerm.toLowerCase()));
        
      return matchesTab && matchesSearch;
    });
  }, [globalTransactions, activeTab, searchTerm]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto my-8 p-6 bg-white/80 rounded-[2.5rem] border border-gray-150 animate-pulse space-y-6">
        <div className="h-12 bg-gray-200 rounded-2xl w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}
        </div>
        {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-2xl w-full" />)}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto my-8 p-10 bg-white rounded-[2.5rem] border border-red-100 text-center shadow-xl">
        <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-100">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <h3 className="text-gray-900 font-black text-xl uppercase tracking-tighter italic">Admin Ledger Error</h3>
        <p className="text-gray-500 font-medium text-sm mt-1">Could not securely retrieve global transaction histories from node database.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50/30 min-h-screen pt-24 md:pt-32 pb-10 md:pb-20 px-4 sm:px-6 lg:px-8 font-sans antialiased text-gray-900" style={{ backgroundImage: `radial-gradient(#e5e7eb 1px, transparent 1px)`, backgroundSize: '24px 24px' }}>
      <div className="max-w-7xl mx-auto">
        
        {/* Upper Module Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
          <div>
            <div className="inline-block bg-gray-900 text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg mb-3 shadow-sm">
              Financial Audit Matrix
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 uppercase tracking-tighter italic leading-none">
              Global Ledger <span className="text-orange-600">Control</span>
            </h1>
            <p className="text-gray-500 font-bold mt-2 text-sm tracking-wide">Audit, search, and monitor financial transactions across all system user nodes.</p>
          </div>

          <div className="relative max-w-md w-full group">
            <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-600 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search User ID, Email, Name, TxID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold text-gray-800 placeholder-gray-400 outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500 shadow-sm transition-all"
            />
          </div>
        </div>

        {/* Analytics Micro Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white p-6 rounded-[2rem] border border-gray-150 shadow-sm flex items-center gap-4 group hover:-translate-y-0.5 transition-transform">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
              <FiArrowUpRight size={22} strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-0.5">Total Injected (Deposits)</span>
              <span className="text-xl font-black text-emerald-600 tracking-tight">+EGP {globalStats.totalDeposits.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-150 shadow-sm flex items-center gap-4 group hover:-translate-y-0.5 transition-transform">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
              <FiArrowDownLeft size={22} strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-0.5">Total Withdrawn (Deductions)</span>
              <span className="text-xl font-black text-rose-600 tracking-tight">-EGP {globalStats.totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-gray-150 shadow-sm flex items-center gap-4 group hover:-translate-y-0.5 transition-transform">
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shrink-0">
              <FiActivity size={20} className="animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-0.5">Total System Logs</span>
              <span className="text-xl font-black text-gray-900 tracking-tight">{globalStats.totalActions} Audit Events</span>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-gray-100 p-1.5 rounded-2xl inline-flex mb-8 shadow-inner border border-gray-200/50">
          {['All', 'Deposit', 'Deduction'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                activeTab === tab ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab === 'All' ? 'All System Logs' : tab === 'Deposit' ? 'Deposits Only' : 'Deductions Only'}
            </button>
          ))}
        </div>

        {/* Mobile Component Layer */}
        <div className="space-y-4 md:hidden">
          {filteredTransactions?.map((tx) => {
            const processedDesc = translateLogDescription(tx.description);
            const userId = tx.user && typeof tx.user === 'object' ? tx.user._id : tx.user;
            return (
              <div 
                key={tx._id} 
                onClick={() => toggleRow(tx._id)}
                className="bg-white p-5 rounded-3xl border border-gray-150 shadow-md space-y-3 cursor-pointer hover:border-orange-500/30 transition-all active:scale-[0.99]"
              >
                <div className="flex justify-between items-center">
                  <span className="text-gray-900 text-xs font-black truncate max-w-[180px]">
                    👤 {tx.userName || tx.userEmail || `Node: ${userId ? String(userId).slice(-6) : 'System'}`}
                  </span>
                  <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase border tracking-wider ${
                    tx.transactionType === 'Deposit' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                  }`}>
                    {tx.transactionType}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-4 pt-1">
                  <p className="text-xs text-gray-400 font-bold truncate max-w-[190px]">{processedDesc}</p>
                  <span className={`font-black text-sm tracking-tight shrink-0 ${tx.transactionType === 'Deposit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.transactionType === 'Deposit' ? '+' : '-'} {tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Desktop Responsive Grid */}
        <div className="hidden md:block bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest pl-8">Date / Time</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Account / User</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Flow Amount</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Post Balance</th>
                  <th className="p-6 text-[10px] font-black text-gray-400 uppercase tracking-widest pr-8">Audit Statement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTransactions?.map((tx) => {
                  const processedDesc = translateLogDescription(tx.description);
                  const rawUserId = tx.user && typeof tx.user === 'object' ? tx.user._id : tx.user;
                  
                  return (
                    <React.Fragment key={tx._id}>
                      <tr 
                        onClick={() => toggleRow(tx._id)}
                        className="hover:bg-gray-50/60 transition-all cursor-pointer group"
                      >
                        <td className="p-6 pl-8 text-gray-400 text-xs font-bold">
                          {new Date(tx.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          <span className="block text-[10px] text-gray-300 font-bold mt-1">
                            {new Date(tx.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td className="p-6">
                          <span className="block text-xs font-black text-gray-800 group-hover:text-orange-600 transition-colors">
                            {tx.userName || 'System Client'}
                          </span>
                          <span className="block text-[10px] text-gray-400 font-mono font-bold mt-1 truncate max-w-[140px]" title={rawUserId}>
                            ID: {rawUserId ? String(rawUserId) : 'N/A'}
                          </span>
                        </td>
                        <td className="p-6">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider ${
                            tx.transactionType === 'Deposit' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                          }`}>
                            {tx.transactionType}
                          </span>
                        </td>
                        <td className={`p-6 font-black text-base tracking-tight ${tx.transactionType === 'Deposit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {tx.transactionType === 'Deposit' ? '+' : '-'} EGP {tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-6 text-gray-900 font-black text-xs tracking-tight">
                          {tx.balanceAfter.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-[10px] text-gray-400 font-bold ml-0.5">EGP</span>
                        </td>
                        <td className="p-6 pr-8 max-w-xs">
                          <div className="flex items-center justify-between gap-4">
                            <p className="text-xs truncate font-bold text-gray-500 group-hover:text-gray-800 transition-colors" title={processedDesc}>{processedDesc}</p>
                            <FiChevronDown className={`text-gray-300 shrink-0 transition-transform duration-300 group-hover:text-orange-500 ${expandedRow === tx._id ? 'rotate-180 text-orange-600' : ''}`} size={16} />
                          </div>
                        </td>
                      </tr>

                      {/* Cryptographic Secure Trail Details */}
                      {expandedRow === tx._id && (
                        <tr className="bg-gray-50/60">
                          <td colSpan="6" className="p-6 border-l-4 border-orange-600 shadow-inner">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-3">
                                <h5 className="text-orange-600 font-black uppercase tracking-widest text-[9px]">Transaction Node Identity</h5>
                                <p className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                  <span>Log TxID:</span> 
                                  <span className="font-mono bg-white border border-gray-200 text-gray-800 px-2 py-0.5 rounded-md shadow-sm">{tx._id}</span>
                                </p>
                                <p className="text-xs font-bold text-gray-500 leading-relaxed">
                                  <span>Full Audit Trail:</span> <span className="text-gray-700 ml-1 font-medium">{processedDesc}</span>
                                </p>
                              </div>
                              <div className="space-y-3 md:border-l border-gray-200 md:pl-8">
                                <h5 className="text-gray-400 font-black uppercase tracking-widest text-[9px]">Client Association Metrics</h5>
                                <p className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                  <span>Owner Token ID:</span> 
                                  <span className="font-mono bg-white border border-gray-200 text-gray-800 px-2 py-0.5 rounded-md shadow-sm">{rawUserId ? String(rawUserId) : 'N/A'}</span>
                                </p>
                                <p className="text-xs font-bold text-gray-500">
                                  <span>Client Reference Name:</span> <span className="text-gray-900 font-black">{tx.userName || 'System Client'}</span>
                                </p>
                                <div className="flex gap-2 pt-2">
                                  <button 
                                    onClick={(e) => handleCopy(tx._id, e)}
                                    className="bg-white hover:bg-gray-900 text-gray-700 hover:text-white border border-gray-200 font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
                                  >
                                    {copiedText === tx._id ? <span className="flex items-center gap-1"><FiCheck className="text-emerald-500"/> Copied TxID</span> : 'Copy Log ID'}
                                  </button>
                                  <button 
                                    onClick={(e) => handleCopy(rawUserId ? String(rawUserId) : '', e)}
                                    className="bg-white hover:bg-gray-900 text-gray-700 hover:text-white border border-gray-200 font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95"
                                  >
                                    {copiedText === (rawUserId ? String(rawUserId) : '') ? <span className="flex items-center gap-1"><FiCheck className="text-emerald-500"/> Copied UserID</span> : 'Copy User ID'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State Handler */}
        {filteredTransactions?.length === 0 && (
          <div className="text-center py-16 border border-dashed border-gray-200 rounded-[2rem] bg-white shadow-sm my-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-3 border border-gray-100">
              <FiLock size={20} />
            </div>
            <h4 className="text-gray-800 font-black uppercase text-xs tracking-widest">No administrative logs match criteria</h4>
            <p className="text-gray-400 font-bold text-xs mt-1">Try searching with alternative parameters or check database node connectivity.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminWalletHistory;