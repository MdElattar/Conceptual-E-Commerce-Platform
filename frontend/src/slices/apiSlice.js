import { fetchBaseQuery, createApi } from '@reduxjs/toolkit/query/react';

// إعداد الكويري الأساسي مع حماية التوكن
const baseQuery = fetchBaseQuery({
baseUrl: import.meta.env.VITE_API_ENDPOINT || 'https://conceptual-e-commerce-platform-m2k7.vercel.app',
  prepareHeaders: (headers, { getState }) => {
    // سحب التوكن من الـ State أو الـ LocalStorage لضمان أقصى اعتمادية
    const userInfo = getState().auth?.userInfo || JSON.parse(localStorage.getItem('userInfo'));

    if (userInfo && userInfo.token) {
      headers.set('authorization', `Bearer ${userInfo.token}`);
    }
    return headers;
  },
});

export const apiSlice = createApi({
  baseQuery,
  // التاجات دي هي اللي بتخلي الـ RTK Query سحري في تحديث البيانات تلقائياً
  tagTypes: ['Product', 'Order', 'User', 'Payment', 'Inquiry', 'Wishlist', 'Return', 'Elite', 'RecentlyViewed', 'VendorSubscription', 'Addresses'], 
  endpoints: () => ({}),
});