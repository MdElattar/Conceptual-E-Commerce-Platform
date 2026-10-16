import { fetchBaseQuery, createApi } from '@reduxjs/toolkit/query/react';

// إعداد الكويري الأساسي مع ربط الدومين بشكل مباشر وصريح للباك إند
const baseQuery = fetchBaseQuery({
  baseUrl: 'https://conceptual-e-commerce-platform-m2k7.vercel.app',
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
  // التاجات لتحديث البيانات تلقائياً عبر RTK Query
  tagTypes: ['Product', 'Order', 'User', 'Payment', 'Inquiry', 'Wishlist', 'Return', 'Elite', 'RecentlyViewed', 'VendorSubscription', 'Addresses'], 
  endpoints: () => ({}),
});