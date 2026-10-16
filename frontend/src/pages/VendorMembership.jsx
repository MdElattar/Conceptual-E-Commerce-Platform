import { Link, useNavigate } from 'react-router-dom';
import {
  FaCheckCircle, FaTimesCircle, FaSpinner, FaBan, FaRedo, FaGem, FaStore, FaChartLine, FaHeadset, FaStar, FaRocket, FaBullhorn, FaCogs, FaUserTie, FaArrowRight
} from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  useGetVendorPlansQuery,
  useGetVendorSubscriptionQuery,
  useSubscribeVendorMutation,
  useCancelVendorSubscriptionMutation,
} from '../slices/vendorSubscriptionApiSlice';
import Button from '../components/Button';

const VendorMembership = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const { data: plans, isLoading: plansLoading } = useGetVendorPlansQuery();
  const { data: vendorSub, isLoading: subLoading } = useGetVendorSubscriptionQuery(undefined, { skip: !userInfo });
  const [subscribeVendor, { isLoading: subscribing }] = useSubscribeVendorMutation();
  const [cancelVendorSubscription, { isLoading: cancelling }] = useCancelVendorSubscriptionMutation();

  const isVendorOrAdmin = userInfo && (userInfo.role === 'vendor' || userInfo.role === 'admin');

  if (!isVendorOrAdmin) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center font-amazon">
        <div className="text-center max-w-md px-6">
          <FaStore className="text-orange-500 mx-auto mb-6" size={64} />
          <h1 className="text-3xl font-black text-white mb-4">Vendor Access Only</h1>
          <p className="text-zinc-400 mb-8">You need a vendor account to manage vendor membership plans.</p>
          <Link to="/become-vendor" className="inline-block bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-xl font-bold text-sm transition-all no-underline">
            Become a Vendor
          </Link>
        </div>
      </div>
    );
  }

  const sub = vendorSub?.subscription;
  const currentPlan = vendorSub?.plan || 'free';
  const isActive = vendorSub?.hasSubscription;
  const currentLimits = vendorSub?.limits;

  const handleSubscribe = async (plan) => {
    try {
      await subscribeVendor({ plan, paymentMethod: 'stripe', autoRenew: true }).unwrap();
      toast.success(`Subscribed to ${plan} plan!`);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to subscribe.');
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your vendor subscription?')) return;
    try {
      await cancelVendorSubscription().unwrap();
      toast.success('Vendor subscription canceled.');
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to cancel.');
    }
  };

  const isLoading = plansLoading || subLoading;

  return (
    <div className="min-h-screen bg-zinc-900 font-amazon">
      {/* Header */}
      <div className="bg-gradient-to-br from-zinc-800 via-zinc-900 to-orange-900 border-b border-zinc-700">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-4">
                <FaStore className="text-orange-400" size={14} />
                <span className="text-xs font-bold uppercase tracking-widest text-zinc-300">Vendor Membership</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Vendor <span className="text-orange-400">Subscription</span>
              </h1>
              <p className="text-zinc-400 mt-2 max-w-xl">
                Choose the right plan for your store. Unlock more products, advertising credits, analytics, and priority support.
              </p>
            </div>
            {!isLoading && (
              <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-4 sm:p-6 min-w-[200px]">
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Current Plan</p>
                <div className="flex items-center gap-2">
                  <FaGem className="text-orange-400" size={18} />
                  <span className="text-xl font-black text-white capitalize">{currentPlan}</span>
                </div>
                {isActive && sub && (
                  <p className="text-xs text-green-400 mt-1">
                    <FaCheckCircle className="inline mr-1" />
                    Active · Expires {new Date(sub.expiresAt).toLocaleDateString()}
                  </p>
                )}
                {sub?.status === 'canceled' && (
                  <p className="text-xs text-yellow-400 mt-1">
                    <FaBan className="inline mr-1" />
                    Canceled · Expires {new Date(sub.expiresAt).toLocaleDateString()}
                  </p>
                )}
                {sub?.status === 'expired' && (
                  <p className="text-xs text-red-400 mt-1">
                    <FaTimesCircle className="inline mr-1" />
                    Expired
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Current Limits */}
        {currentLimits && currentPlan !== 'free' && (
          <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-6 mb-12">
            <h3 className="text-white font-bold text-lg mb-4">Your Plan Limits</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(currentLimits).map(([key, val]) => (
                <div key={key} className="bg-zinc-800/60 rounded-lg p-3">
                  <p className="text-zinc-400 text-xs capitalize mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-white font-bold text-lg">{typeof val === 'boolean' ? (val ? <FaCheckCircle className="text-green-400 inline" /> : <FaTimesCircle className="text-zinc-600 inline" />) : val}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-20">
            <FaSpinner className="animate-spin inline text-orange-500" size={40} />
          </div>
        )}

        {/* Plans Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {(plans || []).map((tier) => {
              const isCurrentPlan = currentPlan === tier.id && isActive;
              const isCanceled = sub?.status === 'canceled' && currentPlan === tier.id;
              const isExpired = sub?.status === 'expired' && currentPlan === tier.id;
              const showSubscribeBtn = (tier.id !== 'free' && !isCurrentPlan && !isCanceled && !isExpired) || (tier.id === currentPlan && !isActive && !isCanceled && !isExpired);
              const showCancelBtn = isCurrentPlan && tier.id !== 'free';
              const showReactivateBtn = (isCanceled || isExpired) && tier.id !== 'free';

              return (
                <div
                  key={tier.id}
                  className={`rounded-2xl border-2 p-6 sm:p-8 flex flex-col relative transition-all hover:shadow-xl ${
                    tier.popular
                      ? 'border-orange-500 bg-zinc-800/60 shadow-lg scale-[1.02] md:scale-105'
                      : 'border-zinc-700 bg-zinc-800/30'
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full">
                      Most Popular
                    </div>
                  )}
                  {isCurrentPlan && (
                    <div className="absolute top-3 right-3 bg-green-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                      Current Plan
                    </div>
                  )}

                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-1">
                      {tier.id === 'free' ? <FaStore className="text-zinc-500" size={20} /> : <FaRocket className="text-orange-400" size={20} />}
                      <h3 className="text-xl font-black text-white">{tier.name}</h3>
                    </div>
                    <p className="text-sm text-zinc-400">{tier.description}</p>
                  </div>

                  <div className="mb-6">
                    <span className="text-3xl font-black text-white">${tier.price}</span>
                    <span className="text-zinc-500 text-sm ml-1">{tier.period}</span>
                  </div>

                  {/* Limits Preview */}
                  {tier.limits && (
                    <div className="bg-zinc-800/60 rounded-lg p-3 mb-6">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">Limits</p>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-zinc-300"><span>Max Products</span><span className="font-bold text-white">{tier.limits.maxProducts}</span></div>
                        <div className="flex justify-between text-zinc-300"><span>Ad Credits</span><span className="font-bold text-white">{tier.limits.adCredits}/mo</span></div>
                        <div className="flex justify-between text-zinc-300"><span>Analytics</span>{tier.limits.analytics ? <FaCheckCircle className="text-green-400" size={12} /> : <FaTimesCircle className="text-zinc-600" size={12} />}</div>
                        <div className="flex justify-between text-zinc-300"><span>Priority Support</span>{tier.limits.prioritySupport ? <FaCheckCircle className="text-green-400" size={12} /> : <FaTimesCircle className="text-zinc-600" size={12} />}</div>
                        <div className="flex justify-between text-zinc-300"><span>API Access</span>{tier.limits.apiAccess ? <FaCheckCircle className="text-green-400" size={12} /> : <FaTimesCircle className="text-zinc-600" size={12} />}</div>
                      </div>
                    </div>
                  )}

                  <ul className="space-y-3 mb-8 flex-1">
                    {(tier.features || []).map((feat, i) => (
                      <li key={i} className={`flex items-start gap-3 text-sm ${feat.included ? 'text-zinc-300' : 'text-zinc-600'}`}>
                        {feat.included ? (
                          <FaCheckCircle className="text-green-500 mt-0.5 shrink-0" size={14} />
                        ) : (
                          <FaTimesCircle className="text-zinc-700 mt-0.5 shrink-0" size={14} />
                        )}
                        <span>{feat.text}</span>
                      </li>
                    ))}
                  </ul>

                  {showSubscribeBtn && (
                    <Button
                      onClick={() => handleSubscribe(tier.id)}
                      disabled={subscribing}
                      variant="primary"
                      className="w-full"
                    >
                      {subscribing ? <FaSpinner className="animate-spin inline mr-2" /> : null}
                      Subscribe - ${tier.price}/mo
                    </Button>
                  )}
                  {showCancelBtn && (
                    <Button
                      onClick={handleCancel}
                      disabled={cancelling}
                      variant="danger"
                      className="w-full"
                    >
                      {cancelling ? <FaSpinner className="animate-spin inline mr-2" /> : <FaBan className="inline mr-2" />}
                      Cancel Subscription
                    </Button>
                  )}
                  {showReactivateBtn && (
                    <Button
                      onClick={() => handleSubscribe(tier.id)}
                      disabled={subscribing}
                      variant="primary"
                      className="w-full"
                    >
                      {subscribing ? <FaSpinner className="animate-spin inline mr-2" /> : <FaRedo className="inline mr-2" />}
                      Reactivate
                    </Button>
                  )}
                  {tier.id === 'free' && isCurrentPlan && (
                    <div className="w-full text-center py-3.5 rounded-xl font-bold text-sm bg-zinc-700/50 text-zinc-400">
                      Your Current Plan
                    </div>
                  )}
                  {tier.id === 'free' && !isCurrentPlan && (
                    <div className="w-full text-center py-3.5 rounded-xl font-bold text-sm bg-zinc-700/50 text-zinc-400">
                      Free Forever
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Features Comparison Table */}
        <section className="mt-16">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-8 text-center">
            Feature <span className="text-orange-400">Comparison</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="py-4 px-4 text-zinc-400 font-bold uppercase tracking-widest">Feature</th>
                  {(plans || []).map(p => (
                    <th key={p.id} className="py-4 px-4 text-white font-bold text-center capitalize">{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(plans && plans[0]?.features || []).map((feat, i) => (
                  <tr key={i} className="border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4 text-zinc-300">{feat.text}</td>
                    {(plans || []).map(p => {
                      const pFeat = p.features?.[i];
                      return (
                        <td key={p.id} className="py-3 px-4 text-center">
                          {pFeat?.included ? (
                            <FaCheckCircle className="text-green-400 inline" size={16} />
                          ) : (
                            <FaTimesCircle className="text-zinc-700 inline" size={16} />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-2xl p-8 sm:p-10 text-center">
          <FaStar className="text-yellow-400 mx-auto mb-4" size={32} />
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-4">
            Maximize Your Store's Potential
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto mb-8">
            Upgrade to Professional or Enterprise to unlock unlimited products, advertising credits, 
            sales analytics, and dedicated support.
          </p>
          <Link
            to="/vendor/dashboard"
            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-xl font-bold text-sm transition-all no-underline active:scale-95"
          >
            <FaArrowRight />
            Back to Dashboard
          </Link>
        </section>
      </div>
    </div>
  );
};

export default VendorMembership;
