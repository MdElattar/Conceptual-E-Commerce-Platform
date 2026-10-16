import { apiSlice } from './apiSlice';
const BEHAVIOR_URL = '/api/user-behavior';

export const userBehaviorApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    logEvent: builder.mutation({
      query: (data) => ({
        url: BEHAVIOR_URL,
        method: 'POST',
        body: data,
      }),
    }),
    getMyBehavior: builder.query({
      query: (params) => ({
        url: BEHAVIOR_URL,
        params,
      }),
    }),
  }),
});

export const {
  useLogEventMutation,
  useGetMyBehaviorQuery,
} = userBehaviorApiSlice;
