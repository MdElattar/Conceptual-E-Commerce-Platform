// src/slices/advertisingApiSlice.js
import { apiSlice } from './apiSlice';

export const advertisingApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // 🌟 دالة التاجر لطلب تمويل منتج
    requestAdBoost: builder.mutation({
      query: (data) => ({
        url: '/api/advertising/boost',
        method: 'POST',
        body: data,
      }),
    }),
    
    // 🌟 دالة الأدمن لجلب طلبات الإعلانات
    getPendingAdRequests: builder.query({
      query: () => ({
        url: '/api/advertising/requests',
      }),
      keepUnusedDataFor: 5,
    }),

    // 🌟 دالة الأدمن للموافقة/الرفض
    resolveAdRequest: builder.mutation({
      query: ({ id, action }) => ({
        url: `/api/advertising/requests/${id}`,
        method: 'PUT',
        body: { action },
      }),
    }),
  }),
});

export const {
  useRequestAdBoostMutation,
  useGetPendingAdRequestsQuery,
  useResolveAdRequestMutation,
} = advertisingApiSlice;