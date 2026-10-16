import { useState, useMemo, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaHeart, FaRegHeart, FaTag, FaGem, FaTruck, FaStar } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Rating from '../Rating';
import Button from '../Button';
import { useAddToWishlistMutation, useRemoveFromWishlistMutation } from '../../slices/wishlistApiSlice';

const FALLBACK_IMG = 'https://placehold.co/400x400/f5f5f5/999?text=DK-TEC';

const HomeProductCard = ({ product, rate, currencyCode, onAddToCart, wishlistProductIds, isSponsored }) => {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const { userInfo } = useSelector((state) => state.auth);

  const [addToWishlist] = useAddToWishlistMutation();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();

  const isWishlisted = useMemo(() => {
    if (!wishlistProductIds || !product) return false;
    return wishlistProductIds.includes(product._id);
  }, [wishlistProductIds, product]);

  const isOutOfStock = !product || Number(product.countInStock) === 0;
  const isLowStock = !isOutOfStock && product?.countInStock <= 5;

  const discount = useMemo(() => {
    if (!product) return null;
    const origPrice = product.originalPrice;
    const salePrice = product.price;
    if (!origPrice || origPrice <= salePrice) return null;
    const saved = origPrice - salePrice;
    const pct = Math.round((saved / origPrice) * 100);
    return { originalPrice: origPrice * rate, salePrice: salePrice * rate, saved: saved * rate, percent: pct };
  }, [product, rate]);

  const displayPrice = useMemo(() => {
    if (!product) return '0.00';
    const p = discount ? discount.salePrice : (product.price || 0) * rate;
    return Number(p).toFixed(2);
  }, [product, discount, rate]);

  const oldPrice = useMemo(() => {
    if (!discount) return null;
    return Number(discount.originalPrice).toFixed(2);
  }, [discount]);

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

  const handleAddToCart = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    const defaultColor = product.colors?.length > 0 ? product.colors[0] : (product.color || '');
    const defaultSize = product.sizes?.length > 0 ? product.sizes[0] : (product.size || '');
    onAddToCart({ ...product, selectedColor: defaultColor, selectedSize: defaultSize });
  }, [product, isOutOfStock, onAddToCart]);

  if (!product) return null;

  return (
    <div className="group bg-white rounded-lg border border-zinc-200 hover:border-orange-200/60 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)] transition-all duration-200 flex flex-col overflow-hidden relative select-none hover:-translate-y-0.5">
      <Link to={`/product/${product._id}`} className="block w-full no-underline">
        <div className="relative bg-gradient-to-b from-zinc-50 to-white overflow-hidden aspect-[4/3]">
          {!imgLoaded && !imgError && (
            <div className="absolute inset-0 bg-zinc-100 animate-pulse" />
          )}
          <img
            src={imgError ? FALLBACK_IMG : (product.image || FALLBACK_IMG)}
            alt={product.name || 'DK-TEC Product'}
            loading="lazy"
            onLoad={() => setImgLoaded(true)}
            onError={() => { setImgError(true); setImgLoaded(true); }}
            className={`w-full h-full object-contain p-2.5 transition-all duration-500 group-hover:scale-110 ${imgLoaded ? 'opacity-100' : 'opacity-0'} ${isOutOfStock ? 'opacity-40 grayscale' : ''}`}
          />

          {isOutOfStock && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60">
              <span className="bg-zinc-900 text-white text-xs font-bold px-3 py-1.5 rounded-full">Out of Stock</span>
            </div>
          )}

          {discount && (
            <span className="absolute top-2 left-2 z-10 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1 shadow-sm">
              <FaTag size={8} /> -{discount.percent}%
            </span>
          )}

          {isSponsored && (
            <span className="absolute bottom-1 left-2 z-10 bg-black/50 text-white text-[9px] uppercase px-1.5 py-0.5 rounded-sm">Sponsored</span>
          )}

          {product.eliteDiscount > 0 && (
            <span className="absolute bottom-1 right-2 z-10 bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded-sm flex items-center gap-1 shadow-sm">
              <FaGem size={8} /> Elite
            </span>
          )}

          <button
            onClick={handleWishlistToggle}
            className={`absolute top-2 right-2 z-20 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm border-0 cursor-pointer ${
              isWishlisted
                ? 'bg-red-50 text-red-500 hover:bg-red-100'
                : 'bg-white/80 text-zinc-400 hover:text-red-400 hover:bg-white opacity-0 group-hover:opacity-100'
            }`}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {isWishlisted ? <FaHeart size={12} /> : <FaRegHeart size={12} />}
          </button>
        </div>
      </Link>

      <div className="p-2.5 flex-1 flex flex-col gap-1 bg-white">
        {product.brand && (
          <p className="text-[10px] text-zinc-500 font-medium truncate">{product.brand}</p>
        )}

        <Link to={`/product/${product._id}`} className="no-underline">
          <h3 className="text-sm font-semibold text-zinc-800 line-clamp-2 leading-snug hover:text-orange-600 transition-colors">
            {product.name || 'Untitled Product'}
          </h3>
        </Link>

        {product.rating ? (
          <div className="flex items-center gap-1.5">
            <Rating value={product.rating} text={product.numReviews || 0} />
            {product.numSales > 0 && (
              <span className="text-[10px] text-zinc-500 font-medium">{product.numSales}+ sold</span>
            )}
          </div>
        ) : (
          product.numSales > 0 && (
            <span className="text-[10px] text-zinc-500 font-medium">{product.numSales}+ sold</span>
          )
        )}

        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-[15px] font-extrabold text-zinc-900">
            {currencyCode} {displayPrice}
          </span>
          {oldPrice && (
            <span className="text-[11px] text-zinc-400 line-through">
              {currencyCode} {oldPrice}
            </span>
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
              <FaTruck size={9} className="text-zinc-500" />
              <span className="text-zinc-600 font-medium">FREE</span>
            </div>
          )}
        </div>

        <Button
          onClick={handleAddToCart}
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

export default memo(HomeProductCard);
