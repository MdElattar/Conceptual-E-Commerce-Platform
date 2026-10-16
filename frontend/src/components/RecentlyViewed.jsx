import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaClock, FaTrash, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Button from './Button';
import { useGetRecentlyViewedQuery, useClearRecentlyViewedMutation } from '../slices/recentlyViewedApiSlice';

const STORAGE_KEY = 'dk_tec_recently_viewed';
const MAX_ITEMS = 20;

const RecentlyViewed = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const { rate = 1, currencyCode = 'USD' } = useSelector((state) => state.currency);

  const { data: backendData } = useGetRecentlyViewedQuery(undefined, { skip: !userInfo });
  const [clearHistory] = useClearRecentlyViewedMutation();

  const [localItems, setLocalItems] = useState([]);

  useEffect(() => {
    if (!userInfo) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) setLocalItems(JSON.parse(stored));
      } catch {}
    }
  }, [userInfo]);

  const items = useMemo(() => {
    if (userInfo && backendData?.products) {
      return backendData.products
        .filter(p => p.product)
        .slice(0, MAX_ITEMS);
    }
    if (!userInfo) return localItems.slice(0, MAX_ITEMS);
    return [];
  }, [userInfo, backendData, localItems]);

  const handleClear = async () => {
    if (userInfo) {
      try { await clearHistory().unwrap(); } catch {}
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setLocalItems([]);
    }
  };

  if (!items.length) return null;

  const scroll = (dir) => {
    const container = document.querySelector('.recently-viewed-scroll');
    if (container) {
      container.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
    }
  };

  const formatPrice = (v) => (v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="py-6 border-t border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FaClock className="text-gray-500" size={16} />
          <h3 className="text-lg font-black text-gray-900 tracking-tight">Recently Viewed</h3>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleClear} variant="ghost" size="sm">
            <FaTrash size={10} /> Clear
          </Button>
          <span className="text-xs text-gray-400 font-medium">{items.length} items</span>
        </div>
      </div>

      <div className="relative group/scroll">
        <button
          onClick={() => scroll('left')}
          className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-zinc-600 hover:text-orange-600 opacity-0 group-hover/scroll:opacity-100 transition-all cursor-pointer"
          aria-label="Scroll left"
        >
          <FaChevronLeft size={12} />
        </button>

        <div className="flex gap-3 overflow-x-auto scroll-smooth pb-2 recently-viewed-scroll scrollbar-hide">
          {items.map((item) => {
            const product = item.product || {};
            const prodId = typeof product === 'object' ? product._id : item.product;
            const prodImage = product.image || item.productImage || '';
            const prodName = product.name || item.productName || '';
            const prodPrice = product.price || item.productPrice || 0;

            return (
              <Link
                key={prodId}
                to={`/product/${prodId}`}
                className="flex-shrink-0 w-[160px] sm:w-[180px] bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 p-2.5 flex flex-col no-underline group/card"
              >
                <div className="h-28 bg-[#F8F9FA] rounded-lg flex items-center justify-center overflow-hidden mb-2 relative">
                  <img
                    src={prodImage || '/images/sample.jpg'}
                    alt={prodName}
                    className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover/card:scale-110"
                    loading="lazy"
                  />
                </div>
                <h4 className="text-[11px] font-bold text-gray-900 line-clamp-2 mb-1 leading-snug min-h-[2rem] group-hover/card:text-orange-600 transition-colors">
                  {prodName}
                </h4>
                {item.vendorName && (
                  <span className="text-[9px] text-gray-400 font-medium truncate mb-1">{item.vendorName}</span>
                )}
                <div className="mt-auto pt-1">
                  <span className="text-xs font-black text-gray-900">{currencyCode} {formatPrice(prodPrice * rate)}</span>
                </div>
              </Link>
            );
          })}
        </div>

        <button
          onClick={() => scroll('right')}
          className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-zinc-600 hover:text-orange-600 opacity-0 group-hover/scroll:opacity-100 transition-all cursor-pointer"
          aria-label="Scroll right"
        >
          <FaChevronRight size={12} />
        </button>
      </div>
    </div>
  );
};

export default RecentlyViewed;
