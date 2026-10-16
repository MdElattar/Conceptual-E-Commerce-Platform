import { Link } from 'react-router-dom';
import { FaHistory, FaFire, FaStar, FaShoppingCart, FaHeart, FaBox, FaClock, FaUser, FaUndo, FaGem } from 'react-icons/fa';
import Button from '../Button';

const loggedInShortcuts = [
  { icon: FaHistory, label: 'Recently Viewed', link: '/browsing-history' },
  { icon: FaFire, label: 'Newest Products', link: '/newest' },
  { icon: FaStar, label: 'Recommended', link: '/products?sort=rating' },
  { icon: FaShoppingCart, label: 'Continue Shopping', link: '/cart' },
  { icon: FaHeart, label: 'Wishlist', link: '/wishlist' },
  { icon: FaBox, label: 'Your Orders', link: '/orders' },
  { icon: FaClock, label: 'Browsing History', link: '/browsing-history' },
  { icon: FaUser, label: 'Account', link: '/profile' },
  { icon: FaUndo, label: 'Returns', link: '/returns' },
  { icon: FaGem, label: 'DK-TEC Elite', link: '/dk-elite' },
];

const WelcomeCard = ({ userInfo }) => {
  if (userInfo) {
    const firstName = userInfo.name ? userInfo.name.split(' ')[0] : '';
    return (
      <div className="bg-white rounded-lg border border-zinc-200 shadow-sm p-4 md:p-5">
        <h3 className="text-lg font-bold text-zinc-900 mb-3 tracking-tight">
          Welcome back{firstName ? `, ${firstName}` : ''}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {loggedInShortcuts.map((item, idx) => (
            <Link
              key={idx}
              to={item.link}
              className="flex flex-col items-center justify-center bg-zinc-50 hover:bg-zinc-100 rounded-lg p-2.5 transition-colors gap-1.5 no-underline text-zinc-700"
            >
              <item.icon className="text-zinc-600" size={16} />
              <span className="text-xs font-medium text-center leading-tight">{item.label}</span>
            </Link>
          ))}
        </div>
        <div className="mt-3 text-center">
          <Link
            to="/profile"
            className="text-sm font-medium text-brand-orange-600 hover:text-orange-800 hover:underline transition-colors"
          >
            Go to your Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-zinc-200 shadow-sm p-4 md:p-5">
      <h3 className="text-lg font-bold text-zinc-900 mb-2 tracking-tight">
        Sign in for your best experience
      </h3>
      <Button to="/login" variant="action" size="md" className="w-full rounded-lg">
        Sign in securely
      </Button>
      <div className="text-center mt-3">
        <span className="text-sm text-zinc-500">New customer? </span>
        <Link
          to="/register"
          className="text-sm font-medium text-brand-orange-600 hover:text-orange-800 hover:underline transition-colors"
        >
          Create your account
        </Link>
      </div>
      <div className="mt-4 pt-3 border-t border-zinc-100">
        <p className="text-xs text-zinc-500 text-center">
          Free shipping on orders over $499.{' '}
          <Link to="/products" className="text-brand-orange-600 hover:text-orange-800 hover:underline">
            Browse products
          </Link>
        </p>
      </div>
    </div>
  );
};

export default WelcomeCard;
