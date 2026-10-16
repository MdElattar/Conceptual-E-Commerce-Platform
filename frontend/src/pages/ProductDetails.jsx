import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { toast } from 'react-toastify';
import { 
  FaTruck, FaShieldAlt, FaGlobe, FaCogs, 
  FaPalette, FaRulerCombined, FaArrowLeft,
  FaStar, FaRegStar, FaUserCircle, FaPaperPlane, FaBoxOpen, FaChevronRight,
  FaTools, FaMicrochip, FaStore, FaBarcode, FaCheckCircle,
  FaChevronDown, FaHeart, FaRegHeart
} from 'react-icons/fa';

import { useCart } from '../context/CartContext';
import { useGetProductDetailsQuery, useCreateReviewMutation, useGetProductsQuery, useGetRecommendationsQuery } from '../slices/productsApiSlice';
import { useAddToWishlistMutation, useRemoveFromWishlistMutation, useGetWishlistQuery } from '../slices/wishlistApiSlice';
import Button from '../components/Button';
import Message from '../components/Message';
import InquiryModal from '../components/InquiryModal';
import { SkeletonProductDetails } from '../components/Skeleton';
import { CrossSell, FrequentlyBoughtTogether, MoreFromSeller, CustomersAlsoViewed } from '../components/CrossSell';
import ImageZoom from '../components/ImageZoom';
import RecentlyViewed from '../components/RecentlyViewed';
import { useAddRecentlyViewedMutation } from '../slices/recentlyViewedApiSlice';

