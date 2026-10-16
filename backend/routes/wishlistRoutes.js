import express from "express";
const router = express.Router();
import {
  getWishlist, addToWishlist, removeFromWishlist, clearWishlist,
} from "../controllers/wishlistController.js";
import { protect } from "../middleware/authMiddleware.js";

router.route("/").get(protect, getWishlist).post(protect, addToWishlist);
router.route("/:productId").delete(protect, removeFromWishlist);
router.route("/clear").post(protect, clearWishlist);

export default router;
