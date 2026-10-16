import * as XLSX from 'xlsx';

// نقوم بتمرير الـ ordersData (البيانات القادمة من الـ API الخاص بالطلبات في الأدمن)
const handleExportExcel = (ordersData) => {
  try {
    // 1. فحص أمان: إذا كانت البيانات لم تأتِ بعد أو ليست مصفوفة
    if (!ordersData || !Array.isArray(ordersData) || ordersData.length === 0) {
      alert("⚠️ لا توجد بيانات مبيعات متاحة حالياً للتصدير أو جاري تحميل البيانات، برجاء المحاولة مرة أخرى!");
      return;
    }

    // 2. فلترة وترتيب البيانات لملف الإكسيل
    const reportRows = ordersData.map((order, index) => {
      return {
        "المسلسل": index + 1,
        "رقم الطلب (Order ID)": order._id || "N/A",
        "تاريخ الطلب": order.createdAt ? new Date(order.createdAt).toLocaleDateString('ar-EG') : "N/A",
        "حساب العميل": order.user?.email || order.user || "عميل نظام",
        "طريقة الدفع": order.paymentMethod || "Stripe",
        "حالة السداد": order.isPaid ? "مدفوع (PAID)" : "غير مدفوع",
        "إجمالي المبلغ (EGP)": order.totalPrice || 0
      };
    });

    // 3. بناء الشيت وتحويله لـ Excel
    const worksheet = XLSX.utils.json_to_sheet(reportRows);
    
    // ضبط اتجاه الشيت ليكون من اليمين لليسار لراحة الأدمن العربي
    worksheet['!dir'] = "rtl";

    // ضبط عروض الأعمدة تلقائياً لمنع ظهور رموز الـ (###)
    worksheet['!cols'] = [
      { wch: 8 },   // المسلسل
      { wch: 30 },  // Order ID
      { wch: 15 },  // التاريخ
      { wch: 30 },  // الحساب
      { wch: 15 },  // طريقة الدفع
      { wch: 15 },  // حالة السداد
      { wch: 20 }   // المبلغ
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "كشف المبيعات");

    // 4. تحميل الملف فوراً
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `DKTEC-Sales-Report-${dateStr}.xlsx`);

  } catch (error) {
    console.error("Excel Export Error:", error);
    alert("حدث خطأ أثناء تصدير ملف الـ Excel: " + error.message);
  }
};