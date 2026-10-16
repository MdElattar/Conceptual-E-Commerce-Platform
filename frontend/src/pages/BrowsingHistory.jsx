import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaClock, FaTrash, FaEye, FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useGetRecentlyViewedQuery, useClearRecentlyViewedMutation } from '../slices/recentlyViewedApiSlice';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import Rating from '../components/Rating';
import ErrorDisplay from '../components/ErrorDisplay';

const STORAGE_KEY = 'dk_tec_recently_viewed';
const MAX_ITEMS = 50;

const BrowsingHistory = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const { currencyCode = 'USD', rate = 1 } = useSelector((state) => state.currency);

  const { data: backendData, isLoading, isError, error } = useGetRecentlyViewedQuery(undefined, { skip: !userInfo });
  const [clearHistory] = useClearRecentlyViewedMutation();

  const [localItems, setLocalItems] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      return [];
    }
  });

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
    if (window.confirm('Clear your entire browsing history?')) {
      if (userInfo) {
        try {
          await clearHistory().unwrap();
          toast.success('Browsing history cleared');
        } catch {
          toast.error('Failed to clear history');
        }
      } else {
        localStorage.removeItem(STORAGE_KEY);
        setLocalItems([]);
        toast.success('Browsing history cleared');
      }
    }
  };

  const formatPrice = (v) => (v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/" className="text-sm text-brand-orange-600 hover:text-orange-800 hover:underline flex items-center gap-1 mb-2">
              <FaArrowLeft size={12} /> Continue shopping
            </Link>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <FaEye className="text-orange-600" />
              Browsing History <span className="text-orange-600 text-xl">({items.length})</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">Products you have recently viewed</p>
          </div>
          {items.length > 0 && (
            <Button onClick={handleClear} variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
              <FaTrash size={12} /> Clear all
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
          </div>
        ) : isError ? (
          <ErrorDisplay message={error?.data?.message || 'Failed to load browsing history'} variant="danger" />
        ) : items.length === 0 ? (
          <EmptyState icon={FaClock} title="No browsing history yet" message="Products you view will appear here" actionTo="/" actionLabel="Browse Products" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {items.map((item) => {
              const product = item.product || {};
              const prodId = typeof product === 'object' ? product._id : item.product;
              const prodImage = product.image || item.productImage || '';
              const prodName = product.name || item.productName || '';
              const prodPrice = product.price || item.productPrice || 0;
              const prodRating = product.rating || 0;
              const prodReviews = product.numReviews || 0;

              return (
                <div key={prodId} className="bg-white rounded-lg border border-zinc-200 overflow-hidden hover:shadow-lg transition-shadow group">
                  <Link to={`/product/${prodId}`} className="block relative h-48 bg-[#F8F9FA] p-4 flex items-center justify-center">
                    <img
                      src={prodImage || 'https://placehold.co/400x400/111/fff?text=DK-TEC'}
                      alt={prodName}
                      className="w-full h-full object-contain mix-blend-multiply transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  </Link>
                  <div className="p-4">
                    <Link to={`/product/${prodId}`} className="no-underline">
                      <h3 className="text-sm font-bold text-gray-900 line-clamp-2 hover:text-orange-600 h-10">{prodName}</h3>
                    </Link>
                    {prodRating > 0 && <Rating value={prodRating} text={prodReviews} />}
                    <div className="mt-2 flex items-center gap-1">
                      <span className="text-xs font-black text-gray-900">{currencyCode}</span>
                      <span className="text-xl font-black text-gray-900">
                        {formatPrice(prodPrice * rate)}
                      </span>
                    </div>
                    <Button to={`/product/${prodId}`} variant="dark" size="sm" className="w-full rounded-full">
                      <FaEye size={12} /> View Product
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowsingHistory;
