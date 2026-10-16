import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FaCheckCircle, FaTimesCircle, FaHardHat, FaStar, FaTruck, FaShieldAlt, FaHeadset, FaGem, FaRocket, FaBuilding, FaArrowRight, FaQuestionCircle, FaSpinner, FaBan, FaRedo, FaStore, FaTimes, FaDollarSign, FaChartLine, FaCrown, FaClock
} from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import ErrorDisplay from '../components/ErrorDisplay';
import {
  useGetPlansQuery, useGetMembershipQuery, useSubscribeMutation, useRequestCancellationMutation, useReactivateMembershipMutation, useCreateCheckoutSessionMutation
} from '../slices/eliteApiSlice';
import Button from '../components/Button';

const discounts = [
  { discount: '10%', label: 'Off All Orders', desc: 'Automatic discount on every purchase', tier: 'Elite' },
  { discount: '20%', label: 'Off Bulk Orders', desc: 'When ordering 10+ units of any item', tier: 'Elite' },
  { discount: '35%', label: 'Trader Discount', desc: 'Business volume pricing for Enterprise', tier: 'Enterprise' },
  { discount: 'Free', label: 'Expedited Shipping', desc: 'On all orders above EGP 500', tier: 'Elite+' },
];

const traderPromos = [
  { icon: FaBuilding, title: 'Bulk Procurement Portal', desc: 'Order equipment in bulk with tiered pricing. The more you buy, the more you save.' },
  { icon: FaRocket, title: 'Express Business Shipping', desc: 'Priority dispatch and delivery for all business orders. Same-day processing available.' },
  { icon: FaStore, title: 'Vendor Marketplace Access', desc: 'List your own products and reach thousands of buyers across our platform.' },
  { icon: FaShieldAlt, title: 'Verified Trader Badge', desc: 'Get verified as a trusted business partner with our Trader Verification Program.' },
];

const faqs = [
  { q: 'How does DK-TEC Elite work?', a: 'Choose a plan that fits your needs. Once subscribed, you get instant access to all the benefits included in your tier, including discounts, free shipping, and priority support.' },
  { q: 'Can I cancel anytime?', a: 'Yes, you can cancel your Elite subscription at any time. Your benefits remain active until the end of your billing period.' },
  { q: 'Are there any long-term contracts?', a: 'No. All plans are month-to-month with no long-term commitment required. You are free to upgrade, downgrade, or cancel as needed.' },
  { q: 'What payment methods are accepted?', a: 'We accept all major credit cards, wallet balance, and bank transfers for Enterprise plans.' },
  { q: 'Can businesses get custom pricing?', a: 'Enterprise plans come with custom negotiated pricing. Contact our sales team for a tailored solution for your business.' },
  { q: 'How do trader discounts work?', a: 'Trader discounts are automatically applied to qualifying bulk orders. The discount percentage increases with order volume and tier level.' },
];

const scrollToSection = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const SkeletonCard = () => (
  <div className="rounded-2xl border-2 border-zinc-200 p-6 sm:p-8 animate-pulse">
    <div className="h-4 bg-zinc-200 rounded w-1/3 mb-4" />
    <div className="h-8 bg-zinc-200 rounded w-1/2 mb-2" />
    <div className="h-3 bg-zinc-200 rounded w-2/3 mb-6" />
    <div className="h-10 bg-zinc-200 rounded w-1/3 mb-6" />
    <div className="space-y-3">
      {[1,2,3,4,5,6].map(j => <div key={j} className="h-3 bg-zinc-100 rounded" />)}
    </div>
  </div>
);