const ProductDetails = () => {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  const { scrollY } = useScroll();
  const headerY = useTransform(scrollY, [400, 500], ["-100%", "0%"]);

  const { addToCart, cartItems = [] } = useCart(); 
  const { data: product, isLoading, refetch, error } = useGetProductDetailsQuery(productId);
  const [createReview, { isLoading: loadingReview }] = useCreateReviewMutation();

  // For Cross-selling (Products from the same vendor or category)
  const { data: allProducts } = useGetProductsQuery({});

  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showInquiry, setShowInquiry] = useState(false);
  const [mainImage, setMainImage] = useState('');
  const [isWishlisted, setIsWishlisted] = useState(false);

  const { userInfo } = useSelector((state) => state.auth);
  const { currencyCode = 'USD', rate = 1, countryCode = 'US' } = useSelector((state) => state.currency);

  const { data: wishlist } = useGetWishlistQuery(undefined, { skip: !userInfo });
  const [addToWishlist] = useAddToWishlistMutation();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();

  useEffect(() => {
    if (wishlist?.products && productId) {
      const found = wishlist.products.some(p => {
        const pid = typeof p.product === 'object' ? p.product._id : p.product;
        return pid === productId;
      });
      setIsWishlisted(found);
    }
  }, [wishlist, productId]);

  useEffect(() => {
    if (product) {
      if (product.colors?.length > 0) setSelectedColor(product.colors[0]);
      if (product.sizes?.length > 0) setSelectedSize(product.sizes[0]);
      setMainImage(product.image);
    }
  }, [product]);

  const [addRecentlyViewed] = useAddRecentlyViewedMutation();

  useEffect(() => {
    if (product && userInfo) {
      addRecentlyViewed({
        productId: product._id,
        productImage: product.image || '',
        productName: product.name || '',
        productPrice: product.price || 0,
        vendorName: product.user?.vendorProfile?.storeName || '',
      });
    } else if (product && !userInfo) {
      try {
        const stored = JSON.parse(localStorage.getItem('dk_tec_recently_viewed') || '[]');
        const filtered = stored.filter((p) => p.productId !== product._id);
        filtered.unshift({
          productId: product._id,
          productImage: product.image || '',
          productName: product.name || '',
          productPrice: product.price || 0,
          vendorName: product.user?.vendorProfile?.storeName || '',
          viewedAt: new Date().toISOString(),
        });
        if (filtered.length > 20) filtered.length = 20;
        localStorage.setItem('dk_tec_recently_viewed', JSON.stringify(filtered));
      } catch {}
    }
  }, [product, userInfo, addRecentlyViewed]);

  const reviewStats = useMemo(() => {
    if (!product?.reviews) return [];
    const stats = [0, 0, 0, 0, 0];
    product.reviews.forEach(r => stats[r.rating - 1]++);
    return stats.reverse(); 
  }, [product]);

  const absoluteMax = 14;
  const actualStock = product?.countInStock || 0;
  const maxAllowed = Math.min(absoluteMax, actualStock);
  const currentInCart = useMemo(() => cartItems.find(
    (x) => x._id === product?._id && x.selectedColor === selectedColor && x.selectedSize === selectedSize
  )?.qty || 0, [cartItems, product, selectedColor, selectedSize]);

  const canAddMore = actualStock > 0 && currentInCart < maxAllowed;

  // 🌟 حسابات السعر الآمنة (بدون دوال خارجية تسبب أخطاء)
  const originalPrice = product?.price || 0;
  const discountPercentage = product?.discount || 0; 
  const isDiscounted = discountPercentage > 0;
  const currentPrice = isDiscounted ? originalPrice - (originalPrice * (discountPercentage / 100)) : originalPrice;

  // 🌟 دالة محلية لفرمتة الأرقام بدقة لتجنب رمز الدولار المزدوج
  const formatLocalPrice = (amount) => {
    return Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // 🌟 استخراج اسم الدولة الحقيقي من كود الدولة (مثال: EG -> Egypt)
  const displayCountryName = useMemo(() => {
    try {
      const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
      return regionNames.of(countryCode) || countryCode;
    } catch {
      return countryCode; // Fallback
    }
  }, [countryCode]);

  // 🌟 تاريخ توصيل ديناميكي يحاكي أمازون (بعد 3 أيام من اليوم)
  const deliveryDate = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }, []);

  const handleAddToCart = () => {
    if (!canAddMore) return; 
    addToCart({ ...product, price: currentPrice, selectedColor, selectedSize });
    
    // Amazon style success toast
    toast.success(
        <div className="flex items-center gap-3">
            <FaCheckCircle className="text-emerald-500 text-xl" />
            <div className="flex flex-col">
                <strong className="text-sm tracking-wide">Added to Cart</strong>
                <span className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">{product.name.substring(0, 30)}...</span>
            </div>
        </div>, 
        { style: { borderRadius: '16px', background: '#fff', color: '#111', border: '1px solid #f3f4f6' } }
    );
  };

  const handleWishlistToggle = async () => {
    if (!userInfo) {
      toast.info('Please sign in to save items to your wishlist');
      return;
    }
    try {
      if (isWishlisted) {
        await removeFromWishlist(productId).unwrap();
        setIsWishlisted(false);
        toast.success('Removed from wishlist', { autoClose: 1500 });
      } else {
        await addToWishlist(productId).unwrap();
        setIsWishlisted(true);
        toast.success('Added to wishlist!', { autoClose: 1500 });
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Wishlist update failed');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await createReview({ productId, rating, comment }).unwrap();
      refetch();
      toast.success('Review submitted successfully! ⭐');
      setRating(0); setComment('');
    } catch (err) {
      toast.error(err?.data?.message || err.error || "Failed to submit review.");
    }
  };

  // Cross-Selling Logic
  const relatedProducts = useMemo(() => {
      if (!allProducts || !product) return [];
      const productsArray = Array.isArray(allProducts) ? allProducts : allProducts.products || [];
      return productsArray.filter(p => 
          p._id !== product._id && 
          p.status === 'active' &&
          (p.category === product.category || p.vendor === product.vendor)
      ).slice(0, 4);
  }, [allProducts, product]);

  if (isLoading) return <SkeletonProductDetails />;

  if (error) return <div className="pt-32 px-4 max-w-7xl mx-auto"><Message variant='danger'>Hardware Protocol Error: Data Unreachable.</Message></div>;
  if (!product) return <div className="pt-32 px-4 max-w-7xl mx-auto"><Message variant='danger'>Product not found.</Message></div>;

  const allImages = [product.image, ...(product.images || [])];

  return (
    <div className="bg-white min-h-screen antialiased pb-20 md:pb-20">
      
      {/* Scroll Progress Bar */}
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-orange-600 origin-left z-[1001]" style={{ scaleX }} />

      {/* Sticky Header (Amazon Style) */}
      <motion.div style={{ y: headerY }} className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-md z-[1000] border-b border-gray-200 py-2.5 shadow-sm hidden lg:block">
        <div className="max-w-[100rem] mx-auto px-8 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <img src={mainImage} loading="lazy" className="w-10 h-10 object-contain p-1 bg-gray-50 rounded-lg border border-gray-100" alt="" />
                <div>
                   <p className="font-bold uppercase text-[10px] text-orange-600 tracking-wider">In Stock</p>
                   <p className="font-bold text-sm text-gray-900 truncate max-w-[300px]">{product.name}</p>
                </div>
            </div>
            <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-gray-900">{currencyCode}</span>
                    <span className="text-xl font-black text-gray-900 leading-none">{formatLocalPrice(currentPrice * rate)}</span>
                  </div>
                  {isDiscounted && <span className="text-[10px] text-gray-400 line-through">List: {currencyCode} {formatLocalPrice(originalPrice * rate)}</span>}
                </div>
                <div className="flex gap-2">
                   <Button onClick={handleAddToCart} disabled={!canAddMore} variant="action" size="md" className="rounded-full uppercase text-xs font-black">Add to Cart</Button>
                   <button
                     onClick={handleWishlistToggle}
                     className={`w-11 h-11 rounded-full flex items-center justify-center transition-all border-2 cursor-pointer ${
                       isWishlisted
                         ? 'bg-red-50 border-red-200 text-red-500 hover:bg-red-100'
                         : 'bg-white border-gray-200 text-gray-400 hover:text-red-400 hover:border-red-200'
                     }`}
                     aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                   >
                     {isWishlisted ? <FaHeart size={18} /> : <FaRegHeart size={18} />}
                   </button>
                </div>
            </div>
        </div>
      </motion.div>

      <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 mb-6 text-[11px] font-bold text-gray-500">
            <Link to="/" className="hover:text-orange-600 transition-colors">Home</Link>
            <FaChevronRight size={8} />
            <Link to={`/department/${product.category}`} className="hover:text-orange-600 transition-colors">{product.category}</Link>
            <FaChevronRight size={8} />
            <span className="text-gray-900 truncate max-w-[200px] sm:max-w-xs">{product.name}</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mb-16 items-start">
          
          {/* Left Column: Image Gallery */}
          <div className="lg:w-5/12 w-full flex flex-col md:flex-row gap-4 relative">
             <div className="flex md:flex-col gap-2 order-2 md:order-1 overflow-x-auto md:overflow-x-visible md:max-h-[500px] custom-scrollbar pr-1">
                {allImages.map((img, index) => (
                  <button 
                    key={index}
                    onClick={() => setMainImage(img)}
                    className={`shrink-0 w-12 h-12 sm:w-16 sm:h-16 bg-[#F8F9FA] rounded-lg p-1 border flex items-center justify-center transition-all cursor-pointer ${mainImage === img ? 'border-orange-500 ring-1 ring-orange-500 shadow-sm' : 'border-gray-200 hover:border-orange-300'}`}
                  >
                    <img src={img} alt={`gallery-${index}`} loading="lazy" className="w-full h-full object-contain mix-blend-multiply rounded-md" />
                  </button>
                ))}
             </div>

             <div className="flex-1 bg-[#F8F9FA] rounded-2xl p-4 sm:p-8 border border-gray-100 shadow-sm flex items-center justify-center min-h-[300px] sm:min-h-[400px] md:min-h-[500px] order-1 md:order-2 group overflow-hidden relative">
                <motion.div
                  key={mainImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full flex items-center justify-center"
                >
                  <ImageZoom
                    src={mainImage}
                    alt={product.name}
                    className="max-w-full max-h-full object-contain mix-blend-multiply cursor-crosshair"
                  />
                </motion.div>
             </div>
          </div>

          {/* Middle Column: Details & Specs */}
          <div className="lg:w-4/12 w-full space-y-5">
              <div className="border-b border-gray-200 pb-5">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-2 leading-snug">
                    {product.name}
                  </h1>
                  
                    {product.user?.vendorProfile?.storeName && (
                    <p className="text-sm text-brand-orange-600 mb-2">
                        Sold by: <Link to={`/vendor/${product.user._id}`} className="hover:underline hover:text-orange-800 font-semibold">{product.user.vendorProfile.storeName}</Link>
                    </p>
                  )}

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className={i < Math.floor(product.rating) ? "text-orange-500" : "text-gray-300"} size={14}/>
                      ))}
                      <FaChevronDown size={10} className="text-gray-400 ml-1 cursor-pointer hover:text-gray-600" />
                    </div>
                    <span className="text-sm font-semibold text-brand-orange-600 hover:text-orange-800 hover:underline cursor-pointer">{product.numReviews} ratings</span>
                  </div>
              </div>

              {/* Price Block */}
              <div className="border-b border-gray-200 pb-5">
                  {isDiscounted && (
                     <div className="flex items-center gap-2 mb-1">
                        <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[11px] font-black uppercase">Limited Time Deal</span>
                     </div>
                  )}
                  
                  <div className="flex items-start gap-2">
                     {isDiscounted && <span className="text-3xl font-light text-red-600 mt-1">-{discountPercentage}%</span>}
                     <div className="flex items-start">
                        <span className="text-sm font-bold text-gray-900 mt-1.5 mr-1">{currencyCode}</span>
                        {/* 🌟 استخدام دالة محلية آمنة للرقم فقط */}
                        <span className="text-4xl font-black text-gray-900 tracking-tight">{formatLocalPrice(currentPrice * rate)}</span>
                     </div>
                  </div>
                  
                  {isDiscounted && (
                     <div className="text-xs text-gray-500 mt-1 font-semibold">
                         List Price: <span className="line-through">{currencyCode} {formatLocalPrice(originalPrice * rate)}</span>
                     </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2 font-medium">All prices include VAT where applicable.</p>
              </div>

              {/* Variant Selectors */}
              {(product.colors?.length > 0 || product.sizes?.length > 0) && (
                  <div className="border-b border-gray-200 pb-5 space-y-4">
                      {product.colors?.length > 0 && (
                          <div>
                              <p className="text-sm font-bold text-gray-900 mb-2">Color: <span className="font-medium text-gray-600">{selectedColor}</span></p>
                              <div className="flex flex-wrap gap-2">
                                  {product.colors.map(color => (
                                      <button 
                                          key={color} 
                                          onClick={() => setSelectedColor(color)}
                                          className={`px-3 py-1.5 border rounded-md text-xs font-semibold transition-all cursor-pointer ${selectedColor === color ? 'border-orange-500 ring-1 ring-orange-500 bg-orange-50/50' : 'border-gray-300 hover:border-gray-400'}`}
                                      >
                                          {color}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      )}
                      
                      {product.sizes?.length > 0 && (
                          <div>
                              <p className="text-sm font-bold text-gray-900 mb-2">Size: <span className="font-medium text-gray-600">{selectedSize}</span></p>
                              <div className="flex flex-wrap gap-2">
                                  {product.sizes.map(size => (
                                      <button 
                                          key={size} 
                                          onClick={() => setSelectedSize(size)}
                                          className={`px-3 py-1.5 border rounded-md text-xs font-semibold transition-all cursor-pointer ${selectedSize === size ? 'border-orange-500 ring-1 ring-orange-500 bg-orange-50/50' : 'border-gray-300 hover:border-gray-400'}`}
                                      >
                                          {size}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
              )}

              {/* About this item (Description) */}
              <div className="pt-2">
                  <h3 className="font-bold text-gray-900 mb-2">About this item</h3>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {product.description}
                  </p>
              </div>

              {/* Dynamic Specs */}
              {product.specs?.length > 0 && (
                  <div className="pt-4">
                      <table className="w-full text-sm text-left">
                          <tbody>
                              {product.specs.map((s, i) => (
                                  <tr key={i} className="border-b border-gray-100 last:border-0">
                                      <th className="py-2 pr-4 font-bold text-gray-900 bg-gray-50/50 w-1/3">{s.label}</th>
                                      <td className="py-2 text-gray-700">{s.value}</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              )}
          </div>

          {/* Right Column: Amazon Buy Box */}
          <div className="lg:w-3/12 w-full">
              <div className="border border-gray-300 rounded-2xl p-5 bg-white shadow-sm lg:sticky lg:top-28">
                  
                  <div className="flex items-start mb-2">
                     <span className="text-xs font-black text-gray-900 mt-1 mr-1">{currencyCode}</span>
                     {/* 🌟 السعر الصافي بدون الـ Utility */}
                     <span className="text-2xl font-black text-gray-900 tracking-tight">{formatLocalPrice(currentPrice * rate)}</span>
                  </div>

                  <div className="mb-4">
                     <span className="text-brand-orange-600 font-bold hover:underline cursor-pointer text-sm">FREE Returns</span>
                  </div>

                  <div className="mb-4">
                      <span className="text-sm font-semibold text-gray-900"><span className="text-brand-orange-600 font-black hover:underline cursor-pointer">Prime</span> FREE Delivery <span className="font-bold">{deliveryDate}</span></span>
                      <p className="text-xs text-gray-600 mt-1 font-medium">Order within <span className="text-green-700 font-bold">2 hrs 30 mins</span></p>
                  </div>

                  <div className="mb-5 flex items-center gap-2 text-sm text-gray-600">
                      <FaGlobe className="text-gray-400" /> 
                      {/* 🌟 عرض اسم الدولة الفعلي ديناميكياً */}
                      Deliver to {displayCountryName}
                  </div>

                  <h3 className={`text-lg font-bold mb-4 ${actualStock > 0 ? 'text-green-700' : 'text-red-600'}`}>
                      {actualStock > 0 ? 'In Stock' : 'Currently Unavailable'}
                  </h3>

                  <div className="space-y-3 mb-6">
                      <Button 
                          onClick={handleAddToCart} 
                          disabled={!canAddMore} 
                          variant="action" 
                          size="full"
                          className="rounded-full font-black"
                      >
                          Add to Cart
                      </Button>
                      
                      <Button 
                        onClick={() => setShowInquiry(true)}
                        variant="secondary"
                        size="full"
                        className="rounded-full font-black"
                      >
                         Technical Inquiry
                      </Button>
                  </div>

                  <div className="space-y-2 text-xs text-gray-500 font-medium">
                      <div className="flex justify-between"><span>Ships from</span><span className="font-bold text-gray-900 truncate max-w-[120px]">DK-TEC Fulfillment</span></div>
                      <div className="flex justify-between"><span>Sold by</span><span className="text-brand-orange-600 font-bold hover:underline cursor-pointer truncate max-w-[120px]">{product.user?.vendorProfile?.storeName || 'DK-TEC'}</span></div>
                      <div className="flex justify-between"><span>Returns</span><span className="text-brand-orange-600 font-bold hover:underline cursor-pointer">Eligible for Return</span></div>
                      <div className="flex justify-between"><span>Payment</span><span className="text-brand-orange-600 font-bold flex items-center gap-1"><FaShieldAlt className="text-orange-500"/> Secure Transaction</span></div>
                  </div>
              </div>
          </div>

        </div>

        {/* 🌟 Cross-Selling Section */}
        {relatedProducts.length > 0 && (
            <div className="border-t border-gray-200 pt-10 mb-16">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Customers who viewed this item also viewed</h2>
                <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 pt-1 snap-x custom-horizontal-scrollbar">
                    {relatedProducts.map((prod) => (
                        <div key={prod._id} className="snap-start shrink-0 w-[200px] sm:w-[220px]">
                            <Link to={`/product/${prod._id}`} className="block group no-underline">
                                <div className="bg-[#F8F9FA] rounded-xl p-4 mb-3 flex items-center justify-center h-40 border border-gray-100 group-hover:border-orange-300 group-hover:shadow-md group-hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
                                    <img src={prod.image} alt={prod.name} loading="lazy" className="max-w-full max-h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-110" />
                                </div>
                                <h3 className="text-sm font-semibold text-brand-orange-600 group-hover:text-orange-800 transition-colors line-clamp-2 mb-1">{prod.name}</h3>
                                <div className="mb-1">
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <FaStar key={i} className={i < Math.floor(prod.rating) ? "text-orange-500" : "text-gray-300"} size={10}/>
                                        ))}
                                        <span className="text-[10px] text-gray-500 ml-1">{prod.numReviews}</span>
                                    </div>
                                </div>
                                <span className="font-bold text-gray-900">{currencyCode} {formatLocalPrice(prod.price * rate)}</span>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- 📋 Reviews Section --- */}
        <div className="border-t border-gray-200 pt-10">
           <div className="flex flex-col lg:flex-row gap-12 items-start">
              
              {/* Left: Stats */}
              <div className="lg:w-1/3 w-full lg:sticky lg:top-28 space-y-6">
                 <h2 className="text-xl font-bold text-gray-900">Customer reviews</h2>
                 
                 <div className="flex items-center gap-4 mb-4">
                    <div className="flex text-orange-500">
                        {[...Array(5)].map((_, i) => <FaStar key={i} size={20} className={i < Math.floor(product.rating) ? "text-orange-500" : "text-gray-200"}/>)}
                    </div>
                    <span className="text-lg font-bold text-gray-900">{product.rating.toFixed(1)} out of 5</span>
                 </div>
                 <p className="text-sm text-gray-500 font-medium">{product.numReviews} global ratings</p>

                 <div className="space-y-3 mt-6">
                    {reviewStats.map((count, i) => {
                       const starNum = 5 - i;
                       const percentage = product.reviews.length > 0 ? (count / product.reviews.length) * 100 : 0;
                       return (
                         <div key={starNum} className="flex items-center gap-3">
                             <span className="text-sm font-semibold text-brand-orange-600 hover:underline cursor-pointer whitespace-nowrap w-12">{starNum} star</span>
                            <div className="h-4 w-full bg-gray-100 rounded overflow-hidden border border-gray-200">
                               <motion.div 
                                 initial={{ width: 0 }} 
                                 whileInView={{ width: `${percentage}%` }} 
                                 className="h-full bg-orange-400" 
                               />
                            </div>
                            <span className="text-sm text-gray-600 w-8 text-right">{Math.round(percentage)}%</span>
                         </div>
                       )
                    })}
                 </div>

                 <div className="pt-8 border-t border-gray-200 mt-8">
                     <h3 className="font-bold text-gray-900 mb-2">Review this product</h3>
                     <p className="text-sm text-gray-600 mb-4">Share your thoughts with other customers</p>
                     
                      {!userInfo ? (
                          <Button to="/login" variant="secondary" size="md" className="w-full text-center">
                              Sign in to write a review
                          </Button>
                     ) : (
                         <div className="space-y-4">
                            <div className="flex gap-2">
                                {[1,2,3,4,5].map((star) => (
                                  <button 
                                   key={star} 
                                   type="button" 
                                   onClick={() => setRating(star)}
                                   className="focus:outline-none cursor-pointer"
                                  >
                                     <FaStar size={24} className={rating >= star ? 'text-orange-500' : 'text-gray-300 hover:text-orange-300'}/>
                                  </button>
                                ))}
                            </div>
                            <textarea 
                                value={comment} 
                                onChange={(e) => setComment(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500 outline-none resize-none" 
                                placeholder="What did you like or dislike?"
                                rows="3"
                            />
                            <Button 
                                onClick={handleReviewSubmit}
                                disabled={loadingReview || rating === 0 || !comment.trim()} 
                                variant="secondary"
                                size="sm"
                                loading={loadingReview}
                            >
                               {loadingReview ? 'Submitting...' : 'Write a customer review'}
                            </Button>
                         </div>
                     )}
                 </div>
              </div>

              {/* Right: Reviews List */}
              <div className="lg:w-2/3 w-full">
                 <h3 className="text-lg font-bold text-gray-900 mb-6">Top reviews from {displayCountryName}</h3>
                 
                 <div className="space-y-8">
                    <AnimatePresence>
                    {product.reviews.length === 0 ? (
                       <p className="text-sm text-gray-500">No customer reviews yet.</p>
                    ) : (
                       product.reviews.map((rev, index) => (
                        <motion.div 
                          key={rev._id}
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-gray-200 pb-6 last:border-0"
                        >
                           <div className="flex items-center gap-2 mb-2">
                               <FaUserCircle size={28} className="text-gray-300" />
                               <span className="font-semibold text-sm text-gray-900">{rev.name}</span>
                           </div>
                           
                           <div className="flex items-center gap-2 mb-1">
                               <div className="flex">
                                  {[...Array(5)].map((_, i) => <FaStar key={i} size={14} className={i < rev.rating ? "text-orange-500" : "text-gray-300"}/>)}
                               </div>
                               <span className="text-sm font-bold text-gray-900">Verified Purchase</span>
                           </div>
                           
                           <span className="text-xs text-gray-500 block mb-3">Reviewed on {new Date(rev.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                           
                           <p className="text-sm text-gray-800 leading-relaxed">
                              {rev.comment}
                           </p>
                        </motion.div>
                       ))
                    )}
                    </AnimatePresence>
                 </div>
              </div>
           </div>
        </div>

      </div>

      <BoughtTogetherSection productId={productId} />

      {/* Cross Selling Sections */}
      {product && (
        <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8">
          <FrequentlyBoughtTogether product={product} />
          <CrossSell product={product} title="Similar Products" maxItems={10} />
          <MoreFromSeller product={product} />
        </div>
      )}

      {/* Recently Viewed */}
      <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8">
        <RecentlyViewed />
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-[1000] px-4 py-3 md:hidden flex items-center gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-xs font-bold text-gray-900">{currencyCode}</span>
            <span className="text-xl font-black text-gray-900">{formatLocalPrice(currentPrice * rate)}</span>
          </div>
          {isDiscounted && (
            <span className="text-[10px] text-gray-400 line-through block">{currencyCode} {formatLocalPrice(originalPrice * rate)}</span>
          )}
          <span className={`text-[11px] font-bold ${actualStock > 0 ? 'text-green-700' : 'text-red-600'}`}>
            {actualStock > 0 ? 'In Stock' : 'Unavailable'}
          </span>
        </div>
        <button
          onClick={handleWishlistToggle}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all border-2 shrink-0 cursor-pointer ${
            isWishlisted
              ? 'bg-red-50 border-red-200 text-red-500'
              : 'bg-white border-gray-200 text-gray-400 hover:text-red-400'
          }`}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {isWishlisted ? <FaHeart size={18} /> : <FaRegHeart size={18} />}
        </button>
        <Button
          onClick={handleAddToCart}
          disabled={!canAddMore}
          variant="action"
          size="md"
          className="flex-1 rounded-full font-black"
        >
          Add to Cart
        </Button>
      </motion.div>

      <InquiryModal 
        isOpen={showInquiry} 
        onClose={() => setShowInquiry(false)} 
        productTitle={product.name} 
      />

      <style jsx>{`
        .custom-horizontal-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-horizontal-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .custom-horizontal-scrollbar::-webkit-scrollbar-thumb { background: #d4d4d8; border-radius: 10px; }
        .custom-horizontal-scrollbar::-webkit-scrollbar-thumb:hover { background: #ea580c; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

const BoughtTogetherSection = ({ productId }) => {
  const { data: boughtTogether = [], isLoading } = useGetRecommendationsQuery(
    { type: 'boughtTogether', productId, limit: 10 },
    { skip: !productId }
  );
  const { rate = 1, currencyCode = 'USD' } = useSelector((state) => state.currency);

  if (isLoading || boughtTogether.length === 0) return null;

  return (
    <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-black text-gray-900 tracking-tight">Customers Who Bought This Also Bought</h3>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {boughtTogether.map((p) => (
          <Link
            key={p._id}
            to={`/product/${p._id}`}
            className="flex-shrink-0 w-[180px] bg-white rounded-xl border border-gray-200 hover:shadow-lg transition-all duration-300 p-3 flex flex-col no-underline group/card"
          >
            <div className="h-32 bg-[#F8F9FA] rounded-lg flex items-center justify-center overflow-hidden mb-2">
              <img
                src={p.image || '/images/sample.jpg'}
                alt={p.name}
                loading="lazy"
                className="w-full h-full object-contain mix-blend-multiply transition-transform duration-500 group-hover/card:scale-110"
              />
            </div>
            <h4 className="text-xs font-bold text-gray-900 line-clamp-2 mb-1 leading-snug min-h-[2rem]">{p.name}</h4>
            <div className="mt-auto pt-1">
              <span className="text-xs font-black text-gray-900">
                {currencyCode} {((p.price || 0) * rate).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export { BoughtTogetherSection };
export default ProductDetails;