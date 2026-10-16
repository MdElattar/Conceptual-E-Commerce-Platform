import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaCheckCircle, FaTimesCircle, FaSpinner, FaGem, FaUser, FaBox, FaHeart, FaHeadset, FaBan, FaCalendarAlt, FaIdBadge, FaToggleOn, FaToggleOff, FaArrowLeft, FaDollarSign, FaFileInvoice, FaRocket, FaTruck, FaStar, FaShieldAlt, FaClock, FaCreditCard
} from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  useGetMembershipQuery, useRequestCancellationMutation, useToggleAutoRenewMutation
} from '../slices/eliteApiSlice';
import Button from '../components/Button';

const allBenefits = [
  { icon: FaDollarSign, text: 'Up to 20% off on all orders' },
  { icon: FaTruck, text: 'Free expedited shipping' },
  { icon: FaClock, text: '45-day extended returns' },
  { icon: FaHeadset, text: 'Priority 24/7 customer service' },
  { icon: FaStar, text: 'Early access to limited deals' },
  { icon: FaGem, text: 'Exclusive Elite-only products' },
  { icon: FaRocket, text: 'Best annual value' },
  { icon: FaShieldAlt, text: 'Member-only discounts' },
];

const quickLinks = [
  { to: '/profile', icon: FaUser, label: 'My Profile' },
  { to: '/orders', icon: FaBox, label: 'My Orders' },
  { to: '/wishlist', icon: FaHeart, label: 'Wishlist' },
  { to: '/contact', icon: FaHeadset, label: 'Support' },
];

