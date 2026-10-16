import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaHardHat, FaBars, FaTimes, 
  FaChevronDown, FaMapMarkerAlt, 
  FaSearch, FaFolderOpen, FaCube, FaFire, FaHistory, FaWallet, FaUser, FaCheck, FaLocationArrow, FaPlus, FaGlobe,
  FaUserCircle,
  FaChevronRight,
  FaHeart,
  FaGem
} from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../slices/authSlice';
import { toast } from 'react-toastify';
import { useGetProfileQuery } from '../slices/usersApiSlice';
import { setManualCurrency } from '../slices/currencySlice';
import { setSelectedLocation } from '../slices/locationSlice';
import { globalCurrencies } from '../utils/currencies';
import { useGetProductsQuery } from '../slices/productsApiSlice';
import { useGetWishlistQuery } from '../slices/wishlistApiSlice';
import { useGetMembershipQuery } from '../slices/eliteApiSlice';
import axios from 'axios';
import Button from './Button';

const Portal = ({ children }) => {
  const [mounted] = useState(() => typeof document !== 'undefined');
  return mounted ? createPortal(children, document.body) : null;
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const [isMobileCurrencyModalOpen, setIsMobileCurrencyModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileUserMenuOpen, setIsMobileUserMenuOpen] = useState(false); 
  
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationTab, setLocationTab] = useState('addresses');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('All');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('recentSearches')) || [];
    } catch {
      return [];
    }
  });
  const [currencySearchQuery, setCurrencySearchQuery] = useState('');

  const [scrollDirection, setScrollDirection] = useState("up");
  const [isAtTop, setIsAtTop] = useState(true);
  
  const currencyMenuRef = useRef(null);
  const userMenuRef = useRef(null);
  const mobileUserMenuRef = useRef(null); 
  const searchRef = useRef(null); 
  const mobileSearchRef = useRef(null);
  
  const { userInfo } = useSelector((state) => state.auth);
  const { cartItems } = useCart();
  const cartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);
  const { data: wishlistData } = useGetWishlistQuery(undefined, { skip: !userInfo });
  const wishlistCount = wishlistData?.products?.length || 0;
  const { data: membershipData } = useGetMembershipQuery(undefined, { skip: !userInfo });
  const isElite = membershipData?.isElite;
  const { pathname, search } = useLocation();
  
  const { currencyCode = 'USD', rate = 1, symbol = '$', countryCode = 'US' } = useSelector((state) => state.currency);
  const { currentLocation } = useSelector((state) => state.location);
  const { data: profile, refetch } = useGetProfileQuery(undefined, { skip: !userInfo });
  const { data: allProducts } = useGetProductsQuery({});

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const storeCredit = (profile?.storeCredit || 0) * rate; 

  const currenciesList = useMemo(() => Object.keys(globalCurrencies).map(key => ({
    countryCode: key, ...globalCurrencies[key]
  })), []);

  const getFlagEmoji = (code) => {
    if (!code) return '🌐';
    const codePoints = code.toUpperCase().split('').map(char =>  127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  };

  // 🌟 Global Event Listener: Allows any component (like SubNavbar) to open this modal
  useEffect(() => {
    const handleOpenLocationModal = () => { setIsLocationModalOpen(true); setLocationTab('addresses'); setCurrencySearchQuery(''); };
    window.addEventListener('openLocationModal', handleOpenLocationModal);
    return () => window.removeEventListener('openLocationModal', handleOpenLocationModal);
  }, []);

  useEffect(() => {
    if (isOpen || isLocationModalOpen || isMobileUserMenuOpen || isMobileCurrencyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen, isLocationModalOpen, isMobileUserMenuOpen, isMobileCurrencyModalOpen]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setIsLocationModalOpen(false);
        setIsMobileUserMenuOpen(false);
        setIsUserMenuOpen(false);
        setIsCurrencyMenuOpen(false);
        setIsMobileCurrencyModalOpen(false);
        setShowSuggestions(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      setIsAtTop(scrollY < 50);
      
      if (Math.abs(scrollY - lastScrollY) < 10) { ticking = false; return; }
      if (isSearchFocused) { setScrollDirection("up"); } 
      else if (scrollY > lastScrollY && scrollY > 100) { setScrollDirection("down"); } 
      else { setScrollDirection("up"); }
      lastScrollY = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) { window.requestAnimationFrame(updateScrollDirection); ticking = true; }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [isSearchFocused]);

  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedQuery(searchQuery); }, 200);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const [prevLocationKey, setPrevLocationKey] = useState(() => pathname + search);
  const locationKey = pathname + search;
  if (locationKey !== prevLocationKey) {
    setPrevLocationKey(locationKey);
    setIsOpen(false);
    setIsCurrencyMenuOpen(false);
    setIsMobileCurrencyModalOpen(false);
    setIsUserMenuOpen(false);
    setIsMobileUserMenuOpen(false);
    setIsLocationModalOpen(false);
    setShowSuggestions(false);
    setIsSearchFocused(false);
    if (pathname !== '/search') { setSearchQuery(''); }
    else { const urlKeyword = new URLSearchParams(search).get('keyword') || ''; setSearchQuery(urlKeyword); }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(event.target)) setIsCurrencyMenuOpen(false);
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) setIsUserMenuOpen(false);
      if (mobileUserMenuRef.current && !mobileUserMenuRef.current.contains(event.target)) setIsMobileUserMenuOpen(false);
      if (searchRef.current && !searchRef.current.contains(event.target) && mobileSearchRef.current && !mobileSearchRef.current.contains(event.target)) { 
        setIsSearchFocused(false); setShowSuggestions(false); 
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => { if (userInfo) refetch(); }, [userInfo, refetch]);

  const toggleMenu = () => setIsOpen(!isOpen);

  const logoutHandler = () => {
    dispatch(logout());
    localStorage.removeItem('userInfo');
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const handleCurrencyChange = (curr) => {
    const currencyData = { currencyCode: curr.code, symbol: curr.symbol, rate: curr.defaultRate || 1, countryCode: curr.countryCode, shippingFee: curr.shippingFee || 0 };
    dispatch(setManualCurrency(currencyData));
    const currentStorage = JSON.parse(localStorage.getItem("userCurrency")) || {};
    localStorage.setItem('userCurrency', JSON.stringify({ ...currentStorage, ...currencyData }));
    setIsCurrencyMenuOpen(false); 
    setIsMobileCurrencyModalOpen(false);
    setIsOpen(false); 
    toast.info(`Region changed to ${curr.name}. Prices updated.`, { position: "bottom-right", autoClose: 2000 });
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        try {
          const geoRes = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = geoRes.data;
          const address = data.display_name || '';
          const city = data.address?.city || data.address?.town || data.address?.village || '';
          const country = data.address?.country || '';
          dispatch(setSelectedLocation({
            latitude,
            longitude,
            address,
            city,
            country,
            countryCode,
          }));
          toast.success(`Delivering to ${city}, ${country}`);
        } catch {
          dispatch(setSelectedLocation({
            latitude,
            longitude,
            address: `${latitude}, ${longitude}`,
            city: '',
            country: '',
            countryCode,
          }));
          toast.success('Location updated successfully!');
        }
        setIsLocationModalOpen(false);
      },
      (error) => {
        setIsLocating(false);
        toast.error('Unable to retrieve location. Please check browser permissions.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const productsArray = Array.isArray(allProducts) ? allProducts : allProducts?.products || [];
  
  const allAvailableCategories = useMemo(() => {
    return ['All', ...new Set(productsArray.map(p => p.category).filter(Boolean))].slice(0, 10);
  }, [productsArray]);

  const activeCategories = useMemo(() => {
    const categories = productsArray.map(p => p.category).filter(Boolean);
    return [...new Set(categories)].slice(0, 8);
  }, [productsArray]);

  const cleanQuery = debouncedQuery.trim().toLowerCase().replace(/\s+/g, ' ');

  const matchedCategories = useMemo(() => {
    if (cleanQuery === '') return [];
    return [...new Set(productsArray.filter(p => p.category && p.category.toLowerCase().includes(cleanQuery)).map(p => p.category))].slice(0, 2);
  }, [productsArray, cleanQuery]);

  const matchedProducts = useMemo(() => {
    if (cleanQuery === '') return [];
    let filtered = productsArray;
    if (searchCategory !== 'All') { filtered = filtered.filter(p => p.category === searchCategory); }
    return filtered
      .filter(p => p.name.toLowerCase().includes(cleanQuery) || (p.brand && p.brand.toLowerCase().includes(cleanQuery)))
      .sort((a, b) => {
        const aName = a.name.toLowerCase(); const bName = b.name.toLowerCase();
        if (aName.startsWith(cleanQuery) && !bName.startsWith(cleanQuery)) return -1;
        if (!aName.startsWith(cleanQuery) && bName.startsWith(cleanQuery)) return 1;
        return 0;
      }).slice(0, 5);
  }, [productsArray, cleanQuery, searchCategory]);

  const popularSuggestions = [
    { type: 'category', name: 'Tools & Industrial' }, { type: 'category', name: 'Electronics & Computers' },
    { type: 'keyword', name: 'Foam Case' }, { type: 'keyword', name: 'Grip' }
  ];

  const saveSearchQuery = (query) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    let searches = JSON.parse(localStorage.getItem('recentSearches')) || [];
    searches = [trimmed, ...searches.filter(s => s.toLowerCase() !== trimmed.toLowerCase())].slice(0, 4);
    localStorage.setItem('recentSearches', JSON.stringify(searches));
    setRecentSearches(searches);
  };

  const handleSuggestionClick = (type, value) => {
    saveSearchQuery(value); setIsSearchFocused(false); setShowSuggestions(false);
    if (type === 'category') { navigate(`/department/${encodeURIComponent(value.trim())}`); } 
    else { navigate(`/search?keyword=${encodeURIComponent(value.trim())}`); }
  };

  const submitHandler = (e) => {
    e.preventDefault(); setIsSearchFocused(false); setShowSuggestions(false);
    const queryToSend = searchQuery.trim();
    let url = '/search?';
    if (queryToSend) { saveSearchQuery(queryToSend); url += `keyword=${encodeURIComponent(queryToSend)}&`; }
    if (searchCategory !== 'All') { url += `category=${encodeURIComponent(searchCategory)}`; }
    navigate(url);
  };

  const currentCountryName = useMemo(() => {
    const curr = currenciesList.find(c => c.countryCode === countryCode);
    return curr ? curr.name : 'Select Location';
  }, [countryCode, currenciesList]);

  const userLocationString = useMemo(() => {
    if (currentLocation?.address) {
      return `${currentLocation.city || ''}, ${currentCountryName}`;
    }
    const defaultAddr = profile?.addresses?.find(a => a.isDefault);
    if (defaultAddr) {
      return `${defaultAddr.city}, ${currentCountryName}`;
    }
    if (profile?.addresses?.length > 0) {
      return `${profile.addresses[0].city}, ${currentCountryName}`;
    }
    return currentCountryName;
  }, [profile, currentCountryName, currentLocation]);

  const isVendor = userInfo?.role === 'vendor';
  const isAdmin = userInfo?.isAdmin;

  const RenderSuggestions = () => (
    <AnimatePresence>
        {showSuggestions && isSearchFocused && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: 0.15 }} className="absolute top-[105%] left-0 w-full bg-white border border-zinc-200 shadow-2xl rounded-md overflow-hidden z-[9999] p-0">
            {cleanQuery === '' ? (
            <div className="p-2">
                {recentSearches.length > 0 && (
                <div className="mb-2">
                    <div className="px-2 py-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wide border-b border-zinc-100 mb-1">Recent Searches</div>
                    {recentSearches.map((searchItem, index) => (
                    <button key={index} type="button" onClick={() => handleSuggestionClick('keyword', searchItem)} className="w-full text-left flex items-center px-2 py-2 text-[14px] font-medium text-zinc-800 hover:bg-zinc-100 rounded transition-colors border-none cursor-pointer bg-transparent">
                        <FaHistory className="mr-3 text-zinc-400" size={14} /><span>{searchItem}</span>
                    </button>
                    ))}
                </div>
                )}
                <div>
                <div className="px-2 py-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wide border-b border-zinc-100 mb-1">Trending</div>
                {popularSuggestions.map((sug, idx) => (
                    <button key={idx} type="button" onClick={() => handleSuggestionClick(sug.type, sug.name)} className="w-full text-left flex items-center px-2 py-2 text-[14px] font-medium text-zinc-800 hover:bg-orange-50 hover:text-orange-700 rounded transition-colors border-none cursor-pointer bg-transparent">
                    {sug.type === 'category' ? <FaFolderOpen className="mr-3 text-zinc-400" size={14} /> : <FaFire className="mr-3 text-orange-500" size={14} />}<span>{sug.name}</span>
                    </button>
                ))}
                </div>
            </div>
            ) : (
            <div className="p-2">
                {matchedCategories.length > 0 && (
                <div className="mb-2">
                    <div className="px-2 py-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wide border-b border-zinc-100 mb-1">Departments</div>
                    {matchedCategories.map((categoryName, idx) => (
                    <button key={idx} type="button" onClick={() => handleSuggestionClick('category', categoryName)} className="w-full text-left flex items-center px-2 py-2 text-[14px] font-medium text-orange-700 hover:bg-orange-50 rounded transition-colors border-none cursor-pointer bg-transparent">
                        <FaFolderOpen className="mr-3 shrink-0 text-orange-500" size={14} /><span>Shop <span className="underline italic">"{categoryName}"</span></span>
                    </button>
                    ))}
                </div>
                )}
                {matchedProducts.length > 0 ? (
                <div>
                    <div className="px-2 py-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wide border-b border-zinc-100 mb-1">Products</div>
                    <ul className="m-0 p-0 list-none">
                    {matchedProducts.map((product) => (
                        <li key={product._id} className="hover:bg-zinc-100 rounded transition-colors">
                        <Link to={`/product/${product._id}`} className="flex items-center px-2 py-2 text-zinc-800 no-underline" onClick={() => setIsSearchFocused(false)}>
                            <FaCube className="text-zinc-400 mr-3 shrink-0" size={14} />
                            <div className="flex flex-col min-w-0"><span className="font-medium text-[14px] truncate">{product.name}</span><span className="text-[11px] text-zinc-500">{product.category}</span></div>
                        </Link>
                        </li>
                    ))}
                    </ul>
                </div>
                ) : (
                matchedCategories.length === 0 && <div className="px-4 py-6 text-center text-[14px] text-zinc-500">No exact matches found. Press Enter to search all.</div>
                )}
            </div>
            )}
        </motion.div>
        )}
    </AnimatePresence>
  );

  return (
    <>
    <nav className={`desktop-nav hidden md:block bg-[#131921] w-full z-[1050] fixed top-0 left-0 transition-transform duration-300 ease-in-out font-amazon box-border ${scrollDirection === 'down' && !isAtTop ? '-translate-y-full' : 'translate-y-0'}`}>
      <div className="w-full mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between items-center h-[60px] gap-2 lg:gap-4">

          <Link to="/" aria-label="DKTEC Home" className="flex-shrink-0 flex items-center gap-1 h-[50px] px-2 cursor-pointer border border-transparent hover:border-white rounded-[2px] transition-colors my-auto no-underline">
            <div className="bg-orange-600 p-1 rounded">
              <FaHardHat className="text-lg text-white" />
            </div>
            <span className="font-bold text-xl text-white tracking-tighter mt-1">
              DKTEC<span className="text-orange-600 italic">.</span>
            </span>
          </Link>

          <button 
            className="hidden lg:flex flex-col justify-center h-[50px] px-2 border border-transparent hover:border-white rounded-[2px] transition-colors cursor-pointer my-auto focus:outline-none focus:border-white shrink-0 bg-transparent text-left group" 
            aria-label={`Deliver to ${userLocationString}`} 
            onClick={() => { setIsLocationModalOpen(true); setCurrencySearchQuery(''); }}
          >
             <span className="text-[12px] text-zinc-300 pl-[22px] font-normal leading-none text-gray-400">Deliver to {userInfo ? userInfo.name.split(' ')[0] : ''}</span>
             <div className="flex items-center gap-1 font-bold text-white text-[14px] leading-tight mt-0.5">
               <FaMapMarkerAlt size={18} className="text-white shrink-0"/> 
               <span className="truncate max-w-[140px]">{userLocationString}</span>
               <span className="text-[11px] text-zinc-400 font-normal ml-0.5">({currencyCode})</span>
               <FaChevronDown size={10} className="text-gray-400 group-hover:text-white transition-colors mt-0.5" />
             </div>
          </button>

          <div className="flex flex-1 max-w-[850px] min-w-[200px] h-[40px] relative group my-auto" ref={searchRef}>
            <form onSubmit={submitHandler} className={`w-full flex items-center bg-white rounded-[4px] overflow-hidden transition-all ${isSearchFocused ? 'ring-[3px] ring-orange-400 shadow-[0_0_0_2px_rgba(249,115,22,0.3)]' : ''}`}>
              <div className="hidden lg:flex h-full border-r border-zinc-300 bg-zinc-100 hover:bg-zinc-200 transition-colors focus-within:ring-2 focus-within:ring-orange-400 relative items-center cursor-pointer">
                <select 
                  aria-label="Search Category" 
                  value={searchCategory} 
                  onChange={(e) => setSearchCategory(e.target.value)} 
                  className="h-full bg-transparent text-[12px] text-zinc-700 px-3 outline-none cursor-pointer w-auto focus:ring-0 border-none appearance-none pr-7"
                  style={{ width: `${Math.max(searchCategory.length * 8 + 35, 60)}px` }} 
                >
                  {allAvailableCategories.map(cat => ( <option key={cat} value={cat}>{cat}</option> ))}
                </select>
                <FaChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              </div>
              <input type="text" aria-label="Search" placeholder="Search DKTEC" className="bg-transparent border-none outline-none flex-1 px-3 text-[15px] text-zinc-900 placeholder-zinc-500 h-full w-full min-w-0" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }} onFocus={() => { setIsSearchFocused(true); setShowSuggestions(true); }} />
              <button type="submit" aria-label="Submit Search" className="bg-[#febd69] hover:bg-[#f3a847] h-full px-4 lg:px-5 flex items-center justify-center transition-colors cursor-pointer border-none focus:outline-none focus:ring-2 focus:ring-orange-600 shrink-0">
                <FaSearch size={20} className="text-zinc-900" />
              </button>
            </form>
            <RenderSuggestions />
          </div>
