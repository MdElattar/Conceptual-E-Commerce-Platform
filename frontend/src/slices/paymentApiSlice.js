import { apiSlice } from './apiSlice';

// مسار الـ API الأساسي لعمليات الدفع (للتسهيل وتجنب الأخطاء الإملائية)
const PAYMENT_URL = '/api/payments';

export const paymentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    // 1. جلب الكروت المحفوظة
    getSavedCards: builder.query({
      query: () => ({ 
        url: `${PAYMENT_URL}/cards`,
        method: 'GET',
      }),
      // يوفر تاج عشان لما نمسح أو نضيف كارت، القائمة تتحدث أوتوماتيك (Refetch)
      providesTags: ['Payment'],
      // إبقاء البيانات في الكاش لمدة 5 ثواني لتسريع التنقل بين الصفحات
      keepUnusedDataFor: 5,
    }),

    // 2. إنشاء Setup Intent (أفضل نسميها Create لأنها بتعمل POST)
    createSetupIntent: builder.mutation({
      query: () => ({ 
        url: `${PAYMENT_URL}/setup-intent`, 
        method: 'POST',
      }),
    }),

    // 3. مسح كارت من الحساب
    deleteCard: builder.mutation({
      query: (paymentMethodId) => ({ 
        url: `${PAYMENT_URL}/cards/${paymentMethodId}`, 
        method: 'DELETE',
      }),
      // بمجرد المسح، اعمل ريفريش أوتوماتيك لتاج الـ Payment عشان الكارت يختفي من الشاشة
      invalidatesTags: ['Payment'],
    }),

    // 4. تعيين كارت كافتراضي
    setDefaultCard: builder.mutation({
      query: (data) => ({ 
        url: `${PAYMENT_URL}/cards/default`, 
        method: 'PUT', 
        body: data, // متوقع يتبعت { paymentMethodId: '...' }
      }),
      // تحديث القائمة عشان يظهر علامة "الافتراضي" على الكارت الصح
      invalidatesTags: ['Payment'],
    }),
    
  }),
});

// تصدير الهوكس (Hooks) لتكون جاهزة للاستخدام في الـ Components
export const { 
  useGetSavedCardsQuery, 
  useCreateSetupIntentMutation, 
  useDeleteCardMutation, 
  useSetDefaultCardMutation 
} = paymentApiSlice;