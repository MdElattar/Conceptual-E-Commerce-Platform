import express from "express";
const router = express.Router();
import {
  getReturnPolicy, createReturnRequest, getMyReturns,
  getReturnById, getAdminReturns, updateReturnStatus, getOrderItemsForReturn,
  getVendorReturns, vendorUpdateReturnStatus,
} from "../controllers/returnController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { isVerifiedVendor } from "../middleware/vendorMiddleware.js";

router.get("/policy", getReturnPolicy);
router.route("/").get(protect, getMyReturns).post(protect, createReturnRequest);
router.route("/admin").get(protect, admin, getAdminReturns);
router.get("/vendor", protect, isVerifiedVendor, getVendorReturns);
router.get("/order-items/:orderId", protect, getOrderItemsForReturn);
router.route("/:id").get(protect, getReturnById).put(protect, admin, updateReturnStatus);
router.put("/:id/vendor-status", protect, isVerifiedVendor, vendorUpdateReturnStatus);

export default router;
