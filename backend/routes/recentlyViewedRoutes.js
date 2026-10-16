import express from "express";
const router = express.Router();
import {
  getRecentlyViewed, addRecentlyViewed, clearRecentlyViewed,
} from "../controllers/recentlyViewedController.js";
import { protect } from "../middleware/authMiddleware.js";

router.route("/").get(protect, getRecentlyViewed).post(protect, addRecentlyViewed);
router.route("/clear").post(protect, clearRecentlyViewed);

export default router;
