import { apiSlice } from './apiSlice';

export const vendorSubscriptionApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getVendorPlans: builder.query({
      query: () => '/api/vendor-subscription/plans',
      providesTags: ['VendorSubscription'],
    }),
    getVendorSubscription: builder.query({
      query: () => '/api/vendor-subscription',
      providesTags: ['VendorSubscription'],
    }),
    subscribeVendor: builder.mutation({
      query: (data) => ({
        url: '/api/vendor-subscription',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['VendorSubscription'],
    }),
    cancelVendorSubscription: builder.mutation({
      query: () => ({
        url: '/api/vendor-subscription/cancel',
        method: 'POST',
      }),
      invalidatesTags: ['VendorSubscription'],
    }),
    getAllVendorSubscriptions: builder.query({
      query: (params) => ({
        url: '/api/vendor-subscription/admin',
        params,
      }),
      providesTags: ['VendorSubscription'],
    }),
  }),
});

export const {
  useGetVendorPlansQuery,
  useGetVendorSubscriptionQuery,
  useSubscribeVendorMutation,
  useCancelVendorSubscriptionMutation,
  useGetAllVendorSubscriptionsQuery,
} = vendorSubscriptionApiSlice;
