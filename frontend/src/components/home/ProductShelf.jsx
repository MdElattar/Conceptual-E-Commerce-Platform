import { useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import HomeProductCard from './HomeProductCard';

import 'swiper/css';
import 'swiper/css/navigation';

const SkeletonCard = () => (
  <div className="w-full max-w-[220px] min-w-[180px] h-[380px] bg-white rounded-xl border border-zinc-100/80 animate-pulse flex flex-col overflow-hidden">
    <div className="h-[180px] w-full bg-zinc-200" />
    <div className="flex-1 p-2.5 flex flex-col gap-2">
      <div className="h-4 bg-zinc-200 rounded w-3/4" />
      <div className="h-3 bg-zinc-200 rounded w-1/2" />
      <div className="h-3 bg-zinc-200 rounded w-1/3" />
      <div className="h-5 bg-zinc-200 rounded w-1/4 mt-auto" />
      <div className="h-8 bg-zinc-200 rounded w-full" />
    </div>
  </div>
);

const ProductShelf = ({
  title,
  linkText,
  linkTo,
  products = [],
  isLoading,
  rate,
  currencyCode,
  onAddToCart,
  wishlistProductIds,
  isSponsored,
  id,
}) => {
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  const onSwiperInit = useCallback((swiper) => {
    if (swiper.params && swiper.params.navigation) {
      swiper.params.navigation.prevEl = prevRef.current;
      swiper.params.navigation.nextEl = nextRef.current;
      swiper.navigation.destroy();
      swiper.navigation.init();
      swiper.navigation.update();
    }
  }, []);

  return (
    <section className="bg-white rounded-xl border border-zinc-100/80 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-3 md:p-5 relative group">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base md:text-lg font-extrabold text-zinc-900 tracking-tight">{title}</h2>
        {linkText && linkTo && (
          <Link
            to={linkTo}
            className="text-[13px] font-bold text-brand-orange-600 hover:text-orange-800 hover:underline"
          >
            {linkText}
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="min-w-[180px] w-[180px]">
              <SkeletonCard />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-10 text-zinc-500 text-sm">
          No products available
        </div>
      ) : (
        <div className="relative">
          <button
            ref={prevRef}
            className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 hover:bg-white shadow-md rounded-r-lg flex items-center justify-center text-zinc-700 hover:text-zinc-900 transition-all opacity-0 group-hover:opacity-100 border-0 cursor-pointer"
          >
            <FaChevronLeft size={16} />
          </button>

          <Swiper
            modules={[Navigation]}
            navigation={{
              prevEl: prevRef.current,
              nextEl: nextRef.current,
            }}
            onInit={onSwiperInit}
            spaceBetween={16}
            slidesPerView={'auto'}
            breakpoints={{
              320: { slidesPerView: 1.5, spaceBetween: 10 },
              480: { slidesPerView: 2, spaceBetween: 12 },
              640: { slidesPerView: 2.5, spaceBetween: 14 },
              768: { slidesPerView: 3, spaceBetween: 14 },
              1024: { slidesPerView: 4, spaceBetween: 16 },
              1280: { slidesPerView: 5, spaceBetween: 16 },
              1536: { slidesPerView: 6, spaceBetween: 16 },
            }}
            className="pb-2"
            id={id}
          >
            {products.map((product, idx) => (
              <SwiperSlide key={`${product._id}-${idx}`} className="h-auto" style={{ width: 'auto' }}>
                <div className="w-[180px] lg:w-[200px]">
                  <HomeProductCard
                    product={product}
                    rate={rate}
                    currencyCode={currencyCode}
                    onAddToCart={onAddToCart}
                    wishlistProductIds={wishlistProductIds}
                    isSponsored={isSponsored}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          <button
            ref={nextRef}
            className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 hover:bg-white shadow-md rounded-l-lg flex items-center justify-center text-zinc-700 hover:text-zinc-900 transition-all opacity-0 group-hover:opacity-100 border-0 cursor-pointer"
          >
            <FaChevronRight size={16} />
          </button>
        </div>
      )}
    </section>
  );
};

export default ProductShelf;
