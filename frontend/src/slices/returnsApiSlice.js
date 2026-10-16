import { apiSlice } from './apiSlice';

const RETURNS_URL = '/api/returns';

export const returnsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getReturnPolicy: builder.query({
      query: () => `${RETURNS_URL}/policy`,
    }),
    getMyReturns: builder.query({
      query: () => RETURNS_URL,
      providesTags: ['Returns'],
    }),
    createReturnRequest: builder.mutation({
      query: (data) => ({
        url: RETURNS_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Returns'],
    }),
    getAllReturns: builder.query({
      query: () => `${RETURNS_URL}/admin`,
      providesTags: ['AllReturns'],
    }),
    updateReturnStatus: builder.mutation({
      query: ({ id, status, adminNote, refundAmount }) => ({
        url: `${RETURNS_URL}/${id}`,
        method: 'PUT',
        body: { status, adminNote, refundAmount },
      }),
      invalidatesTags: ['AllReturns', 'Returns'],
    }),
    getVendorReturns: builder.query({
      query: () => `${RETURNS_URL}/vendor`,
      providesTags: ['VendorReturns'],
    }),
    vendorUpdateReturnStatus: builder.mutation({
      query: ({ returnId, status, reason }) => ({
        url: `${RETURNS_URL}/${returnId}/vendor-status`,
        method: 'PUT',
        body: { status, reason },
      }),
      invalidatesTags: ['VendorReturns'],
    }),
  }),
});

export const {
  useGetReturnPolicyQuery,
  useGetMyReturnsQuery,
  useCreateReturnRequestMutation,
  useGetAllReturnsQuery,
  useUpdateReturnStatusMutation,
  useGetVendorReturnsQuery,
  useVendorUpdateReturnStatusMutation,
} = returnsApiSlice;
