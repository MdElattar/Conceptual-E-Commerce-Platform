import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetProductsQuery } from '../slices/productsApiSlice';
import { useCart } from '../context/CartContext';
import { useGetWishlistQuery } from '../slices/wishlistApiSlice';
import Message from '../components/Message';
import { SkeletonCard } from '../components/Skeleton';
import ProductCard from '../components/ProductCard';
import { FaAd } from 'react-icons/fa';

const DepartmentBanner = ({ category }) => {
  return (
    <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-800 text-white p-8 sm:p-12 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6 mb-10 shadow-lg border border-zinc-800 relative overflow-hidden group select-none">
      <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl group-hover:bg-orange-600/20 transition-all duration-500"></div>
      <div className="flex flex-col gap-2 relative z-10">
        <span className="bg-orange-600 text-white text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-widest w-fit flex items-center gap-1">
          <FaAd size={10} /> DK-TEC Official
        </span>
        <h1 className="font-black text-3xl md:text-4xl tracking-tight text-white uppercase">
          {category} Storefront
        </h1>
        <p className="text-sm text-zinc-400 max-w-2xl font-medium leading-relaxed">
          Explore top-tier equipment and verified tools in the {category} division.
        </p>
      </div>
    </div>
  );
};

const CategoryScreen = () => {
  const { category } = useParams(); 
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { currencyCode = 'USD', rate = 1 } = useSelector((state) => state.currency);
  const { userInfo } = useSelector((state) => state.auth);

  const { data: wishlist } = useGetWishlistQuery(undefined, { skip: !userInfo });
  const wishlistProductIds = useMemo(() => {
    if (!wishlist?.products) return [];
    return wishlist.products.map((p) =>
      typeof p.product === 'object' ? p.product._id : p.product
    );
  }, [wishlist]);

  const { data: products, isLoading, error } = useGetProductsQuery({ category });

  const topRated = useMemo(() => {
    if (!products) return [];
    return [...products].filter(p => p.status === 'active' || !p.status).sort((a, b) => b.rating - a.rating).slice(0, 6);
  }, [products]);

  const allCategoryProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => p.status === 'active' || !p.status);
  }, [products]);

  if (error) return <div className="py-10 px-4 max-w-7xl mx-auto"><Message variant='danger'>{error?.data?.message || "Failed loading department"}</Message></div>;

  return (
    <div className="bg-[#fafafa] min-h-[calc(100vh-120px)] antialiased pt-6 pb-20">
      <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8">
        
        <DepartmentBanner category={category} />

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[1,2,3,4,5,6,7,8].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : allCategoryProducts.length === 0 ? (
          <div className="py-24 text-center bg-white border border-gray-200 rounded-xl shadow-sm">
            <h3 className="text-xl font-bold text-gray-900">Department Empty</h3>
            <p className="text-gray-500 text-sm mt-2">No active units deployed here yet.</p>
          </div>
        ) : (
          <div className="space-y-12">
            
            {topRated.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-end mb-6 pb-4 border-b border-gray-100">
                  <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase flex items-center gap-2">
                    Top Rated in {category}
                  </h2>
                </div>
                <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x custom-horizontal-scrollbar">
                  {topRated.map((product) => (
                    <div key={product._id} className="snap-start shrink-0 w-[260px] sm:w-[280px]">
                      <ProductCard product={product} rate={rate} currencyCode={currencyCode} addToCart={addToCart} wishlistProductIds={wishlistProductIds} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-center">
              <button 
                onClick={() => navigate(`/search?category=${category}`)}
                className="bg-gray-900 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-colors shadow-md"
              >
                Open Advanced Search Filters
              </button>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase mb-6">All Arrivals</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {allCategoryProducts.map((product) => (
                  <ProductCard key={product._id} product={product} rate={rate} currencyCode={currencyCode} addToCart={addToCart} />
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
      <style jsx>{`
        .custom-horizontal-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-horizontal-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .custom-horizontal-scrollbar::-webkit-scrollbar-thumb { background: #d4d4d8; border-radius: 10px; }
        .custom-horizontal-scrollbar::-webkit-scrollbar-thumb:hover { background: #ea580c; }
      `}</style>
    </div>
  );
};

export default CategoryScreen;