const EliteDashboard = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const { rate, symbol: currencySymbol } = useSelector((state) => state.currency);
  const { data: membership, isLoading, error } = useGetMembershipQuery(undefined, { skip: !userInfo });
  const [requestCancellation, { isLoading: cancelling }] = useRequestCancellationMutation();
  const [toggleAutoRenew, { isLoading: togglingAutoRenew }] = useToggleAutoRenewMutation();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const isElite = membership?.isElite;
  const subscription = membership?.subscription;
  const isPendingCancel = subscription?.status === 'pending_cancel';

  const handleToggleAutoRenew = useCallback(async () => {
    try {
      await toggleAutoRenew().unwrap();
      toast.success('Auto-renew preference updated.');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update auto-renew.');
    }
  }, [toggleAutoRenew]);

  const handleCancelRequest = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a reason for cancellation.');
      return;
    }
    try {
      await requestCancellation({ reason: cancelReason }).unwrap();
      toast.success('Cancellation request submitted to admin.');
      setShowCancelModal(false);
      setCancelReason('');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit cancellation request.');
    }
  };

  if (!userInfo) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center font-amazon">
        <div className="text-center max-w-md px-6">
          <FaGem className="text-orange-500 mx-auto mb-6" size={64} />
          <h1 className="text-3xl font-black text-zinc-900 mb-4">Elite Dashboard</h1>
          <p className="text-zinc-500 mb-8">Please log in to view your Elite membership dashboard.</p>
          <Link to="/login" className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-xl font-bold text-sm transition-all no-underline">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center font-amazon">
        <FaSpinner className="animate-spin text-orange-600" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center font-amazon">
        <div className="text-center max-w-md px-6">
          <FaTimesCircle className="text-red-500 mx-auto mb-6" size={48} />
          <h2 className="text-2xl font-black text-zinc-900 mb-2">Failed to Load</h2>
          <p className="text-zinc-500 mb-6">Could not load membership data.</p>
          <Link to="/dk-elite" className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-xl font-bold text-sm transition-all no-underline">
            Go to Elite Page
          </Link>
        </div>
      </div>
    );
  }

  if (!isElite && !membership?.subscription) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center font-amazon">
        <div className="text-center max-w-md px-6">
          <FaGem className="text-zinc-300 mx-auto mb-6" size={64} />
          <h1 className="text-3xl font-black text-zinc-900 mb-4">No Elite Membership</h1>
          <p className="text-zinc-500 mb-8">You are not currently an Elite member. Subscribe to unlock premium benefits.</p>
          <Link to="/dk-elite#plans" className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-xl font-bold text-sm transition-all no-underline">
            View Plans
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';

  return (
    <div className="min-h-screen bg-zinc-50 font-amazon">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Link */}
        <Link to="/dk-elite" className="inline-flex items-center gap-2 text-zinc-500 hover:text-orange-600 text-sm font-bold transition-colors mb-6 no-underline">
          <FaArrowLeft size={12} />
          Back to Elite
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight">
            Elite <span className="text-orange-600">Dashboard</span>
          </h1>
          <p className="text-zinc-500 mt-1">Manage your DK-TEC Elite membership.</p>
        </div>

        {/* Membership Overview Card */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center">
                <FaGem className="text-orange-600" size={28} />
              </div>
              <div>
                <h2 className="text-xl font-black text-zinc-900 capitalize">{subscription?.plan || 'Free'} Plan</h2>
                <div className="flex items-center gap-2 mt-1">
                  {isPendingCancel ? (
                    <span className="text-xs font-bold text-yellow-600 bg-yellow-50 border border-yellow-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <FaClock size={10} /> Pending Cancel
                    </span>
                  ) : isElite ? (
                    <span className="text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <FaCheckCircle size={10} /> Active
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-zinc-600 bg-zinc-100 border border-zinc-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <FaTimesCircle size={10} /> {subscription?.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-zinc-900">{currencySymbol}{(subscription?.price || 0 * rate).toFixed(2)}</p>
              <p className="text-xs text-zinc-500">{subscription?.plan === 'yearly' ? '/year' : subscription?.plan === 'monthly' ? '/month' : ''}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-zinc-50 rounded-xl">
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                <FaIdBadge size={10} /> Membership ID
              </p>
              <p className="text-sm font-mono text-zinc-900 break-all">#{subscription?._id?.slice(-8) || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                <FaCalendarAlt size={10} /> Start Date
              </p>
              <p className="text-sm font-bold text-zinc-900">{formatDate(subscription?.startDate)}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                <FaCalendarAlt size={10} /> Expiry Date
              </p>
              <p className="text-sm font-bold text-zinc-900">{formatDate(subscription?.expiresAt)}</p>
            </div>
            {subscription?.paymentMethod && (
              <div className="col-span-2 sm:col-span-3">
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                  <FaCreditCard size={10} /> Payment Method
                </p>
                <p className="text-sm font-bold text-zinc-900 capitalize">{subscription.paymentMethod}</p>
              </div>
            )}
          </div>
          <button onClick={handleToggleAutoRenew} disabled={togglingAutoRenew} className="w-full mt-4 flex items-center justify-between p-4 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer disabled:opacity-60">
            <div className="flex items-center gap-2">
              {togglingAutoRenew ? (
                <FaSpinner className="text-zinc-400 animate-spin" size={20} />
              ) : subscription?.autoRenew ? (
                <FaToggleOn className="text-green-500" size={20} />
              ) : (
                <FaToggleOff className="text-zinc-400" size={20} />
              )}
              <span className="text-sm font-bold text-zinc-700">Auto-Renew</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${subscription?.autoRenew ? 'bg-green-50 text-green-600' : 'bg-zinc-100 text-zinc-500'}`}>
                {subscription?.autoRenew ? 'On' : 'Off'}
              </span>
            </div>
          </button>
        </div>

        {/* Benefits Unlocked */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 mb-6">
          <h3 className="text-lg font-black text-zinc-900 mb-4 flex items-center gap-2">
            <FaRocket className="text-orange-500" size={18} />
            Benefits Unlocked
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(subscription?.benefits?.length ? allBenefits.filter(b => subscription.benefits.includes(b.text)) : allBenefits).map((benefit, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                <FaCheckCircle className="text-green-500 shrink-0" size={16} />
                <benefit.icon className="text-orange-500 shrink-0" size={14} />
                <span className="text-sm text-zinc-700 font-medium">{benefit.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 mb-6">
          <h3 className="text-lg font-black text-zinc-900 mb-4">Quick Links</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickLinks.map((link, i) => (
              <Link key={i} to={link.to} className="flex flex-col items-center gap-2 p-4 bg-zinc-50 hover:bg-orange-50 rounded-xl transition-colors no-underline group">
                <link.icon className="text-zinc-400 group-hover:text-orange-600 transition-colors" size={22} />
                <span className="text-xs font-bold text-zinc-600 group-hover:text-orange-700 transition-colors">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Cancel Membership */}
        {isElite && !isPendingCancel && (
          <div className="bg-white border border-red-200 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-zinc-900">Cancel Membership</h3>
                <p className="text-sm text-zinc-500">Your benefits will remain active until the expiry date.</p>
              </div>
              <Button
                onClick={() => setShowCancelModal(true)}
                variant="danger"
                className="shrink-0"
              >
                <FaBan size={14} />
                Request Cancellation
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCancelModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-black text-zinc-900 mb-2">Cancel Membership</h3>
            <p className="text-sm text-zinc-500 mb-4">Are you sure you want to cancel? Please tell us why.</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Tell us why you are leaving..."
              className="w-full border border-zinc-300 rounded-xl p-3 text-sm outline-none focus:border-orange-500 transition-colors resize-none h-24"
              required
            />
            <div className="flex gap-3 mt-4">
              <Button
                onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                variant="secondary"
                className="flex-1"
              >
                Keep My Membership
              </Button>
              <Button
                onClick={handleCancelRequest}
                disabled={cancelling}
                variant="danger"
                className="flex-1"
              >
                {cancelling ? <FaSpinner className="animate-spin inline" /> : 'Request Cancellation'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EliteDashboard;