<div className="flex items-center h-full text-white shrink-0">
            {/* Desktop Dropdowns omitted for brevity, keeping original layout */}
            {/* ... Currency Dropdown ... */}
            <div className="hidden lg:flex relative flex-col justify-center px-3 h-[50px] border border-transparent hover:border-white rounded-[2px] transition-colors cursor-pointer my-auto focus:outline-none focus:border-white" tabIndex="0" aria-label="Change Language or Currency" ref={currencyMenuRef} onClick={() => { setIsCurrencyMenuOpen(!isCurrencyMenuOpen); if (!isCurrencyMenuOpen) setCurrencySearchQuery(''); }}>
                <div className="flex items-center h-full gap-1">
                    <span className="text-[22px] leading-none drop-shadow-sm flex items-center">{getFlagEmoji(countryCode)}</span>
                    <span className="font-bold text-[14px] leading-none ml-1 mt-0.5">{currencyCode}</span>
                    <FaChevronDown size={10} className="text-gray-400 ml-0.5 mt-0.5" />
                </div>
                <AnimatePresence>
                  {isCurrencyMenuOpen && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.15 }} className="absolute top-[50px] right-0 w-72 bg-white rounded-md shadow-2xl border border-zinc-200 z-[9999] overflow-hidden text-zinc-900 cursor-default" onClick={e => e.stopPropagation()}>
                      <div className="p-3">
                        <p className="text-[12px] font-bold text-zinc-600 mb-2 border-b border-zinc-200 pb-2">Change country/region.</p>
                        <div className="relative mb-2">
                          <input
                            type="text"
                            placeholder="Search countries..."
                            value={currencySearchQuery}
                            onChange={(e) => setCurrencySearchQuery(e.target.value)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-2 text-[13px] outline-none focus:border-orange-500 focus:bg-white transition-colors"
                          />
                        </div>
                        <div className="max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                          {currenciesList.filter(curr =>
                            currencySearchQuery === '' ||
                            curr.name.toLowerCase().includes(currencySearchQuery.toLowerCase()) ||
                            curr.code.toLowerCase().includes(currencySearchQuery.toLowerCase()) ||
                            curr.countryCode.toLowerCase().includes(currencySearchQuery.toLowerCase())
                          ).map((curr) => (
                            <button key={curr.countryCode} onClick={() => handleCurrencyChange(curr)} className="w-full flex items-center justify-between px-3 py-2 hover:bg-zinc-100 rounded text-left border-none bg-transparent cursor-pointer focus:outline-none focus:bg-zinc-100 group">
                              <div className="flex items-center gap-3">
                                <span className="text-[18px] group-hover:scale-110 transition-transform">{getFlagEmoji(curr.countryCode)}</span>
                                <span className="text-[14px] text-zinc-800 font-medium">{curr.name} ({curr.code})</span>
                              </div>
                              {currencyCode === curr.code ? (
                                <FaCheck className="text-orange-500" size={12} />
                              ) : (
                                <div className="w-3 h-3 rounded-full border border-zinc-300 group-hover:border-orange-500 transition-colors" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>

            {/* ... Account & Lists Dropdown ... */}
            <div className="relative flex flex-col justify-center px-2 lg:px-3 h-[50px] border border-transparent hover:border-white rounded-[2px] transition-colors cursor-pointer my-auto focus:outline-none focus:border-white" tabIndex="0" aria-label="Account and Lists Menu" ref={userMenuRef} onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                <span className="text-[11px] lg:text-[12px] text-white leading-none mb-0.5 font-normal">Hello, {userInfo ? userInfo.name.split(' ')[0] : 'sign in'}{isElite && <FaGem className="inline text-yellow-300 ml-1" size={10} />}</span>
                <div className="flex items-center gap-1">
                    <span className="font-bold text-[13px] lg:text-[14px] leading-none whitespace-nowrap">Account & Lists</span>
                    <FaChevronDown size={10} className="text-gray-400 mt-0.5" />
                </div>
                <AnimatePresence>
                  {isUserMenuOpen && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.15 }} className="absolute top-[50px] right-0 w-64 bg-white rounded-md shadow-2xl border border-zinc-200 z-[9999] overflow-hidden text-zinc-900 cursor-default" onClick={e => e.stopPropagation()}>
                      {!userInfo && (
                        <div className="p-4 border-b border-zinc-200 flex flex-col items-center bg-zinc-50">
                            <Button onClick={() => navigate('/login')} variant="primary" className="w-56">Sign in</Button>
                            <p className="text-[12px] mt-2">New customer? <Link to="/register" className="text-blue-600 hover:text-orange-600 hover:underline">Start here.</Link></p>
                        </div>
                      )}
                      <div className="p-5 flex flex-col items-start bg-white">
                        {userInfo && storeCredit > 0 && (
                          <Link to="/profile" className="w-full flex items-center justify-between p-3 mb-4 bg-orange-50/50 border border-orange-200 rounded-[4px] hover:bg-orange-100/50 transition-colors no-underline">
                             <div className="flex items-center gap-2">
                               <FaWallet className="text-orange-600" size={16} />
                               <span className="text-[13px] font-bold text-zinc-900">Wallet Balance</span>
                             </div>
                             <span className="font-mono font-bold text-[14px] text-orange-700">{symbol} {storeCredit.toLocaleString('en-US', {minimumFractionDigits: 0})}</span>
                          </Link>
                        )}
                        <h3 className="text-[16px] font-bold mb-3 text-black tracking-tight">Your Account</h3>
                        <div className="flex flex-col gap-3 w-full">
                            <Link to="/profile" className="text-[13px] text-zinc-700 hover:text-orange-600 hover:underline no-underline w-full text-left transition-colors">Account</Link>
                            <Link to="/orders" className="text-[13px] text-zinc-700 hover:text-orange-600 hover:underline no-underline w-full text-left transition-colors">Orders</Link>
                            <Link to="/wishlist" className="text-[13px] text-zinc-700 hover:text-orange-600 hover:underline no-underline w-full text-left transition-colors">Saved Items</Link>
                            <Link to="/browsing-history" className="text-[13px] text-zinc-700 hover:text-orange-600 hover:underline no-underline w-full text-left transition-colors">Browsing History</Link>
                            <Link to="/dk-elite" className="text-[13px] text-orange-600 hover:text-orange-800 hover:underline no-underline w-full text-left transition-colors font-bold">DK-TEC Elite{isElite && <FaGem className="inline text-orange-600 ml-1" size={12} />}</Link>
                            <Link to="/returns" className="text-[13px] text-zinc-700 hover:text-orange-600 hover:underline no-underline w-full text-left transition-colors">Returns Policy</Link>
                            <Link to="/contact" className="text-[13px] text-zinc-700 hover:text-orange-600 hover:underline no-underline w-full text-left transition-colors">Contact Us</Link>
                        </div>
{userInfo && (isVendor || isAdmin) && (
    <div className="w-full mt-4 pt-4 border-t border-zinc-100 flex flex-col gap-3">
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Management</span>
        {isVendor && <Link to="/vendor/dashboard" className="text-[13px] text-orange-600 hover:underline no-underline w-full text-left font-medium">Seller Dashboard</Link>}
        {isVendor && <Link to="/vendor/profile" className="text-[13px] text-orange-600 hover:underline no-underline w-full text-left font-medium">Store Profile</Link>}
        {isVendor && <Link to="/vendor/membership" className="text-[13px] text-orange-600 hover:underline no-underline w-full text-left font-medium">Vendor Membership</Link>}
        {isAdmin && <Link to="/admin/dashboard" className="text-[13px] text-red-600 hover:underline no-underline w-full text-left font-medium">Admin Center</Link>}
        {isAdmin && <Link to="/admin/memberships" className="text-[13px] text-red-600 hover:underline no-underline w-full text-left font-medium">Membership Management</Link>}
    </div>
)}
                        {userInfo && ( <Button onClick={logoutHandler} variant="ghost" className="w-full text-left mt-4 border-t border-zinc-100 pt-3">Sign Out</Button> )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>

            {/* Returns & Orders */}
            <Link to="/orders" aria-label="Returns and Orders" className="hidden lg:flex flex-col justify-center px-2 lg:px-3 h-[50px] border border-transparent hover:border-white rounded-[2px] transition-colors cursor-pointer no-underline text-white my-auto focus:outline-none focus:border-white">
                <span className="text-[11px] lg:text-[12px] font-normal leading-none mb-0.5">Returns</span>
                <span className="font-bold text-[13px] lg:text-[14px] leading-none whitespace-nowrap">& Orders</span>
            </Link>

            {/* 🌟 Desktop Wishlist (Aligned Centered) */}
            <Link to="/wishlist" aria-label="Wishlist" className="hidden lg:flex items-center justify-center px-2 lg:px-3 h-[50px] border border-transparent hover:border-white rounded-[2px] transition-colors cursor-pointer no-underline text-white group my-auto relative focus:outline-none focus:border-white">
              <div className="relative flex items-center justify-center">
                <FaHeart className="text-white group-hover:text-orange-400 transition-colors" size={20} />
                {wishlistCount > 0 && (
                  <motion.span
                    key={wishlistCount}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2.5 bg-[#f08804] text-black font-bold text-[11px] rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center border border-[#131921]"
                  >
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </motion.span>
                )}
              </div>
            </Link>

            {/* 🌟 USER PROVIDED CART UI (Untouched Layout) */}
            <Link to="/cart" aria-label={`Cart, ${cartCount} items`} className="flex items-end justify-center px-1 sm:px-2 h-[50px] border border-transparent hover:border-white rounded-[2px] transition-colors cursor-pointer no-underline text-white group my-auto relative focus:outline-none focus:border-white pb-[3px]">
                <div className="relative flex flex-col items-center justify-end w-[48px] h-[40px] mt-2 shrink-0">
                    <div className="absolute top-[0px] left-0 w-full flex justify-center z-10 pointer-events-none">
                         <motion.span key={cartCount} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="text-[#f08804] font-bold text-[17px] ml-1 leading-none bg-transparent">
                            {cartCount > 99 ? '99+' : cartCount}
                          </motion.span>
                    </div>
                    <svg width="68" height="51" viewBox="0 0 46 38" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-0">
                        <circle cx="16" cy="33" r="3" fill="white"/>
                        <circle cx="33" cy="33" r="3" fill="white"/>
                        <path d="M7 11H12.5L15 25C15.2 26 16 26.5 17 26.5H32C33 26.5 33.8 26 34 25.2L37 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
                <span className="font-bold text-[14px] leading-none mt-auto mb-[6px] hidden lg:block text-white ml-0.5">Cart</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>

    {/* =========================================
        🌟 MOBILE ONLY NAVBAR (< 768px)
    ========================================= */}
    <nav className={`mobile-nav md:hidden bg-[#131921] w-full z-[1050] fixed top-0 left-0 transition-transform duration-300 ease-in-out font-amazon box-border flex flex-col ${scrollDirection === 'down' && !isAtTop ? '-translate-y-full' : 'translate-y-0'}`}>
      <div className="flex justify-between items-center h-[60px] px-2 w-full">
        
        <div className="flex items-center h-full">
          <button onClick={toggleMenu} aria-label="Toggle Mobile Menu" className="px-2 text-white border border-transparent hover:border-white rounded-sm cursor-pointer bg-transparent h-[45px] flex items-center justify-center focus:outline-none">
             <FaBars size={24} />
          </button>
          <Link to="/" aria-label="DKTEC Home" className="flex items-center gap-1 h-[45px] px-2 cursor-pointer border border-transparent hover:border-white rounded-[2px] transition-colors no-underline">
            <div className="bg-orange-600 p-1 rounded">
              <FaHardHat className="text-lg text-white" />
            </div>
            <span className="font-bold text-xl text-white tracking-tighter mt-1">
              DKTEC<span className="text-orange-600 italic">.</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center h-full shrink-0">
           <button onClick={() => setIsMobileUserMenuOpen(true)} aria-label="User Profile" className="relative flex items-center justify-center px-2 h-[45px] text-white border border-transparent hover:border-white rounded-[2px] cursor-pointer bg-transparent focus:outline-none" ref={mobileUserMenuRef}>
              <span className="font-bold text-[13px] mr-1 truncate max-w-[80px]">{userInfo ? userInfo.name.split(' ')[0] : 'Sign In'}</span>
              <FaUser size={20} />
           </button>

            {/* 🌟 Mobile Wishlist (Aligned Centered) */}
            <Link to="/wishlist" aria-label="Wishlist" className="flex items-center justify-center px-2 h-[45px] border border-transparent hover:border-white rounded-[2px] transition-colors cursor-pointer no-underline text-white group relative focus:outline-none my-auto">
                <div className="relative flex items-center justify-center">
                    <FaHeart className="text-white group-hover:text-orange-400 transition-colors" size={20} />
                    {wishlistCount > 0 && (
                      <motion.span
                        key={wishlistCount}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-2 -right-2.5 bg-[#f08804] text-black font-bold text-[10px] rounded-full h-4 min-w-[15px] px-1 flex items-center justify-center border border-[#131921]"
                      >
                        {wishlistCount > 99 ? '99+' : wishlistCount}
                      </motion.span>
                    )}
                </div>
            </Link>

            {/* 🌟 USER PROVIDED CART UI (Untouched Layout) */}
            <Link to="/cart" aria-label={`Cart, ${cartCount} items`} className="flex items-end justify-center px-1 sm:px-2 h-[50px] border border-transparent hover:border-white rounded-[2px] transition-colors cursor-pointer no-underline text-white group relative focus:outline-none focus:border-white pb-[3px]">
                 <div className="relative flex flex-col items-center justify-end w-[48px] h-[40px] mt-2 shrink-0">
                     <div className="absolute top-[0px] left-0 w-full flex justify-center z-10 pointer-events-none">
                          <motion.span key={cartCount} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="text-[#f08804] font-bold text-[17px] ml-1 leading-none bg-transparent">
                             {cartCount > 99 ? '99+' : cartCount}
                           </motion.span>
                     </div>
                     <svg width="68" height="51" viewBox="0 0 46 38" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-0">
                         <circle cx="16" cy="33" r="3" fill="white"/>
                         <circle cx="33" cy="33" r="3" fill="white"/>
                         <path d="M7 11H12.5L15 25C15.2 26 16 26.5 17 26.5H32C33 26.5 33.8 26 34 25.2L37 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                     </svg>
                 </div>
             </Link>
        </div>
      </div>

      <div className="w-full px-2 pb-2 h-[50px] bg-[#131921]" ref={mobileSearchRef}>
          <form onSubmit={submitHandler} className={`w-full h-[44px] flex items-center bg-white rounded-[4px] overflow-hidden transition-all ${isSearchFocused ? 'ring-[3px] ring-orange-400 shadow-[0_0_0_2px_rgba(249,115,22,0.3)]' : ''}`}>
              <input 
                type="text" 
                aria-label="Search"
                placeholder="Search DKTEC" 
                className="bg-transparent border-none outline-none flex-1 px-3 text-[16px] text-zinc-900 placeholder-zinc-500 h-full w-full"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                onFocus={() => { setIsSearchFocused(true); setShowSuggestions(true); }}
              />
              <button type="submit" aria-label="Submit Search" className="bg-[#febd69] hover:bg-[#f3a847] h-full px-5 flex items-center justify-center transition-colors cursor-pointer border-none focus:outline-none">
                <FaSearch size={22} className="text-zinc-900" />
              </button>
          </form>
          <RenderSuggestions />
      </div>
    </nav>
    {/* =========================================
      🌟 GLOBAL UI ELEMENTS (PORTALS)
      Rendered completely outside the DOM hierarchy
      ========================================= 
    */}
    
    {/* 🌟 1. Mobile Profile Dropdown Menu (Portal) */}
    <Portal>
        <AnimatePresence>
          {isMobileUserMenuOpen && (
            <div className="fixed inset-0 z-[99999] md:hidden font-amazon" style={{ top: '60px' }}>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileUserMenuOpen(false)} className="absolute inset-0 bg-black/50 cursor-pointer" />
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.15 }} className="absolute top-2 right-2 w-[90%] max-w-[300px] bg-white rounded-md shadow-2xl overflow-hidden text-zinc-900 flex flex-col items-start border border-zinc-200" onClick={(e) => e.stopPropagation()}>
                  {!userInfo && (
                    <div className="p-4 border-b border-zinc-200 flex flex-col items-center bg-zinc-50 w-full">
                        <Button onClick={() => {setIsMobileUserMenuOpen(false); navigate('/login')}} variant="primary" className="w-full">Sign in</Button>
                        <p className="text-[12px] mt-2">New customer? <Link to="/register" onClick={() => setIsMobileUserMenuOpen(false)} className="text-blue-600 hover:text-orange-600 hover:underline">Start here.</Link></p>
                    </div>
                  )}

                  <div className="p-5 w-full flex flex-col gap-3">
                      {userInfo && storeCredit > 0 && (
                        <Link to="/profile" className="w-full flex items-center justify-between p-3 mb-2 bg-orange-50/50 border border-orange-200 rounded-[4px] hover:bg-orange-100/50 transition-colors no-underline">
                           <div className="flex items-center gap-2">
                             <FaWallet className="text-orange-600" size={16} />
                             <span className="text-[13px] font-bold text-zinc-900">Balance</span>
                           </div>
                           <span className="font-mono font-bold text-[14px] text-orange-700">{symbol} {storeCredit.toLocaleString('en-US', {minimumFractionDigits: 0})}</span>
                        </Link>
                      )}

                      <h3 className="text-[16px] font-bold mb-1 text-black">Your Account</h3>
                      <Link to="/profile" onClick={() => setIsMobileUserMenuOpen(false)} className="text-[14px] text-zinc-700 hover:text-orange-600 no-underline block w-full text-left">Account Settings</Link>
                      <Link to="/orders" onClick={() => setIsMobileUserMenuOpen(false)} className="text-[14px] text-zinc-700 hover:text-orange-600 no-underline block w-full text-left">Orders</Link>
                      <Link to="/wishlist" onClick={() => setIsMobileUserMenuOpen(false)} className="text-[14px] text-zinc-700 hover:text-orange-600 no-underline block w-full text-left">Saved Items</Link>
                      <Link to="/dk-elite" onClick={() => setIsMobileUserMenuOpen(false)} className="text-[14px] text-orange-600 font-bold hover:text-orange-800 no-underline block w-full text-left">DK-TEC Elite{isElite && <FaGem className="inline text-orange-600 ml-1" size={12} />}</Link>
                      <Link to="/returns" onClick={() => setIsMobileUserMenuOpen(false)} className="text-[14px] text-zinc-700 hover:text-orange-600 no-underline block w-full text-left">Returns Policy</Link>
                      <Link to="/contact" onClick={() => setIsMobileUserMenuOpen(false)} className="text-[14px] text-zinc-700 hover:text-orange-600 no-underline block w-full text-left">Customer Service</Link>
                      
                      {userInfo && (isVendor || isAdmin) && (
                        <div className="w-full mt-2 pt-3 border-t border-zinc-100 flex flex-col gap-3">
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Management</span>
                            {isVendor && <Link to="/vendor/dashboard" onClick={() => setIsMobileUserMenuOpen(false)} className="text-[14px] text-orange-600 font-medium no-underline w-full text-left">Seller Dashboard</Link>}
                            {isVendor && <Link to="/vendor/profile" onClick={() => setIsMobileUserMenuOpen(false)} className="text-[14px] text-orange-600 font-medium no-underline w-full text-left">Store Profile</Link>}
                            {isVendor && <Link to="/vendor/membership" onClick={() => setIsMobileUserMenuOpen(false)} className="text-[14px] text-orange-600 font-medium no-underline w-full text-left">Vendor Membership</Link>}
                            {isAdmin && <Link to="/admin/dashboard" onClick={() => setIsMobileUserMenuOpen(false)} className="text-[14px] text-red-600 font-medium no-underline w-full text-left">Admin Center</Link>}
                            {isAdmin && <Link to="/admin/memberships" onClick={() => setIsMobileUserMenuOpen(false)} className="text-[14px] text-red-600 font-medium no-underline w-full text-left">Membership Management</Link>}
                        </div>
                      )}

                      {userInfo && ( <Button onClick={() => { logoutHandler(); setIsMobileUserMenuOpen(false); }} variant="ghost" className="w-full text-left mt-2 border-t border-zinc-100 pt-3">Sign Out</Button> )}
                  </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
    </Portal>

    {/* 🌟 2. Global Hamburger Drawer (Left Side Menu) - Portal */}
    <Portal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[99999] flex font-amazon h-[100dvh]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={() => setIsOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-pointer"></motion.div>
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }} className="relative w-[85%] max-w-[360px] bg-white h-full shadow-2xl flex flex-col overflow-hidden">
              <button onClick={() => setIsOpen(false)} className="absolute top-4 -right-12 text-white hover:text-zinc-300 transition-colors z-[2010] cursor-pointer border-none bg-transparent focus:outline-none">
                <FaTimes size={32} />
              </button>

              <div className="bg-[#232f3e] text-white px-6 py-5 flex items-center gap-3 shrink-0">
                <FaUserCircle size={32} className="text-zinc-300" />
                <span className="text-[20px] font-black tracking-tight mt-1">
                  Hello, {userInfo ? userInfo.name.split(' ')[0] : 'Sign in'}{isElite && <FaGem className="inline text-yellow-300 ml-1" size={14} />}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pb-10 bg-white">
                
                {/* 🌟 New Currency Selector in Sidebar */}
                <div className="py-4 border-b-[3px] border-zinc-200">
                  <h3 className="px-6 py-2 text-[18px] font-bold text-zinc-900">Settings</h3>
                  
                  {/* Currency / Language Button */}
                  <button 
                    onClick={() => { setIsOpen(false); setIsMobileCurrencyModalOpen(true); setCurrencySearchQuery(''); }}
                    className="w-full text-left px-6 py-3.5 text-[15px] font-medium text-zinc-600 hover:bg-zinc-100 flex items-center justify-between cursor-pointer border-none bg-transparent transition-colors"
                  >
                    <div className="flex items-center gap-2">
                       <span className="text-[18px]">{getFlagEmoji(countryCode)}</span>
                       <span>{currencyCode} - {currentCountryName}</span>
                    </div>
                    <FaChevronRight size={14} className="text-zinc-400" />
                  </button>
                </div>

                <div className="py-4 border-b-[3px] border-zinc-200">
                  <h3 className="px-6 py-2 text-[18px] font-bold text-zinc-900">Trending</h3>
                  <button onClick={() => { setIsOpen(false); navigate('/search?sortBy=rating'); }} className="w-full text-left px-6 py-3.5 text-[15px] font-medium text-zinc-600 hover:bg-zinc-100 flex items-center justify-between cursor-pointer border-none bg-transparent transition-colors">
                    Best Sellers <FaChevronRight size={14} className="text-zinc-400" />
                  </button>
                  <button onClick={() => { setIsOpen(false); navigate('/newest'); }} className="w-full text-left px-6 py-3.5 text-[15px] font-medium text-zinc-600 hover:bg-zinc-100 flex items-center justify-between cursor-pointer border-none bg-transparent transition-colors">
                    New Releases <FaChevronRight size={14} className="text-zinc-400" />
                  </button>
                </div>

                <div className="py-4 border-b-[3px] border-zinc-200">
                  <h3 className="px-6 py-2 text-[18px] font-bold text-zinc-900">Shop by Department</h3>
                  {activeCategories.length > 0 ? (
                    activeCategories.map((category, index) => (
                      <button 
                        key={index} 
                        onClick={() => { setIsOpen(false); navigate(`/department/${encodeURIComponent(category.toLowerCase().trim())}`); }} 
                        className="w-full text-left px-6 py-3.5 text-[15px] font-medium text-zinc-600 hover:bg-zinc-100 flex items-center justify-between cursor-pointer border-none bg-transparent transition-colors"
                      >
                        {category} <FaChevronRight size={14} className="text-zinc-400" />
                      </button>
                    ))
                  ) : (
                    <p className="px-6 py-3 text-sm text-zinc-400">Loading departments...</p>
                  )}
                </div>

                <div className="py-4 pb-10">
                  <h3 className="px-6 py-2 text-[18px] font-bold text-zinc-900">Help & Account</h3>
                  <button onClick={() => { setIsOpen(false); navigate('/profile'); }} className="w-full text-left px-6 py-3.5 text-[15px] font-medium text-zinc-600 hover:bg-zinc-100 cursor-pointer border-none bg-transparent transition-colors">Your Account</button>
                  <button onClick={() => { setIsOpen(false); navigate('/dk-elite'); }} className="w-full text-left px-6 py-3.5 text-[15px] font-medium text-orange-600 hover:bg-orange-50 cursor-pointer border-none bg-transparent transition-colors font-bold">DK-TEC Elite</button>
                  <button onClick={() => { setIsOpen(false); navigate('/contact'); }} className="w-full text-left px-6 py-3.5 text-[15px] font-medium text-zinc-600 hover:bg-zinc-100 cursor-pointer border-none bg-transparent transition-colors">Customer Service</button>
                  {userInfo ? (
                    <Button onClick={() => { logoutHandler(); setIsOpen(false); }} variant="ghost" className="w-full text-left">Sign Out</Button>
                  ) : (
                    <Button onClick={() => { navigate('/login'); setIsOpen(false); }} variant="primary" className="w-full text-left">Sign In</Button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>

    {/* 🌟 3. Global Location Modal (Deliver To) - Portal */}
    <Portal>
      <AnimatePresence>
        {isLocationModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-4 font-amazon h-[100dvh]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={() => setIsLocationModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"></motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 100 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 100 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative bg-white sm:rounded-lg shadow-2xl w-full max-w-[420px] max-h-[85dvh] overflow-hidden z-10 flex flex-col 
                         absolute bottom-0 sm:relative rounded-t-2xl sm:rounded-t-lg"
            >
              
              <div className="bg-zinc-100 px-5 py-4 border-b border-zinc-200 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-zinc-900 text-[16px]">Choose your location</h3>
                <button onClick={() => setIsLocationModalOpen(false)} className="text-zinc-500 hover:text-zinc-800 bg-transparent border-none cursor-pointer p-1 rounded-sm hover:bg-zinc-200 transition-colors focus:outline-none">
                  <FaTimes size={20} />
                </button>
              </div>

              <div className="flex border-b border-zinc-200 shrink-0">
                <button
                  onClick={() => setLocationTab('addresses')}
                  className={`flex-1 py-3 text-[13px] font-bold text-center border-b-2 transition-colors bg-transparent cursor-pointer ${
                    locationTab === 'addresses'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  <FaMapMarkerAlt size={12} className="inline mr-1" /> Saved Addresses
                </button>
                <button
                  onClick={() => setLocationTab('countries')}
                  className={`flex-1 py-3 text-[13px] font-bold text-center border-b-2 transition-colors bg-transparent cursor-pointer ${
                    locationTab === 'countries'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  <FaGlobe size={12} className="inline mr-1" /> All Countries
                </button>
              </div>

              {locationTab === 'addresses' ? (
                <div className="p-5 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
                  <p className="text-[13px] text-zinc-500 leading-snug">
                    Delivery options and delivery speeds may vary for different locations.
                  </p>

                  {userInfo ? (
                    <>
                      <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
                        {(profile?.addresses || []).length > 0 ? (
                          profile.addresses.map((addr) => {
                            const isSelected = currentLocation?._id === addr._id || addr.isDefault;
                            return (
                              <button
                                key={addr._id}
                                onClick={() => {
                                  dispatch(setSelectedLocation({
                                    _id: addr._id,
                                    fullName: addr.fullName,
                                    phone: addr.phone,
                                    address: addr.addressLine,
                                    city: addr.city,
                                    district: addr.district,
                                    country: addr.country || countryCode,
                                  }));
                                  setIsLocationModalOpen(false);
                                  toast.success(`Delivering to ${addr.city}`);
                                }}
                                className={`border rounded-[6px] p-3 flex flex-col cursor-pointer relative overflow-hidden text-left focus:outline-none focus:ring-2 focus:ring-orange-400 hover:bg-orange-50 transition-colors w-full ${
                                  isSelected ? 'border-orange-500 bg-orange-50/40' : 'border-zinc-200 bg-white'
                                }`}
                              >
                                {isSelected && <div className="absolute top-0 left-0 w-[4px] h-full bg-orange-500"></div>}
                                <span className="font-bold text-zinc-900 text-[15px]">{addr.fullName}</span>
                                <span className="text-zinc-600 text-[13px] mt-0.5 line-clamp-2 leading-tight">{addr.addressLine}</span>
                                <span className="text-zinc-600 text-[13px]">{addr.city}{addr.district ? `, ${addr.district}` : ''}</span>
                                {isSelected && (
                                  <span className="text-[#f08804] font-bold text-[11px] mt-2 uppercase tracking-wide flex items-center gap-1">
                                    <FaCheck size={10}/> {addr.isDefault ? 'Default' : 'Selected'}
                                  </span>
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <div className="text-center py-4 text-zinc-500 text-[13px]">
                            No saved addresses. Add one below.
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <button onClick={() => { setIsLocationModalOpen(false); navigate('/addresses'); }} className="text-[13px] text-[#007185] hover:text-orange-600 hover:underline text-left bg-transparent border-none cursor-pointer font-medium p-0 focus:outline-none w-fit">
                          Manage address book
                        </button>
                        <span className="text-zinc-300">|</span>
                        <button onClick={() => { setIsLocationModalOpen(false); navigate('/addresses'); }} className="text-[13px] text-brand-orange-600 hover:text-orange-800 hover:underline text-left bg-transparent border-none cursor-pointer font-medium p-0 focus:outline-none w-fit">
                          Add new address
                        </button>
                      </div>
                    </>
                  ) : (
                    <Button onClick={() => { setIsLocationModalOpen(false); navigate('/login'); }} variant="primary" className="w-full">
                      Sign in to see your addresses
                    </Button>
                  )}

                  <div className="flex items-center gap-3 my-2">
                    <div className="h-px bg-zinc-200 flex-1"></div>
                    <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-widest">or</span>
                    <div className="h-px bg-zinc-200 flex-1"></div>
                  </div>

                  <button onClick={() => { setIsLocationModalOpen(false); navigate('/addresses'); }} className="w-full flex items-center justify-center gap-2 border border-zinc-300 rounded-[8px] py-2.5 px-3 hover:bg-zinc-50 transition-colors cursor-pointer text-zinc-800 text-[13px] font-medium shadow-[0_2px_5px_rgba(213,217,217,0.5)] focus:outline-none focus:ring-2 focus:ring-orange-400 group">
                     <FaPlus className="text-zinc-500 group-hover:text-[#007185] transition-colors" size={12} />
                     <span>Add a new address</span>
                  </button>

                  <button 
                    onClick={handleGetCurrentLocation}
                    disabled={isLocating}
                    className="w-full flex items-center justify-center gap-2 border border-[#8a99a8] rounded-[8px] py-2.5 px-3 hover:bg-zinc-50 transition-colors cursor-pointer text-zinc-800 text-[13px] font-medium shadow-[0_2px_5px_rgba(213,217,217,0.5)] focus:outline-none focus:ring-2 focus:ring-[#007185] group disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                     {isLocating ? (
                       <span className="animate-spin h-4 w-4 border-2 border-[#007185] border-t-transparent rounded-full"></span>
                     ) : (
                       <FaLocationArrow className="text-[#007185] transition-colors" size={14} />
                     )}
                     <span>{isLocating ? 'Locating...' : 'Use my current location'}</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 flex flex-col overflow-y-auto custom-scrollbar" style={{ maxHeight: '400px' }}>
                  <div className="relative mb-3">
                    <input
                      type="text"
                      placeholder="Search countries..."
                      value={currencySearchQuery}
                      onChange={(e) => setCurrencySearchQuery(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-[14px] outline-none focus:border-orange-500 focus:bg-white transition-colors pl-10"
                    />
                    <FaGlobe className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                  </div>
                  <div className="flex-1 space-y-1">
                    {currenciesList.filter(curr =>
                      currencySearchQuery === '' ||
                      curr.name.toLowerCase().includes(currencySearchQuery.toLowerCase()) ||
                      curr.code.toLowerCase().includes(currencySearchQuery.toLowerCase()) ||
                      curr.countryCode.toLowerCase().includes(currencySearchQuery.toLowerCase())
                    ).map((curr) => {
                      const isActive = currencyCode === curr.code;
                      return (
                        <button
                          key={curr.countryCode}
                          onClick={() => {
                            handleCurrencyChange(curr);
                            dispatch(setSelectedLocation({
                              country: curr.name,
                              countryCode: curr.countryCode,
                              city: '',
                              address: '',
                            }));
                            setIsLocationModalOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all bg-transparent border-none cursor-pointer hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-300 ${
                            isActive ? 'bg-orange-50/60 ring-1 ring-orange-200' : ''
                          }`}
                        >
                          <span className="text-[22px] shrink-0">{getFlagEmoji(curr.countryCode)}</span>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-[14px] font-bold text-zinc-800 truncate">{curr.name}</span>
                            <span className="text-[12px] text-zinc-500">{curr.code}{curr.shippingFee ? ` · Shipping ${curr.shippingFee}` : ''}</span>
                          </div>
                          {isActive && (
                            <FaCheck className="text-orange-500 shrink-0" size={14} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>

    {/* 🌟 4. Global Mobile Currency Modal (Bottom Sheet) - Portal */}
    <Portal>
      <AnimatePresence>
        {isMobileCurrencyModalOpen && (
          <div className="fixed inset-0 z-[99999] flex items-end justify-center p-0 font-amazon h-[100dvh]">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={() => setIsMobileCurrencyModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"></motion.div>

            <motion.div 
              initial={{ opacity: 0, y: "100%" }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative bg-white w-full max-w-md max-h-[80dvh] overflow-hidden z-10 flex flex-col rounded-t-2xl"
            >
              
              <div className="bg-zinc-100 px-5 py-4 border-b border-zinc-200 flex justify-between items-center shrink-0">
                <h3 className="font-bold text-zinc-900 text-[16px]">Change Country / Region</h3>
                <button onClick={() => setIsMobileCurrencyModalOpen(false)} className="text-zinc-500 hover:text-zinc-800 bg-transparent border-none cursor-pointer p-1 rounded-sm hover:bg-zinc-200 transition-colors focus:outline-none">
                  <FaTimes size={20} />
                </button>
              </div>

              <div className="px-3 pt-2">
                <input
                  type="text"
                  placeholder="Search countries..."
                  value={currencySearchQuery}
                  onChange={(e) => setCurrencySearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-[14px] outline-none focus:border-orange-500 focus:bg-white transition-colors"
                />
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                {currenciesList.filter(curr =>
                  currencySearchQuery === '' ||
                  curr.name.toLowerCase().includes(currencySearchQuery.toLowerCase()) ||
                  curr.code.toLowerCase().includes(currencySearchQuery.toLowerCase()) ||
                  curr.countryCode.toLowerCase().includes(currencySearchQuery.toLowerCase())
                ).map((curr) => (
                  <button key={curr.countryCode} onClick={() => handleCurrencyChange(curr)} className="w-full flex items-center justify-between px-4 py-4 hover:bg-zinc-50 border-b border-zinc-100 bg-transparent cursor-pointer focus:outline-none focus:bg-zinc-50 group">
                    <div className="flex items-center gap-3">
                      <span className="text-[24px] group-hover:scale-110 transition-transform">{getFlagEmoji(curr.countryCode)}</span>
                      <div className="flex flex-col items-start">
                        <span className="text-[15px] text-zinc-900 font-bold">{curr.name}</span>
                        <span className="text-[13px] text-zinc-500">{curr.code}</span>
                      </div>
                    </div>
                    {currencyCode === curr.code ? (
                      <div className="w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center">
                        <FaCheck className="text-orange-600" size={12} />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-zinc-300 group-hover:border-orange-400 transition-colors" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Portal>

    </>
  );
};

export default Navbar;