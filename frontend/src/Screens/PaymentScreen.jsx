import { useState } from 'react';
import { FaPlus, FaTimes, FaTrash, FaCheckCircle, FaLock, FaShieldAlt, FaCreditCard } from 'react-icons/fa';
import { SiVisa, SiMastercard } from 'react-icons/si';
import { toast } from 'react-toastify';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardNumberElement, CardExpiryElement, CardCvcElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { 
  useGetSavedCardsQuery, 
  useDeleteCardMutation, 
  useSetDefaultCardMutation, 
  useCreateSetupIntentMutation // 👈 تم التحديث ليتطابق مع الـ apiSlice
} from '../slices/paymentApiSlice';

// استخدام متغير البيئة كممارسة صحيحة، مع وضع مفتاحك كبديل احتياطي
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CARD_STYLE = {
  style: {
    base: {
      color: "#1a1a1a",
      fontSize: "14px",
      fontFamily: "Inter, sans-serif",
      "::placeholder": { color: "#9ca3af" },
    },
  },
};

const AddCardModal = ({ onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [createSetupIntent] = useCreateSetupIntentMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setIsSubmitting(true);

    try {
      // 1. جلب الـ Client Secret من الباك أند
      const { clientSecret } = await createSetupIntent().unwrap();
      
      // 2. تأكيد حفظ الكارت مع سترايب
      const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card: elements.getElement(CardNumberElement) },
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Card Securely Linked!');
        onSuccess();
      }
    } catch (err) {
      toast.error(err?.data?.message || 'Connection failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-zinc-900/40 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="bg-gray-50 px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-sm font-bold uppercase tracking-widest text-gray-700 flex items-center gap-2">
            <FaLock size={12} className="text-orange-600" /> New Card
          </h2>
          <button type="button" onClick={onCancel} disabled={isSubmitting} className="text-gray-400 hover:text-black transition-colors disabled:opacity-50">
            <FaTimes size={16} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase">Card Number</label>
            <div className="px-3 py-3 bg-gray-50 rounded-lg border focus-within:ring-1 focus-within:ring-orange-500 transition-all">
              <CardNumberElement options={CARD_STYLE} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">Expiry</label>
              <div className="px-3 py-3 bg-gray-50 rounded-lg border focus-within:ring-1 focus-within:ring-orange-500 transition-all">
                <CardExpiryElement options={CARD_STYLE} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase">CVC</label>
              <div className="px-3 py-3 bg-gray-50 rounded-lg border focus-within:ring-1 focus-within:ring-orange-500 transition-all">
                <CardCvcElement options={CARD_STYLE} />
              </div>
            </div>
          </div>

          <button 
            disabled={isSubmitting || !stripe} 
            className="w-full bg-black text-white py-3.5 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'SECURING...' : 'LINK CARD'}
          </button>
        </div>
      </form>
    </div>
  );
};

const PaymentScreen = () => {
  const { data: cards, isLoading } = useGetSavedCardsQuery();
  const [deleteCard] = useDeleteCardMutation();
  const [setDefault] = useSetDefaultCardMutation();
  const [showAdd, setShowAdd] = useState(false);

  // دوال منفصلة للتعامل مع الأخطاء والنجاح بشكل نظيف
  const handleDeleteCard = async (id) => {
    if (window.confirm('Are you sure you want to delete this card?')) {
      try {
        await deleteCard(id).unwrap();
        toast.success('Card removed successfully');
      } catch (err) {
        toast.error(err?.data?.message || 'Failed to remove card');
      }
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefault({ paymentMethodId: id }).unwrap();
      toast.success('Default card updated');
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update default card');
    }
  };

  return (
    <div className="pt-28 pb-10 px-4 max-w-5xl mx-auto min-h-screen antialiased">
      <div className="flex justify-between items-center mb-12 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900">PAYMENT <span className="text-orange-600 italic">WALLET</span></h1>
          <p className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-tighter">Manage your secure encryption methods</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)} 
          className="bg-black text-white px-5 py-2.5 rounded-full font-bold text-xs hover:bg-orange-600 transition-all flex items-center gap-2 shadow-lg active:scale-95"
        >
          <FaPlus size={10} /> ADD METHOD
        </button>
      </div>

      {showAdd && (
        <Elements stripe={stripePromise}>
          <AddCardModal 
            onSuccess={() => setShowAdd(false)} 
            onCancel={() => setShowAdd(false)} 
          />
        </Elements>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="h-44 bg-gray-100 rounded-2xl animate-pulse"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(!cards || cards.length === 0) && (
            <div className="col-span-full py-16 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <FaCreditCard size={32} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-400 text-xs font-bold uppercase">No secure methods saved yet</p>
            </div>
          )}
          
          {cards?.map(card => (
            <div 
              key={card.id} 
              className={`relative p-6 rounded-2xl border transition-all duration-300 group
                ${card.isDefault 
                  ? 'bg-zinc-900 text-white border-zinc-800 shadow-xl ring-1 ring-orange-600/50' 
                  : 'bg-white border-gray-100 hover:border-gray-300 hover:shadow-md'}`}
            >
              <div className="flex justify-between items-start mb-8">
                <div className={`p-2 rounded-lg ${card.isDefault ? 'bg-white/5' : 'bg-gray-50'}`}>
                    {card.brand === 'visa' ? <SiVisa size={28} /> : <SiMastercard size={28} />}
                </div>
                {card.isDefault && (
                  <span className="text-[8px] font-black px-2 py-1 bg-orange-600 rounded text-white tracking-widest">DEFAULT</span>
                )}
              </div>

              <p className={`text-lg font-mono tracking-[0.2em] mb-4 ${card.isDefault ? 'text-zinc-100' : 'text-zinc-800'}`}>
                •••• {card.last4}
              </p>

              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold opacity-50 uppercase">{card.expMonth}/{card.expYear}</span>
                
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!card.isDefault && (
                    <button 
                      onClick={() => handleSetDefault(card.id)}
                      className="p-2 bg-gray-100 text-gray-500 hover:bg-green-500 hover:text-white rounded-lg transition-all"
                      title="Set as Default"
                    >
                      <FaCheckCircle size={12} />
                    </button>
                  )}
                  <button 
                    onClick={() => handleDeleteCard(card.id)}
                    className="p-2 bg-gray-100 text-gray-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                    title="Delete Card"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-20 flex flex-wrap items-center justify-center gap-8 opacity-40">
        <div className="flex items-center gap-2 text-[10px] font-bold"><FaShieldAlt /> PCI-DSS COMPLIANT</div>
        <div className="flex items-center gap-2 text-[10px] font-bold"><FaLock /> 256-BIT ENCRYPTION</div>
        <div className="flex items-center gap-2 text-[10px] font-bold"><SiVisa size={20}/></div>
        <div className="flex items-center gap-2 text-[10px] font-bold"><SiMastercard size={20}/></div>
      </div>
    </div>
  );
};

export default PaymentScreen;