import { apiSlice } from './apiSlice';
const RECENTLY_VIEWED_URL = '/api/recently-viewed';

export const recentlyViewedApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRecentlyViewed: builder.query({
      query: () => RECENTLY_VIEWED_URL,
      providesTags: ['RecentlyViewed'],
    }),
    addRecentlyViewed: builder.mutation({
      query: (data) => ({
        url: RECENTLY_VIEWED_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['RecentlyViewed'],
    }),
    clearRecentlyViewed: builder.mutation({
      query: () => ({
        url: `${RECENTLY_VIEWED_URL}/clear`,
        method: 'POST',
      }),
      invalidatesTags: ['RecentlyViewed'],
    }),
  }),
});

export const {
  useGetRecentlyViewedQuery,
  useAddRecentlyViewedMutation,
  useClearRecentlyViewedMutation,
} = recentlyViewedApiSlice;
