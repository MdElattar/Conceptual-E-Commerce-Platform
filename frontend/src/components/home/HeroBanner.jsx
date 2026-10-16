import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import { useGetBannersQuery } from '../../slices/bannersApiSlice';
import { FaFire, FaCogs, FaTruck, FaHeadset } from 'react-icons/fa';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

const FALLBACK_IMG = 'https://placehold.co/400x400/f5f5f5/999?text=DK-TEC';

const defaultBanners = [
  {
    _id: 'default-1',
    image: "https://m.media-amazon.com/images/I/71Ie3JXGfVL._SX3000_.jpg",
    title: "", subTitle: "", ctaText: "", ctaLink: "/products", isActive: true
  },
  {
    _id: 'default-2',
    image: "https://m.media-amazon.com/images/I/61lwJy4B8PL._SX3000_.jpg",
    title: "", subTitle: "", ctaText: "", ctaLink: "/products", isActive: true
  }
];

const miniCards = [
  { icon: FaFire, label: "Today's Deals", link: "/products?discount=true" },
  { icon: FaCogs, label: "Industrial Equipment", link: "/products?category=Industrial" },
  { icon: FaTruck, label: "Free Shipping", link: "/products" },
  { icon: FaHeadset, label: "Support 24/7", link: "/contact" },
];

const HeroBanner = () => {
  const { data: fetchedBanners = [], isLoading: isLoadingBanners } = useGetBannersQuery();

  const dbActiveBanners = fetchedBanners.filter(b => b.isActive);
  const activeBanners = dbActiveBanners.length > 0 ? dbActiveBanners : defaultBanners;

  const handleImgError = (e) => {
    if (e.target.src !== FALLBACK_IMG) {
      e.target.src = FALLBACK_IMG;
    }
  };

  if (isLoadingBanners) {
    return (
      <div className="hidden md:block w-full bg-[#E3E6E6]">
        <div className="h-[480px] bg-zinc-200 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="hidden md:block w-full bg-[#E3E6E6]">
      <div className="relative w-full mx-auto overflow-hidden">
        <Swiper
          modules={[Navigation, Pagination, Autoplay, EffectFade]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          loop={activeBanners.length > 1}
          speed={800}
          navigation={activeBanners.length > 1}
          pagination={{ clickable: true }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          className="hero-banner-swiper w-full h-[280px] md:h-[380px] lg:h-[480px]"
        >
          {activeBanners.map((slide) => (
            <SwiperSlide key={slide._id}>
              <Link
                to={slide.ctaLink || '/products'}
                className="relative block w-full h-full"
              >
                {slide.image ? (
                  <img
                    src={slide.image}
                    alt={slide.title || 'Promotional Banner'}
                    className="w-full h-full object-cover object-center"
                    loading="lazy"
                    onError={handleImgError}
                  />
                ) : (
                  <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                    <span className="text-white text-2xl font-bold">{slide.title || 'DK-TEC'}</span>
                  </div>
                )}
                {slide.title && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <div className="text-center text-white px-4">
                      <h2 className="text-3xl md:text-5xl font-bold mb-2">{slide.title}</h2>
                      {slide.subTitle && <p className="text-lg md:text-2xl mb-4">{slide.subTitle}</p>}
                      {slide.ctaText && (
                        <span className="inline-block bg-white text-zinc-900 px-6 py-2 rounded-full font-bold text-sm hover:bg-zinc-100 transition">
                          {slide.ctaText}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-b from-transparent via-transparent to-[#E3E6E6] pointer-events-none" />
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <div className="max-w-[100rem] mx-auto px-3 sm:px-4 lg:px-6 -mt-8 md:-mt-16 relative z-20 pb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {miniCards.map((card, idx) => (
            <Link
              key={idx}
              to={card.link}
              className="flex items-center gap-3 bg-white rounded-lg p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow border border-zinc-100"
            >
              <div className="w-10 h-10 bg-zinc-50 rounded-full flex items-center justify-center shrink-0">
                <card.icon className="text-zinc-600" size={18} />
              </div>
              <span className="text-sm font-medium text-zinc-800">{card.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        .hero-banner-swiper .swiper-button-next,
        .hero-banner-swiper .swiper-button-prev {
          color: rgba(255,255,255,0.9) !important;
          background: rgba(0,0,0,0.3) !important;
          width: 40px !important;
          height: 80px !important;
          border-radius: 4px !important;
          transition: all 0.2s ease;
          top: 40% !important;
        }
        .hero-banner-swiper .swiper-button-next:hover,
        .hero-banner-swiper .swiper-button-prev:hover {
          background: rgba(0,0,0,0.5) !important;
        }
        .hero-banner-swiper .swiper-button-next:after,
        .hero-banner-swiper .swiper-button-prev:after {
          font-size: 24px !important;
          font-weight: 700 !important;
        }
        .hero-banner-swiper .swiper-pagination-bullet {
          background: #fff !important;
          opacity: 0.6 !important;
        }
        .hero-banner-swiper .swiper-pagination-bullet-active {
          opacity: 1 !important;
        }
        @media (max-width: 768px) {
          .hero-banner-swiper .swiper-button-next,
          .hero-banner-swiper .swiper-button-prev {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default HeroBanner;