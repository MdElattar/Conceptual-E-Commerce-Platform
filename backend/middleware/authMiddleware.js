import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";

const protect = asyncHandler(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id || decoded.userId).select("-password");
      next();
    } catch (error) {
      res.status(401);
      throw new Error("Not authorized, token failed");
    }
  }
  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

const admin = (req, res, next) => {
  if (req.user && (req.user.isAdmin || req.user.role === 'admin')) {
    next();
  } else {
    res.status(401);
    throw new Error("Not authorized as an admin");
  }
};

// 🌟 ده اللي كان ناقص وبيوقع السيرفر!
const isVendor = (req, res, next) => {
  if (req.user && req.user.role === "vendor") {
    next();
  } else {
    res.status(403);
    throw new Error("عذراً، هذا الإجراء مخصص للتجار فقط");
  }
};

const optionalAuth = asyncHandler(async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id || decoded.userId).select("-password");
    } catch {
      // Token invalid or expired — continue without user
    }
  }
  next();
});

export { protect, admin, isVendor, optionalAuth };