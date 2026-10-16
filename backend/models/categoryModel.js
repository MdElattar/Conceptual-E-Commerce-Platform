const mongoose = require("mongoose");

const categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "الرجاء إدخال اسم القسم"],
      unique: true,
      trim: true,
    },
    // 🔗 الـ Slug ضروري جداً للـ SEO وعناوين الصفحات مثل (amazon.com/c/electronics)
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    // 🌳 سر القائمة اللانهائية: القسم يشير إلى القسم الأكبر منه (الأب)
    // إذا كانت القيمة null، فهذا يعني أنه قسم رئيسي (Root Category)
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    description: {
      type: String,
      trim: true,
    },
    image: {
      type: String,
      default: "", // رابط صورة أو أيقونة القسم لعرضها في الـ Mega Menu
    },
    // 🛡️ استراتيجية "الأرفف الفاضية": يمكنك تعطيل القسم أو إخفائه لو لم يحتوي على منتجات
    isActive: {
      type: Boolean,
      default: true,
    },
    // 🔥 لتمييز الأقسام الهامة في الصفحة الرئيسية (مثل بنرات التخفيضات في أمازون)
    isFeatured: {
      type: Boolean,
      default: false,
    },
    // 🌟 ميزة أمازون الفائقة: الخصائص الديناميكية المسموح بها داخل هذا القسم
    // تتيح فلترة المنتجات بناءً على نوع القسم (مثل: مقاس الحذاء، رامات اللابتوب، سعة الغسالة)
    allowedAttributes: [
      {
        key: { type: String, required: true }, // اسم الخاصية (مثال: RAM, Color, Storage, Brand)
        type: { 
          type: String, 
          enum: ["text", "number", "select"], 
          default: "text" 
        },
        options: [{ type: String }], // الاختيارات المتاحة إذا كان النوع select (مثال: ["8GB", "16GB"])
      }
    ]
  },
  { 
    timestamps: true,
    // لتفعيل جلب الأقسام الفرعية بشكل افتراضي عند طلب البيانات
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
  }
);

// 🔍 خاصية وهمية (Virtual Property) لربط الأقسام الفرعية تلقائياً بدون تخزينها مرتين
categorySchema.virtual("children", {
  ref: "Category",
  localField: "_id",
  foreignField: "parent",
});

const Category = mongoose.model("Category", categorySchema);
module.exports = Category;