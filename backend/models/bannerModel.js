import mongoose from 'mongoose';

const bannerSchema = mongoose.Schema(
  {
    title: {
      type: String,
      default: '', // 🌟 شلنا الـ required وبقى الديفولت فاضي
    },
    subTitle: {
      type: String,
      default: '', // 🌟 شلنا الـ required
    },
    image: {
      type: String,
      default: '', // 🌟 شلنا الـ required عشان لو حب يعمل بانر كلام بس
    },
    bgColor: {
      type: String,
      default: 'bg-transparent', 
    },
    ctaText: {
      type: String,
      default: '',
    },
    ctaLink: {
      type: String,
      default: '/products',
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Banner = mongoose.model('Banner', bannerSchema);
export default Banner;