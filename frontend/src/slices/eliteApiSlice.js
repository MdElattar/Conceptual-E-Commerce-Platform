import { apiSlice } from './apiSlice';

export const eliteApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getPlans: builder.query({
      query: () => '/api/elite/plans',
      providesTags: ['Elite'],
    }),
    getMembership: builder.query({
      query: () => '/api/elite',
      providesTags: ['Elite'],
    }),
    subscribe: builder.mutation({
      query: (data) => ({
        url: '/api/elite',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Elite'],
    }),
    reactivateMembership: builder.mutation({
      query: () => ({
        url: '/api/elite/reactivate',
        method: 'POST',
      }),
      invalidatesTags: ['Elite'],
    }),
    checkElite: builder.query({
      query: (userId) => `/api/elite/check/${userId}`,
    }),
    getAllMemberships: builder.query({
      query: (params) => ({
        url: '/api/elite/admin',
        params,
      }),
      providesTags: ['Elite'],
    }),
    requestCancellation: builder.mutation({
      query: (data) => ({
        url: '/api/elite/cancel-request',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Elite'],
    }),
    adminUpdateMembership: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/elite/admin/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Elite'],
    }),
    toggleAutoRenew: builder.mutation({
      query: () => ({
        url: '/api/elite/auto-renew',
        method: 'PATCH',
      }),
      invalidatesTags: ['Elite'],
    }),
    createCheckoutSession: builder.mutation({
      query: (data) => ({
        url: '/api/elite/create-checkout-session',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useGetPlansQuery,
  useGetMembershipQuery,
  useSubscribeMutation,
  useReactivateMembershipMutation,
  useCheckEliteQuery,
  useGetAllMembershipsQuery,
  useAdminUpdateMembershipMutation,
  useRequestCancellationMutation,
  useToggleAutoRenewMutation,
  useCreateCheckoutSessionMutation,
} = eliteApiSlice;
