import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { FaBars, FaChevronRight, FaMapMarkerAlt, FaFire, FaUserCircle, FaGem, FaBox, FaHeart, FaHistory, FaHeadset, FaShieldAlt, FaTimes } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { useGetProductsQuery } from '../slices/productsApiSlice';
import { globalCurrencies } from '../utils/currencies';

const SubNavbar = () => {
  const [scrollDirection, setScrollDirection] = useState("up");
  const [isAtTop, setIsAtTop] = useState(true);
  const [isAllMenuOpen, setIsAllMenuOpen] = useState(false);
  const [allMenuSearch, setAllMenuSearch] = useState('');
  const allMenuRef = useRef(null);
  
  const { userInfo } = useSelector((state) => state.auth);
  const { countryCode = 'US', currencyCode = 'USD' } = useSelector((state) => state.currency);

  const { data: allProducts, isLoading } = useGetProductsQuery({});

  const currenciesList = Object.keys(globalCurrencies).map(key => ({
    countryCode: key, ...globalCurrencies[key]
  }));

  const currentCountryName = useMemo(() => {
    const curr = currenciesList.find(c => c.countryCode === countryCode);
    return curr ? curr.name : 'Select Location';
  }, [countryCode, currenciesList]);

  useEffect(() => {
    const updateNavbarVars = () => {
      const desktopNav = document.querySelector('.desktop-nav');
      const mobileNav = document.querySelector('.mobile-nav');
      if (desktopNav) {
        document.documentElement.style.setProperty('--navbar-desktop-height', `${desktopNav.offsetHeight}px`);
      }
      if (mobileNav) {
        document.documentElement.style.setProperty('--navbar-mobile-height', `${mobileNav.offsetHeight}px`);
      }
    };
    updateNavbarVars();
    const observer = new ResizeObserver(updateNavbarVars);
    const targets = [document.querySelector('.desktop-nav'), document.querySelector('.mobile-nav')].filter(Boolean);
    targets.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (allMenuRef.current && !allMenuRef.current.contains(e.target)) {
        setIsAllMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      setIsAtTop(scrollY < 50);
      if (Math.abs(scrollY - lastScrollY) < 10) { ticking = false; return; }
      if (scrollY > lastScrollY && scrollY > 100) { setScrollDirection("down"); } 
      else { setScrollDirection("up"); }
      lastScrollY = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) { window.requestAnimationFrame(updateScrollDirection); ticking = true; }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const activeCategories = useMemo(() => {
    if (!allProducts) return [];
    const productsArray = Array.isArray(allProducts) ? allProducts : allProducts.products || [];
    const categories = productsArray.filter(product => product.status === 'active' || !product.status).map(product => product.category).filter(Boolean);
    return [...new Set(categories)].sort();
  }, [allProducts]);

  const mobileCategories = [
    { name: "Deals", path: "/search?keyword=deal" },
    { name: "New Arrivals", path: "/newest" },
    { name: "Electronics", path: "/department/electronics" },
    { name: "Fashion", path: "/department/fashion" },
    { name: "Home", path: "/department/home" },
    { name: "Accessories", path: "/department/accessories" },
    { name: "Best Sellers", path: "/search?sortBy=rating" },
    { name: "DK-TEC Elite", path: "/dk-elite" },
  ];

  return (
    <>
      {/* 🌟 Desktop SubNavbar (Hidden on Mobile) */}
      <div 
        style={{ top: 'var(--navbar-desktop-height, 60px)' }}
        className={`hidden md:block w-full bg-[#232f3e] text-white fixed left-0 z-[1030] transition-transform duration-300 ease-in-out ${
          scrollDirection === 'down' && !isAtTop ? '-translate-y-[100px]' : 'translate-y-0'
        }`}
      >
        <div className="max-w-[100rem] mx-auto px-2 flex items-center h-[39px] justify-between">
          <div className="flex items-center overflow-x-visible whitespace-nowrap h-full flex-1 relative">
            
            {/* All Menu Button Container */}
            <div className="relative" ref={allMenuRef}>
              <button 
                onClick={() => setIsAllMenuOpen(!isAllMenuOpen)} 
                className="flex items-center gap-1 px-3 h-[32px] my-auto border border-transparent hover:border-white rounded-[2px] font-bold shrink-0 cursor-pointer bg-transparent text-white focus:outline-none transition-colors"
              >
                <FaBars size={18} />
                <span className="text-[14px] mt-0.5">All</span>
              </button>
              
              {/* 🌟 Robust & Fully Visible Mega Menu Dropdown */}
              <AnimatePresence>
                {isAllMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: -8, scale: 0.98 }} 
                    animate={{ opacity: 1, y: 0, scale: 1 }} 
                    exit={{ opacity: 0, y: -8, scale: 0.98 }} 
                    transition={{ duration: 0.15 }} 
                    className="absolute top-[42px] left-0 bg-white text-zinc-900 rounded-lg shadow-2xl border border-zinc-300 w-[360px] max-h-[500px] flex flex-col z-[99999] overflow-hidden"
                  >
                    {/* Header of All Menu */}
                    <div className="bg-[#232f3e] text-white px-4 py-3 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2">
                        <FaUserCircle size={22} className="text-zinc-300" />
                        <span className="font-bold text-[15px]">Hello, {userInfo ? userInfo.name.split(' ')[0] : 'Sign in'}</span>
                      </div>
                      <button onClick={() => setIsAllMenuOpen(false)} className="text-zinc-300 hover:text-white bg-transparent border-none cursor-pointer p-1">
                        <FaTimes size={16} />
                      </button>
                    </div>

                    <div className="p-3 border-b border-zinc-200 bg-zinc-50 shrink-0">
                      <input 
                        type="text" 
                        placeholder="Search departments or features..." 
                        value={allMenuSearch} 
                        onChange={(e) => setAllMenuSearch(e.target.value)} 
                        className="w-full px-3 py-2 rounded bg-white border border-zinc-300 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-orange-400 placeholder-zinc-400 shadow-sm" 
                        autoFocus 
                      />
                    </div>

                    <div className="overflow-y-auto flex-1 p-2 divide-y divide-zinc-100 custom-scrollbar">
                      {allMenuSearch ? (
                        <div className="py-2">
                          <p className="px-3 py-1 text-xs font-bold text-zinc-400 uppercase tracking-wider">Search Results</p>
                          {activeCategories.filter(c => c.toLowerCase().includes(allMenuSearch.toLowerCase())).map((cat, i) => (
                            <Link key={i} to={`/department/${encodeURIComponent(cat.toLowerCase().trim())}`} onClick={() => setIsAllMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-orange-50 text-sm font-medium text-zinc-700 hover:text-orange-600 no-underline transition-colors">
                              <FaChevronRight size={10} className="text-zinc-300" /> {cat}
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <>
                          {/* Section 1: Quick Navigation / Features (Distinct from Navbar) */}
                          <div className="py-2">
                            <p className="px-3 py-1 text-[11px] font-black uppercase tracking-widest text-zinc-400">Quick Access & Features</p>
                            <Link to="/profile" onClick={() => setIsAllMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded hover:bg-orange-50 text-sm font-medium text-zinc-700 hover:text-orange-600 no-underline transition-colors">
                              <FaUserCircle className="text-zinc-500" size={14} /> Your Account & Settings
                            </Link>
                            <Link to="/orders" onClick={() => setIsAllMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded hover:bg-orange-50 text-sm font-medium text-zinc-700 hover:text-orange-600 no-underline transition-colors">
                              <FaBox className="text-zinc-500" size={14} /> Your Orders & Tracking
                            </Link>
                            <Link to="/wishlist" onClick={() => setIsAllMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded hover:bg-orange-50 text-sm font-medium text-zinc-700 hover:text-orange-600 no-underline transition-colors">
                              <FaHeart className="text-rose-500" size={14} /> Wishlist & Saved Items
                            </Link>
                            <Link to="/browsing-history" onClick={() => setIsAllMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded hover:bg-orange-50 text-sm font-medium text-zinc-700 hover:text-orange-600 no-underline transition-colors">
                              <FaHistory className="text-zinc-500" size={14} /> Browsing History
                            </Link>
                          </div>

                          {/* Section 2: Dynamic Database Categories */}
                          <div className="py-2">
                            <p className="px-3 py-1 text-[11px] font-black uppercase tracking-widest text-zinc-400">Shop By Department</p>
                            {activeCategories.map((cat, i) => (
                              <Link key={i} to={`/department/${encodeURIComponent(cat.toLowerCase().trim())}`} onClick={() => setIsAllMenuOpen(false)} className="flex items-center justify-between px-3 py-2.5 rounded hover:bg-orange-50 text-sm font-medium text-zinc-700 hover:text-orange-600 no-underline transition-colors">
                                <span>{cat}</span>
                                <FaChevronRight size={10} className="text-zinc-300" />
                              </Link>
                            ))}
                          </div>

                          {/* Section 3: Programs & Support */}
                          <div className="py-2">
                            <p className="px-3 py-1 text-[11px] font-black uppercase tracking-widest text-zinc-400">Programs & Support</p>
                            <Link to="/dk-elite" onClick={() => setIsAllMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded hover:bg-orange-50 text-sm font-bold text-orange-600 no-underline transition-colors">
                              <FaGem size={14} className="text-orange-500" /> DK-TEC Elite Membership
                            </Link>
                            <Link to="/contact" onClick={() => setIsAllMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded hover:bg-orange-50 text-sm font-medium text-zinc-700 hover:text-orange-600 no-underline transition-colors">
                              <FaHeadset className="text-zinc-500" size={14} /> Customer Support & Help
                            </Link>
                            <Link to="/returns" onClick={() => setIsAllMenuOpen(false)} className="flex items-center gap-3 px-3 py-2 rounded hover:bg-orange-50 text-sm font-medium text-zinc-700 hover:text-orange-600 no-underline transition-colors">
                              <FaShieldAlt className="text-zinc-500" size={14} /> Returns & Warranty Policy
                            </Link>
                          </div>
                        </>
                      )}
                      {activeCategories.length === 0 && !isLoading && (
                        <p className="text-center text-zinc-400 text-sm py-6">No categories available in database</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center h-full ml-2">
                <Link to="/search?keyword=deal" className="px-2.5 h-[32px] my-auto flex items-center border border-transparent hover:border-white rounded-[2px] text-[14px] text-white shrink-0 no-underline transition-colors">Today's Deals</Link>
                <Link to="/newest" className="px-2.5 h-[32px] my-auto flex items-center border border-transparent hover:border-white rounded-[2px] text-[14px] text-white shrink-0 no-underline transition-colors">New Releases</Link>
            </div>
            <div className="w-px h-[20px] bg-zinc-600 mx-2 shrink-0 hidden md:block"></div>
            {isLoading ? (
              <div className="flex gap-4 px-2"><div className="w-16 h-3 bg-zinc-600 animate-pulse rounded"></div></div>
            ) : (
              <div className="flex items-center h-full">
                {activeCategories.slice(0, 4).map((category, index) => (
                  <Link key={`cat-${index}`} to={`/department/${encodeURIComponent(category.toLowerCase().trim())}`} className="px-2.5 h-[32px] my-auto flex items-center border border-transparent hover:border-white rounded-[2px] text-[14px] text-white shrink-0 no-underline transition-colors">
                    {category}
                  </Link>
                ))}
              </div>
            )}
            <div className="w-px h-[20px] bg-zinc-600 mx-2 shrink-0 hidden lg:block"></div>
            <div className="flex items-center h-full">
                <Link to="/contact" className="px-2.5 h-[32px] my-auto flex items-center border border-transparent hover:border-white rounded-[2px] text-[14px] text-white shrink-0 no-underline transition-colors">Customer Service</Link>
                <Link to="/returns" className="px-2.5 h-[32px] my-auto flex items-center border border-transparent hover:border-white rounded-[2px] text-[14px] text-white shrink-0 no-underline transition-colors">Returns</Link>
                <Link to="/vendor/dashboard" className="px-2.5 h-[32px] my-auto flex items-center border border-transparent hover:border-white rounded-[2px] text-[14px] text-white shrink-0 no-underline transition-colors">Sell</Link>
                {userInfo?.role === 'vendor' && (
                  <Link to="/vendor/membership" className="px-2.5 h-[32px] my-auto flex items-center gap-1.5 border border-transparent hover:border-white rounded-[2px] text-[14px] text-white shrink-0 no-underline transition-colors">
                    <FaGem size={12} /> Vendor Membership
                  </Link>
                )}
                <div className="w-px h-[20px] bg-zinc-600 mx-2 shrink-0 hidden lg:block"></div>
                <Link to="/dk-elite" className="px-2.5 h-[32px] my-auto flex items-center border border-transparent hover:border-white rounded-[2px] text-[14px] text-orange-300 hover:text-orange-200 shrink-0 no-underline transition-colors font-bold">DK-TEC Elite</Link>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 Mobile SubNavbar (Visible ONLY on Mobile < 768px) */}
      <div style={{ top: 'var(--navbar-mobile-height, 110px)' }} className={`md:hidden w-full fixed left-0 z-[1030] transition-transform duration-300 ease-in-out ${scrollDirection === 'down' && !isAtTop ? '-translate-y-[150px]' : 'translate-y-0'}`}>
        
        {/* Mobile Deliver To Bar */}
        <button onClick={() => window.dispatchEvent(new Event('openLocationModal'))} className="bg-[#37475a] text-white px-3 py-2 flex items-center w-full shadow-sm border-0 cursor-pointer text-left">
           <FaMapMarkerAlt size={16} className="text-white mr-2 shrink-0"/>
            <span className="text-[13px] font-medium leading-none truncate">
              Deliver to {userInfo ? userInfo.name.split(' ')[0] : 'Customer'} - {currentCountryName} ({currencyCode})
            </span>
        </button>

        {/* Mobile Category Strip (Scrollable) */}
        <div className="bg-[#232f3e] text-white w-full h-[40px] flex items-center overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] px-1 shadow-md border-t border-zinc-700">
           {mobileCategories.map((link, idx) => (
              <Link key={idx} to={link.path} className="px-3 h-full flex items-center text-[13px] font-medium text-zinc-100 hover:text-white no-underline shrink-0 active:bg-zinc-700 transition-colors">
                {link.name}
              </Link>
           ))}
           {userInfo?.role === 'vendor' && (
             <Link to="/vendor/membership" className="px-3 h-full flex items-center gap-1 text-[13px] font-medium text-orange-300 hover:text-orange-200 no-underline shrink-0 active:bg-zinc-700 transition-colors">
               <FaGem size={10} /> Vendor Membership
             </Link>
           )}
        </div>
      </div>

      {/* 🌟 FIXED Spacers */}
      <div className="hidden md:block h-[99px] w-full bg-transparent shrink-0"></div>
      <div className="block md:hidden h-[182px] w-full bg-transparent shrink-0"></div>
    </>
  );
};

export default SubNavbar;