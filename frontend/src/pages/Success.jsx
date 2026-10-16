import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { usePayOrderMutation } from '../slices/orderApiSlice';
import { toast } from 'react-toastify';
import { FaCheckCircle, FaShoppingBag, FaArrowRight, FaMicrochip, FaSpinner } from 'react-icons/fa';
import Confetti from 'react-confetti' // تريك: استخدام الاختزال التلقائي لأبعاد الشاشة

const Success = () => {
  const { clearCart } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [payOrder] = usePayOrderMutation();
  const [isProcessing, setIsProcessing] = useState(true);

  const [windowDimensions, setWindowDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('orderId');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);

    const confirmPayment = async () => {
      if (!orderId) {
        setIsProcessing(false);
        return;
      }

      try {
        if (sessionId) {
          await payOrder({ 
            orderId, 
            details: { id: sessionId, status: 'COMPLETED' } 
          }).unwrap();
        } 
        
        clearCart();
        toast.success('Order processed successfully!', { toastId: 'success-toast' });
      } catch (err) {
        console.error('Payment Update Status:', err);
        clearCart(); 
      } finally {
        setIsProcessing(false);
      }
    };

    confirmPayment();
    return () => window.removeEventListener('resize', handleResize);
  }, [orderId, sessionId, payOrder, clearCart]);

  return (
    // تريك 1: استخدام max-w-full مع الإجبار على قفل العرض الداخلي يمنع الصفحة من التمدد بسبب الهيدر/الفوتر الخارجين
    <div className="w-full max-w-full overflow-hidden flex flex-col items-center justify-center bg-gray-50 px-4 py-8 sm:py-16 antialiased min-h-[calc(100vh-8rem)] box-border">
      
      {!isProcessing && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <Confetti 
            width={windowDimensions.width - 20} 
            height={windowDimensions.height} 
            recycle={false} 
            numberOfPieces={100} 
          />
        </div>
      )}

      {/* تريك 2: تحديد العرض الأقصى كنسبة شاشة ثابتة للموبايل لمنع أي انبعاج جانبي مهما كانت عيوب العناصر الأبوية */}
      <div className="w-full mt-16 max-w-[340px] xs:max-w-[360px] sm:max-w-md bg-white p-5 sm:p-10 rounded-2xl shadow-sm border border-gray-200 text-center relative overflow-hidden transition-all box-border mx-auto">
        
        {/* Top Tech Border Indicator */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
        
        {/* Status Icon Unit */}
        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mx-auto mb-4 border shadow-sm transition-colors
          ${isProcessing ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'}`}>
          {isProcessing ? (
            <FaSpinner className="text-orange-600 text-lg sm:text-xl animate-spin" />
          ) : (
            <FaCheckCircle className="text-green-600 text-lg sm:text-xl" />
          )}
        </div>

        <h1 className="text-xl sm:text-3xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">
          {isProcessing ? (
            <>Verifying <span className="text-orange-600">Payment</span></>
          ) : (
            <>Payment <span className="text-green-600">Successful</span></>
          )}
        </h1>

        <div className="flex items-center justify-center gap-1.5 mt-2 mb-4 opacity-60">
          <FaMicrochip className={isProcessing ? "text-orange-500 text-[9px]" : "text-green-500 text-[9px]"} />
          <p className="text-gray-400 font-bold text-[8px] sm:text-[9px] uppercase tracking-wider">Transaction Settlement Terminal</p>
        </div>
        
        <p className="text-gray-500 font-medium text-[11px] sm:text-xs leading-relaxed mb-6 px-1">
          {isProcessing 
            ? 'Securing communication lines. Please wait while we finalize your order clearance details.' 
            : `Thank you for your purchase! Your industrial manifest order #${orderId?.slice(-6)} has been secured and dispatched to logistics.`
          }
        </p>

        {/* Action Buttons Hub */}
        <div className="space-y-2.5 w-full box-border">
          <Link 
            to="/orders" 
            className="group flex items-center justify-center w-full bg-gray-950 text-white py-3 sm:py-3.5 rounded-xl font-bold uppercase tracking-wider text-[11px] sm:text-xs shadow-sm hover:bg-orange-600 transition-all gap-2"
          >
            <FaShoppingBag size={11} />
            View My Orders
            <FaArrowRight size={9} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link 
            to="/" 
            className="flex items-center justify-center w-full bg-gray-50 text-gray-700 border border-gray-200 py-3 sm:py-3.5 rounded-xl font-bold uppercase tracking-wider text-[11px] sm:text-xs hover:bg-gray-100 transition-all"
          >
            Continue Procurement
          </Link>
        </div>

        {/* Technical Transaction Footer */}
        {!isProcessing && (
          /* تريك 3: صياغة صارمة للـ TX_ID النصي ليعمل ملتفاً للداخل بالملي ولا يضغط على أطراف الكادر المطلقة */
          <div className="mt-6 pt-4 border-t border-gray-100 text-[8px] sm:text-[9px] text-gray-400 font-bold uppercase tracking-tight block bg-gray-50/70 px-2 py-2 rounded-lg max-w-full overflow-hidden break-all whitespace-normal [word-break:break-all]">
            <span className="text-gray-500 block mb-0.5">TX_ID:</span>
            <span className="text-gray-600 block leading-tight">{sessionId || 'DIRECT_CHARGE_' + orderId?.slice(0, 12).toUpperCase()}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Success;