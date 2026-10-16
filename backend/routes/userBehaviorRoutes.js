import express from 'express';
const router = express.Router();
import { logEvent, getMyBehavior } from '../controllers/userBehaviorController.js';
import { protect } from '../middleware/authMiddleware.js';

router.post('/', protect, logEvent);
router.get('/', protect, getMyBehavior);

export default router;
