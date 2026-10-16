import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, EffectFade, FreeMode } from 'swiper/modules'; 
import { useGetProductsQuery } from '../slices/productsApiSlice'; 
import { useGetBannersQuery } from '../slices/bannersApiSlice';
import { FaHistory, FaFire, FaStar, FaShoppingCart, FaHeart, FaBox } from 'react-icons/fa';
import Rating from './Rating';
import Button from './Button';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';
import 'swiper/css/free-mode';

const FALLBACK_IMG = 'https://placehold.co/400x400/f5f5f5/999?text=DK-TEC';

const Hero = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);

  const { data: products = [], isLoading: isLoadingProducts, isError } = useGetProductsQuery({});
  const { data: fetchedBanners = [], isLoading: isLoadingBanners } = useGetBannersQuery();
  
  const defaultBanners = [
    {
      _id: 'default-1',
      bgColor: "bg-transparent",
      image: "https://m.media-amazon.com/images/I/71Ie3JXGfVL._SX3000_.jpg", 
      title: "", subTitle: "", ctaText: "", ctaLink: "/products", isActive: true
    },
    {
      _id: 'default-2',
      bgColor: "bg-transparent",
      image: "https://m.media-amazon.com/images/I/61lwJy4B8PL._SX3000_.jpg", 
      title: "", subTitle: "", ctaText: "", ctaLink: "/products", isActive: true
    }
  ];

  const deals = useMemo(() => products.filter(p => p.discountPrice > 0).slice(0, 4), [products]);
  const latest = useMemo(() => [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8), [products]);
  const industrial = useMemo(() => products.filter(p => p.category?.toLowerCase().includes('industrial') || p.category?.toLowerCase().includes('tools')).slice(0, 4), [products]);
  const topRated = useMemo(() => [...products].filter(p => (p.rating || 0) > 0).sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 8), [products]);

  const dbActiveBanners = fetchedBanners.filter(b => b.isActive);
  const activeBanners = dbActiveBanners.length > 0 ? dbActiveBanners : defaultBanners;

  const activeTopCards = useMemo(() => {
    const cards = [];
    if (deals.length > 0) cards.push('deals');
    if (industrial.length > 0) cards.push('industrial');
    if (latest.length > 0) cards.push('latest');
    cards.push('userState');
    return cards;
  }, [deals, industrial, latest]);

  const handleImgError = (e) => {
    if (e.target.src !== FALLBACK_IMG) {
      e.target.src = FALLBACK_IMG;
    }
  };

  if (isLoadingBanners || isLoadingProducts) {
      return (
        <div className="w-full bg-[#E3E6E6] min-h-screen">
          <div className="hidden md:block w-full h-[350px] md:h-[450px] lg:h-[550px] bg-zinc-300 animate-pulse"></div>
          
          <div className="relative z-20 md:-mt-24 lg:-mt-48 xl:-mt-64 px-3 sm:px-4 lg:px-6 max-w-[100rem] mx-auto pt-4 md:pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
               {[1,2,3,4].map(i => (
                 <div key={i} className="h-[400px] bg-white rounded-sm animate-pulse p-5 flex flex-col gap-4 shadow-sm">
                   <div className="h-6 bg-zinc-200 rounded w-3/4"></div>
                   <div className="flex-1 bg-zinc-100 rounded"></div>
                   <div className="h-4 bg-zinc-200 rounded w-1/3 mt-auto"></div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      );
  }

  if (isError) {
    return (
      <div className="w-full bg-[#E3E6E6] min-h-[50vh] flex items-center justify-center">
        <div className="bg-white p-8 rounded shadow-sm text-center">
           <h2 className="text-xl font-bold text-zinc-800 mb-2">Something went wrong</h2>
           <p className="text-zinc-500 mb-4">We couldn't load the content. Please try again.</p>
           <Button onClick={() => window.location.reload()} variant="secondary">Refresh Page</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#E3E6E6] pb-12 font-amazon">
      
      {/* =========================================
          🌟 1. DESKTOP HERO BANNER
          ========================================= */}
      <div className="hidden md:block w-full mx-auto relative overflow-hidden"> 
        <Swiper
          modules={[Navigation, Autoplay, EffectFade]} 
          effect={'fade'}
          fadeEffect={{ crossFade: true }}
          loop={activeBanners.length > 1}
          speed={800}
          navigation={activeBanners.length > 1}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          className="w-full h-[350px] md:h-[450px] lg:h-[550px] xl:h-[650px] 2xl:h-[700px] hero-swiper"
        >
          {activeBanners.map((slide) => {
            const hasText = slide.title || slide.subTitle || slide.ctaText;
            const isPureImage = !hasText && slide.image;

            return (
            <SwiperSlide key={slide._id}>
              {({ isActive }) => (
                <div onClick={() => slide.ctaLink && navigate(slide.ctaLink)} className={`relative h-full w-full flex items-center justify-center cursor-pointer ${isPureImage ? 'bg-transparent' : slide.bgColor || 'bg-gray-900'}`}>
                  {isPureImage ? (
                    <img src={slide.image} alt="Promotional Banner" className={`w-full h-full object-cover object-top transition-transform duration-[6000ms] ${isActive ? 'scale-100' : 'scale-[1.01]'}`} />
                  ) : (
                    <>
                      {slide.image && <div className={`absolute inset-0 bg-cover bg-center transition-transform duration-[6000ms] ${isActive ? 'scale-105' : 'scale-100'} mix-blend-overlay opacity-60`} style={{ backgroundImage: `url('${slide.image}')` }} />}
                      {!slide.image && (
                        <>
                           <div className="absolute left-10 bottom-10 opacity-20 w-[30rem] h-[30rem] bg-white rounded-full blur-3xl pointer-events-none"></div>
                           <div className="absolute right-20 top-10 opacity-30 w-64 h-64 bg-black rounded-lg transform rotate-12 blur-3xl pointer-events-none"></div>
                        </>
                      )}
                      {hasText && (
                        <div className="relative z-10 text-center px-4 max-w-4xl w-full pb-32 lg:pb-40">
                          <h2 className="text-4xl lg:text-6xl font-black text-white mb-2 tracking-tight drop-shadow-lg">{slide.title}</h2>
                          <h3 className="text-2xl lg:text-4xl font-black text-yellow-300 mb-5 tracking-tighter drop-shadow-md">{slide.subTitle}</h3>
                          {slide.ctaLink && slide.ctaText && (
                              <Button onClick={(e) => { e.stopPropagation(); navigate(slide.ctaLink); }} variant="primary" className="rounded-full">
                                {slide.ctaText}
                              </Button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  <div className="absolute bottom-0 left-0 w-full h-[50%] bg-gradient-to-t from-[#E3E6E6] via-[#E3E6E6]/80 to-transparent z-10 pointer-events-none"></div>
                </div>
              )}
            </SwiperSlide>
          )})}
        </Swiper>
      </div>

      {/* =========================================
          🌟 2. MAIN CONTENT GRID (Dynamic Flex Render)
          ========================================= */}
      <div className="relative z-20 md:-mt-24 lg:-mt-48 xl:-mt-64 px-3 sm:px-4 lg:px-6 max-w-[100rem] mx-auto pt-4 md:pt-0">
        
        <div className={`flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 lg:gap-5 mb-5 items-stretch dynamic-card-container cards-count-${activeTopCards.length}`}>
          
          {/* 🌟 Card 1: Today's Deals */}
          {deals.length > 0 && (
            <Link to="/products?discount=true" className="dynamic-card flex-grow bg-white p-4 sm:p-5 flex flex-col min-h-[450px] h-[450px] cursor-pointer hover:shadow-lg transition-shadow rounded-sm z-30 w-full sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)]">
              <h3 className="text-[20px] font-bold text-zinc-900 mb-3 tracking-tight">Today's Deals</h3>
              <div className="grid grid-cols-2 gap-2.5 flex-grow mb-2">
                {deals.slice(0,4).map(product => (
                  <div key={product._id} className="flex flex-col items-start gap-0.5">
                    <div className="w-full aspect-square bg-zinc-50 rounded-sm flex items-center justify-center overflow-hidden relative p-2">
                      <img src={product.image} alt={product.name} className="w-full h-full object-contain hover:scale-105 transition-transform duration-300" loading="lazy" onError={handleImgError} />
                    </div>
                    <span className="text-[11px] text-zinc-700 line-clamp-1 leading-tight font-medium">{product.name}</span>
                    <div className="flex items-center gap-1">
                      <Rating value={product.rating} size="text-[10px]" />
                      {product.numReviews > 0 && <span className="text-[10px] text-[#007185]">({product.numReviews})</span>}
                    </div>
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      {product.discountPrice > 0 ? (
                        <>
                          <span className="text-[13px] font-bold text-zinc-900">${Number(product.discountPrice).toFixed(2)}</span>
                          <span className="text-[10px] text-zinc-400 line-through">${Number(product.price).toFixed(2)}</span>
                        </>
                      ) : (
                        <span className="text-[13px] font-bold text-zinc-900">${Number(product.price).toFixed(2)}</span>
                      )}
                    </div>
                    {product.discountPrice > 0 && (
                      <span className="bg-[#CC0C39] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                        Up to {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% off
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <span className="text-[#007185] hover:text-orange-600 text-[13px] font-medium mt-auto">See all deals</span>
            </Link>
          )}

          {/* 🌟 Card 2: Industrial Equipment */}
          {industrial.length > 0 && (
            <Link to="/products?category=industrial" className="dynamic-card flex-grow bg-white p-4 sm:p-5 flex flex-col min-h-[450px] h-[450px] cursor-pointer hover:shadow-lg transition-shadow rounded-sm z-30 w-full sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)]">
              <h3 className="text-[20px] font-bold text-zinc-900 mb-3 tracking-tight">Industrial Equipment</h3>
              <div className="grid grid-cols-2 gap-2.5 flex-grow mb-2">
                {industrial.slice(0,4).map(product => (
                  <div key={product._id} className="flex flex-col items-start gap-0.5">
                    <div className="w-full aspect-square bg-zinc-50 rounded-sm flex items-center justify-center overflow-hidden relative p-2">
                      <img src={product.image} alt={product.name} className="w-full h-full object-contain hover:scale-105 transition-transform duration-300" loading="lazy" onError={handleImgError} />
                    </div>
                    <span className="text-[11px] text-zinc-700 line-clamp-1 leading-tight font-medium">{product.name}</span>
                    <div className="flex items-center gap-1">
                      <Rating value={product.rating} size="text-[10px]" />
                      {product.numReviews > 0 && <span className="text-[10px] text-[#007185]">({product.numReviews})</span>}
                    </div>
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      {product.discountPrice > 0 ? (
                        <>
                          <span className="text-[13px] font-bold text-zinc-900">${Number(product.discountPrice).toFixed(2)}</span>
                          <span className="text-[10px] text-zinc-400 line-through">${Number(product.price).toFixed(2)}</span>
                        </>
                      ) : (
                        <span className="text-[13px] font-bold text-zinc-900">${Number(product.price).toFixed(2)}</span>
                      )}
                    </div>
                    {product.discountPrice > 0 && (
                      <span className="bg-[#CC0C39] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                        Up to {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% off
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <span className="text-[#007185] hover:text-orange-600 text-[13px] font-medium mt-auto">Explore category</span>
            </Link>
          )}

          {/* 🌟 Card 3: Newest Products */}
          {latest.length > 0 && (
            <Link to="/newest" className="dynamic-card flex-grow bg-white p-4 sm:p-5 flex flex-col min-h-[450px] h-[450px] cursor-pointer hover:shadow-lg transition-shadow rounded-sm z-30 w-full sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)]">
              <h3 className="text-[20px] font-bold text-zinc-900 mb-3 tracking-tight">Newest Products</h3>
              <div className="grid grid-cols-2 gap-2.5 flex-grow mb-2">
                {latest.slice(0,4).map(product => (
                  <div key={product._id} className="flex flex-col items-start gap-0.5">
                    <div className="w-full aspect-square bg-zinc-50 rounded-sm flex items-center justify-center overflow-hidden relative p-2">
                      <img src={product.image} alt={product.name} className="w-full h-full object-contain hover:scale-105 transition-transform duration-300" loading="lazy" onError={handleImgError} />
                    </div>
                    <span className="text-[11px] text-zinc-700 line-clamp-1 leading-tight font-medium">{product.name}</span>
                    <div className="flex items-center gap-1">
                      <Rating value={product.rating} size="text-[10px]" />
                      {product.numReviews > 0 && <span className="text-[10px] text-[#007185]">({product.numReviews})</span>}
                    </div>
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      {product.discountPrice > 0 ? (
                        <>
                          <span className="text-[13px] font-bold text-zinc-900">${Number(product.discountPrice).toFixed(2)}</span>
                          <span className="text-[10px] text-zinc-400 line-through">${Number(product.price).toFixed(2)}</span>
                        </>
                      ) : (
                        <span className="text-[13px] font-bold text-zinc-900">${Number(product.price).toFixed(2)}</span>
                      )}
                    </div>
                    {product.discountPrice > 0 && (
                      <span className="bg-[#CC0C39] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                        Up to {Math.round(((product.price - product.discountPrice) / product.price) * 100)}% off
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <span className="text-[#007185] hover:text-orange-600 text-[13px] font-medium mt-auto">Shop new releases</span>
            </Link>
          )}

          {/* 🌟 Card 4: Welcome Back / Sign In Dashboard */}
          <div className="dynamic-card flex-grow bg-white p-4 sm:p-5 flex flex-col min-h-[450px] h-[450px] rounded-sm z-30 justify-between w-full sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)] hover:shadow-lg transition-shadow">
            {userInfo ? (
              <>
                <div>
                  <h3 className="text-[20px] font-bold text-zinc-900 mb-3 tracking-tight">Welcome back, {userInfo.name.split(' ')[0]}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Link to="/browsing-history" className="flex flex-col items-center justify-center bg-zinc-50 rounded-sm p-2.5 hover:bg-zinc-100 transition-colors gap-1 no-underline text-zinc-700 min-h-[68px]">
                      <FaHistory className="text-zinc-600" size={16} />
                      <span className="text-[10px] font-medium text-center leading-tight">Recently Viewed</span>
                    </Link>
                    <Link to="/newest" className="flex flex-col items-center justify-center bg-zinc-50 rounded-sm p-2.5 hover:bg-zinc-100 transition-colors gap-1 no-underline text-zinc-700 min-h-[68px]">
                      <FaFire className="text-orange-500" size={16} />
                      <span className="text-[10px] font-medium text-center leading-tight">Newest Products</span>
                    </Link>
                    <Link to="/products?sort=rating" className="flex flex-col items-center justify-center bg-zinc-50 rounded-sm p-2.5 hover:bg-zinc-100 transition-colors gap-1 no-underline text-zinc-700 min-h-[68px]">
                      <FaStar className="text-yellow-500" size={16} />
                      <span className="text-[10px] font-medium text-center leading-tight">Recommended</span>
                    </Link>
                    <Link to="/cart" className="flex flex-col items-center justify-center bg-zinc-50 rounded-sm p-2.5 hover:bg-zinc-100 transition-colors gap-1 no-underline text-zinc-700 min-h-[68px]">
                      <FaShoppingCart className="text-zinc-600" size={16} />
                      <span className="text-[10px] font-medium text-center leading-tight">Continue Shopping</span>
                    </Link>
                    <Link to="/wishlist" className="flex flex-col items-center justify-center bg-zinc-50 rounded-sm p-2.5 hover:bg-zinc-100 transition-colors gap-1 no-underline text-zinc-700 min-h-[68px]">
                      <FaHeart className="text-red-400" size={16} />
                      <span className="text-[10px] font-medium text-center leading-tight">Wishlist</span>
                    </Link>
                    <Link to="/orders" className="flex flex-col items-center justify-center bg-zinc-50 rounded-sm p-2.5 hover:bg-zinc-100 transition-colors gap-1 no-underline text-zinc-700 min-h-[68px]">
                      <FaBox className="text-zinc-600" size={16} />
                      <span className="text-[10px] font-medium text-center leading-tight">Your Orders</span>
                    </Link>
                  </div>
                </div>
                <Button onClick={() => navigate('/profile')} variant="secondary" className="mt-3 w-fit">
                  Go to your Account
                </Button>
              </>
            ) : (
              <>
                <div>
                  <h3 className="text-[20px] font-bold text-zinc-900 mb-2 tracking-tight">Sign in for your best experience</h3>
                  <Button onClick={() => navigate('/login')} variant="primary" className="w-full mt-2">
                    Sign in securely
                  </Button>
                  <div className="text-center mt-2">
                    <span className="text-[12px] text-zinc-500">New customer? </span>
                    <Link to="/register" className="text-brand-orange-600 hover:text-orange-800 text-[12px] font-medium">Create your account</Link>
                  </div>
                </div>
                <div className="mt-3 flex-grow bg-zinc-50 rounded-sm flex items-center justify-center overflow-hidden cursor-pointer" onClick={() => navigate('/products')}>
                  <img src="https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80" alt="Promotional" className="w-full h-full object-contain hover:scale-105 transition-transform duration-500" loading="lazy" onError={handleImgError} />
                </div>
              </>
            )}
          </div>

        </div>

        {/* =========================================
            🌟 HORIZONTAL SCROLLING SECTIONS
            ========================================= */}
        
        {/* Horizontal Strip 1: Top Rated */}
        {topRated.length > 0 && (
          <div className="bg-white p-4 sm:p-5 rounded-sm mb-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[20px] font-bold text-zinc-900 tracking-tight">Top Rated Products</h3>
              <Link to="/search?sortBy=rating" className="text-[#007185] hover:text-orange-600 hover:underline text-[13px] font-medium">See more</Link>
            </div>
            
            <Swiper
              modules={[FreeMode, Navigation]}
              freeMode={true}
              slidesPerView={'auto'}
              spaceBetween={16}
              navigation={true}
              className="w-full horizontal-product-swiper"
            >
              {topRated.map((product) => (
                <SwiperSlide key={product._id} className="!w-[140px] sm:!w-[160px] lg:!w-[200px]">
                  <Link to={`/product/${product._id}`} className="flex flex-col items-start cursor-pointer group no-underline text-inherit h-full">
                    <div className="w-full aspect-square bg-zinc-50 mb-2 p-3 flex items-center justify-center rounded overflow-hidden">
                      <img src={product.image} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" loading="lazy" onError={handleImgError} />
                    </div>
                    <span className="text-[13px] sm:text-[14px] text-[#007185] group-hover:text-orange-600 line-clamp-2 leading-tight mb-1">{product.name}</span>
                    <div className="flex items-center gap-1 mt-auto">
                      <span className="text-xs text-yellow-500">★★★★☆</span>
                      <span className="text-[11px] text-[#007185] font-medium">{product.numReviews || 0}</span>
                    </div>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}

        {/* Horizontal Strip 2: Limited Time Deals */}
        {deals.length > 0 && (
          <div className="bg-white p-4 sm:p-5 rounded-sm mb-5 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-[20px] font-bold text-zinc-900 tracking-tight">Limited Time Deals</h3>
              <Link to="/search?keyword=deal" className="text-[#007185] hover:text-orange-600 hover:underline text-[13px] font-medium">View all</Link>
            </div>
            
            <Swiper
              modules={[FreeMode, Navigation]}
              freeMode={true}
              slidesPerView={'auto'}
              spaceBetween={16}
              navigation={true}
              className="w-full horizontal-product-swiper"
            >
              {deals.map((product) => (
                <SwiperSlide key={product._id} className="!w-[140px] sm:!w-[160px] lg:!w-[200px]">
                  <Link to={`/product/${product._id}`} className="flex flex-col items-start cursor-pointer group no-underline text-inherit h-full">
                    <div className="w-full aspect-square bg-zinc-50 mb-2 p-3 flex items-center justify-center rounded overflow-hidden relative">
                      <img src={product.image} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" loading="lazy" onError={handleImgError} />
                      <div className="absolute bottom-2 left-2 bg-[#CC0C39] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-sm">
                        Deal
                      </div>
                    </div>
                  </Link>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}

      </div>

      <style>{`
        .hero-swiper .swiper-button-next, 
        .hero-swiper .swiper-button-prev {
          color: rgba(255, 255, 255, 0.8) !important;
          background: transparent !important;
          width: 40px !important; height: 80px !important; 
          transition: all 0.2s ease; top: 35% !important; 
          text-shadow: 0px 0px 8px rgba(0, 0, 0, 0.8);
          z-index: 40 !important;
        }
        .hero-swiper .swiper-button-next:after, 
        .hero-swiper .swiper-button-prev:after { font-size: 35px !important; font-weight: 200 !important; }
        .hero-swiper .swiper-button-next:hover, .hero-swiper .swiper-button-prev:hover { color: #fff !important; transform: scale(1.1); }
        
        .horizontal-product-swiper .swiper-button-next,
        .horizontal-product-swiper .swiper-button-prev {
          background-color: rgba(255,255,255,0.9) !important;
          color: #333 !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
          border-radius: 4px;
          width: 45px !important;
          height: 90px !important;
          top: 40% !important;
        }
        .horizontal-product-swiper .swiper-button-next:after,
        .horizontal-product-swiper .swiper-button-prev:after {
          font-size: 20px !important;
          font-weight: 900 !important;
        }
        .horizontal-product-swiper .swiper-button-disabled { display: none !important; }
        
        @media (max-width: 768px) {
          .horizontal-product-swiper .swiper-button-next,
          .horizontal-product-swiper .swiper-button-prev { display: none !important; }
        }

        .dynamic-card-container {
          display: flex;
          flex-wrap: wrap;
        }
        .dynamic-card {
          flex: 1 1 auto;
        }
        
        @media (min-width: 1024px) {
          .cards-count-3 .dynamic-card {
            width: calc(33.333% - 14px);
            max-width: calc(33.333% - 14px);
          }
          .cards-count-2 .dynamic-card {
            width: calc(50% - 10px);
            max-width: calc(50% - 10px);
          }
          .cards-count-1 .dynamic-card {
            width: 100%;
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Hero;
