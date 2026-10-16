import { motion } from 'framer-motion';
import { FaSpinner, FaStar, FaTruck, FaCheckCircle, FaTimesCircle, FaChartLine, FaBoxOpen, FaExclamationCircle, FaArrowUp, FaArrowDown, FaShoppingBag, FaChartBar, FaChartPie } from 'react-icons/fa';
import { useGetVendorPerformanceQuery } from '../slices/orderApiSlice';
import { useSelector } from 'react-redux';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import AdvancedAnalytics from './AdvancedAnalytics';

const gradeColors = {
  'A+': 'text-emerald-600 bg-emerald-50 border-emerald-200',
  'A': 'text-emerald-500 bg-emerald-50 border-emerald-200',
  'B': 'text-blue-600 bg-blue-50 border-blue-200',
  'C': 'text-amber-600 bg-amber-50 border-amber-200',
  'D': 'text-rose-600 bg-rose-50 border-rose-200',
};

export default function SellerPerformanceTab() {
  const currencyState = useSelector((state) => state.currency) || {};
  const currencyCode = currencyState.currencyCode || 'USD';
  const rate = currencyState.rate || 1;

  const formatLocalPrice = (amount) => {
    const safeAmount = Number(amount) || 0;
    const convertedAmount = safeAmount * rate;
    return `${currencyCode} ${convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const { data, isLoading, error } = useGetVendorPerformanceQuery();

  if (isLoading) {
    return <div className="flex justify-center py-20" data-testid="performance-spinner"><FaSpinner className="animate-spin text-4xl text-gray-300" /></div>;
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <FaExclamationCircle className="text-amber-500 text-5xl mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900">Could not load performance data</h3>
        <p className="text-sm text-gray-500 mt-2">{error?.data?.message || 'Please check backend connection.'}</p>
      </div>
    );
  }

  const p = data?.performance;

  if (!p) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
        <FaChartLine className="text-gray-200 text-6xl mx-auto mb-4" />
        <p className="text-gray-500 font-bold">No performance data available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Score Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black border-4 ${gradeColors[p.grade] || 'text-gray-600 bg-gray-50 border-gray-200'}`}>
          {p.performanceScore}
        </div>
        <div className="text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <h2 className="text-2xl font-black text-gray-900">Grade {p.grade}</h2>
            <span className={`px-3 py-1 rounded-full text-xs font-black ${gradeColors[p.grade] || ''}`}>
              {p.performanceScore >= 90 ? 'Excellent' : p.performanceScore >= 80 ? 'Great' : p.performanceScore >= 70 ? 'Good' : p.performanceScore >= 60 ? 'Fair' : 'Needs Improvement'}
            </span>
          </div>
          <p className="text-sm text-gray-500 font-medium mt-1">Overall seller performance score based on fulfillment, quality, and reliability.</p>
        </div>
      </div>

      {/* Core Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <FaCheckCircle className="text-emerald-500" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fulfillment Rate</p>
          </div>
          <p className="text-2xl font-black text-gray-900">{p.fulfillmentRate}%</p>
          <p className="text-[10px] text-gray-400 font-bold mt-1">{p.deliveredItems} of {p.totalItems} delivered</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <FaTimesCircle className="text-rose-500" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cancellation Rate</p>
          </div>
          <p className="text-2xl font-black text-gray-900">{p.cancellationRate}%</p>
          <p className="text-[10px] text-gray-400 font-bold mt-1">{p.cancelledItems} cancelled</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <FaTruck className="text-indigo-500" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Avg Shipping</p>
          </div>
          <p className="text-2xl font-black text-gray-900">{p.avgShippingHours > 0 ? `${p.avgShippingHours}h` : 'N/A'}</p>
          <p className="text-[10px] text-gray-400 font-bold mt-1">Time to deliver</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-2">
            <FaStar className="text-amber-500" />
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Avg Rating</p>
          </div>
          <p className="text-2xl font-black text-gray-900">{p.avgRating}</p>
          <p className="text-[10px] text-gray-400 font-bold mt-1">{p.totalReviews} reviews</p>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Sales Value</p>
          <p className="text-3xl font-black text-gray-900">{formatLocalPrice(p.totalSalesValue)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Earnings (After Commission)</p>
          <p className="text-3xl font-black text-emerald-600">{formatLocalPrice(p.totalEarnings)}</p>
        </div>
      </div>

      {/* Order Status Breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
          <FaBoxOpen className="text-gray-400" /> Order Status Breakdown
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <p className="text-2xl font-black text-emerald-600">{p.deliveredItems}</p>
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Delivered</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
            <p className="text-2xl font-black text-blue-600">{p.shippedItems}</p>
            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Shipped</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-2xl font-black text-gray-600">{p.pendingItems}</p>
            <p className="text-[10px] font-bold text-gray-700 uppercase tracking-wider">Pending</p>
          </div>
          <div className="text-center p-4 bg-rose-50 rounded-xl border border-rose-100">
            <p className="text-2xl font-black text-rose-600">{p.cancelledItems}</p>
            <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Cancelled</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      {p.monthlyTrends && p.monthlyTrends.length > 0 && (
        <>
          {/* Bar Chart: Monthly Sales & Earnings */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FaChartBar className="text-gray-400" /> Monthly Sales & Earnings
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={p.monthlyTrends} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 600 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  labelStyle={{ fontWeight: 700, fontSize: 13 }}
                  formatter={(value) => [`${currencyCode} ${(Number(value) * rate).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                <Bar dataKey="sales" name="Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="earnings" name="Earnings" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Line Chart: Monthly Order Trends */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FaChartLine className="text-gray-400" /> Monthly Order Trends
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={p.monthlyTrends} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 600 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                  labelStyle={{ fontWeight: 700, fontSize: 13 }}
                />
                <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                <Line type="monotone" dataKey="orders" name="Total Orders" stroke="#6b7280" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="delivered" name="Delivered" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="cancelled" name="Cancelled" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </>
      )}

      {/* Donut Chart: Order Status Breakdown */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
          <FaChartPie className="text-gray-400" /> Order Status Distribution
        </h3>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Delivered', value: p.deliveredItems, color: '#10b981' },
                  { name: 'Shipped', value: p.shippedItems, color: '#3b82f6' },
                  { name: 'Pending', value: p.pendingItems, color: '#f59e0b' },
                  { name: 'Cancelled', value: p.cancelledItems, color: '#ef4444' },
                ].filter(d => d.value > 0)}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {[
                  { name: 'Delivered', value: p.deliveredItems, color: '#10b981' },
                  { name: 'Shipped', value: p.shippedItems, color: '#3b82f6' },
                  { name: 'Pending', value: p.pendingItems, color: '#f59e0b' },
                  { name: 'Cancelled', value: p.cancelledItems, color: '#ef4444' },
                ].filter(d => d.value > 0).map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                labelStyle={{ fontWeight: 700, fontSize: 13 }}
                formatter={(value, name) => [value, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 justify-center">
            {p.deliveredItems > 0 && <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-700"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Delivered ({p.deliveredItems})</span>}
            {p.shippedItems > 0 && <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-700"><span className="w-3 h-3 rounded-full bg-blue-500" /> Shipped ({p.shippedItems})</span>}
            {p.pendingItems > 0 && <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-700"><span className="w-3 h-3 rounded-full bg-amber-500" /> Pending ({p.pendingItems})</span>}
            {p.cancelledItems > 0 && <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-700"><span className="w-3 h-3 rounded-full bg-red-500" /> Cancelled ({p.cancelledItems})</span>}
          </div>
        </div>
      </motion.div>

      {/* Monthly Trends Table */}
      {p.monthlyTrends && p.monthlyTrends.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
            <FaChartLine className="text-gray-400" /> Monthly Performance Trends
          </h3>
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-gray-400 text-[10px] uppercase tracking-widest border-b border-gray-200">
                  <th className="p-3 font-black">Month</th>
                  <th className="p-3 font-black">Orders</th>
                  <th className="p-3 font-black">Delivered</th>
                  <th className="p-3 font-black">Cancelled</th>
                  <th className="p-3 font-black">Sales</th>
                  <th className="p-3 font-black">Earnings</th>
                </tr>
              </thead>
              <tbody className="text-sm font-semibold text-gray-800 divide-y divide-gray-100">
                {p.monthlyTrends.map((t, i) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 font-bold text-gray-900">{t.month}</td>
                    <td className="p-3">{t.orders}</td>
                    <td className="p-3">
                      <span className="flex items-center gap-1 text-emerald-600">
                        <FaArrowUp size={10} /> {t.delivered}
                      </span>
                    </td>
                    <td className="p-3">
                      {t.cancelled > 0 ? (
                        <span className="flex items-center gap-1 text-rose-600">
                          <FaArrowDown size={10} /> {t.cancelled}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-3 font-mono">{formatLocalPrice(t.sales)}</td>
                    <td className="p-3 font-mono text-emerald-600">{formatLocalPrice(t.earnings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AdvancedAnalytics />
    </div>
  );
}
