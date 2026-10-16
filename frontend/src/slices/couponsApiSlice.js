import { apiSlice } from './apiSlice';

export const couponsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCoupons: builder.query({
      query: () => ({ url: `/api/coupons` }),
      providesTags: ['Coupon'],
    }),
    createCoupon: builder.mutation({
      query: (data) => ({
        url: `/api/coupons`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Coupon'],
    }),
    // ضيف الجزء ده ضروري جداً
    deleteCoupon: builder.mutation({
      query: (couponId) => ({
        url: `/api/coupons/${couponId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Coupon'],
    }),
    validateCoupon: builder.mutation({
      query: (data) => ({
        url: `/api/coupons/validate`,
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const { 
  useCreateCouponMutation, 
  useValidateCouponMutation,
  useGetCouponsQuery,
  useDeleteCouponMutation // لازم تتصدر هنا
} = couponsApiSlice;