import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
    FaTrash, FaPlus, FaTruckLoading, FaWeightHanging, 
    FaGlobeAmericas, FaSearch, FaExclamationCircle, 
    FaInfoCircle, FaShieldAlt
} from 'react-icons/fa';
import { Country } from 'country-state-city';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const ShippingRatesScreen = () => {
  const [rates, setRates] = useState([]);
  const [country, setCountry] = useState('EG');
  const [minWeight, setMinWeight] = useState('');
  const [maxWeight, setMaxWeight] = useState('');
  const [cost, setCost] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRates = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      // 🌟 تأكد من إن مسار الباك إند متوافق (في بعض نسخ الكود السابقة كان /api/shipping-rates)
      const { data } = await axios.get('/api/shipping', config);
      setRates(data);
    } catch {
      toast.error('Failed to connect to Logistics Grid Node');
    }
  };

  useEffect(() => { fetchRates(); }, []);

  const stats = useMemo(() => {
    const costs = rates.map(r => r.cost);
    return {
      totalZones: new Set(rates.map(r => r.country)).size,
      avgCost: rates.length ? (rates.reduce((acc, r) => acc + r.cost, 0) / rates.length).toFixed(2) : 0,
      peakTariff: costs.length ? Math.max(...costs).toFixed(2) : '0.00'
    };
  }, [rates]);

  const isCollisionDetected = useMemo(() => {
    if (!minWeight || !maxWeight) return false;
    return rates.some(r => 
      r.country === country && 
      ((Number(minWeight) >= r.minWeight && Number(minWeight) < r.maxWeight) ||
       (Number(maxWeight) > r.minWeight && Number(maxWeight) <= r.maxWeight))
    );
  }, [rates, country, minWeight, maxWeight]);

  const filteredRates = useMemo(() => {
    return rates.filter(r => {
      const countryName = Country.getCountryByCode(r.country)?.name.toLowerCase() || '';
      return r.country.toLowerCase().includes(searchTerm.toLowerCase()) || 
             countryName.includes(searchTerm.toLowerCase());
    });
  }, [rates, searchTerm]);

  const submitHandler = async (e) => {
    e.preventDefault();
    if(Number(minWeight) >= Number(maxWeight)) {
        return toast.warning("Range Error: Min mass vector must be strictly lower than Max mass.");
    }
    
    setLoading(true);
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.post('/api/shipping', { country, minWeight, maxWeight, cost }, config);
      
      toast.success(`Logistics Rule Activated for ${country} 🚀`);
      setMinWeight(''); setMaxWeight(''); setCost('');
      fetchRates();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Configuration Sync Failed');
    } finally {
      setLoading(false);
    }
  };

  const deleteHandler = async (id) => {
    if (window.confirm('WARNING: Decommissioning this rule will instantly mutate active client checkouts. Proceed? ⚠️')) {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
        await axios.delete(`/api/shipping/${id}`, config);
        toast.info('Logistics matrix node decommissioned');
        fetchRates();
      } catch {
        toast.error('Operation Refused by Guard Core');
      }
    }
  };

  return (
    <div className="bg-gray-50/30 min-h-screen pt-24 md:pt-32 pb-10 md:pb-20 px-4 sm:px-6 lg:px-8 font-sans antialiased text-gray-900">
      
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6 border-b border-gray-100 pb-8">
        <div className="flex items-center gap-5">
          <div className="bg-gray-900 p-5 rounded-[2.2rem] shadow-xl text-orange-500 -rotate-3 border border-orange-500/10 shrink-0">
            <FaTruckLoading size={36} />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <p className="text-gray-400 font-black text-[9px] uppercase tracking-widest">Global Logistics Subsystem</p>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 uppercase tracking-tight italic leading-none">
              Freight <span className="text-orange-600">Control</span>
            </h1>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
            <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm flex items-center gap-3 min-w-[120px]">
                <div className="w-9 h-9 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center font-black text-xs shadow-inner">{stats.totalZones}</div>
                <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider leading-tight">Active<br/>Hubs</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm flex items-center gap-3 min-w-[120px]">
                <div className="w-9 h-9 bg-gray-50 text-gray-900 rounded-xl flex items-center justify-center font-black text-xs shadow-inner">${stats.avgCost}</div>
                <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider leading-tight">Average<br/>Tariff</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-150 shadow-sm flex items-center gap-3 min-w-[120px]">
                <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-black text-xs shadow-inner">${stats.peakTariff}</div>
                <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider leading-tight">Peak<br/>Tariff</p>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-4">
          <form onSubmit={submitHandler} className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-gray-150 sticky top-28 space-y-6">
            <div className="border-b border-gray-50 pb-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <FaPlus className="text-orange-600" size={10}/> Establish Tariff Rule
              </h2>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block tracking-wider">Target Destination Vector</label>
                <div className="relative">
                  <FaGlobeAmericas className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-600 z-10" size={12} />
                  <select 
                    value={country} onChange={(e) => setCountry(e.target.value)}
                    className="w-full pl-12 pr-10 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none font-bold text-sm transition-all cursor-pointer text-gray-800 shadow-inner appearance-none"
                  >
                    {Country.getAllCountries().map((c) => (
                      <option key={c.isoCode} value={c.isoCode}>{c.name} ({c.isoCode})</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block tracking-wider">Min Mass (KG)</label>
                    <div className="relative">
                        <FaWeightHanging className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={11}/>
                        <input type="number" step="0.01" value={minWeight} onChange={(e) => setMinWeight(e.target.value)} className="w-full pl-10 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none font-mono font-bold text-sm transition-all shadow-inner" placeholder="0.00" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block tracking-wider">Max Mass (KG)</label>
                    <div className="relative">
                        <FaWeightHanging className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={11}/>
                        <input type="number" step="0.01" value={maxWeight} onChange={(e) => setMaxWeight(e.target.value)} className="w-full pl-10 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none font-mono font-bold text-sm transition-all shadow-inner" placeholder="10.00" required />
                    </div>
                  </div>
              </div>

              {isCollisionDetected && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-[10px] text-amber-800 font-bold leading-normal">
                  <FaExclamationCircle className="shrink-0 mt-0.5 text-amber-600" size={12}/>
                  <span>Collision Warning: This weight range overlaps with an existing matrix rule for {Country.getCountryByCode(country)?.name}.</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1 block tracking-wider">Secure Tariff Surcharge</label>
                <div className="relative flex items-center">
                  <span className="absolute left-5 font-mono font-black text-orange-500 text-xl">$</span>
                  <input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} className="w-full pl-12 pr-4 py-5 bg-gray-950 text-orange-500 rounded-2xl outline-none font-mono font-black text-2xl  focus:ring-4 ring-orange-500/10 transition-all shadow-inner" placeholder="0.00" required />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-gray-900 transition-all shadow-xl shadow-orange-600/10 active:scale-95 disabled:bg-gray-100 disabled:text-gray-400 flex items-center justify-center gap-2">
                {loading ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> : <><FaPlus size={10}/> Activate System Rule</>}
              </button>
            </div>
          </form>
        </motion.div>

        <div className="lg:col-span-8 space-y-6">
          <div className="relative group">
              <FaSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-600 transition-colors" size={12} />
              <input 
                  type="text" 
                  placeholder="Query Matrix by Country Code or Identifier (e.g. Germany)..." 
                  className="pl-12 p-3 pr-6 py-4.5 bg-white border border-gray-200 rounded-2xl shadow-sm outline-none focus:ring-4 focus:ring-orange-500/5 w-full font-bold text-xs"
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-md border border-gray-150 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-widest text-left">Logistics Zone</th>
                    <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-widest text-left">Weight Constraint</th>
                    <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-widest text-left">Tariff Base</th>
                    <th className="p-6 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Action Console</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <AnimatePresence mode="popLayout">
                    {filteredRates.length === 0 ? (
                      <motion.tr initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
                        <td colSpan="4" className="p-16 text-center">
                            <div className="relative inline-block mb-4">
                                <FaTruckLoading className="text-gray-100" size={70}/>
                                <FaShieldAlt className="absolute bottom-0 right-0 text-orange-500 bg-white rounded-full p-1" size={24}/>
                            </div>
                            <p className="text-gray-400 font-black uppercase tracking-wider text-[10px]">No Active Logistics Routing Vectors Matched</p>
                        </td>
                      </motion.tr>
                    ) : (
                      filteredRates.map((rate) => (
                        <motion.tr layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.98 }} key={rate._id} className="hover:bg-gray-50/50 transition-all group">
                          <td className="p-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-950 text-orange-500 rounded-xl flex items-center justify-center font-mono font-black text-xs shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                                    {rate.country}
                                </div>
                                <div>
                                    <span className="block font-black text-gray-800 tracking-tight text-sm">
                                        {Country.getCountryByCode(rate.country)?.name || 'Generic Zone Node'}
                                    </span>
                                    <span className="text-[8px] text-emerald-600 font-black uppercase tracking-widest block mt-0.5">Customs Gateway Synced</span>
                                </div>
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="flex items-center gap-2">
                              <span className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-mono font-bold text-xs text-gray-600 shadow-xs">{rate.minWeight}kg</span>
                              <div className="h-[2px] w-3 bg-orange-600/20 rounded-full"></div>
                              <span className="bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-mono font-bold text-xs text-gray-600 shadow-xs">{rate.maxWeight}kg</span>
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="flex flex-col">
                                <span className="font-mono font-black text-xl text-gray-900 tracking-tight">${rate.cost.toFixed(2)}</span>
                                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Clearing Surcharge Incl.</span>
                            </div>
                          </td>
                          <td className="p-6 text-center">
                            <button onClick={() => deleteHandler(rate._id)} className="text-gray-300 hover:text-red-600 p-2.5 bg-gray-50 hover:bg-red-50 border border-gray-200/60 rounded-xl transition-all active:scale-95" title="Decommission Routing Rule">
                              <FaTrash size={12}/>
                            </button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="p-6 bg-gray-950 rounded-[2rem] text-white relative overflow-hidden group border border-gray-900">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-6 transition-transform text-white">
                  <FaInfoCircle size={50}/>
              </div>
              <h4 className="text-[9px] font-black uppercase tracking-widest text-orange-500 mb-2">Automated Volumetric Metric Safeguard</h4>
              <p className="text-[11px] font-medium text-gray-400 leading-relaxed max-w-xl">
                  The infrastructure engine checks the greater vector value between <span className="text-white font-bold italic">Actual Structural Mass</span> vs <span className="text-white font-bold italic">Volumetric Cube Index ((L×W×H)/5000)</span> to protect active global transport margins dynamically at checkout.
              </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ShippingRatesScreen;