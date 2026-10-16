import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { formatCurrency } from '../utils/currencies';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/navigation';

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const { currencyCode, rate } = useSelector((state) => state.currency);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fetch all active products
        const { data } = await axios.get('/api/products'); 
        setProducts(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching featured products", error);
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center py-20 bg-[#E3E6E6]">
      <div className="text-sm font-black animate-pulse text-gray-400 tracking-widest uppercase">Loading Marketplace...</div>
    </div>
  );

  // 🌟 Slice and dice the products array to simulate different Amazon departments
  const sponsoredProducts = products.filter(p => p.isSponsored === true).slice(0, 10);
  const dealProducts = products.filter(p => p.discountPrice > 0).slice(0, 12);
  
  // Mix it up for the category grids with deduplication
  const categoryGrid1 = products.slice(0, 4);
  const usedIds1 = new Set(categoryGrid1.map(p => p._id));
  const remaining2 = products.filter(p => !usedIds1.has(p._id));
  const categoryGrid2 = remaining2.slice(0, 4);
  const usedIds2 = new Set([...usedIds1, ...categoryGrid2.map(p => p._id)]);
  const remaining3 = products.filter(p => !usedIds2.has(p._id));
  const categoryGrid3 = remaining3.slice(0, 4);

  return (
    <div className="bg-[#E3E6E6] pb-12 pt-4">
      <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* 🌟 1. SPONSORED PRODUCTS RAIL */}
        {sponsoredProducts.length > 0 && (
            <ProductRail 
               title={<>Sponsored Deals <span className="text-[13px] text-gray-500 font-normal ml-2">Top promoted items</span></>}
               products={sponsoredProducts} 
               rate={rate} currencyCode={currencyCode} 
               isSponsored={true}
            />
        )}

        {/* 🌟 2. CATEGORY MULTI-GRID (Everyday Essentials, etc.) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Category4Grid title="Everyday Essentials" products={categoryGrid1} rate={rate} currencyCode={currencyCode} />
           <Category4Grid title="Industrial Starting at $199" products={categoryGrid2} rate={rate} currencyCode={currencyCode} />
           <Category4Grid title="Top picks for you" products={categoryGrid3} rate={rate} currencyCode={currencyCode} />
        </section>

        {/* 🌟 3. DEALS RAIL */}
        {dealProducts.length > 0 && (
            <ProductRail 
               title="Welcome Deals | Below $499 👋" 
               linkText="Shop now"
               products={dealProducts} 
               rate={rate} currencyCode={currencyCode} 
            />
        )}

        {/* 🌟 4. ANOTHER RAIL (Simulating continuous browsing) */}
        {products.length > 0 && (
            <ProductRail 
               title="Industrial & Scientific" 
               linkText="Shop now"
               products={products.slice(0, 15)} 
               rate={rate} currencyCode={currencyCode} 
               hideDetails={true} // Amazon often shows just images for sub-categories
            />
        )}

      </div>

      <style>{`
        /* Amazon Style Rail Arrows - Centered and Transparent */
        .rail-swiper .swiper-button-next, 
        .rail-swiper .swiper-button-prev {
          color: #333 !important;
          background: rgba(255, 255, 255, 0.95);
          width: 45px !important;
          height: 100px !important;
          border-radius: 4px;
          border: 1px solid #ddd;
          box-shadow: 0 2px 5px rgba(0,0,0,0.15);
          top: 40%;
        }
        .rail-swiper .swiper-button-next.swiper-button-disabled,
        .rail-swiper .swiper-button-prev.swiper-button-disabled {
          opacity: 0; 
        }
        .rail-swiper .swiper-button-next:after, 
        .rail-swiper .swiper-button-prev:after {
          font-size: 20px !important;
          font-weight: 900;
        }
      `}</style>
    </div>
  );
};