const DKElite = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const { rate, symbol: currencySymbol } = useSelector((state) => state.currency);
  const { data: plans, isLoading: plansLoading, isError: plansError, refetch: plansRefetch } = useGetPlansQuery();
  const { data: membership, isLoading: membershipLoading } = useGetMembershipQuery(undefined, { skip: !userInfo });
  const [subscribe, { isLoading: subscribing }] = useSubscribeMutation();
  const [createCheckoutSession, { isLoading: isCreatingSession }] = useCreateCheckoutSessionMutation();
  const [requestCancellation, { isLoading: cancelling }] = useRequestCancellationMutation();
  const [reactivateMembership, { isLoading: reactivating }] = useReactivateMembershipMutation();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const isVendor = userInfo?.role === 'vendor';
  const isElite = membership?.isElite;
  const subscription = membership?.subscription;
  const currentPlanName = subscription?.plan || 'free';
  const currentStatus = subscription?.status || 'free';
  const isPendingCancel = currentStatus === 'pending_cancel';

  const customerPlans = (plans || []).filter(p => p.id !== 'enterprise');
  const vendorPlans = (plans || []).filter(p => p.id === 'enterprise');
  const displayPlans = isVendor ? (plans || []) : customerPlans;

  const allFeatures = useMemo(() => {
    if (!displayPlans.length) return [];
    const featureMap = new Map();
    displayPlans.forEach(p => {
      (p.features || []).forEach(f => {
        if (!featureMap.has(f.text)) featureMap.set(f.text, {});
        featureMap.get(f.text)[p.id] = f.included;
      });
    });
    return Array.from(featureMap.entries()).map(([text, included]) => ({ text, included }));
  }, [displayPlans]);

  const getPrice = (price) => (price * rate);

  const handleSubscribe = async (plan, e) => {
    e?.preventDefault();
    if (!userInfo) { navigate('/register'); return; }
    try {
      const result = await subscribe({ plan, paymentMethod: 'wallet', autoRenew: true }).unwrap();
      if (result.success) {
        toast.success(`Welcome to DK-TEC Elite ${plan}!`);
        return;
      }
    } catch (err) {
      if (err?.data?.redirectToCheckout || err?.data?.message?.includes('Insufficient')) {
        try {
          const session = await createCheckoutSession({ plan }).unwrap();
          if (session.url) {
            window.location.href = session.url;
          }
        } catch (checkoutErr) {
          toast.error(checkoutErr?.data?.message || 'Failed to initiate checkout.');
        }
        return;
      }
      toast.error(err?.data?.message || 'Failed to subscribe.');
    }
  };

  const handleCancelRequest = async () => {
    if (!cancelReason.trim()) { toast.error('Please provide a reason.'); return; }
    try {
      await requestCancellation({ reason: cancelReason }).unwrap();
      toast.success('Cancellation request submitted to admin.');
      setShowCancelModal(false);
      setCancelReason('');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit cancellation.');
    }
  };

  const handleReactivate = async () => {
    try {
      await reactivateMembership().unwrap();
      toast.success('Elite membership reactivated!');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to reactivate.');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : 'N/A';

  const BannerStatus = () => {
    if (!userInfo) return null;
    if (membershipLoading) return <FaSpinner className="animate-spin inline mr-2" />;
    if (isPendingCancel) return <span className="text-orange-300 text-xs font-bold"><FaClock className="inline mr-1" />Cancellation Requested</span>;
    if (isElite) return <span className="text-green-300 text-xs font-bold"><FaCheckCircle className="inline mr-1" />Active · Expires {formatDate(subscription?.expiresAt)}</span>;
    if (currentStatus === 'canceled') return <span className="text-yellow-300 text-xs font-bold"><FaBan className="inline mr-1" />Canceled · Benefits until {formatDate(subscription?.expiresAt)}</span>;
    if (currentStatus === 'expired') return <span className="text-red-300 text-xs font-bold"><FaTimesCircle className="inline mr-1" />Expired</span>;
    return <span className="text-zinc-400 text-xs font-bold"><FaHardHat className="inline mr-1" />Free Plan</span>;
  };

  const getPlanAction = (tier) => {
    const isCurrentPlan = isElite && currentPlanName === tier.id;
    const isCanceled = currentStatus === 'canceled' && subscription?.plan === tier.id;
    const isExpired = currentStatus === 'expired' && subscription?.plan === tier.id;
    const isOnDifferentPaid = isElite && tier.id !== 'free' && currentPlanName !== tier.id && currentPlanName !== 'free';
    const isUpgrade = isOnDifferentPaid && tier.price > (plans?.find(p => p.id === currentPlanName)?.price || 0);
    const isDowngrade = isOnDifferentPaid && !isUpgrade;

    if (tier.id === 'free') {
      return <Link to={userInfo ? '#plans' : '/register'} className="w-full text-center py-3.5 rounded-xl font-bold text-sm transition-all no-underline bg-zinc-100 hover:bg-zinc-200 text-zinc-900 block active:scale-95">{userInfo ? 'Your Current Plan' : 'Get Started Free'}</Link>;
    }

    if (isCurrentPlan && !isPendingCancel) {
      return <Button onClick={() => setShowCancelModal(true)} disabled={cancelling} variant="danger" size="sm" className="w-full">{cancelling ? <FaSpinner className="animate-spin inline mr-2" /> : <FaBan className="inline mr-2" />}Cancel Membership</Button>;
    }

    if (isCanceled || isExpired) {
      return <Button onClick={handleReactivate} disabled={reactivating} variant="primary" size="sm" className="w-full">{reactivating ? <FaSpinner className="animate-spin inline mr-2" /> : <FaRedo className="inline mr-2" />}{isCanceled ? 'Resubscribe' : 'Reactivate'}</Button>;
    }

    if (isPendingCancel && isCurrentPlan) {
      return <div className="w-full text-center py-3.5 rounded-xl font-bold text-sm bg-yellow-50 text-yellow-700 border border-yellow-200">Cancellation Requested</div>;
    }

    if (isOnDifferentPaid) {
      return <Button onClick={(e) => handleSubscribe(tier.id, e)} disabled={subscribing} variant="primary" size="sm" className="w-full">{subscribing ? <FaSpinner className="animate-spin inline mr-2" /> : null}{isUpgrade ? 'Upgrade' : 'Downgrade'}</Button>;
    }

    if (isCurrentPlan) {
      return <div className="w-full text-center py-3.5 rounded-xl font-bold text-sm bg-zinc-100 text-zinc-500">Your Current Plan</div>;
    }

    if (!userInfo) {
      return <Link to="/register" className="w-full text-center py-3.5 rounded-xl font-bold text-sm transition-all no-underline active:scale-95 bg-orange-600 hover:bg-orange-700 text-white shadow-md block">Sign Up & Subscribe</Link>;
    }

    return <Button onClick={(e) => handleSubscribe(tier.id, e)} disabled={subscribing} variant="primary" className="w-full">{subscribing ? <FaSpinner className="animate-spin inline mr-2" /> : null}Subscribe Now</Button>;
  };

  if (plansError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-amazon">
        <div className="text-center max-w-md px-6">
          <FaTimesCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-black text-zinc-900 mb-2">Something Went Wrong</h2>
          <p className="text-zinc-500 mb-6">Failed to load membership plans. Please try again.</p>
          <Button onClick={plansRefetch} variant="secondary">Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen font-amazon">
      {/* Membership Banner */}
      {userInfo && (
        <div className={`py-2 px-4 text-center text-sm font-bold ${
          isPendingCancel ? 'bg-orange-100 text-orange-800'
          : isElite ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white'
          : currentStatus === 'canceled' ? 'bg-yellow-100 text-yellow-800'
          : currentStatus === 'expired' ? 'bg-red-100 text-red-800'
          : 'bg-zinc-100 text-zinc-600'
        }`}>
          {membershipLoading ? (
            <FaSpinner className="animate-spin inline mr-2" />
          ) : isPendingCancel ? (
            <><FaClock className="inline mr-2 text-orange-600" />Cancellation Requested — Your benefits remain active until {formatDate(subscription?.expiresAt)}</>
          ) : isElite ? (
            <><FaGem className="inline mr-2 text-yellow-300" />Elite Member — {subscription?.plan} plan · <BannerStatus /></>
          ) : currentStatus === 'canceled' ? (
            <><FaBan className="inline mr-2" />Membership Canceled · Benefits until {formatDate(subscription?.expiresAt)} <Button onClick={handleReactivate} disabled={reactivating} variant="link" className="ml-2 underline font-black">{reactivating ? <FaSpinner className="animate-spin inline" /> : 'Reactivate'}</Button></>
          ) : currentStatus === 'expired' ? (
            <><FaTimesCircle className="inline mr-2" />Membership Expired <Button onClick={() => scrollToSection('plans')} variant="link" className="ml-2 underline font-black">Resubscribe</Button></>
          ) : (
            <><FaHardHat className="inline mr-2" />You are on Starter plan. <Link to="#plans" className="text-orange-600 underline font-black" onClick={(e) => { e.preventDefault(); scrollToSection('plans'); }}>Upgrade to Elite</Link></>
          )}
        </div>
      )}

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-orange-900 text-white">
        <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-20">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-6">
                <FaGem className="text-orange-400" size={14} />
                <span className="text-xs font-bold uppercase tracking-widest">Premium Membership Program</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-4 leading-tight">
                Elevate Your <span className="text-orange-400">Equipment</span> Experience
              </h1>
              <p className="text-lg sm:text-xl text-zinc-300 max-w-2xl mb-8 leading-relaxed">
                Unlock exclusive discounts, free expedited shipping, priority support, and trader promotions.
                From individual buyers to enterprise fleets — there is a plan for you.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button onClick={() => scrollToSection('plans')} variant="primary">
                  View Plans & Pricing
                </Button>
                <Button onClick={() => scrollToSection('compare')} variant="secondary">
                  Compare Plans
                </Button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="relative">
                <div className="w-64 h-64 sm:w-80 sm:h-80 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-full blur-3xl absolute -top-10 -left-10" />
                <div className="relative bg-zinc-800/50 border border-zinc-700/50 rounded-3xl p-8 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <FaHardHat className="text-orange-400" size={24} />
                    <span className="text-xl font-black">DK-TEC</span>
                    <span className="text-orange-400 font-black italic">Elite</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm"><FaCheckCircle className="text-green-400 shrink-0" /><span className="text-zinc-300">Save up to 35% on every order</span></div>
                    <div className="flex items-center gap-3 text-sm"><FaCheckCircle className="text-green-400 shrink-0" /><span className="text-zinc-300">Free expedited shipping all year</span></div>
                    <div className="flex items-center gap-3 text-sm"><FaCheckCircle className="text-green-400 shrink-0" /><span className="text-zinc-300">Priority 24/7 customer support</span></div>
                    <div className="flex items-center gap-3 text-sm"><FaCheckCircle className="text-green-400 shrink-0" /><span className="text-zinc-300">Early access to deals & new drops</span></div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-zinc-700/50">
                    <span className="text-2xl font-black">{currencySymbol}{(9.99 * rate).toFixed(2)}</span>
                    <span className="text-zinc-400 text-sm ml-1">/month</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-zinc-50 border-y border-zinc-200">
        <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: '23%', label: 'Average Member Savings' },
              { number: '50K+', label: 'Active Elite Members' },
              { number: '4.8★', label: 'Member Satisfaction' },
              { number: '2,500+', label: 'Enterprise Partners' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-2xl sm:text-3xl font-black text-orange-600">{stat.number}</div>
                <div className="text-xs sm:text-sm text-zinc-600 font-medium mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section id="plans" className="py-20">
        <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight mb-3">
              Choose Your <span className="text-orange-600">Elite</span> Plan
            </h2>
            <p className="text-zinc-500 max-w-2xl mx-auto">
              All plans include free standard shipping, order tracking, and our satisfaction guarantee.
              Upgrade anytime to unlock more benefits.
            </p>
          </div>

          {plansError ? (
            <ErrorDisplay message={plansError?.data?.message || 'Failed to load plans'} variant="danger" />
          ) : plansLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 max-w-6xl mx-auto">
              {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="max-w-6xl mx-auto space-y-12">
              {/* Customer Plans */}
              <div>
                <h3 className="text-xl font-black text-zinc-700 mb-6 flex items-center gap-2">
                  <FaGem className="text-orange-500" size={18} /> Customer Plans
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                  {customerPlans.map((tier) => (
                    <div key={tier.id} className={`rounded-2xl border-2 p-6 sm:p-8 flex flex-col relative transition-all hover:shadow-xl hover:-translate-y-1 ${
                      tier.popular ? 'border-orange-500 bg-orange-50/30 shadow-lg scale-[1.02] lg:scale-105' : 'border-zinc-200 bg-white'
                    }`}>
                      {tier.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full">Most Popular</div>}
                      {isElite && currentPlanName === tier.id && <div className="absolute top-3 right-3 bg-green-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Your Plan</div>}
                      <div className="mb-6">
                        <div className="flex items-center gap-2 mb-1">
                          {tier.id === 'free' ? <FaHardHat className="text-zinc-400" size={18} /> : <FaGem className="text-orange-600" size={18} />}
                          <h3 className="text-xl font-black text-zinc-900">{tier.name}</h3>
                        </div>
                        <p className="text-sm text-zinc-500">{tier.description}</p>
                      </div>
                      <div className="mb-6">
                        <span className="text-3xl font-black text-zinc-900">{currencySymbol}{getPrice(tier.price).toFixed(2)}</span>
                        <span className="text-zinc-500 text-sm ml-1">{tier.period}</span>
                        {tier.id === 'yearly' && <div className="text-xs text-green-600 font-bold mt-1">Save {currencySymbol}{(getPrice(9.99 * 12 - 99.99)).toFixed(2)} vs monthly</div>}
                      </div>
                      <ul className="space-y-3 mb-8 flex-1">
                        {(tier.features || []).map((feat, i) => (
                          <li key={i} className={`flex items-start gap-3 text-sm ${feat.included ? 'text-zinc-700' : 'text-zinc-400'}`}>
                            {feat.included ? <FaCheckCircle className="text-green-500 mt-0.5 shrink-0" size={14} /> : <FaTimesCircle className="text-zinc-300 mt-0.5 shrink-0" size={14} />}
                            <span>{feat.text}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-auto">{getPlanAction(tier)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vendor Plans */}
              {isVendor && vendorPlans.length > 0 && (
                <div>
                  <h3 className="text-xl font-black text-zinc-700 mb-6 flex items-center gap-2">
                    <FaStore className="text-orange-500" size={18} /> Vendor & Enterprise Plans
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-3xl mx-auto">
                    {vendorPlans.map((tier) => (
                      <div key={tier.id} className="rounded-2xl border-2 border-zinc-200 bg-white p-6 sm:p-8 flex flex-col relative transition-all hover:shadow-xl hover:-translate-y-1">
                        {isElite && currentPlanName === tier.id && <div className="absolute top-3 right-3 bg-green-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">Your Plan</div>}
                        <div className="mb-6">
                          <div className="flex items-center gap-2 mb-1">
                            <FaBuilding className="text-orange-600" size={18} />
                            <h3 className="text-xl font-black text-zinc-900">{tier.name}</h3>
                          </div>
                          <p className="text-sm text-zinc-500">{tier.description}</p>
                        </div>
                        <div className="mb-6">
                          <span className="text-3xl font-black text-zinc-900">{currencySymbol}{getPrice(tier.price).toFixed(2)}</span>
                          <span className="text-zinc-500 text-sm ml-1">{tier.period}</span>
                        </div>
                        <ul className="space-y-3 mb-8 flex-1">
                          {(tier.features || []).map((feat, i) => (
                            <li key={i} className={`flex items-start gap-3 text-sm ${feat.included ? 'text-zinc-700' : 'text-zinc-400'}`}>
                              {feat.included ? <FaCheckCircle className="text-green-500 mt-0.5 shrink-0" size={14} /> : <FaTimesCircle className="text-zinc-300 mt-0.5 shrink-0" size={14} />}
                              <span>{feat.text}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-auto">{getPlanAction(tier)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Plan Comparison Table */}
      <section id="compare" className="py-16 bg-zinc-50">
        <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight mb-3">
              Plan <span className="text-orange-600">Comparison</span>
            </h2>
            <p className="text-zinc-500 max-w-2xl mx-auto">See exactly what each plan includes.</p>
          </div>
          {displayPlans.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 bg-white sticky top-0 z-10">
                    <th className="py-4 px-4 text-zinc-500 font-bold uppercase tracking-widest text-xs">Feature</th>
                    {displayPlans.map(p => (
                      <th key={p.id} className="py-4 px-4 text-center font-black text-zinc-900 capitalize text-sm">{p.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allFeatures.map((feat, i) => (
                    <tr key={i} className="border-b border-zinc-100 hover:bg-white transition-colors">
                      <td className="py-3 px-4 text-zinc-700 font-medium">{feat.text}</td>
                      {displayPlans.map(p => (
                        <td key={p.id} className="py-3 px-4 text-center">
                          {feat.included[p.id] ? (
                            <FaCheckCircle className="text-green-500 inline" size={18} />
                          ) : (
                            <FaTimesCircle className="text-zinc-300 inline" size={18} />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Member Discounts */}
      <section className="py-16">
        <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight mb-3">
              Member-Only <span className="text-orange-600">Discounts</span>
            </h2>
            <p className="text-zinc-500 max-w-2xl mx-auto">Elite members save on every order. The higher your tier, the bigger your savings.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {discounts.map((d, i) => (
              <div key={i} className="bg-white border border-zinc-200 rounded-2xl p-6 text-center hover:shadow-lg transition-shadow">
                <div className="text-3xl font-black text-orange-600 mb-1">{d.discount}</div>
                <div className="text-sm font-bold text-zinc-900 mb-1">{d.label}</div>
                <div className="text-xs text-zinc-500">{d.desc}</div>
                <div className="mt-3 inline-block bg-orange-50 text-orange-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">{d.tier}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trader / Business Section */}
      <section className="py-20 bg-zinc-50">
        <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12 mb-16">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-4 py-1.5 mb-4">
                <FaBuilding className="text-orange-600" size={14} />
                <span className="text-xs font-bold text-orange-700 uppercase tracking-widest">For Businesses & Traders</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight mb-4">
                Built for <span className="text-orange-600">Trade</span>
              </h2>
              <p className="text-zinc-500 max-w-xl leading-relaxed">
                Enterprise and Trader plans are designed for businesses that need equipment at scale.
                From construction fleets to industrial suppliers, we have you covered.
              </p>
            </div>
            <div className="flex-1 bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-3xl p-8 text-white">
              <div className="flex items-center gap-2 mb-4">
                <FaStar className="text-yellow-400" />
                <span className="font-black text-sm uppercase tracking-widest">Trader Success</span>
              </div>
              <p className="text-zinc-300 text-sm italic leading-relaxed">
                "Since joining DK-TEC Enterprise, our procurement costs dropped by 28%. The bulk ordering
                system and dedicated account manager transformed how we source equipment."
              </p>
              <div className="mt-4 pt-4 border-t border-zinc-700/50 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center font-black text-sm">AM</div>
                <div>
                  <p className="font-bold text-sm">Ahmed Mansour</p>
                  <p className="text-[10px] text-zinc-400">Operations Director, Mansour Group</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {traderPromos.map((promo, i) => (
              <div key={i} className="bg-white border border-zinc-200 rounded-2xl p-6 hover:shadow-lg transition-all hover:border-orange-200 group">
                <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-orange-100 transition-colors">
                  <promo.icon className="text-orange-600" size={22} />
                </div>
                <h3 className="font-bold text-zinc-900 mb-2 text-sm">{promo.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{promo.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight mb-3">
              Frequently Asked <span className="text-orange-600">Questions</span>
            </h2>
          </div>
          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((faq, i) => (
              <details key={i} className="bg-white border border-zinc-200 rounded-xl overflow-hidden group">
                <summary className="px-5 py-4 font-bold text-sm text-zinc-900 cursor-pointer flex items-center justify-between hover:bg-zinc-50 transition-colors list-none">
                  <span className="flex items-center gap-2">
                    <FaQuestionCircle className="text-orange-500 shrink-0" size={14} />
                    {faq.q}
                  </span>
                  <FaArrowRight className="text-zinc-400 group-open:rotate-90 transition-transform shrink-0" size={12} />
                </summary>
                <div className="px-5 pb-4 text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-3">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-zinc-900 via-zinc-800 to-orange-900 text-white">
        <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FaGem className="text-orange-400 mx-auto mb-4" size={36} />
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
            {isElite ? 'You Are Already an Elite Member!' : 'Ready to Upgrade Your Experience?'}
          </h2>
          <p className="text-zinc-300 max-w-xl mx-auto mb-8">
            {isElite ? 'Enjoying your benefits? Manage your subscription from your dashboard.' : 'Join thousands of members saving on equipment every day. Start with a free Starter account and upgrade when you are ready.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isElite ? (
              <Link to="/elite-dashboard" className="bg-orange-600 hover:bg-orange-700 text-white px-10 py-4 rounded-xl font-bold text-sm transition-all no-underline active:scale-95">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="bg-orange-600 hover:bg-orange-700 text-white px-10 py-4 rounded-xl font-bold text-sm transition-all no-underline active:scale-95">
                  Create Free Account
                </Link>
                <Link to="/contact" className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-10 py-4 rounded-xl font-bold text-sm transition-all no-underline backdrop-blur-sm active:scale-95">
                  Talk to Sales
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCancelModal(false)} />
          <div className="relative bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <button onClick={() => setShowCancelModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition-colors bg-transparent border-none cursor-pointer">
              <FaTimes size={18} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center">
                <FaBan className="text-red-500" size={22} />
              </div>
              <div>
                <h3 className="text-xl font-black text-zinc-900">Cancel Membership</h3>
                <p className="text-sm text-zinc-500">Are you sure you want to cancel?</p>
              </div>
            </div>
            <p className="text-sm text-zinc-600 mb-3">Please tell us why you are leaving (required):</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Your feedback helps us improve..."
              className="w-full border border-zinc-300 rounded-xl p-3 text-sm outline-none focus:border-orange-500 transition-colors resize-none h-28"
              required
            />
            <p className="text-xs text-zinc-400 mb-4">Your benefits remain active until the end of your billing period.</p>
            <div className="flex gap-3">
              <Button
                onClick={() => { setShowCancelModal(false); setCancelReason(''); }}
                variant="secondary"
                className="flex-1"
              >
                Keep My Membership
              </Button>
              <Button
                onClick={handleCancelRequest}
                disabled={cancelling || !cancelReason.trim()}
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

export default DKElite;
