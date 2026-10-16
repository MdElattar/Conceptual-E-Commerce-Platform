import express from "express";
const router = express.Router();
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from "../controllers/addressController.js";
import { protect } from "../middleware/authMiddleware.js";

router.route("/")
  .get(protect, getAddresses)
  .post(protect, addAddress);

router.route("/:id")
  .put(protect, updateAddress)
  .delete(protect, deleteAddress);

router.route("/:id/default")
  .put(protect, setDefaultAddress);

export default router;
