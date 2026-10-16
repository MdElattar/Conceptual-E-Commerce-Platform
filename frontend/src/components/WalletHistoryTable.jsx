import React, { useState, useMemo } from 'react';
import { useGetMyWalletHistoryQuery } from '../slices/orderApiSlice';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { FaWallet, FaArrowUp, FaArrowDown, FaHistory, FaSearch, FaCopy, FaCheck, FaExclamationTriangle, FaChevronDown } from 'react-icons/fa';

const WalletHistoryTable = () => {
  const { data: transactions, isLoading, error } = useGetMyWalletHistoryQuery();
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // 🧠 مفسر ومترجم السجلات المالي الذكي لدعم توحيد اللغة والـ Architecture
  const translateLogDescription = (description) => {
    if (!description) return 'No log parameters provided';
    
    if (/[\u0600-\u06FF]/.test(description)) {
      const extractedNumbers = description.match(/[\d.]+/g) || [];
      const amount = extractedNumbers[0] || '0.00';
      const orderId = extractedNumbers[1] || '';

      if (description.includes('سحب') && description.includes('يدوياً')) {
        return `Manual debit adjustments: EGP ${amount} transferred to bank by administrator clearance.`;
      }
      if (description.includes('مرتجع') || description.includes('إلغائه')) {
        return `Order reversal sequence #${orderId || 'N/A'}: EGP ${amount} credited back to ledger.`;
      }
      return description;
    }
    return description;
  };

  const handleCopyId = (id, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const stats = useMemo(() => {
    if (!transactions) return { totalIn: 0, totalOut: 0, count: 0 };
    return transactions.reduce((acc, tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.transactionType === 'Deposit') acc.totalIn += amt;
      if (tx.transactionType === 'Deduction') acc.totalOut += amt;
      acc.count += 1;
      return acc;
    }, { totalIn: 0, totalOut: 0, count: 0 });
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions?.filter((tx) => {
      const matchesTab = activeTab === 'All' || tx.transactionType === activeTab;
      const translatedDesc = translateLogDescription(tx.description).toLowerCase();
      const matchesSearch = translatedDesc.includes(searchTerm.toLowerCase()) || 
                            tx._id?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesTab && matchesSearch;
    });
  }, [transactions, activeTab, searchTerm]);

  const toggleRow = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-5xl mx-auto my-6 p-5 bg-white border border-gray-200/60 rounded-[2rem] space-y-4 shadow-sm animate-pulse">
        <div className="h-10 bg-gray-100 rounded-xl w-1/4" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-50 rounded-xl" />)}
        </div>
        <div className="h-48 bg-gray-50 rounded-xl w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-5xl mx-auto my-6 p-8 bg-white border border-red-100 rounded-[2rem] text-center shadow-md">
        <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3 border border-red-100">
          <FaExclamationTriangle size={18} />
        </div>
        <h3 className="text-gray-900 font-black text-sm uppercase tracking-tight">Ledger Synchronization Offline</h3>
        <p className="text-gray-400 text-xs mt-1 font-sans font-medium">Failed to pull operational history from the database pipeline.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto my-6 p-5 sm:p-6 bg-white border border-gray-200/80 rounded-[2rem] text-left font-mono antialiased shadow-sm box-border">
      
      {/* Upper Pipeline Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 mb-5 border-b border-gray-100 gap-4">
        <div>
          <h2 className="text-base font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
            <FaWallet className="text-orange-600" size={14} /> Core Ledger Audit
          </h2>
          <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mt-0.5">Real-time cryptographic wallet sequence nodes.</p>
        </div>

        {/* Search Matrix */}
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-3.5 flex items-center text-gray-400">
            <FaSearch size={11} />
          </span>
          <input
            type="text"
            placeholder="FILTER NODES OR IDS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-[11px] font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:border-orange-500/50 focus:bg-white focus:ring-4 focus:ring-orange-500/5 transition-all uppercase tracking-wider"
          />
        </div>
      </div>

      {/* Grid Dashboard Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
          <span className="text-gray-400 text-[9px] uppercase font-black tracking-widest flex items-center gap-1.5"><FaArrowUp className="text-emerald-600" size={8} /> Gross Deposits</span>
          <span className="text-lg font-black text-emerald-600 font-mono mt-1 block">+EGP {formatCurrency(stats.totalIn)}</span>
        </div>
        <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
          <span className="text-gray-400 text-[9px] uppercase font-black tracking-widest flex items-center gap-1.5"><FaArrowDown className="text-rose-600" size={8} /> Gross Deductions</span>
          <span className="text-lg font-black text-rose-600 font-mono mt-1 block">-EGP {formatCurrency(stats.totalOut)}</span>
        </div>
        <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
          <span className="text-gray-400 text-[9px] uppercase font-black tracking-widest flex items-center gap-1.5"><FaHistory className="text-orange-600" size={8} /> Sequence Nodes</span>
          <span className="text-lg font-black text-gray-800 font-mono mt-1 block">{stats.count} Commits</span>
        </div>
      </div>

      {/* Sort Pipelines Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200/60 mb-6 self-start inline-flex">
        {['All', 'Deposit', 'Deduction'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-150 ${
              activeTab === tab ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-400 hover:text-gray-800'
            }`}
          >
            {tab === 'All' ? 'All Matrices' : tab === 'Deposit' ? 'Deposits' : 'Debits'}
          </button>
        ))}
      </div>

      {/* 📱 Mobile Dynamic Layout */}
      <div className="space-y-3 md:hidden">
        {filteredTransactions?.map((tx) => {
          const processedDesc = translateLogDescription(tx.description);
          const isExpanded = expandedRow === tx._id;
          return (
            <div 
              key={tx._id} 
              onClick={() => toggleRow(tx._id)}
              className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm space-y-2.5 cursor-pointer active:bg-gray-50 transition-all box-border"
            >
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-[10px] font-bold">
                  {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${
                  tx.transactionType === 'Deposit' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                }`}>
                  {tx.transactionType}
                </span>
              </div>
              
              <div className="flex justify-between items-center gap-4">
                <div className={`text-xs text-gray-500 font-sans font-medium ${isExpanded ? 'whitespace-normal' : 'truncate max-w-[190px]'}`}>
                  {processedDesc}
                </div>
                <div className={`font-black font-mono text-xs shrink-0 ${tx.transactionType === 'Deposit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {tx.transactionType === 'Deposit' ? '+' : '-'} EGP {formatCurrency(tx.amount)}
                </div>
              </div>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden pt-3 border-t border-gray-100 text-[10px] text-gray-400 space-y-2"
                  >
                    <div className="flex justify-between items-center bg-gray-50 p-2 rounded-xl border border-gray-200 mt-1">
                      <span className="truncate mr-2 font-bold text-gray-500">HEX ID: {tx._id}</span>
                      <button 
                        onClick={(e) => handleCopyId(tx._id, e)} 
                        className="text-orange-600 font-black uppercase shrink-0 flex items-center gap-1 hover:text-gray-900"
                      >
                        {copiedId === tx._id ? <><FaCheck size={8} /> Copied</> : <><FaCopy size={8} /> Copy</>}
                      </button>
                    </div>
                    <div className="flex justify-between pt-1 font-bold">
                      <span>RUNNING LEDGER:</span>
                      <span className="text-gray-800 font-black">EGP {formatCurrency(tx.balanceAfter)}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* 💻 Desktop Monitor Grid */}
      <div className="hidden md:block overflow-x-auto w-full border border-gray-100 rounded-2xl">
        <table className="w-full text-left text-gray-700 border-collapse table-fixed">
          <thead>
            <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-400 text-[10px] uppercase tracking-widest font-black">
              <th className="p-4 pl-5 w-[16%]">Timestamp</th>
              <th className="p-4 w-[16%]">Classification</th>
              <th className="p-4 w-[18%]">Delta Amount</th>
              <th className="p-4 w-[18%]">Anchor Balance</th>
              <th className="p-4 pr-5 w-[32%]">Operational logs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {filteredTransactions?.map((tx) => {
              const processedDesc = translateLogDescription(tx.description);
              const isExpanded = expandedRow === tx._id;
              return (
                <React.Fragment key={tx._id}>
                  <tr 
                    onClick={() => toggleRow(tx._id)}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer group"
                  >
                    <td className="p-4 pl-5 text-gray-400 font-bold text-[11px]">
                      {new Date(tx.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      <span className="block text-[9px] text-gray-300 font-normal mt-0.5">
                        {new Date(tx.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                        tx.transactionType === 'Deposit' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        <span className={`w-1 h-1 rounded-full ${tx.transactionType === 'Deposit' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        {tx.transactionType === 'Deposit' ? 'DEPOSIT' : 'DEBIT'}
                      </span>
                    </td>
                    <td className={`p-4 font-black font-mono text-sm tracking-tight ${tx.transactionType === 'Deposit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.transactionType === 'Deposit' ? '+' : '-'} {formatCurrency(tx.amount)}
                    </td>
                    <td className="p-4 font-black font-mono text-gray-800">
                      {formatCurrency(tx.balanceAfter)} <span className="text-[9px] text-gray-400 font-bold">EGP</span>
                    </td>
                    <td className="p-4 pr-5 text-gray-500 font-sans font-medium">
                      <div className="flex items-center justify-between gap-3">
                        <p className={`text-[11px] leading-relaxed truncate max-w-[220px] group-hover:text-gray-800 transition-colors`}>{processedDesc}</p>
                        <FaChevronDown size={9} className={`text-gray-300 shrink-0 transition-transform duration-200 group-hover:text-orange-500 ${isExpanded ? 'rotate-180 text-orange-600' : ''}`} />
                      </div>
                    </td>
                  </tr>

                  {/* Desktop Dropdown Component */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <tr>
                        <td colSpan="5" className="p-0 bg-gray-50/30">
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-l-4 border-orange-600 my-1 py-3.5 px-5 bg-gray-50/60 text-[11px] text-gray-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner"
                          >
                            <div className="space-y-1">
                              <p><span className="text-gray-400 font-black uppercase text-[9px] tracking-wider mr-1.5">Node Hash ID:</span> <span className="font-mono text-gray-600 font-bold select-all">{tx._id}</span></p>
                              <p><span className="text-gray-400 font-black uppercase text-[9px] tracking-wider mr-1.5">Full Statement:</span> <span className="font-sans text-gray-700 font-medium">{processedDesc}</span></p>
                            </div>
                            <button 
                              onClick={(e) => handleCopyId(tx._id, e)}
                              className="bg-white hover:bg-gray-900 text-gray-700 hover:text-white border border-gray-200 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-sm shrink-0 flex items-center gap-1.5 active:scale-95"
                            >
                              {copiedId === tx._id ? <><FaCheck className="text-emerald-500" /> Token Copied</> : <><FaCopy /> Copy Hex ID</>}
                            </button>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State Vector */}
      {filteredTransactions?.length === 0 && (
        <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50 my-2">
          <h4 className="text-gray-400 font-black text-xs uppercase tracking-wider">No Transaction Records Found</h4>
          <p className="text-gray-400 font-sans text-[11px] font-medium mt-1">The filtered query parameter yielded zero matching operational entries.</p>
        </div>
      )}
    </div>
  );
};

export default WalletHistoryTable;