import { Link } from 'react-router-dom';
import { FaSpinner } from 'react-icons/fa';

const variants = {
  primary: 'bg-brand-orange-600 hover:bg-brand-orange-700 text-white',
  action: 'bg-brand-action hover:bg-brand-action-hover text-brand-action-text border border-brand-action-border',
  secondary: 'bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
  success: 'bg-emerald-500 hover:bg-emerald-600 text-white',
  dark: 'bg-zinc-900 hover:bg-brand-orange-600 text-white',
  ghost: 'bg-transparent hover:bg-zinc-100 text-zinc-700',
  link: 'bg-transparent hover:underline text-brand-orange-600 px-0 py-0 shadow-none',
};

const sizes = {
  xs: 'px-2.5 py-1.5 text-micro rounded-btn',
  sm: 'px-4 py-2 text-xs font-bold rounded-btn',
  md: 'px-5 py-2.5 text-sm font-bold rounded-btn',
  lg: 'px-6 py-3 text-sm font-bold rounded-btn',
  xl: 'px-8 py-3.5 text-sm font-bold rounded-btn',
  full: 'w-full px-6 py-3 text-sm font-bold rounded-btn',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  to,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center gap-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm active:scale-[0.98]';
  const classes = `${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {loading && <FaSpinner className="animate-spin" />}
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={disabled || loading} {...props}>
      {loading && <FaSpinner className="animate-spin" />}
      {children}
    </button>
  );
};

export default Button;
