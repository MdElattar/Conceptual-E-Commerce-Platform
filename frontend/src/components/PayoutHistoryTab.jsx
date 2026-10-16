import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaSpinner, FaMoneyBillWave, FaUniversity, FaExclamationCircle, FaCheckCircle, FaClock, FaTimesCircle, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { useGetVendorWalletTransactionsQuery } from '../slices/orderApiSlice';
import { useSelector } from 'react-redux';

const typeIcons = {
  Deposit: FaArrowDown,
  Deduction: FaArrowUp,
  Withdrawal: FaArrowUp,
};

const typeColors = {
  Deposit: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  Deduction: 'text-rose-600 bg-rose-50 border-rose-200',
  Withdrawal: 'text-amber-600 bg-amber-50 border-amber-200',
};

const statusBadges = {
  Pending: 'bg-amber-100 text-amber-800 border-amber-200',
  Completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Rejected: 'bg-rose-100 text-rose-800 border-rose-200',
};

export default function PayoutHistoryTab() {
  const [filter, setFilter] = useState('all');

  const currencyState = useSelector((state) => state.currency) || {};
  const currencyCode = currencyState.currencyCode || 'USD';
  const rate = currencyState.rate || 1;

  const formatLocalPrice = (amount) => {
    const safeAmount = Number(amount) || 0;
    const convertedAmount = safeAmount * rate;
    return `${currencyCode} ${convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const { data: transactions = [], isLoading, error } = useGetVendorWalletTransactionsQuery();

  const filtered = filter === 'all'
    ? transactions
    : transactions.filter(t => t.transactionType === filter || t.status === filter);

  const summary = {
    total: transactions.length,
    withdrawals: transactions.filter(t => t.transactionType === 'Withdrawal').length,
    deposits: transactions.filter(t => t.transactionType === 'Deposit').length,
    pending: transactions.filter(t => t.status === 'Pending').length,
  };

  const filterTabs = [
    { id: 'all', label: `All (${summary.total})` },
    { id: 'Withdrawal', label: `Withdrawals (${summary.withdrawals})` },
    { id: 'Deposit', label: `Deposits (${summary.deposits})` },
    { id: 'Pending', label: `Pending (${summary.pending})` },
  ];

  if (isLoading) {
    return <div className="flex justify-center py-20"><FaSpinner className="animate-spin text-4xl text-gray-300" /></div>;
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <FaExclamationCircle className="text-amber-500 text-5xl mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900">Could not load payout history</h3>
        <p className="text-sm text-gray-500 mt-2">{error?.data?.message || 'Please check backend connection.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Transactions</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{summary.total}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Withdrawals</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{summary.withdrawals}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Deposits</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{summary.deposits}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending</p>
          <p className="text-2xl font-black text-rose-600 mt-1">{summary.pending}</p>
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

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <FaMoneyBillWave className="text-gray-200 text-6xl mx-auto mb-4" />
          <p className="text-gray-500 font-bold">No transactions found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((tx) => {
            const TypeIcon = typeIcons[tx.transactionType] || FaMoneyBillWave;
            const iconColor = typeColors[tx.transactionType] || 'text-gray-600 bg-gray-50 border-gray-200';
            return (
              <motion.div key={tx._id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${iconColor}`}>
                      <TypeIcon size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">{tx.description || tx.transactionType}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadges[tx.status] || 'bg-gray-100 text-gray-600'}`}>
                          {tx.status || 'N/A'}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400">{new Date(tx.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-black ${tx.transactionType === 'Deposit' ? 'text-emerald-600' : 'text-gray-900'}`}>
                      {tx.transactionType === 'Deposit' ? '+' : '-'}{formatLocalPrice(tx.amount || 0)}
                    </p>
                    <p className="text-[10px] text-gray-400 font-bold">Balance: {formatLocalPrice(tx.balanceAfter || 0)}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