// ==========================================
// 🌟 Product Rail Component (Horizontal Slider)
// ==========================================
const ProductRail = ({ title, linkText, products, rate, currencyCode, isSponsored, hideDetails }) => {
    return (
        <section className="bg-white p-4 md:p-6 rounded-sm shadow-sm border border-gray-200">
            <div className="flex items-end gap-4 mb-4">
                <h2 className="text-[20px] font-bold text-gray-900 tracking-tight">
                    {title}
                </h2>
                {linkText && (
                    <Link to="/products" className="text-[13px] font-medium text-[#007185] hover:text-red-700 hover:underline transition-all pb-0.5">
                    {linkText}
                    </Link>
                )}
            </div>
            
            <Swiper
                modules={[Navigation]}
                navigation={true}
                spaceBetween={16}
                slidesPerView={2}
                breakpoints={{
                    640: { slidesPerView: 3 },
                    768: { slidesPerView: 4 },
                    1024: { slidesPerView: 5 },
                    1280: { slidesPerView: 6 },
                }}
                className="rail-swiper pb-2"
            >
                {products.map((product, idx) => (
                    // Adding a composite key just in case we are reusing the same product array slices
                    <SwiperSlide key={`${product._id}-${idx}`} className="h-auto">
                        <ProductMinimalCard product={product} isSponsored={isSponsored} rate={rate} currencyCode={currencyCode} hideDetails={hideDetails} />
                    </SwiperSlide>
                ))}
            </Swiper>
        </section>
    );
};

// ==========================================
// 🌟 Category 4-Grid Component (Square Grid)
// ==========================================
const Category4Grid = ({ title, products }) => {
  return (
    <div className="bg-white p-5 rounded-sm shadow-sm border border-gray-200 flex flex-col h-full">
      <h3 className="text-[20px] font-bold text-gray-900 mb-4 leading-tight">{title}</h3>
      <div className="grid grid-cols-2 gap-4 flex-grow mb-4">
          {products.map((product, idx) => (
             <Link key={idx} to={`/product/${product._id}`} className="group flex flex-col items-center">
                <div className="w-full aspect-square bg-[#F8F9FA] rounded mb-1 flex items-center justify-center p-2">
                    <img src={product.image} alt={product.name} loading="lazy" className="w-full h-full object-contain mix-blend-multiply" />
                </div>
                <span className="text-[12px] text-gray-700 line-clamp-1 group-hover:text-[#007185]">{product.name}</span>
             </Link>
          ))}
      </div>
      <Link to="/products" className="text-[#007185] hover:text-red-700 hover:underline text-[13px] font-medium mt-auto">Shop now</Link>
    </div>
  );
};

// ==========================================
// 🌟 Reusable Minimal Card (Amazon Style)
// ==========================================
const ProductMinimalCard = ({ product, isSponsored, rate, currencyCode, hideDetails }) => {
  return (
    <div className="bg-white flex flex-col h-full relative group">
      
      {isSponsored && (
        <span className="text-[11px] text-gray-500 mb-1 px-1">Sponsored</span>
      )}

      <Link to={`/product/${product._id}`} className="relative h-48 bg-[#F8F9FA] p-2 flex items-center justify-center overflow-hidden shrink-0 rounded border border-gray-100 mb-2">
        <img src={product.image} alt={product.name} loading="lazy" className="w-full h-full object-contain mix-blend-multiply" />
      </Link>

      {!hideDetails && (
        <div className="flex flex-col flex-grow px-1">
          {product.discountPrice > 0 && (
             <div className="flex items-center gap-2 mb-1 mt-1">
                 <span className="bg-[#CC0C39] text-white text-[11px] font-bold px-2 py-1 rounded-sm shadow-sm">
                      Up to {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% off
                 </span>
                 <span className="text-[#CC0C39] text-[11px] font-bold">Deal</span>
             </div>
          )}

          <Link to={`/product/${product._id}`} className="no-underline mt-1">
            <h3 className="text-[14px] font-medium text-[#007185] line-clamp-2 hover:text-red-700 hover:underline leading-snug">
              {product.name}
            </h3>
          </Link>
          
          <div className="mt-1 flex items-baseline gap-1">
              <span className="text-xs font-medium text-gray-900 mb-1">{currencyCode}</span>
              <span className="text-xl font-bold text-gray-900 tracking-tight">
                {((product.price) * rate).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
              </span>
              {product.discountPrice > 0 && (
                  <span className="ml-1 text-xs text-gray-500 line-through">
                      {formatCurrency((product.price + product.discountPrice) * rate, currencyCode)}
                  </span>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeaturedProducts;