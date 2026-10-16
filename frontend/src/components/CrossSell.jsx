import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaChevronLeft, FaChevronRight, FaStar } from 'react-icons/fa';
import { useGetProductsQuery } from '../slices/productsApiSlice';
import { useCart } from '../context/CartContext';
import Rating from './Rating';

const HorizontalScroll = ({ children }) => {
  const scrollRef = React.useRef(null);

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group/scroll">
      <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-zinc-600 hover:text-orange-600 opacity-0 group-hover/scroll:opacity-100 transition-all cursor-pointer -ml-4">
        <FaChevronLeft size={14} />
      </button>
      <div ref={scrollRef} className="flex gap-4 overflow-x-auto scroll-smooth pb-2 scrollbar-hide">
        {children}
      </div>
      <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200 flex items-center justify-center text-zinc-600 hover:text-orange-600 opacity-0 group-hover/scroll:opacity-100 transition-all cursor-pointer -mr-4">
        <FaChevronRight size={14} />
      </button>
    </div>
  );
};

const ProductMiniCard = ({ product, rate, currencyCode, onClick }) => {
  const discount = useMemo(() => {
    if (!product.originalPrice || product.originalPrice <= product.price) return null;
    return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  }, [product]);

  return (
    <Link to={`/product/${product._id}`} onClick={onClick} className="flex-shrink-0 w-[200px] bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 p-3 flex flex-col no-underline group/card">
      <div className="h-32 bg-[#F8F9FA] rounded-lg flex items-center justify-center overflow-hidden mb-2 relative">
        <img src={product.image || '/images/sample.jpg'} alt={product.name} loading="lazy" className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover/card:scale-110" />
        {discount && (
          <span className="absolute top-1 left-1 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-sm">-{discount}%</span>
        )}
      </div>
      <h4 className="text-xs font-bold text-gray-900 line-clamp-2 mb-1 leading-snug min-h-[2rem]">{product.name}</h4>
      <Rating value={product.rating} size="text-[10px]" />
      <div className="mt-auto pt-1">
        <span className="text-xs font-black text-gray-900">{currencyCode} {((product.price || 0) * rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
      </div>
    </Link>
  );
};

const CrossSell = ({ product, title = 'Similar Products', filterFn = null, maxItems = 10, onProductClick }) => {
  const { rate = 1, currencyCode = 'USD' } = useSelector((state) => state.currency);
  const { data: allProducts } = useGetProductsQuery({});

  const recommendations = useMemo(() => {
    if (!allProducts || !product) return [];
    let items = allProducts.filter(p => p && p._id !== product._id && (p.status === 'active' || !p.status));
    if (filterFn) items = items.filter(filterFn);
    if (!filterFn && product.category) {
      const sameCategory = items.filter(p => p.category === product.category);
      if (sameCategory.length >= 4) items = sameCategory;
    }
    return items.slice(0, maxItems);
  }, [allProducts, product, filterFn, maxItems]);

  if (!recommendations.length) return null;

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-black text-gray-900 tracking-tight">{title}</h3>
        <span className="text-xs text-gray-400 font-medium">{recommendations.length} items</span>
      </div>
      <HorizontalScroll>
        {recommendations.map((rec) => (
          <ProductMiniCard key={rec._id} product={rec} rate={rate} currencyCode={currencyCode} onClick={onProductClick} />
        ))}
      </HorizontalScroll>
    </div>
  );
};

const FrequentlyBoughtTogether = ({ product, onProductClick }) => {
  const { rate = 1, currencyCode = 'USD' } = useSelector((state) => state.currency);
  const { data: allProducts } = useGetProductsQuery({});

  const bundle = useMemo(() => {
    if (!allProducts || !product) return [];
    const others = allProducts.filter(p => p && p._id !== product._id && (p.status === 'active' || !p.status));
    const sameCat = others.filter(p => p.category === product.category).slice(0, 2);
    const sameBrand = others.filter(p => p.brand === product.brand && p.category !== product.category).slice(0, 1);
    return [product, ...sameCat, ...sameBrand].slice(0, 4);
  }, [allProducts, product]);

  const total = bundle.reduce((sum, p) => sum + (p.price || 0) * rate, 0);

  if (bundle.length < 2) return null;

  return (
    <div className="py-6 border-t border-gray-200">
      <h3 className="text-lg font-black text-gray-900 tracking-tight mb-4">Frequently Bought Together</h3>
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {bundle.map((p, i) => (
            <React.Fragment key={p._id}>
              <Link to={`/product/${p._id}`} onClick={onProductClick} className="w-24 h-24 bg-[#F8F9FA] rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden no-underline hover:border-orange-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
                <img src={p.image || '/images/sample.jpg'} alt={p.name} loading="lazy" className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-110" />
              </Link>
              {i < bundle.length - 1 && <span className="text-gray-300 text-xl font-bold">+</span>}
            </React.Fragment>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xl font-black text-gray-900">{currencyCode} {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          <span className="text-xs text-gray-500">Total for {bundle.length} items</span>
        </div>
      </div>
    </div>
  );
};

const MoreFromSeller = ({ product, onProductClick }) => {
  const { rate = 1, currencyCode = 'USD' } = useSelector((state) => state.currency);
  const { data: allProducts } = useGetProductsQuery({});

  const sellerProducts = useMemo(() => {
    if (!allProducts || !product?.user?._id) return [];
    return allProducts
      .filter(p => p && p.user?._id === product.user._id && p._id !== product._id && (p.status === 'active' || !p.status))
      .slice(0, 8);
  }, [allProducts, product]);

  if (!sellerProducts.length) return null;

  return (
    <div className="py-6 border-t border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-black text-gray-900 tracking-tight">
          More From {product.user?.vendorProfile?.storeName || 'This Seller'}
        </h3>
      </div>
      <HorizontalScroll>
        {sellerProducts.map((p) => (
          <ProductMiniCard key={p._id} product={p} rate={rate} currencyCode={currencyCode} onClick={onProductClick} />
        ))}
      </HorizontalScroll>
    </div>
  );
};

const CustomersAlsoViewed = ({ product, onProductClick }) => {
  const { rate = 1, currencyCode = 'USD' } = useSelector((state) => state.currency);
  const { data: allProducts } = useGetProductsQuery({});

  const alsoViewed = useMemo(() => {
    if (!allProducts || !product) return [];
    const others = allProducts.filter(p => p && p._id !== product._id && (p.status === 'active' || !p.status));
    const sameCat = others.filter(p => p.category === product.category).slice(0, 6);
    const topRated = others.filter(p => (p.rating || 0) >= 4).slice(0, 4);
    const combined = [...sameCat, ...topRated];
    const unique = combined.filter((p, i, arr) => arr.findIndex(x => x._id === p._id) === i);
    return unique.slice(0, 10);
  }, [allProducts, product]);

  if (!alsoViewed.length) return null;

  return (
    <div className="py-6 border-t border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-black text-gray-900 tracking-tight">Customers Also Viewed</h3>
      </div>
      <HorizontalScroll>
        {alsoViewed.map((p) => (
          <ProductMiniCard key={p._id} product={p} rate={rate} currencyCode={currencyCode} onClick={onProductClick} />
        ))}
      </HorizontalScroll>
    </div>
  );
};

export { CrossSell, FrequentlyBoughtTogether, MoreFromSeller, CustomersAlsoViewed };
export default CrossSell;
