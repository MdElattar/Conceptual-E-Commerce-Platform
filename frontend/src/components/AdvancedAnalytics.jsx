import { motion } from 'framer-motion';
import { FaSpinner, FaExclamationCircle, FaChartLine, FaBoxOpen, FaShoppingBag, FaWarehouse, FaChartBar, FaArrowUp, FaArrowDown, FaMinus, FaCrown, FaSkull, FaTags, FaChartArea, FaBoxes } from 'react-icons/fa';
import { useGetVendorAnalyticsQuery } from '../slices/orderApiSlice';
import { useSelector } from 'react-redux';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, AreaChart, Area } from 'recharts';

export default function AdvancedAnalytics() {
  const currencyState = useSelector((state) => state.currency) || {};
  const currencyCode = currencyState.currencyCode || 'USD';
  const rate = currencyState.rate || 1;

  const formatPrice = (val) => {
    const safe = Number(val) || 0;
    return `${currencyCode} ${(safe * rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const { data, isLoading, error } = useGetVendorAnalyticsQuery();

  if (isLoading) {
    return <div className="flex justify-center py-16" data-testid="analytics-spinner"><FaSpinner className="animate-spin text-3xl text-gray-300" /></div>;
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
        <FaExclamationCircle className="text-amber-500 text-4xl mx-auto mb-3" />
        <h3 className="text-base font-bold text-gray-900">Failed to load analytics</h3>
        <p className="text-sm text-gray-500 mt-1">{error?.data?.message || 'Check backend connection.'}</p>
      </div>
    );
  }

  const a = data?.analytics;
  if (!a) return null;

  const TrendIcon = a.forecast.trend === 'up' ? FaArrowUp : a.forecast.trend === 'down' ? FaArrowDown : FaMinus;
  const trendColor = a.forecast.trend === 'up' ? 'text-emerald-500' : a.forecast.trend === 'down' ? 'text-rose-500' : 'text-gray-500';

  return (
    <div className="space-y-6 mt-10 border-t border-gray-200 pt-10">
      <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
        <FaChartArea className="text-indigo-500" /> Advanced Analytics
      </h2>

      {/* ── MoM / YoY Comparisons ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Revenue (this month)</p>
          <p className="text-2xl font-black text-gray-900">{formatPrice(a.comparisons.revenue.current)}</p>
          <div className="flex gap-3 mt-2 text-xs font-bold">
            <span className={a.comparisons.revenue.momChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
              MoM: {a.comparisons.revenue.momChange >= 0 ? '+' : ''}{a.comparisons.revenue.momChange}%
            </span>
            {a.comparisons.revenue.previousYear > 0 && (
              <span className={a.comparisons.revenue.yoyChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                YoY: {a.comparisons.revenue.yoyChange >= 0 ? '+' : ''}{a.comparisons.revenue.yoyChange}%
              </span>
            )}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Orders (this month)</p>
          <p className="text-2xl font-black text-gray-900">{a.comparisons.orders.current}</p>
          <div className="flex gap-3 mt-2 text-xs font-bold">
            <span className={a.comparisons.orders.momChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
              MoM: {a.comparisons.orders.momChange >= 0 ? '+' : ''}{a.comparisons.orders.momChange}%
            </span>
            {a.comparisons.orders.previousYear > 0 && (
              <span className={a.comparisons.orders.yoyChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                YoY: {a.comparisons.orders.yoyChange >= 0 ? '+' : ''}{a.comparisons.orders.yoyChange}%
              </span>
            )}
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Earnings (this month)</p>
          <p className="text-2xl font-black text-emerald-600">{formatPrice(a.comparisons.earnings.current)}</p>
          <span className={`inline-block mt-2 text-xs font-bold ${a.comparisons.earnings.momChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            MoM: {a.comparisons.earnings.momChange >= 0 ? '+' : ''}{a.comparisons.earnings.momChange}%
          </span>
        </div>
      </div>

      {/* ── Weekly Trends ── */}
      {a.weeklyTrends && a.weeklyTrends.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
            <FaChartLine className="text-gray-400" /> Weekly Trends (12 weeks)
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={a.weeklyTrends} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" tick={{ fontSize: 10, fontWeight: 600 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                labelStyle={{ fontWeight: 700, fontSize: 13 }}
                formatter={(value, name) => [name === 'orders' || name === 'delivered' ? value : formatPrice(value), name]}
              />
              <Legend wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
              <Area type="monotone" dataKey="sales" name="Sales" stroke="#3b82f6" fill="url(#salesGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="earnings" name="Earnings" stroke="#10b981" fill="url(#earningsGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* ── Top & Worst Products ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {a.topProducts && a.topProducts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FaCrown className="text-amber-500" /> Top 10 Best Sellers
            </h3>
            <div className="space-y-3">
              {a.topProducts.map((p, i) => (
                <div key={p.id || i} className="flex items-center gap-3 p-2 bg-gradient-to-r from-amber-50/50 to-transparent rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-black shrink-0">{i + 1}</span>
                  <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
                    {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <FaShoppingBag className="text-gray-400 m-auto mt-2.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                    <p className="text-[10px] text-gray-400">{p.qtySold} sold</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-gray-900">{formatPrice(p.revenue)}</p>
                    <p className="text-[10px] font-bold text-emerald-600">{formatPrice(p.earnings)} earned</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        {a.worstProducts && a.worstProducts.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <FaSkull className="text-red-400" /> Bottom 10 Performers
            </h3>
            <div className="space-y-3">
              {a.worstProducts.map((p, i) => (
                <div key={p.id || i} className="flex items-center gap-3 p-2 bg-gradient-to-r from-rose-50/50 to-transparent rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-black shrink-0">{i + 1}</span>
                  <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
                    {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : <FaShoppingBag className="text-gray-400 m-auto mt-2.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                    <p className="text-[10px] text-gray-400">{p.numSales || 0} sold &bull; Stock: {p.countInStock}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-gray-900">{formatPrice((p.numSales || 0) * (p.price || 0))}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Profit Margins ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
          <FaTags className="text-gray-400" /> Profit Margins
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <FaChartBar className="text-emerald-500 text-2xl" />
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Overall Margin</p>
              <p className="text-3xl font-black text-emerald-600">{a.profitMargins.overall}%</p>
              <p className="text-[10px] text-gray-400 font-bold">Net profit after commission</p>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">By Category</p>
            {a.profitMargins.byCategory && a.profitMargins.byCategory.length > 0 ? (
              <div className="space-y-2">
                {a.profitMargins.byCategory.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="font-bold text-gray-700">{c.category}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${Math.min(c.margin, 100)}%` }} />
                      </div>
                      <span className="font-black text-gray-900 w-12 text-right">{c.margin.toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No data yet</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Inventory Insights ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
          <FaWarehouse className="text-gray-400" /> Inventory Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 text-center">
            <p className="text-2xl font-black text-indigo-600">{a.inventoryInsights.totalStock}</p>
            <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Total Stock</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
            <p className="text-2xl font-black text-emerald-600">{a.inventoryInsights.turnoverRate}</p>
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Turnover Rate</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 text-center">
            <p className="text-2xl font-black text-amber-600">{a.inventoryInsights.lowStockItems.length + a.inventoryInsights.outOfStockItems.length}</p>
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Items Needing Attention</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {a.inventoryInsights.lowStockItems.length > 0 && (
            <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-100">
              <p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-2 flex items-center gap-1"><FaExclamationCircle /> Low Stock ({a.inventoryInsights.lowStockItems.length})</p>
              <div className="space-y-1.5">
                {a.inventoryInsights.lowStockItems.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm font-semibold text-gray-700">
                    <span className="truncate">{item.name}</span>
                    <span className="text-amber-600 shrink-0 ml-2">{item.countInStock} / {item.threshold}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {a.inventoryInsights.outOfStockItems.length > 0 && (
            <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100">
              <p className="text-xs font-black text-rose-700 uppercase tracking-widest mb-2 flex items-center gap-1"><FaBoxes /> Out of Stock ({a.inventoryInsights.outOfStockItems.length})</p>
              <div className="space-y-1.5">
                {a.inventoryInsights.outOfStockItems.map((item, i) => (
                  <div key={i} className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <FaSkull className="text-rose-400 shrink-0" size={10} />
                    <span className="truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Forecast ── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
          <FaChartArea className="text-gray-400" /> Revenue Forecast
        </h3>
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
          <TrendIcon className={`text-3xl ${trendColor}`} />
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Next Month Projection</p>
            <p className="text-2xl font-black text-gray-900">{formatPrice(a.forecast.nextMonthRevenue)}</p>
            <p className="text-xs font-bold text-gray-500">
              Trend: <span className={trendColor}>{a.forecast.trend.toUpperCase()}</span> &bull; {a.forecast.basedOn}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
