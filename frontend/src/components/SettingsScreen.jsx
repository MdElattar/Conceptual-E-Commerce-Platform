import { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { FaGlobe, FaCreditCard, FaShippingFast, FaLock, FaBell , FaCogs } from 'react-icons/fa';
import Button from './Button';

const SettingsScreen = () => {
  const [activeMenu, setActiveMenu] = useState('general');

  const menuItems = [
    { id: 'general', icon: <FaGlobe />, label: 'General Info' },
    { id: 'payment', icon: <FaCreditCard />, label: 'Payment Gateways' },
    { id: 'shipping', icon: <FaShippingFast />, label: 'Shipping Zones' },
    { id: 'security', icon: <FaLock />, label: 'Security & API' },
    { id: 'notifications', icon: <FaBell />, label: 'Notifications' },
  ];

  return (
    <div className="pt-24 md:pt-32 pb-10 px-4 max-w-7xl mx-auto font-sans text-gray-900 bg-gray-50/50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight uppercase">
          System <span className="text-orange-600">Settings</span>
        </h1>
        <p className="text-gray-500 mt-1 font-bold text-xs uppercase tracking-widest">Global Platform Configuration</p>
      </header>

      <div className="flex flex-col md:flex-row gap-8">
        {/* 🎛️ Settings Sidebar */}
        <div className="w-full md:w-64 shrink-0 space-y-2">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeMenu === item.id ? 'bg-zinc-900 text-white shadow-md' : 'bg-transparent text-gray-500 hover:bg-white hover:text-orange-600'}`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>

        {/* ⚙️ Settings Content Area */}
        <div className="flex-1 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm min-h-[400px]">
          <motion.div
            key={activeMenu}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeMenu === 'general' && (
              <div className="space-y-6">
                <h2 className="text-xl font-black mb-4">Platform Identity</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Platform Name</label>
                    <input type="text" defaultValue="DK-TEC Marketplace" className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-orange-500" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Support Email</label>
                    <input type="email" defaultValue="support@dk-tec.com" className="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-orange-500" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Admin Commission (%)</label>
                  <input type="number" defaultValue="10" className="w-1/3 mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl font-black text-sm outline-none focus:border-orange-500" />
                </div>
                <Button variant="primary" size="lg" className="font-black text-xs uppercase tracking-wider">Save Changes</Button>
              </div>
            )}

            {activeMenu !== 'general' && (
              <div className="h-full flex flex-col items-center justify-center text-center py-20 text-gray-400">
                <FaCogs size={40} className="mb-4 text-gray-200" />
                <h3 className="font-bold uppercase tracking-widest text-sm">Module in development</h3>
                <p className="text-xs mt-2 max-w-sm">The {activeMenu} configuration module is securely locked pending API integrations.</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;