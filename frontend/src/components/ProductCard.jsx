import { useState, useMemo, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import {
  FaHeart, FaRegHeart, FaEye, FaTag, FaStar, FaBolt, FaGem, FaTruck
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import Rating from './Rating';
import Button from './Button';
import { useAddToWishlistMutation, useRemoveFromWishlistMutation } from '../slices/wishlistApiSlice';

const FALLBACK_IMG = 'https://placehold.co/400x400/f5f5f5/999?text=DK-TEC';

const ProductCard = ({ product, rate, currencyCode, addToCart, wishlistProductIds, isSponsored, onQuickView }) => {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const { userInfo } = useSelector((state) => state.auth);

  const [addToWishlist] = useAddToWishlistMutation();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();

  const isWishlisted = useMemo(() => {
    if (!wishlistProductIds || !product) return false;
    return wishlistProductIds.includes(product._id);
  }, [wishlistProductIds, product?._id]);

  const isOutOfStock = !product || Number(product.countInStock) === 0 || product.countInStock === undefined;
  const isLowStock = !isOutOfStock && product?.countInStock > 0 && product.countInStock <= 5;

  const discount = useMemo(() => {
    if (!product) return null;
    const origPrice = product.originalPrice;
    const salePrice = product.price;
    if (!origPrice || origPrice <= salePrice) return null;
    const saved = origPrice - salePrice;
    const pct = Math.round((saved / origPrice) * 100);
    return { originalPrice: origPrice * rate, salePrice: salePrice * rate, saved: saved * rate, percent: pct };
  }, [product?.originalPrice, product?.price, rate]);

  const formatPrice = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
  };

  const handleWishlistToggle = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!userInfo) {
      toast.info('Please sign in to save items to your wishlist');
      return;
    }
    try {
      if (isWishlisted) {
        await removeFromWishlist(product._id).unwrap();
        toast.success('Removed from wishlist', { autoClose: 1500 });
      } else {
        await addToWishlist(product._id).unwrap();
        toast.success('Added to wishlist!', { autoClose: 1500 });
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Wishlist update failed');
    }
  }, [userInfo, isWishlisted, product, addToWishlist, removeFromWishlist]);

  const handleAddToCartClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (isOutOfStock) return;
      const defaultColor = product.colors?.length > 0 ? product.colors[0] : (product.color || '');
      const defaultSize = product.sizes?.length > 0 ? product.sizes[0] : (product.size || '');
      addToCart({ ...product, selectedColor: defaultColor, selectedSize: defaultSize });
      toast.success(`${product.name?.substring(0, 20)}... added to cart!`, {
        position: "bottom-right",
        autoClose: 2000,
        theme: "dark"
      });
    } catch (err) {
      console.error("Cart action fallback captured error safely:", err);
    }
  }, [product, isOutOfStock, addToCart]);

  const handleQuickView = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) onQuickView(product);
  }, [product, onQuickView]);

  const badgeCount = useMemo(() => {
    let count = 0;
    if (discount) count++;
    if ((product.rating || 0) >= 4.5) count++;
    if (product.numSales > 50) count++;
    if (product.eliteDiscount > 0) count++;
    return count;
  }, [discount, product.rating, product.numSales, product.eliteDiscount]);

  if (!product) return null;

  return (
    <div className="group bg-white rounded-lg border border-zinc-200 hover:border-orange-200/60 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-200 flex flex-col h-full relative select-none cursor-pointer hover:-translate-y-0.5">

      <Link to={`/product/${product._id}`} className="block w-full no-underline">
        <div className="relative bg-gradient-to-b from-zinc-50 to-white overflow-hidden aspect-[4/3]">
          {!imgLoaded && !imgError && (
            <div className="absolute inset-0 bg-zinc-100 animate-pulse" />
          )}
          <img
            src={imgError ? FALLBACK_IMG : (product.image || FALLBACK_IMG)}
            alt={product.name || 'Marketplace Item'}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => { setImgError(true); setImgLoaded(true); }}
            className={`w-full h-full object-contain p-3 transition-all duration-500 group-hover:scale-110 ${isOutOfStock ? 'opacity-40 grayscale' : ''} ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          />

          {badgeCount <= 2 && (
            <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
              {discount && (
                <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1 shadow-sm">
                  <FaTag size={8} /> -{discount.percent}%
                </span>
              )}
              {(product.rating || 0) >= 4.5 && (
                <span className="bg-zinc-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1 shadow-sm">
                  <FaStar size={8} /> Best Seller
                </span>
              )}
              {product.eliteDiscount > 0 && (
                <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1 shadow-sm">
                  <FaGem size={8} /> Elite
                </span>
              )}
            </div>
          )}

          {badgeCount > 2 && discount && (
            <div className="absolute top-2 left-2 z-10">
              <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm shadow-sm">
                -{discount.percent}%
              </span>
            </div>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
              <span className="bg-zinc-900 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                Out of Stock
              </span>
            </div>
          )}

          {isSponsored && (
            <span className="absolute bottom-1 left-2 z-10 bg-black/50 text-white text-[9px] uppercase px-1.5 py-0.5 rounded-sm">
              Sponsored
            </span>
          )}

          <button
            onClick={handleWishlistToggle}
            className={`absolute top-2 right-2 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm border-0 cursor-pointer ${
              isWishlisted
                ? 'bg-red-50 text-red-500 hover:bg-red-100 scale-110'
                : 'bg-white/80 text-zinc-400 hover:text-red-400 hover:bg-white opacity-0 group-hover:opacity-100'
            }`}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {isWishlisted ? <FaHeart size={14} /> : <FaRegHeart size={14} />}
          </button>
        </div>
      </Link>

      <div className="p-3 flex-1 flex flex-col gap-1 bg-white">
        {product.user?.vendorProfile?.storeName && (
          <p className="text-[11px] text-orange-600 font-semibold truncate">{product.user.vendorProfile.storeName}</p>
        )}

        <Link to={`/product/${product._id}`} className="no-underline">
          <h3 className="text-sm font-semibold text-zinc-800 line-clamp-2 leading-snug hover:text-orange-600 transition-colors">
            {product.name || 'Untitled Product'}
          </h3>
        </Link>

        <div className="flex items-center gap-1.5 flex-wrap min-h-[18px]">
          <Rating value={product.rating} text={product.numReviews || 0} />
          {product.numSales > 0 && (
            <span className="text-[10px] text-zinc-500 font-medium">{product.numSales}+ sold</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-medium min-h-[16px]">
          {product.colors?.length > 0 && (
            <span>{product.colors.length} Colors</span>
          )}
          {product.sizes?.length > 0 && (
            <span>{product.sizes.length} Sizes</span>
          )}
        </div>

        <div className="flex items-baseline gap-2 flex-wrap mt-1">
          {discount ? (
            <>
              <span className="text-base font-extrabold text-red-600 tracking-tight">
                {currencyCode} {formatPrice(discount.salePrice)}
              </span>
              <span className="text-[11px] text-zinc-400 line-through">
                {currencyCode} {formatPrice(discount.originalPrice)}
              </span>
              <span className="text-[10px] font-bold text-green-700 bg-green-50 px-1 py-0.5 rounded-sm">
                -{discount.percent}%
              </span>
            </>
          ) : (
            <div className="flex items-start">
              <span className="text-[10px] font-bold text-zinc-900 mt-0.5 mr-0.5">{currencyCode}</span>
              <span className="text-lg font-extrabold text-zinc-900 tracking-tight">
                {formatPrice((product.price || 0) * rate)}
              </span>
            </div>
          )}
        </div>

        <div className="mt-auto pt-1">
          {isOutOfStock ? (
            <span className="text-[11px] font-semibold text-red-600">Currently Unavailable</span>
          ) : isLowStock ? (
            <span className="text-[11px] font-semibold text-amber-600">Only {product.countInStock} left</span>
          ) : (
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-green-700 font-semibold">In Stock</span>
              <span className="text-zinc-300 mx-1">|</span>
              <FaTruck size={10} className="text-zinc-500" />
              <span className="text-zinc-600 font-medium">FREE Delivery</span>
            </div>
          )}
        </div>

        {onQuickView && (
          <button
            onClick={handleQuickView}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/0 hover:bg-black/10 transition-all duration-200 opacity-0 group-hover:opacity-100 border-0 cursor-pointer rounded-lg"
            aria-label="Quick view"
          >
            <span className="bg-white text-zinc-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 translate-y-2 group-hover:translate-y-0 transition-all duration-200">
              <FaEye /> Quick View
            </span>
          </button>
        )}

        <Button
          onClick={handleAddToCartClick}
          disabled={isOutOfStock}
          variant="action"
          size="sm"
          className={`w-full !rounded-lg ${isOutOfStock ? '!bg-zinc-100 !text-zinc-400 !shadow-none' : ''}`}
        >
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </Button>
      </div>
    </div>
  );
};

export default memo(ProductCard);
