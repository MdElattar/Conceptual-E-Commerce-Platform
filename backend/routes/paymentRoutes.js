import express from 'express';
const router = express.Router();
import { createSetupIntent, getSavedCards, detachCard, setDefaultCard } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

router.post('/setup-intent', protect, createSetupIntent);
router.get('/cards', protect, getSavedCards);
router.delete('/cards/:paymentMethodId', protect, detachCard);
router.put('/cards/default', protect, setDefaultCard);

export default router;