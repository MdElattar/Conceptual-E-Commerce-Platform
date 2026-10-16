import { useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useGetProductsQuery, useGetRecommendationsQuery } from '../../slices/productsApiSlice';
import { useGetRecentlyViewedQuery } from '../../slices/recentlyViewedApiSlice';
import { useCart } from '../../context/CartContext';
import { useGetWishlistQuery } from '../../slices/wishlistApiSlice';
import Button from '../Button';
import HeroBanner from './HeroBanner';
import WelcomeCard from './WelcomeCard';
import ProductShelf from './ProductShelf';

const brandLogos = [
  { name: 'Siemens', color: 'bg-green-600' },
  { name: 'Bosch', color: 'bg-red-600' },
  { name: 'ABB', color: 'bg-blue-700' },
  { name: 'Schneider', color: 'bg-yellow-500' },
  { name: 'Honeywell', color: 'bg-orange-500' },
  { name: 'Mitsubishi', color: 'bg-red-700' },
];

const HomePage = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const { rate, currencyCode } = useSelector((state) => state.currency);
  const { addToCart, cartItems } = useCart();

  const { data: newest = [], isLoading: isLoadingNewest, isError: isErrorNewest } = useGetProductsQuery({ inStock: 'true', limit: 20 });
  const { data: bestSellers = [], isLoading: isLoadingBestSellers, isError: isErrorBestSellers } = useGetProductsQuery({ sortBy: 'sales', inStock: 'true', limit: 20 });
  const { data: topRated = [], isLoading: isLoadingTopRated, isError: isErrorTopRated } = useGetProductsQuery({ sortBy: 'rating', minReviews: '3', inStock: 'true', limit: 20 });
  const { data: trending = [], isLoading: isLoadingTrending, isError: isErrorTrending } = useGetProductsQuery({ sortBy: 'trending', inStock: 'true', limit: 20 });
  const { data: allProducts = [], isLoading: isLoadingAll, isError: isErrorAll } = useGetProductsQuery({ inStock: 'true', limit: 50 });
  const { data: recommended = [], isLoading: isLoadingRecommended, isError: isErrorRecommended } = useGetRecommendationsQuery({ type: 'personalized', limit: 20 }, { skip: !userInfo });

  const { data: wishlistData } = useGetWishlistQuery(undefined, { skip: !userInfo });
  const { data: recentlyViewedData } = useGetRecentlyViewedQuery(undefined, { skip: !userInfo });

  const wishlistProductIds = useMemo(() => {
    if (!wishlistData?.products) return [];
    return wishlistData.products.map(item => item.product?._id).filter(Boolean);
  }, [wishlistData]);

  const recentlyViewed = useMemo(() => {
    if (!recentlyViewedData?.products) return [];
    return recentlyViewedData.products.slice(0, 6).map(item => {
      if (item.product && typeof item.product === 'object') {
        return { ...item.product, viewedAt: item.viewedAt };
      }
      return {
        _id: item.product || '',
        image: item.productImage || '',
        name: item.productName || '',
        price: item.productPrice || 0,
        viewedAt: item.viewedAt,
      };
    });
  }, [recentlyViewedData]);

  const deals = useMemo(() => {
    if (!allProducts) return [];
    return allProducts.filter(p => p.originalPrice > p.price);
  }, [allProducts]);

  const categories = useMemo(() => {
    if (!allProducts) return [];
    const cats = new Set();
    allProducts.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).slice(0, 8);
  }, [allProducts]);

  const handleAddToCart = useCallback((product) => {
    addToCart(product);
  }, [addToCart]);

  const shelfProps = useMemo(() => ({
    rate,
    currencyCode,
    onAddToCart: handleAddToCart,
    wishlistProductIds,
  }), [rate, currencyCode, handleAddToCart, wishlistProductIds]);

  return (
    <div className="min-h-screen bg-[#E3E6E6]">
      <HeroBanner />

      <div className="max-w-[100rem] mx-auto px-2 sm:px-3 md:px-4 lg:px-6 pb-8 space-y-3 md:space-y-5 -mt-2 relative z-10">
        <WelcomeCard userInfo={userInfo} />

        {!isErrorNewest && !isLoadingNewest && newest.length > 0 && (
          <ProductShelf
            title="Newest Products"
            linkText="See all"
            linkTo="/newest"
            products={newest}
            id="newest"
            {...shelfProps}
          />
        )}
        {isLoadingNewest && (
          <ProductShelf title="Newest Products" isLoading={true} id="newest-skeleton" {...shelfProps} />
        )}

        {!isErrorBestSellers && !isLoadingBestSellers && bestSellers.length > 0 && (
          <ProductShelf
            title="Best Sellers"
            linkText="See all"
            linkTo="/products?sort=sales"
            products={bestSellers}
            id="bestSellers"
            {...shelfProps}
          />
        )}
        {isLoadingBestSellers && (
          <ProductShelf title="Best Sellers" isLoading={true} id="bestSellers-skeleton" {...shelfProps} />
        )}

        {!isErrorTopRated && !isLoadingTopRated && topRated.length > 0 && (
          <ProductShelf
            title="Top Rated"
            linkText="See all"
            linkTo="/products?sortBy=rating"
            products={topRated}
            id="topRated"
            {...shelfProps}
          />
        )}
        {isLoadingTopRated && (
          <ProductShelf title="Top Rated" isLoading={true} id="topRated-skeleton" {...shelfProps} />
        )}

        {!isErrorTrending && !isLoadingTrending && trending.length > 0 && (
          <ProductShelf
            title="Trending Now"
            linkText="See all"
            linkTo="/products?sort=trending"
            products={trending}
            id="trending"
            {...shelfProps}
          />
        )}
        {isLoadingTrending && (
          <ProductShelf title="Trending Now" isLoading={true} id="trending-skeleton" {...shelfProps} />
        )}

        {!isErrorAll && !isLoadingAll && deals.length > 0 && (
          <ProductShelf
            title="Today's Deals"
            linkText="View all"
            linkTo="/products?discount=true"
            products={deals}
            id="deals"
            {...shelfProps}
          />
        )}
        {isLoadingAll && (
          <ProductShelf title="Today's Deals" isLoading={true} id="deals-skeleton" {...shelfProps} />
        )}

        {userInfo && !isErrorRecommended && !isLoadingRecommended && recommended.length > 0 && (
          <ProductShelf
            title="Recommended For You"
            linkText="See all"
            linkTo="/products?sortBy=rating"
            products={recommended}
            id="recommended"
            {...shelfProps}
          />
        )}
        {userInfo && isLoadingRecommended && (
          <ProductShelf title="Recommended For You" isLoading={true} id="recommended-skeleton" {...shelfProps} />
        )}

        <section className="bg-white rounded-xl border border-zinc-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-3 md:p-5">
          <h2 className="text-base md:text-lg font-extrabold text-zinc-900 mb-4 tracking-tight">Featured Brands</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {brandLogos.map((brand, idx) => (
              <div
                key={idx}
                className="flex items-center justify-center h-20 bg-zinc-50 rounded-lg border border-zinc-200 hover:shadow-sm transition-shadow"
              >
                <div className={`w-10 h-10 ${brand.color} rounded-full opacity-80`} />
                <span className="text-xs font-bold text-zinc-500 ml-2">{brand.name}</span>
              </div>
            ))}
          </div>
        </section>

        {userInfo && recentlyViewed.length > 0 && (
          <ProductShelf
            title="Recently Viewed"
            linkText="View all"
            linkTo="/browsing-history"
            products={recentlyViewed}
            id="recentlyViewed"
            {...shelfProps}
          />
        )}

        {categories.length > 0 && (
          <section className="bg-white rounded-xl border border-zinc-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-3 md:p-5">
            <h2 className="text-base md:text-lg font-extrabold text-zinc-900 mb-4 tracking-tight">More Categories</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {categories.map((cat, idx) => (
                <Link
                  key={idx}
                  to={`/department/${encodeURIComponent(cat)}`}
                  className="flex items-center justify-center h-16 bg-zinc-50 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:border-[#007185] transition-all no-underline"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </section>
        )}

        {cartItems && cartItems.length > 0 && (
          <div className="text-center">
            <Button to="/cart" variant="action" size="lg">
              Continue Shopping ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
