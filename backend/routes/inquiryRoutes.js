import express from 'express';
const router = express.Router();
import { 
  createInquiry, 
  getInquiries, 
  updateInquiryStatus, // هنضيف دول في الـ controller
  deleteInquiry 
} from '../controllers/inquiryController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

// المسارات اللي على الرابط الرئيسي /api/inquiries
router.route('/')
  .post(createInquiry)
  .get(protect, admin, getInquiries);

// المسارات اللي محتاجة ID محدد /api/inquiries/:id
router.route('/:id')
  .put(protect, admin, updateInquiryStatus)
  .delete(protect, admin, deleteInquiry);

export default router;