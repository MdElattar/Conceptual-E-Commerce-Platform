import { apiSlice } from './apiSlice';

const NOTIFICATIONS_URL = '/api/notifications';

export const notificationsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: (params) => ({
        url: NOTIFICATIONS_URL,
        params: { limit: params?.limit || 50, skip: params?.skip || 0 },
      }),
      providesTags: ['Notification'],
      keepUnusedDataFor: 5,
    }),
    markAsRead: builder.mutation({
      query: (id) => ({
        url: `${NOTIFICATIONS_URL}/${id}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notification'],
    }),
    markAllAsRead: builder.mutation({
      query: () => ({
        url: `${NOTIFICATIONS_URL}/read-all`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notification'],
    }),
    deleteNotification: builder.mutation({
      query: (id) => ({
        url: `${NOTIFICATIONS_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
} = notificationsApiSlice;
