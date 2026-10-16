import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const router = express.Router();

// التأكد من الإعدادات
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'products',
    allowedFormats: ['jpg', 'png', 'jpeg', 'webp'],
  },
});

const upload = multer({ storage });

router.post('/', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'لم يتم اختيار أي صورة للرفع' });
    }
    
    // 🌟 التعديل السحري هنا: بنرجع الداتا كـ JSON جواه خاصية image
    res.status(200).json({ 
        message: 'Image Uploaded Successfully',
        image: req.file.path // رابط Cloudinary
    });

  } catch (error) {
    res.status(500).json({ message: 'خطأ أثناء الرفع لـ Cloudinary: ' + error.message });
  }
});

export default router;