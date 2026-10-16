import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaFilter, FaTimes, FaChevronRight, FaExclamationCircle, FaAd, FaTimesCircle } from 'react-icons/fa';
import { useGetProductsQuery } from '../slices/productsApiSlice';
import { useCart } from '../context/CartContext';
import { useGetWishlistQuery } from '../slices/wishlistApiSlice';
import Message from '../components/Message';
import { SkeletonCard } from '../components/Skeleton';
import ProductCard from '../components/ProductCard';
import Rating from '../components/Rating'; 
import SponsoredBanner from '../components/SponsoredBanner';
import QuickViewModal from '../components/QuickViewModal';

const SearchScreen = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart(); 

  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const category = searchParams.get('category') ? searchParams.get('category').toLowerCase().trim() : 'all';
  const searchTerm = searchParams.get('keyword') ? searchParams.get('keyword').toLowerCase().trim() : '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const selectedRating = Number(searchParams.get('rating')) || 0;
  
  const selectedBrands = useMemo(() => {
    try { const brands = searchParams.get('brands'); return brands ? brands.split(',') : []; } 
    catch { return []; }
  }, [searchParams]);

  const sortBy = searchParams.get('sortBy') || 'featured';
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const [inputMinPrice, setInputMinPrice] = useState(minPrice);
  const [inputMaxPrice, setInputMaxPrice] = useState(maxPrice);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [minPrice, maxPrice, category, searchTerm, selectedBrands.length, selectedRating]);

  useEffect(() => {
    if (isMobileFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileFilterOpen]);

  const { currencyCode = 'USD', rate = 1 } = useSelector((state) => state.currency);
  const { userInfo } = useSelector((state) => state.auth);

  const { data: wishlist } = useGetWishlistQuery(undefined, { skip: !userInfo });
  const wishlistProductIds = useMemo(() => {
    if (!wishlist?.products) return [];
    return wishlist.products.map((p) =>
      typeof p.product === 'object' ? p.product._id : p.product
    );
  }, [wishlist]);

  const { data: products, isLoading, error } = useGetProductsQuery({ 
    keyword: searchTerm, 
    category: category !== 'all' ? category : undefined 
  });

  const updateURLParams = (key, value) => {
    try {
      const currentParams = new URLSearchParams(searchParams);
      if (value) currentParams.set(key, value); else currentParams.delete(key);
      setSearchParams(currentParams);
    } catch (err) { console.error(err); }
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let result = products.filter(p => p && (p.status === 'active' || !p.status));

    result = result.filter(p => {
      const pPrice = (p.price || 0) * rate;
      const meetsMin = minPrice ? pPrice >= Number(minPrice) : true;
      const meetsMax = maxPrice ? pPrice <= Number(maxPrice) : true;
      const meetsRating = (p.rating || 0) >= selectedRating;
      const meetsBrand = selectedBrands.length > 0 ? selectedBrands.some(b => b.toLowerCase().trim() === (p.brand || '').toLowerCase().trim()) : true;
      return meetsMin && meetsMax && meetsRating && meetsBrand;
    });

    // 🌟 Smart Sorting Logic: Ensure Sponsored stays on top if sorting by "featured"
    if (sortBy === 'featured') {
      result.sort((a, b) => {
         if (a.isSponsored && !b.isSponsored) return -1;
         if (!a.isSponsored && b.isSponsored) return 1;
         return 0; // Keep original order (which is newest first from backend)
      });
    } else if (sortBy === 'price-asc') {
      result.sort((a, b) => ((a?.price || 0) * rate) - ((b?.price || 0) * rate));
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => ((b?.price || 0) * rate) - ((a?.price || 0) * rate));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b?.rating || 0) - (a?.rating || 0));
    }

    return result;
  }, [products, minPrice, maxPrice, rate, selectedRating, selectedBrands, sortBy]);

  const dynamicCategories = useMemo(() => {
    if (!products) return [];
    const allCats = products.filter(p => p && (p.status === 'active' || !p.status)).map(p => p.category).filter(Boolean);
    return [...new Set(allCats)].sort();
  }, [products]);

  const availableBrands = useMemo(() => {
    if (!products) return [];
    const activeProducts = products.filter(p => p && (p.status === 'active' || !p.status));
    return [...new Set(activeProducts.map(p => p.brand).filter(Boolean))].slice(0, 10);
  }, [products]);

  const handleCategoryChange = (newCategory) => {
    if (newCategory === 'All') updateURLParams('category', '');
    else updateURLParams('category', newCategory.toLowerCase().trim());
    setIsMobileFilterOpen(false);
  };

  const handleBrandToggle = (brand) => {
    let updatedBrands = [...selectedBrands];
    if (updatedBrands.includes(brand)) updatedBrands = updatedBrands.filter(b => b !== brand);
    else updatedBrands.push(brand);
    updateURLParams('brands', updatedBrands.length > 0 ? updatedBrands.join(',') : null);
    setIsMobileFilterOpen(false);
  };

  const handlePriceSubmit = (e) => {
    e.preventDefault();
    const currentParams = new URLSearchParams(searchParams);
    if (inputMinPrice) currentParams.set('minPrice', inputMinPrice); else currentParams.delete('minPrice');
    if (inputMaxPrice) currentParams.set('maxPrice', inputMaxPrice); else currentParams.delete('maxPrice');
    setSearchParams(currentParams);
    setIsMobileFilterOpen(false);
  };

  const isTargetedSearch = category !== 'all' || searchTerm !== '' || selectedBrands.length > 0 || minPrice || maxPrice || selectedRating > 0;

  if (error) return <div className="py-10 px-4 max-w-7xl mx-auto"><Message variant='danger'>Search Engine Offline</Message></div>;

  return (
    <div className="bg-[#fafafa] min-h-[calc(100vh-120px)] antialiased flex flex-col pt-0">
      
      {/* Top Results Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm w-full z-30 relative">
        <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-sm text-gray-800 font-medium">
            {filteredProducts.length > 0 ? (
              <>
                <span className="font-bold">1-{filteredProducts.length}</span> results 
                {searchTerm && <> for <span className="font-bold text-orange-600">"{searchTerm}"</span></>}
                {category !== 'all' && <> in <span className="font-bold text-orange-600">"{category}"</span></>}
              </>
            ) : (
              <span>No exact matches found.</span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-md px-3 py-1.5 focus-within:border-orange-500">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Sort by:</span>
              <select value={sortBy} onChange={(e) => updateURLParams('sortBy', e.target.value)} className="bg-transparent text-sm font-bold text-gray-900 outline-none cursor-pointer border-none p-0 focus:ring-0">
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Avg. Customer Review</option>
              </select>
            </div>
            <button onClick={() => setIsMobileFilterOpen(true)} className="lg:hidden bg-white border border-gray-300 text-gray-900 px-4 py-1.5 rounded-md text-sm font-bold shadow-sm flex items-center gap-2 shrink-0 cursor-pointer hover:bg-gray-50">
              <FaFilter /> Filters
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 flex-1 w-full pt-6 pb-20">
        <div className="flex flex-col lg:flex-row gap-8 items-start h-full">

          {/* Mobile Backdrop */}
          <div 
            className={`fixed inset-0 bg-black/60 z-[1999] lg:hidden transition-opacity duration-300 ${isMobileFilterOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => setIsMobileFilterOpen(false)}
          ></div>

          {/* Sidebar Filters */}
          <aside className={`fixed top-0 left-0 h-full w-[280px] bg-white z-[2000] lg:static lg:h-auto lg:w-60 xl:w-64 lg:bg-transparent lg:z-auto shrink-0 transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col ${isMobileFilterOpen ? 'translate-x-0 shadow-[20px_0_40px_rgba(0,0,0,0.2)]' : '-translate-x-full'}`}>
            
            <div className="flex justify-between items-center lg:hidden p-5 border-b border-gray-200 bg-gray-50 shrink-0">
              <h3 className="font-black text-lg text-gray-900 uppercase tracking-tight flex items-center gap-2">
                <FaFilter size={14} className="text-orange-600" /> Filters
              </h3>
              <button onClick={() => setIsMobileFilterOpen(false)} className="text-gray-500 hover:text-red-500 bg-white border border-gray-200 p-2 rounded-lg shadow-sm cursor-pointer transition-colors">
                <FaTimes size={14} />
              </button>
            </div>

            <div className="p-5 lg:p-0 flex-1 overflow-y-auto custom-scrollbar lg:sticky lg:top-[20px] lg:h-[calc(100vh-120px)] space-y-6 text-sm">
              
              <div>
                <h4 className="font-bold text-gray-900 mb-2">Department</h4>
                <ul className="space-y-1.5 text-gray-700 list-none p-0 m-0">
                  <li><button onClick={() => handleCategoryChange('All')} className={`text-left w-full hover:text-orange-600 flex items-center gap-1.5 py-1 border-none bg-transparent cursor-pointer transition-all ${category === 'all' ? 'font-black text-black' : 'text-sm font-medium'}`}>{category === 'all' && <FaChevronRight size={8} className="text-orange-600" />} Any Department</button></li>
                  {dynamicCategories.map((cat, idx) => (
                    <li key={idx}><button onClick={() => handleCategoryChange(cat)} className={`text-left w-full hover:text-orange-600 flex items-start gap-1.5 py-1 border-none bg-transparent cursor-pointer transition-all ${category === cat.toLowerCase() ? 'font-black text-black' : 'text-sm font-medium'}`}>{category === cat.toLowerCase() && <FaChevronRight size={8} className="text-orange-600 mt-1 shrink-0" />} <span className="truncate">{cat}</span></button></li>
                  ))}
                </ul>
              </div>

              {availableBrands.length > 0 && (
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Brands</h4>
                  <ul className="space-y-2 list-none p-0 m-0">
                    {availableBrands.map((brand, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <input type="checkbox" id={`brand-idx-${idx}`} checked={selectedBrands.includes(brand)} onChange={() => handleBrandToggle(brand)} className="w-4 h-4 text-orange-600 bg-white border-gray-300 rounded focus:ring-orange-500 cursor-pointer" />
                        <label htmlFor={`brand-idx-${idx}`} className="text-gray-700 hover:text-orange-600 cursor-pointer text-sm font-medium truncate select-none">{brand}</label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h4 className="font-bold text-gray-900 mb-2">Customer Reviews</h4>
                <ul className="space-y-2 list-none p-0 m-0">
                  {[4, 3, 2, 1].map(stars => (
                    <li key={stars}>
                      <button onClick={() => { updateURLParams('rating', selectedRating === stars ? null : stars.toString()); setIsMobileFilterOpen(false); }} className="flex items-center hover:text-orange-600 group border-none bg-transparent cursor-pointer text-left">
                        <Rating value={stars} size="text-base" color={selectedRating === stars ? '#ea580c' : '#f59e0b'} />
                        <span className={`ml-1 text-xs group-hover:text-orange-600 transition-all ${selectedRating === stars ? 'font-black text-black' : 'text-gray-600 font-medium'}`}>& Up</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-2">Price ({currencyCode})</h4>
                <form onSubmit={handlePriceSubmit} className="flex items-center gap-2">
                  <input type="number" placeholder="Min" value={inputMinPrice} onChange={(e) => setInputMinPrice(e.target.value)} className="w-16 p-1.5 bg-white border border-gray-400 rounded focus:border-orange-500 outline-none font-mono text-xs text-gray-900" />
                  <span className="text-gray-400">-</span>
                  <input type="number" placeholder="Max" value={inputMaxPrice} onChange={(e) => setInputMaxPrice(e.target.value)} className="w-16 p-1.5 bg-white border border-gray-400 rounded focus:border-orange-500 outline-none font-mono text-xs text-gray-900" />
                  <button type="submit" className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded text-xs font-bold cursor-pointer">Go</button>
                </form>
              </div>

              {isTargetedSearch && (
                <div className="pt-4 border-t border-gray-100 pb-8 lg:pb-0">
                   <button onClick={() => { setInputMinPrice(''); setInputMaxPrice(''); setIsMobileFilterOpen(false); navigate('/search'); }} className="w-full py-2.5 bg-white text-red-600 rounded-lg text-xs font-bold uppercase hover:bg-red-50 hover:border-red-200 transition-all border border-gray-300 shadow-sm cursor-pointer">
                     Clear All Filters
                   </button>
                </div>
              )}
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 w-full min-w-0">
            
            {/* Active Filters Display */}
            {isTargetedSearch && !isLoading && filteredProducts.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider mr-1">Active:</span>
                 
                 {searchTerm && (
                   <span className="bg-orange-50 border border-orange-200 text-orange-700 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm">
                     "{searchTerm}" <button onClick={() => updateURLParams('keyword', '')} className="hover:text-red-500 cursor-pointer border-none bg-transparent p-0 flex"><FaTimesCircle size={12}/></button>
                   </span>
                 )}
                 {category !== 'all' && (
                   <span className="bg-orange-50 border border-orange-200 text-orange-700 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm">
                     {category} <button onClick={() => updateURLParams('category', '')} className="hover:text-red-500 cursor-pointer border-none bg-transparent p-0 flex"><FaTimesCircle size={12}/></button>
                   </span>
                 )}
                 {selectedBrands.map(b => (
                   <span key={b} className="bg-orange-50 border border-orange-200 text-orange-700 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm">
                     {b} <button onClick={() => handleBrandToggle(b)} className="hover:text-red-500 cursor-pointer border-none bg-transparent p-0 flex"><FaTimesCircle size={12}/></button>
                   </span>
                 ))}
                 {selectedRating > 0 && (
                   <span className="bg-orange-50 border border-orange-200 text-orange-700 px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm">
                     {selectedRating} Stars & Up <button onClick={() => updateURLParams('rating', '')} className="hover:text-red-500 cursor-pointer border-none bg-transparent p-0 flex"><FaTimesCircle size={12}/></button>
                   </span>
                 )}
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {[1,2,3,4,5,6,7,8].map((i) => <SkeletonCard key={i} />)}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-24 text-center flex flex-col items-center justify-center bg-white border border-gray-200 rounded-xl shadow-sm">
                <FaExclamationCircle size={40} className="text-orange-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-900">No results found</h3>
                <p className="text-gray-500 text-sm mt-2 mb-6">Try adjusting your filters or search keywords.</p>
                <button onClick={() => { setIsMobileFilterOpen(false); navigate('/search'); }} className="bg-gray-900 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-md cursor-pointer">
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {filteredProducts.map((product, index) => (
                  <React.Fragment key={product?._id || index}>
                    {index > 0 && index % 8 === 0 && <SponsoredBanner index={index} />}
                    {/* 🌟 Pass isSponsored to ProductCard so it can render the badge if needed */}
                    <ProductCard product={product} rate={rate} currencyCode={currencyCode} addToCart={addToCart} isSponsored={product.isSponsored} wishlistProductIds={wishlistProductIds} onQuickView={setQuickViewProduct} />
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <QuickViewModal product={quickViewProduct} isOpen={!!quickViewProduct} onClose={() => setQuickViewProduct(null)} addToCart={addToCart} wishlistProductIds={wishlistProductIds} />
    </div>
  );
};

export default SearchScreen;