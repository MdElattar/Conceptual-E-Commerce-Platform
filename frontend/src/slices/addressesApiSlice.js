import { apiSlice } from './apiSlice';

export const addressesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSavedAddresses: builder.query({
      query: () => ({
        url: '/api/addresses',
        method: 'GET',
      }),
      providesTags: ['Addresses'],
    }),

    addNewAddress: builder.mutation({
      query: (data) => ({
        url: '/api/addresses',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Addresses'],
    }),

    updateAddress: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/addresses/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Addresses'],
    }),

    deleteAddress: builder.mutation({
      query: (id) => ({
        url: `/api/addresses/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Addresses'],
    }),

    setDefaultAddress: builder.mutation({
      query: (id) => ({
        url: `/api/addresses/${id}/default`,
        method: 'PUT',
      }),
      invalidatesTags: ['Addresses'],
    }),

    reverseGeocode: builder.mutation({
      query: (coords) => ({
        url: '/api/location/reverse-geocode',
        method: 'POST',
        body: coords,
      }),
    }),
  }),
});

export const {
  useGetSavedAddressesQuery,
  useAddNewAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
  useReverseGeocodeMutation,
} = addressesApiSlice;
