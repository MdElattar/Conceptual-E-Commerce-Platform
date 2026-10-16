import { apiSlice } from './apiSlice';

const PRODUCTS_URL = '/api/products';
const UPLOADS_URL = '/api/upload'; 

export const productsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    // 1. جلب كل المنتجات (مع البحث والفلترة)
    getProducts: builder.query({
      query: (params) => ({
        url: PRODUCTS_URL,
        method: 'GET',
        // 🌟 تريكة الـ Mapping: تمرير جميع المعاملات ديناميكياً لتلتقطها قاعدة البيانات في السيرفر
        params: {
          keyword: params?.keyword,
          category: params?.category,
          brands: params?.brands,
          minPrice: params?.minPrice,
          maxPrice: params?.maxPrice,
          rating: params?.rating,
          sortBy: params?.sortBy,
          isAdminQuery: params?.isAdminQuery,
          user: params?.user,
          minReviews: params?.minReviews,
          inStock: params?.inStock,
          limit: params?.limit,
        },
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: 'Product', id: _id })),
              { type: 'Product', id: 'LIST' },
              'Product'
            ]
          : ['Product'],
      keepUnusedDataFor: 10, // رفع الكاش لـ 10 ثوانٍ ليعطي تصفحاً أسرع وأكثر سلاسة للمستخدم أثناء الانتقال بين الفلاتر
    }),

    // 2. جلب تفاصيل منتج معين
    getProductDetails: builder.query({
      query: (productId) => ({
        url: `${PRODUCTS_URL}/${productId}`,
      }),
      providesTags: (result, error, productId) => [{ type: 'Product', id: productId }],
      keepUnusedDataFor: 30,
    }),

    // 3. إنشاء منتج جديد (يدعم الأدمن والتاجر)
    createProduct: builder.mutation({
      query: (data) => ({
        url: PRODUCTS_URL,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Product'],
    }),

    // 4. تحديث منتج (يدعم الأدمن والتاجر)
    updateProduct: builder.mutation({
      query: (data) => ({
        url: `${PRODUCTS_URL}/${data.productId}`,
        method: 'PUT',
        body: data, 
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: 'Product', id: productId },
        'Product',
      ],
    }),

    // 5. حذف منتج
    deleteProduct: builder.mutation({
      query: (productId) => ({
        url: `${PRODUCTS_URL}/${productId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Product'],
    }),

    // 6. رفع صور المنتجات 📸
    uploadProductImage: builder.mutation({
      query: (data) => ({
        url: UPLOADS_URL,
        method: 'POST',
        body: data,
      }),
    }),

    // 7. إضافة تقييم جديد (التقييم الموثق) ⭐
    createReview: builder.mutation({
      query: (data) => ({
        url: `${PRODUCTS_URL}/${data.productId}/reviews`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { productId }) => [
        { type: 'Product', id: productId },
      ],
    }),

    // 8. جلب المنتجات الأعلى تقييماً (للسلايدر) 🔥
    getTopProducts: builder.query({
      query: () => `${PRODUCTS_URL}/top`,
      keepUnusedDataFor: 5,
    }),

    // 🌟 9. [جديد] موافقة الأدمن على المنتج (Admin Approve)
    approveProduct: builder.mutation({
      query: (data) => ({
        url: `${PRODUCTS_URL}/${data.productId}/approve`,
        method: 'PUT',
        body: { category: data.category }
      }),
      invalidatesTags: ['Product'],
    }),

    // 🌟 10. [جديد] رفض الأدمن للمنتج (Admin Reject)
    rejectProduct: builder.mutation({
      query: (data) => ({
        url: `${PRODUCTS_URL}/${data.productId}/reject`,
        method: 'PUT',
        body: { rejectReason: data.rejectReason }
      }),
      invalidatesTags: ['Product'],
    }),

    requestCategory: builder.mutation({
       query: (data) => ({
          url: '/api/category-requests',
          method: 'POST',
          body: data
       })
    }),

    // 🌟 Get vendor's own products (all statuses)
    getVendorProducts: builder.query({
      query: () => ({
        url: `${PRODUCTS_URL}/vendor`,
        method: 'GET',
      }),
      providesTags: ['Product'],
      keepUnusedDataFor: 5,
    }),

    // 🌟 Admin: Get all products with pending edits
    getPendingEditsProducts: builder.query({
      query: () => ({
        url: `${PRODUCTS_URL}/pending-edits`,
        method: 'GET',
      }),
      providesTags: ['Product'],
      keepUnusedDataFor: 5,
    }),

    // 🌟 Admin: Approve pending edits
    approvePendingEdits: builder.mutation({
      query: (data) => ({
        url: `${PRODUCTS_URL}/${data.productId}/approve-edits`,
        method: 'PUT',
      }),
      invalidatesTags: ['Product'],
    }),

    // 🌟 Admin: Reject pending edits
    rejectPendingEdits: builder.mutation({
      query: (data) => ({
        url: `${PRODUCTS_URL}/${data.productId}/reject-edits`,
        method: 'PUT',
        body: { reason: data.reason },
      }),
      invalidatesTags: ['Product'],
    }),

    // 🌟 Vendor: Adjust stock
    adjustStock: builder.mutation({
      query: (data) => ({
        url: `${PRODUCTS_URL}/${data.productId}/adjust-stock`,
        method: 'PUT',
        body: { quantity: data.quantity, reason: data.reason, lowStockThreshold: data.lowStockThreshold },
      }),
      invalidatesTags: ['Product'],
    }),

    // 🌟 Recommendation Engine
    getRecommendations: builder.query({
      query: (params) => ({
        url: `${PRODUCTS_URL}/recommendations`,
        params: {
          type: params?.type || 'trending',
          productId: params?.productId,
          limit: params?.limit || 20,
        },
      }),
      keepUnusedDataFor: 5,
    }),
    
  }),
});

export const {
  useGetProductsQuery,
  useGetProductDetailsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useCreateReviewMutation,
  useGetTopProductsQuery,
  useUploadProductImageMutation,
  useApproveProductMutation,
  useRejectProductMutation,
  useRequestCategoryMutation,
  useGetVendorProductsQuery,
  useGetPendingEditsProductsQuery,
  useApprovePendingEditsMutation,
  useRejectPendingEditsMutation,
  useAdjustStockMutation,
  useGetRecommendationsQuery,
} = productsApiSlice;