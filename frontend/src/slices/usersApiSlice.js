import { apiSlice } from "./apiSlice";
const USERS_URL = "/api/users";

export const usersApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // تسجيل الدخول
    login: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/auth`,
        method: "POST",
        body: data,
      }),
    }),

    // جلب بيانات البروفايل (العناوين، الاسم، الخ)
    getProfile: builder.query({
      query: () => ({
        url: `${USERS_URL}/profile`,
      }),
      providesTags: ["User"], // يراقب أي تغيير يخص المستخدم
    }),

    // تسجيل حساب جديد
    register: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}`,
        method: "POST",
        body: data,
      }),
    }),

    // تسجيل الخروج
    logout: builder.mutation({
      query: () => ({
        url: `${USERS_URL}/logout`,
        method: "POST",
      }),
    }),

    // تحديث بيانات البروفايل (بما فيها العناوين)
    profile: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/profile`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["User"], // يخبر النظام أن البيانات القديمة انتهت ويجب جلب الجديد
    }),

    // تسجيل الخروج من كل الأجهزة
    logoutAllDevices: builder.mutation({
      query: () => ({
        url: `${USERS_URL}/logout-all`,
        method: "POST",
      }),
    }),

    // --- Endpoints الإدارة (Admin) ---
    getUsers: builder.query({
      query: () => ({
        url: USERS_URL,
      }),
      providesTags: ["Users"],
      keepUnusedDataFor: 5,
    }),

    deleteUser: builder.mutation({
      query: (userId) => ({
        url: `${USERS_URL}/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Users"],
    }),

    getUserDetails: builder.query({
      query: (id) => ({
        url: `${USERS_URL}/${id}`,
      }),
      keepUnusedDataFor: 5,
    }),

    // ابحث عن الـ mutation ده في الـ usersApiSlice واعدل الـ body بتاعه
    updateUser: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/${data.userId}`,
        method: "PUT",
        body: {
          name: data.name,
          email: data.email,
          phone: data.phone, // 👈 الحتة السحرية الناقصة اللي بتسبب الانهيار!
          isAdmin: data.isAdmin,
        },
      }),
      invalidatesTags: ["Users"],
    }),
    updateProfile: builder.mutation({
      query: (data) => ({
        url: `${USERS_URL}/profile`,
        method: "PUT",
        body: data,
      }),
      // السطر ده مهم جداً عشان أي صفحة تانية بتعرض العناوين تتحدث أوتوماتيك
      invalidatesTags: ["User"],
    }),
    sendPhoneOtp: builder.mutation({
      query: (data) => ({
        url: `/api/users/send-phone-otp`,
        method: "POST",
        body: data, // يحتوي على { phone } بالصيغة الدولية
      }),
    }),

    // ✅ التحقق من الكود المدخل
    verifyPhoneOtp: builder.mutation({
      query: (data) => ({
        url: `/api/users/verify-phone-otp`,
        method: "POST",
        body: data, // يحتوي على { otp }
      }),
    }),

    // 🌟 جلب البروفايل العام للتاجر (الصفحة العامة للمتجر)
    getPublicVendorProfile: builder.query({
      query: (vendorId) => ({
        url: `/api/users/public/${vendorId}`,
      }),
    }),

    // 🌟 Two-Factor Authentication
    verify2FA: builder.mutation({
      query: (data) => ({
        url: '/api/users/verify-2fa',
        method: 'POST',
        body: data,
      }),
    }),
    generate2FASecret: builder.query({
      query: () => '/api/users/2fa/secret',
    }),
    enable2FA: builder.mutation({
      query: (data) => ({
        url: '/api/users/2fa/enable',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    disable2FA: builder.mutation({
      query: (data) => ({
        url: '/api/users/2fa/disable',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    getBackupCodes: builder.query({
      query: () => '/api/users/2fa/backup-codes',
    }),
    regenerateBackupCodes: builder.mutation({
      query: (data) => ({
        url: '/api/users/2fa/regenerate-backup-codes',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useProfileMutation, // الاسم الأساسي
  useProfileMutation: useUpdateProfileMutation, // الاسم المستعار لصفحة الـ Checkout
  useLogoutAllDevicesMutation,
  useDeleteUserMutation,
  useGetUsersQuery,
  useGetUserDetailsQuery,
  useUpdateUserMutation,
  useGetProfileQuery,
  useSendPhoneOtpMutation,
  useVerifyPhoneOtpMutation,
  useGetPublicVendorProfileQuery,
  useVerify2FAMutation,
  useGenerate2FASecretQuery,
  useEnable2FAMutation,
  useDisable2FAMutation,
  useGetBackupCodesQuery,
  useRegenerateBackupCodesMutation,
} = usersApiSlice;
