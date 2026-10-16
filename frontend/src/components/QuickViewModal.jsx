import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { FaTimes, FaShoppingCart, FaHeart, FaRegHeart, FaArrowRight, FaMinus, FaPlus, FaCheck } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import Button from './Button';
import Rating from './Rating';
import { useAddToWishlistMutation, useRemoveFromWishlistMutation } from '../slices/wishlistApiSlice';

const QuickViewModal = ({ product, isOpen, onClose, addToCart, wishlistProductIds }) => {
  const [qty, setQty] = useState(1);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [isAdded, setIsAdded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { userInfo } = useSelector((state) => state.auth);
  const { rate = 1, currencyCode = 'USD' } = useSelector((state) => state.currency);

  const [addToWishlist] = useAddToWishlistMutation();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();

  const isInWishlist = wishlistProductIds?.includes(product?._id);

  useEffect(() => {
    if (isOpen) {
      setQty(1);
      setIsAdded(false);
      setImgError(false);
      if (product) {
        setSelectedColor(product.colors?.[0] || '');
        setSelectedSize(product.sizes?.[0] || '');
      }
    }
  }, [isOpen, product]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const discount = useMemo(() => {
    if (!product) return null;
    const origPrice = product.originalPrice;
    const salePrice = product.price;
    if (!origPrice || origPrice <= salePrice) return null;
    const saved = origPrice - salePrice;
    const pct = Math.round((saved / origPrice) * 100);
    return { originalPrice: origPrice * rate, salePrice: salePrice * rate, saved: saved * rate, percent: pct };
  }, [product?.originalPrice, product?.price, rate]);

  if (!isOpen || !product) return null;

  const isOutOfStock = Number(product.countInStock) === 0;
  const stockDisplay = product.countInStock > 10 ? 'In Stock' : product.countInStock > 0 ? `Only ${product.countInStock} left` : 'Out of Stock';
  const stockColor = product.countInStock > 10 ? 'text-green-700' : product.countInStock > 0 ? 'text-orange-600' : 'text-red-600';

  const handleWishlistToggle = async () => {
    if (!userInfo) { toast.info('Please sign in'); return; }
    try {
      if (isInWishlist) {
        await removeFromWishlist(product._id).unwrap();
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist(product._id).unwrap();
        toast.success('Added to wishlist!');
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Wishlist update failed');
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const payload = { ...product, qty, selectedColor, selectedSize };
    for (let i = 0; i < qty; i++) addToCart(payload);
    setIsAdded(true);
    toast.success(`${product.name?.substring(0, 20)} x${qty} added to cart!`, { autoClose: 2000, theme: 'dark' });
    setTimeout(() => setIsAdded(false), 2000);
  };

  const formatPrice = (v) => v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto z-10 animate-fade-in">
        <button onClick={onClose} className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-600 hover:text-zinc-900 transition-all border-0 cursor-pointer">
          <FaTimes size={18} />
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="md:w-1/2 bg-[#F8F9FA] p-6 flex items-center justify-center min-h-[300px] relative">
            {!imgError && !product.image && (
              <div className="absolute inset-0 bg-gray-100 animate-pulse" />
            )}
            <img
              src={imgError ? 'https://placehold.co/400x400/f5f5f5/999?text=DK-TEC' : (product.image || '/images/sample.jpg')}
              alt={product.name}
              loading="lazy"
              className="w-full h-full max-h-[350px] object-contain mix-blend-multiply"
              onError={() => setImgError(true)}
            />

            {isOutOfStock && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                <span className="bg-zinc-900 text-white text-sm font-black px-6 py-3 rounded-lg">Currently Unavailable</span>
              </div>
            )}

            {discount && (
              <span className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-md flex items-center gap-1">
                -{discount.percent}%
              </span>
            )}
          </div>

          {/* Details */}
          <div className="md:w-1/2 p-6 flex flex-col gap-4">
            <div>
              {product.brand && (
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider">{product.brand}</span>
              )}
              <h2 className="text-lg font-bold text-gray-900 leading-snug mt-1">{product.name}</h2>
            </div>

            <Rating value={product.rating} text={product.numReviews || 0} />

            {/* Price */}
            <div className="flex items-baseline gap-2">
              {discount ? (
                <>
                  <span className="text-2xl font-black text-red-600">{currencyCode} {formatPrice(discount.salePrice)}</span>
                  <span className="text-sm text-gray-400 line-through">{currencyCode} {formatPrice(discount.originalPrice)}</span>
                  <span className="text-[11px] font-black text-green-700 bg-green-50 px-2 py-0.5 rounded">Save {discount.percent}%</span>
                </>
              ) : (
                <>
                  <span className="text-xs font-black text-gray-900 mt-1 mr-1">{currencyCode}</span>
                  <span className="text-2xl font-black text-gray-900">{formatPrice((product.price || 0) * rate)}</span>
                </>
              )}
            </div>

            {/* Stock */}
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${stockColor}`}>{stockDisplay}</span>
            </div>

            {/* View Full Details - Prominent button to navigate to dedicated product page */}
            <Link
              to={`/product/${product._id}`}
              onClick={onClose}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border-2 border-orange-500 bg-orange-50 hover:bg-orange-100 text-orange-700 hover:text-orange-800 font-black text-xs uppercase tracking-wider transition-all duration-200 no-underline group"
            >
              <FaArrowRight className="text-orange-500 group-hover:translate-x-0.5 transition-transform" size={12} />
              View Full Details
              <span className="text-orange-400 group-hover:translate-x-0.5 transition-transform">&rarr;</span>
            </Link>
            <div className="border-t border-gray-100 my-2" />

            {/* Colors */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase">Color: <span className="text-gray-900">{selectedColor}</span></span>
                <div className="flex gap-2 mt-1">
                  {product.colors.map((c) => (
                    <button key={c} onClick={() => setSelectedColor(c)} className={`px-3 py-1 text-xs font-bold rounded-full border-2 transition-all cursor-pointer ${
                      selectedColor === c ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                    }`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase">Size: <span className="text-gray-900">{selectedSize}</span></span>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {product.sizes.map((s) => (
                    <button key={s} onClick={() => setSelectedSize(s)} className={`px-3 py-1 text-xs font-bold rounded-full border-2 transition-all cursor-pointer ${
                      selectedSize === s ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                    }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <span className="text-xs font-bold text-gray-500 uppercase">Quantity</span>
              <div className="flex items-center gap-3 mt-1">
                <button onClick={() => setQty(Math.max(1, qty - 1))} disabled={qty <= 1} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 disabled:opacity-40 border-0 cursor-pointer disabled:cursor-not-allowed">
                  <FaMinus size={12} />
                </button>
                <span className="text-lg font-black text-gray-900 w-8 text-center">{qty}</span>
                <button onClick={() => setQty(Math.min(product.countInStock || 99, qty + 1))} disabled={qty >= (product.countInStock || 99)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 disabled:opacity-40 border-0 cursor-pointer disabled:cursor-not-allowed">
                  <FaPlus size={12} />
                </button>
              </div>
            </div>

            {/* Seller info */}
            {product.user?.vendorProfile?.storeName && (
              <div className="text-xs text-gray-500">
                Sold by <span className="font-bold text-gray-900">{product.user.vendorProfile.storeName}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 mt-2">
              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                variant={isAdded ? 'success' : (isOutOfStock ? 'secondary' : 'action')}
                size="md"
                className={`flex-1 rounded-full text-xs font-black ${isAdded ? 'pointer-events-none' : ''}`}
              >
                {isAdded ? <><FaCheck /> Added</> : <><FaShoppingCart /> Add to Cart</>}
              </Button>
              <button
                onClick={handleWishlistToggle}
                className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all cursor-pointer ${
                  isInWishlist ? 'bg-red-50 border-red-200 text-red-500' : 'bg-white border-gray-200 text-gray-400 hover:border-gray-400'
                }`}
              >
                {isInWishlist ? <FaHeart size={18} /> : <FaRegHeart size={18} />}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default QuickViewModal;
