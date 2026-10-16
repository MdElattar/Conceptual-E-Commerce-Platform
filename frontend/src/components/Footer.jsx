import { useState } from 'react';
import { Link } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHardHat, FaEnvelope, FaMapMarkerAlt, FaFacebookF, 
  FaTwitter, FaYoutube, FaLinkedinIn, FaGlobe, 
  FaChevronRight, FaTimes, FaCheckCircle 
} from 'react-icons/fa';
import { useSelector, useDispatch } from 'react-redux';
import { setManualCurrency } from '../slices/currencySlice';
import { globalCurrencies } from '../utils/currencies';
import { toast } from 'react-toastify';

const Footer = () => {
  const dispatch = useDispatch();
  const { countryCode, currencyCode, symbol } = useSelector((state) => state.currency);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getFlagEmoji = (code) => {
    if (!code) return '🌐';
    return code
      .toUpperCase()
      .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt()));
  };

  const currenciesList = Object.keys(globalCurrencies).map(key => ({
    countryCode: key,
    ...globalCurrencies[key]
  }));

  const handleRegionChange = (curr) => {
    const currencyData = {
      code: curr.code,
      symbol: curr.symbol,
      rate: curr.defaultRate || 1,
      countryCode: curr.countryCode,
      shippingFee: curr.shippingFee || 0
    };

    dispatch(setManualCurrency(currencyData));

    localStorage.setItem('userCurrency', JSON.stringify({
      currencyCode: currencyData.code,
      symbol: currencyData.symbol,
      rate: currencyData.rate,
      countryCode: currencyData.countryCode,
      shippingFee: currencyData.shippingFee
    }));

    setIsModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.success(`LOGISTICS ROUTE: Updated to ${curr.name} ${getFlagEmoji(curr.countryCode)}`);
  };

  const featuredRegions = ['EG', 'SA', 'AE', 'US'];

  return (
    <footer className="bg-[#0D1527] text-white pt-20 pb-10 relative overflow-hidden border-t border-gray-900 selection:bg-[#FF6B00] selection:text-white">
      {/* الهندسة الخلفية - الـ Core Icon */}
      <div className="absolute -top-10 -right-10 opacity-[0.02] text-white pointer-events-none select-none">
        <FaHardHat size={450} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

          {/* 1. البراند والعملة الحالية */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-[#FF6B00] p-2.5 rounded-xl shadow-lg shadow-[#FF6B00]/20">
                <FaHardHat className="text-xl text-white" />
              </div>
              <span className="font-black text-2xl tracking-tight uppercase">DKTEC<span className="text-[#FF6B00]">.</span></span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed font-semibold">
              Elite industrial solutions provider. Specializing in high-performance batching plants and global spare parts logistics since 2015.
            </p>

            {/* كارت المنطقة الحالي المطور بالكامل */}
            <div className="pt-2">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2.5">ACTIVE LOGISTICS HUB</p>
              <div
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-4 bg-[#152039] border border-gray-800/80 px-4 py-3 rounded-2xl group hover:border-[#FF6B00]/50 hover:bg-[#192644] transition-all duration-300 cursor-pointer shadow-xl"
              >
                <span className="text-2xl filter drop-shadow-md">{getFlagEmoji(countryCode)}</span>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-black uppercase tracking-wide text-gray-200">{countryCode} / {currencyCode} ({symbol})</span>
                  <span className="text-[9px] text-[#FF6B00] font-black uppercase tracking-widest mt-0.5 group-hover:tracking-wider transition-all">SWITCH GATEWAY 🔒</span>
                </div>
                <FaChevronRight className="text-gray-600 group-hover:text-[#FF6B00] group-hover:translate-x-1 transition-all duration-300 ml-2" size={10} />
              </div>
            </div>
          </div>

          {/* 2. الاستكشاف والتنقل */}
          <div>
            <h3 className="text-xs font-black mb-6 uppercase tracking-widest text-[#FF6B00]">EXPLORATION MANIFEST</h3>
            <ul className="space-y-3.5 pl-0">
              {['Home', 'Products', 'About Us', 'Contact'].map((item) => (
                <li key={item} className="list-none">
                  <Link 
                    to={item === 'Home' ? '/' : `/${item.toLowerCase().replace(' ', '')}`} 
                    className="text-gray-400 hover:text-white text-xs font-black uppercase tracking-wider no-underline transition-all duration-200 flex items-center gap-2 group"
                  >
                    <div className="w-1.5 h-1.5 bg-[#FF6B00] rounded-full scale-0 group-hover:scale-100 transition-all duration-200"></div>
                    <span className="group-hover:translate-x-1 transition-transform duration-200">{item}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. الوصول السريع المطور جرافيكياً */}
          <div>
            <h3 className="text-xs font-black mb-6 uppercase tracking-widest text-[#FF6B00]">GLOBAL ROUTING</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {featuredRegions.map(code => (
                <div
                  key={code}
                  onClick={() => handleRegionChange({ countryCode: code, ...globalCurrencies[code] })}
                  className={`bg-[#152039]/40 border p-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 cursor-pointer group ${countryCode === code ? 'border-[#FF6B00] bg-[#FF6B00]/10' : 'border-gray-800/80 hover:border-[#FF6B00]/30 hover:bg-[#152039]'}`}
                >
                  <span className="text-lg filter drop-shadow-sm">{getFlagEmoji(code)}</span>
                  <span className="text-[10px] font-black text-gray-400 group-hover:text-white uppercase transition-colors">{code}</span>
                  {countryCode === code && <FaCheckCircle className="text-[#FF6B00] ml-auto animate-scale" size={10} />}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-gray-500 mt-4 font-bold italic leading-relaxed">
              Serving 50+ countries with localized pricing and heavy-duty shipping protocols.
            </p>
          </div>

          {/* 4. المقر الرئيسي وقنوات الاتصال */}
          <div className="space-y-4">
            <h3 className="text-xs font-black mb-2 uppercase tracking-widest text-[#FF6B00]">COMMAND CENTER</h3>
            <div className="space-y-3">
              <a href="mailto:sales@dongkunchina.com" className="flex items-center gap-3 bg-[#152039] border border-gray-800/80 p-3.5 rounded-2xl hover:border-[#FF6B00]/50 hover:bg-[#192644] transition-all duration-300 no-underline group">
                <FaEnvelope className="text-[#FF6B00] group-hover:scale-110 transition-transform text-sm" />
                <span className="text-xs font-black text-gray-300 tracking-tight">sales@dongkunchina.com</span>
              </a>
              <div className="flex items-start gap-3 bg-[#152039]/20 border border-transparent p-3.5 rounded-2xl">
                <FaMapMarkerAlt className="text-[#FF6B00] mt-0.5 text-sm shrink-0" />
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-wide leading-relaxed text-left">Hangzhou, Zhejiang Province, China</span>
              </div>
            </div>
          </div>
        </div>

        {/* شريط الحقوق السفلي والأزرار الاجتماعية المحدثة */}
        <div className="border-t border-gray-800/60 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">© 2026 DKTEC MACHINERY EQUIPMENT CO. ALL RIGHTS RESERVED.</p>
          </div>
          <div className="flex gap-2.5">
            {[FaFacebookF, FaTwitter, FaYoutube, FaLinkedinIn].map((Icon, i) => (
              <a key={i} href="#" className="w-9 h-9 bg-[#152039] flex items-center justify-center rounded-xl text-gray-300 hover:text-white hover:bg-[#FF6B00] border border-gray-850 hover:border-[#FF6B00] shadow-md hover:-translate-y-0.5 transition-all duration-300">
                <Icon size={12} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* --- تريك الـ Region Selection Modal المطور بالأنميشن الهيدروليكي --- */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">
            {/* الخلفية المضببة الشفافة */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#070b14]/90 backdrop-blur-md"
              onClick={() => setIsModalOpen(false)}
            ></motion.div>

            {/* صندوق المودال المستوحى من الـ Cargo Vault */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative bg-[#0D1527] w-full max-w-xl rounded-[2rem] border border-gray-800/80 shadow-2xl overflow-hidden text-left"
            >
              {/* هيدر المودال */}
              <div className="p-6 border-b border-gray-800/60 flex justify-between items-center bg-gradient-to-r from-[#FF6B00]/10 to-transparent">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-white">SELECT REGION NODE</h2>
                  <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest mt-1">Prices and logistics pipelines will auto-configure</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2.5 bg-[#152039] hover:bg-rose-600/20 text-gray-400 hover:text-rose-500 border border-gray-800 rounded-xl transition-all duration-200"
                >
                  <FaTimes size={12} />
                </button>
              </div>

              {/* القائمة القابلة للتمرير مع معالجة الـ Scrollbar */}
              <div className="p-6 max-h-[50vh] overflow-y-auto overflow-x-hidden pr-2 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currenciesList.map((curr) => (
                    <button
                      key={curr.countryCode}
                      onClick={() => handleRegionChange({ countryCode: curr.countryCode, ...curr })}
                      className={`flex items-center justify-between p-3.5 rounded-xl transition-all duration-300 border-2 text-left ${
                        countryCode === curr.countryCode 
                          ? 'border-[#FF6B00] bg-[#FF6B00]/10 text-white' 
                          : 'border-gray-800/60 bg-[#152039]/30 text-gray-400 hover:border-gray-600 hover:bg-[#152039]/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl filter drop-shadow-sm">{getFlagEmoji(curr.countryCode)}</span>
                        <div className="flex flex-col">
                          <span className="text-xs font-black uppercase tracking-wide text-gray-200">{curr.name}</span>
                          <span className={`text-[9px] mt-0.5 font-bold ${countryCode === curr.countryCode ? 'text-[#FF6B00]' : 'text-gray-500'}`}>{curr.code} ({curr.symbol})</span>
                        </div>
                      </div>
                      {countryCode === curr.countryCode && <FaCheckCircle className="text-[#FF6B00]" size={12} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* فوتر المودال وديف الترجمة */}
              <div className="p-5 bg-[#0a101e] border-t border-gray-800/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest m-0">
                  <FaGlobe className="inline mr-1.5 text-[#FF6B00]" />
                  DKTEC SECURE SUPPLY CHAIN NODE
                </p>
                {/* ديف جوجل للترجمة مدمج بشكل نظيف جداً في الهيكل السفلي */}
                <div id="google_translate_element" className="footer-translate opacity-80 hover:opacity-100 transition-opacity"></div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </footer>
  );
};

export default Footer;