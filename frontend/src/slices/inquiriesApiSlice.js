import { apiSlice } from './apiSlice';
const INQUIRIES_URL = '/api/inquiries';

export const inquiriesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // فنكشن إرسال الاستفسار (من صفحة المنتج)
    createInquiry: builder.mutation({
      query: (data) => ({
        url: INQUIRIES_URL,
        method: 'POST',
        body: data,
      }),
      // تريكة الكاش: بنقول للسيستم إن بيانات الاستفسارات اتغيرت
      invalidatesTags: ['Inquiry'],
    }),
    
    // فنكشن جلب الاستفسارات (للأدمن)
    getInquiries: builder.query({
      query: () => ({
        url: INQUIRIES_URL,
      }),
      // بنراقب التاج ده عشان لو حصل إضافة/تعديل/مسح نحدث الداتا فوراً
      providesTags: ['Inquiry'],
      keepUnusedDataFor: 5,
    }),
    
    // فنكشن تحديث حالة الاستفسار (للأدمن)
    updateInquiry: builder.mutation({
      query: (data) => ({
        url: `${INQUIRIES_URL}/${data.id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Inquiry'],
    }),
    
    // فنكشن حذف الاستفسار (للأدمن)
    deleteInquiry: builder.mutation({
      query: (id) => ({
        url: `${INQUIRIES_URL}/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Inquiry'],
    }),
  }),
});

export const { 
  useCreateInquiryMutation, 
  useGetInquiriesQuery, 
  useUpdateInquiryMutation, 
  useDeleteInquiryMutation 
} = inquiriesApiSlice;