import { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { FaStore, FaStar, FaChevronRight, FaTruck, FaShieldAlt, FaCheckCircle } from 'react-icons/fa';
import { useGetPublicVendorProfileQuery } from '../slices/usersApiSlice';
import { useGetProductsQuery } from '../slices/productsApiSlice';
import Message from '../components/Message';
import { SkeletonCard } from '../components/Skeleton';

const VendorStore = () => {
  const { id: vendorId } = useParams();
  const navigate = useNavigate();

  const { currencyCode = 'USD', rate = 1 } = useSelector((state) => state.currency);

  const { data: vendor, isLoading: loadingVendor, error: vendorError } = useGetPublicVendorProfileQuery(vendorId);
  const { data: products, isLoading: loadingProducts } = useGetProductsQuery({ user: vendorId });

  const vendorProducts = useMemo(() => {
    if (!products) return [];
    return Array.isArray(products) ? products : products.products || [];
  }, [products]);

  const storeName = vendor?.vendorProfile?.storeName || vendor?.name || 'Vendor Store';
  const storeDesc = vendor?.vendorProfile?.storeDescription || '';
  const storeLogo = vendor?.vendorProfile?.storeLogo || '';
  const storeBanner = vendor?.vendorProfile?.storeBanner || '';
  const isVerified = vendor?.vendorProfile?.isVerified;

  const avgRating = useMemo(() => {
    if (vendorProducts.length === 0) return 0;
    const total = vendorProducts.reduce((sum, p) => sum + (p.rating || 0), 0);
    return (total / vendorProducts.length).toFixed(1);
  }, [vendorProducts]);

  if (loadingVendor) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-10 h-10 border-3 border-gray-100 border-t-orange-600 rounded-full"></motion.div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest animate-pulse">Loading Store...</p>
      </div>
    </div>
  );

  if (vendorError) return (
    <div className="pt-32 px-4 max-w-7xl mx-auto">
      <Message variant='danger'>Store not found.</Message>
    </div>
  );

  return (
    <div className="bg-white min-h-screen antialiased pb-20">
      {/* Store Banner */}
      <div className="relative h-48 sm:h-64 bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 overflow-hidden">
        {storeBanner && (
          <img src={storeBanner} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 max-w-[100rem] mx-auto">
          <div className="flex items-center gap-4">
            {storeLogo ? (
              <img src={storeLogo} alt={storeName} loading="lazy" className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 border-white/20 object-cover bg-white" />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-orange-600 flex items-center justify-center">
                <FaStore className="text-white text-2xl" />
              </div>
            )}
            <div className="text-white">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">{storeName}</h1>
                {isVerified && <FaCheckCircle className="text-blue-400 text-lg" title="Verified Seller" />}
              </div>
              {storeDesc && (
                <p className="text-sm text-zinc-300 mt-1 line-clamp-2 max-w-xl">{storeDesc}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-zinc-400">
                <span className="flex items-center gap-1">
                  <FaStar className="text-orange-400" size={14} />
                  {avgRating} ({vendorProducts.length} products)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 mb-6 text-xs font-bold text-gray-500">
          <Link to="/" className="hover:text-orange-600 transition-colors">Home</Link>
          <FaChevronRight size={8} />
          <span className="text-gray-900">{storeName}</span>
        </nav>

        {/* Store Info Bar */}
        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 sm:p-6 mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-sm text-zinc-600">
            <span className="flex items-center gap-1.5"><FaTruck className="text-orange-500" /> Ships from DK-TEC</span>
            <span className="flex items-center gap-1.5"><FaShieldAlt className="text-orange-500" /> Secure Transaction</span>
          </div>
          {vendor?._id && (
            <Link to={`/search?user=${vendorId}`} className="text-sm font-bold text-brand-orange-600 hover:text-orange-800 hover:underline transition-colors">
              View all products by this seller &rarr;
            </Link>
          )}
        </div>

        {/* Products Grid */}
        {loadingProducts ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {[1,2,3,4,5,6,7,8].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : vendorProducts.length === 0 ? (
          <div className="text-center py-16">
            <FaStore className="mx-auto text-4xl text-zinc-300 mb-4" />
            <h3 className="text-lg font-bold text-zinc-600">No products yet</h3>
            <p className="text-sm text-zinc-400 mt-1">This seller hasn't listed any products.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {vendorProducts.map((product) => (
              <Link
                key={product._id}
                to={`/product/${product._id}`}
                className="group bg-white rounded-xl border border-zinc-200 hover:border-orange-300 hover:shadow-lg transition-all overflow-hidden no-underline"
              >
                <div className="h-40 sm:h-48 bg-[#F8F9FA] p-4 flex items-center justify-center">
                  <img
                    src={product.image || '/images/sample.jpg'}
                    alt={product.name}
                    loading="lazy"
                    className="max-w-full max-h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.src = 'https://placehold.co/400x400/111/fff?text=DK-TEC'; }}
                  />
                </div>
                <div className="p-3 sm:p-4">
                  <h3 className="text-sm font-bold text-gray-900 line-clamp-2 mb-1 group-hover:text-orange-600 transition-colors leading-snug">{product.name}</h3>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} className={i < Math.floor(product.rating || 0) ? "text-orange-500" : "text-gray-300"} size={10} />
                    ))}
                    <span className="text-[10px] text-gray-500 ml-1">{product.numReviews || 0}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-xs font-black text-gray-900 mt-1 mr-0.5">{currencyCode}</span>
                    <span className="text-lg font-black text-gray-900 tracking-tight">
                      {((product.price || 0) * rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorStore;