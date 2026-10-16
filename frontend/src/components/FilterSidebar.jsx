import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FaChevronDown, FaTimes } from 'react-icons/fa';

const FilterSidebar = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // الفئات والماركات (ممكن بعدين نجيبهم من الباك إند، بس هنحطهم ثابتين دلوقتي للتجربة)
  const categories = ['Electronics', 'Industrial', 'Tools', 'Safety Gear', 'Accessories'];
  const brands = ['DeWalt', 'Stanley', 'Makita', '3M', 'Bosch'];

  // دالة تحديث الـ URL
  const handleFilterChange = (key, value) => {
    const currentParams = new URLSearchParams(searchParams);
    
    if (value) {
      currentParams.set(key, value);
    } else {
      currentParams.delete(key);
    }
    
    // تصفير الصفحة لرقم 1 عند تغيير أي فلتر
    currentParams.delete('page'); 
    setSearchParams(currentParams);
  };

  // قراءة القيم الحالية لمعرفة الفلتر النشط
  const currentCategory = searchParams.get('category') || '';
  const currentBrand = searchParams.get('brand') || '';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';

  // للتحكم في حقول السعر محلياً قبل الإرسال
  const [minPrice, setMinPrice] = useState(currentMinPrice);
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice);

  const applyPriceFilter = (e) => {
    e.preventDefault();
    const currentParams = new URLSearchParams(searchParams);
    if (minPrice) currentParams.set('minPrice', minPrice);
    else currentParams.delete('minPrice');
    
    if (maxPrice) currentParams.set('maxPrice', maxPrice);
    else currentParams.delete('maxPrice');
    
    currentParams.delete('page');
    setSearchParams(currentParams);
  };

  const clearAllFilters = () => {
    // نحتفظ بكلمة البحث لو موجودة ونمسح الباقي
    const keyword = searchParams.get('keyword');
    if (keyword) {
      setSearchParams({ keyword });
    } else {
      setSearchParams({});
    }
    setMinPrice('');
    setMaxPrice('');
  };

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-black text-zinc-800 uppercase tracking-wider text-sm">Filters</h3>
        {(currentCategory || currentBrand || currentMinPrice || currentMaxPrice) && (
          <button onClick={clearAllFilters} className="text-[10px] text-red-500 font-bold hover:underline flex items-center gap-1">
            <FaTimes size={10} /> CLEAR
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <h4 className="font-bold text-xs text-zinc-600 mb-3 flex justify-between items-center">
          Department <FaChevronDown size={10} className="text-zinc-400" />
        </h4>
        <ul className="space-y-2">
          {categories.map((c) => (
            <li key={c}>
              <button 
                onClick={() => handleFilterChange('category', currentCategory === c ? '' : c)}
                className={`text-xs font-semibold w-full text-left transition-colors ${currentCategory === c ? 'text-orange-600' : 'text-zinc-600 hover:text-orange-500'}`}
              >
                {c}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <hr className="border-zinc-100 mb-6" />

      {/* Brand Filter */}
      <div className="mb-6">
        <h4 className="font-bold text-xs text-zinc-600 mb-3 flex justify-between items-center">
          Brands <FaChevronDown size={10} className="text-zinc-400" />
        </h4>
        <ul className="space-y-2">
          {brands.map((b) => (
            <li key={b} className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id={`brand-${b}`}
                checked={currentBrand === b}
                onChange={() => handleFilterChange('brand', currentBrand === b ? '' : b)}
                className="rounded border-zinc-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
              />
              <label htmlFor={`brand-${b}`} className="text-xs font-semibold text-zinc-600 cursor-pointer hover:text-orange-500">{b}</label>
            </li>
          ))}
        </ul>
      </div>

      <hr className="border-zinc-100 mb-6" />

      {/* Price Filter */}
      <div>
        <h4 className="font-bold text-xs text-zinc-600 mb-3">Price Range</h4>
        <form onSubmit={applyPriceFilter} className="flex items-center gap-2">
          <input 
            type="number" 
            placeholder="Min" 
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full text-xs p-2 border border-zinc-200 rounded-lg outline-none focus:border-orange-500"
          />
          <span className="text-zinc-400">-</span>
          <input 
            type="number" 
            placeholder="Max" 
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full text-xs p-2 border border-zinc-200 rounded-lg outline-none focus:border-orange-500"
          />
          <button type="submit" className="bg-zinc-900 text-white text-xs px-3 py-2 rounded-lg hover:bg-orange-600 transition-colors font-bold">
            Go
          </button>
        </form>
      </div>
    </div>
  );
};

export default FilterSidebar;