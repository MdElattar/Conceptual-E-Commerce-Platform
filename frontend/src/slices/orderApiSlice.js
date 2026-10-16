import { apiSlice } from "./apiSlice";

export const orderApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation({
      query: (order) => ({
        url: "/api/orders/create-checkout-session",
        method: "POST",
        body: order,
      }),
    }),
    getMyOrders: builder.query({
      query: () => ({
        url: "/api/orders/myorders",
      }),
      keepUnusedDataFor: 5,
    }),
    getOrders: builder.query({
      query: () => ({
        url: "/api/orders",
      }),
      keepUnusedDataFor: 5,
    }),
    payOrder: builder.mutation({
      query: ({ orderId, details }) => ({
        url: `/api/orders/${orderId}/pay`,
        method: "PUT",
        body: details,
      }),
    }),
    // frontend/src/slices/orderApiSlice.js
    getOrderDetails: builder.query({
      query: (id) => ({
        url: `/api/orders/${id}`,
      }),
      keepUnusedDataFor: 5,
    }),
    // داخل الـ endpoints في ملف orderApiSlice.js
    deliverOrder: builder.mutation({
      query: (orderId) => ({
        url: `/api/orders/${orderId}/deliver`,
        method: "PUT",
      }),
    }),
    onWayOrder: builder.mutation({
      query: (orderId) => ({
        url: `/api/orders/${orderId}/onway`,
        method: "PUT",
      }),
      invalidatesTags: ["Order"],
    }),
    // الإلغاء: Cancel
    // src/slices/orderApiSlice.js
    cancelOrder: builder.mutation({
      query: (orderId) => ({
        url: `/api/orders/${orderId}/cancel`,
        method: "PUT",
      }),
      // السطر ده هو اللي هيخلي الرصيد يتحدث في الـ Navbar فوراً 👇
      invalidatesTags: ["Order", "User"],
    }),
    processOrder: builder.mutation({
      query: (orderId) => ({
        url: `/api/orders/${orderId}/process`,
        method: "PUT",
      }),
    }),
    getDashboardStats: builder.query({
      query: () => ({
        url: `/api/users/stats`,
      }),
      keepUnusedDataFor: 5,
    }),
    payOrderWithWallet: builder.mutation({
      query: (orderId) => ({
        url: `/api/orders/${orderId}/pay-wallet`,
        method: "PUT",
      }),
      // دي التكة السحرية اللي بتخلي الرصيد يتخصم في الـ Navbar والطلب يتحول لمدفوع في نفس اللحظة
      invalidatesTags: ["Order", "User"],
    }),
    adminBankRefundAndDeduct: builder.mutation({
      query: (orderId) => ({
        url: `/api/orders/${orderId}/bank-refund-deduct`,
        method: "PUT",
      }),
      invalidatesTags: ["Order"], // عشان يعمل ريفريش لبيانات الأوردر تلقائياً بعد الخصم
    }),
    getMyWalletHistory: builder.query({
      query: () => ({
        url: "/api/orders/my-wallet-history",
        method: "GET",
      }),
      keepUnusedDataFor: 5, // كاش لمدة 5 ثواني
    }),

    // 2. Hook للأدمن لجلب كافة حركات المحفظة بالسيستم
    getAllWalletHistory: builder.query({
      query: () => ({
        url: "/api/orders/admin/wallet-history",
        method: "GET",
      }),
      keepUnusedDataFor: 5,
    }),
    getVendorOrders: builder.query({
      query: () => ({
        url: "/api/orders/vendor", // مسار الباك إند اللي بيجيب طلبات التاجر
      }),
      keepUnusedDataFor: 5,
    }),
    confirmItemDelivery: builder.mutation({
      query: ({ orderId, itemId, deliveryProofImage }) => ({
        url: `/api/orders/${orderId}/item/${itemId}/confirm-delivery`,
        method: "PUT",
        body: { deliveryProofImage },
      }),
    }),
    requestVendorPayout: builder.mutation({
      query: (data) => ({
        url: "/api/orders/vendor/payout",
        method: "POST",
        body: data,
      }),
    }),
    getVendorWalletTransactions: builder.query({
      query: () => ({
        url: "/api/orders/vendor/wallet-transactions",
        method: "GET",
      }),
      keepUnusedDataFor: 5,
    }),
    updateVendorOrderItem: builder.mutation({
      query: ({ orderId, itemId, status, trackingNumber, reason }) => ({
        url: `/api/vendor/orders/${orderId}/item/${itemId}`,
        method: "PUT",
        body: { status, trackingNumber, reason },
      }),
      invalidatesTags: ["Order"],
    }),
    getVendorPerformance: builder.query({
      query: () => ({
        url: "/api/vendor/performance",
        method: "GET",
      }),
      keepUnusedDataFor: 60,
    }),
    getVendorAnalytics: builder.query({
      query: () => ({
        url: "/api/vendor/analytics",
        method: "GET",
      }),
      keepUnusedDataFor: 60,
    }),
  }),
});

export const {
  useCreateOrderMutation,
  useGetMyOrdersQuery,
  useGetOrdersQuery,
  usePayOrderMutation,
  useGetOrderDetailsQuery,
  useDeliverOrderMutation,
  useProcessOrderMutation,
  useGetDashboardStatsQuery,
  useCancelOrderMutation,
  useOnWayOrderMutation,
  usePayOrderWithWalletMutation,
  useAdminBankRefundAndDeductMutation,
  useGetMyWalletHistoryQuery,
  useGetAllWalletHistoryQuery,
  useGetVendorOrdersQuery,
  useConfirmItemDeliveryMutation,
  useRequestVendorPayoutMutation,
  useGetVendorWalletTransactionsQuery,
  useUpdateVendorOrderItemMutation,
  useGetVendorPerformanceQuery,
  useGetVendorAnalyticsQuery,
} = orderApiSlice;
