import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaHeart, FaTrash, FaShoppingCart, FaArrowLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useGetWishlistQuery, useRemoveFromWishlistMutation, useClearWishlistMutation } from '../slices/wishlistApiSlice';
import { useCart } from '../context/CartContext';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import Rating from '../components/Rating';

const Wishlist = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const { currencyCode = 'USD', rate = 1 } = useSelector((state) => state.currency);
  const { addToCart, cartItems } = useCart();
  const [removeFromWishlist] = useRemoveFromWishlistMutation();
  const [clearWishlist] = useClearWishlistMutation();

  const { data: wishlist, isLoading } = useGetWishlistQuery(undefined, {
    skip: !userInfo,
  });

  const wishlistProductIds = useMemo(() => {
    if (!wishlist?.products) return [];
    return wishlist.products.map((p) =>
      typeof p.product === 'object' ? p.product._id : p.product
    );
  }, [wishlist]);

  const handleRemove = async (productId) => {
    try {
      await removeFromWishlist(productId).unwrap();
      toast.success('Removed from wishlist');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to remove');
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Clear your entire wishlist?')) {
      try {
        await clearWishlist().unwrap();
        toast.success('Wishlist cleared');
      } catch (err) {
        toast.error(err?.data?.message || 'Failed to clear');
      }
    }
  };

  const handleAddToCart = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    const defaultColor = product.colors?.length > 0 ? product.colors[0] : (product.color || '');
    const defaultSize = product.sizes?.length > 0 ? product.sizes[0] : (product.size || '');
    addToCart({ ...product, selectedColor: defaultColor, selectedSize: defaultSize });
    toast.success(`${product.name?.substring(0, 20)}... added to cart!`);
  };

  if (!userInfo) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 pt-24">
        <FaHeart className="text-gray-300" size={64} />
        <h2 className="text-2xl font-bold text-gray-900">Sign in to view your wishlist</h2>
        <p className="text-gray-500">Save your favorite items and come back to them later</p>
        <Button to="/login" variant="action" size="lg" className="rounded-full">
          Sign in
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center pt-24">
        <div className="animate-spin h-8 w-8 border-4 border-orange-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const products = wishlist?.products?.map((p) =>
    typeof p.product === 'object' ? p.product : null
  ).filter(Boolean) || [];

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/" className="text-sm text-brand-orange-600 hover:text-orange-800 hover:underline flex items-center gap-1 mb-2">
              <FaArrowLeft size={12} /> Continue shopping
            </Link>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Your Wishlist <span className="text-orange-600">({products.length})</span>
            </h1>
          </div>
          {products.length > 0 && (
            <Button onClick={handleClearAll} variant="ghost" size="sm" className="text-red-500 hover:text-red-700">
              <FaTrash size={12} /> Clear all
            </Button>
          )}
        </div>

        {products.length === 0 ? (
          <EmptyState icon={FaHeart} title="Your wishlist is empty" message="Save items you love by tapping the heart icon" actionTo="/" actionLabel="Browse Products" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {products.map((product) => (
              <div key={product._id} className="bg-white rounded-lg border border-zinc-200 overflow-hidden hover:shadow-lg transition-shadow group">
                <Link to={`/product/${product._id}`} className="block relative h-48 bg-[#F8F9FA] p-4 flex items-center justify-center">
                  <img
                    src={product.image || 'https://placehold.co/400x400/111/fff?text=DK-TEC'}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-contain mix-blend-multiply transition-transform group-hover:scale-105"
                  />
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemove(product._id); }}
                    className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 shadow-sm border-0 cursor-pointer"
                  >
                    <FaTrash size={12} />
                  </button>
                </Link>
                <div className="p-4">
                  <Link to={`/product/${product._id}`} className="no-underline">
                    <h3 className="text-sm font-bold text-gray-900 line-clamp-2 hover:text-orange-600 h-10">{product.name}</h3>
                  </Link>
                  <Rating value={product.rating} text={product.numReviews || 0} />
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-xs font-black text-gray-900">{currencyCode}</span>
                    <span className="text-xl font-black text-gray-900">
                      {((product.price || 0) * rate).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <Button
                    onClick={(e) => handleAddToCart(product, e)}
                    disabled={Number(product.countInStock) === 0}
                    variant={Number(product.countInStock) === 0 ? 'secondary' : 'action'}
                    size="sm"
                    className="w-full rounded-full"
                  >
                    <FaShoppingCart size={12} /> {Number(product.countInStock) === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
