// src/slices/bannersApiSlice.js
import { apiSlice } from './apiSlice';

export const bannersApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getBanners: builder.query({
      query: () => ({
        url: '/api/banners',
      }),
      keepUnusedDataFor: 5,
    }),
    getAdminBanners: builder.query({
      query: () => ({
        url: '/api/banners/admin',
      }),
    }),
    createBanner: builder.mutation({
      query: (data) => ({
        url: '/api/banners',
        method: 'POST',
        body: data,
      }),
    }),
    deleteBanner: builder.mutation({
      query: (id) => ({
        url: `/api/banners/${id}`,
        method: 'DELETE',
      }),
    }),
    toggleBannerStatus: builder.mutation({
      query: (id) => ({
        url: `/api/banners/${id}/toggle`,
        method: 'PUT',
      }),
    }),
  }),
});

export const {
  useGetBannersQuery,
  useGetAdminBannersQuery,
  useCreateBannerMutation,
  useDeleteBannerMutation,
  useToggleBannerStatusMutation,
} = bannersApiSlice;