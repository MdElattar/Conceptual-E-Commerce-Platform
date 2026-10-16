// backend/controllers/bannerController.js
import asyncHandler from 'express-async-handler';
import Banner from '../models/bannerModel.js';

// @desc    Get all active banners (Public)
// @route   GET /api/banners
// @access  Public
export const getBanners = asyncHandler(async (req, res) => {
  // العميل يرى البانرات المفعلة فقط وبأحدث ترتيب
  const banners = await Banner.find({ isActive: true }).sort({ createdAt: -1 });
  res.json(banners);
});

// @desc    Get all banners regardless of status (Admin Only)
// @route   GET /api/banners/admin
// @access  Private/Admin
export const getAdminBanners = asyncHandler(async (req, res) => {
  const banners = await Banner.find({}).sort({ createdAt: -1 });
  res.json(banners);
});

// @desc    Create a new banner (Admin Only)
// @route   POST /api/banners
// @access  Private/Admin
export const createBanner = asyncHandler(async (req, res) => {
  const { title, subTitle, image, bgColor, ctaText, ctaLink } = req.body;

  const banner = await Banner.create({
    title,
    subTitle,
    image,
    bgColor,
    ctaText,
    ctaLink,
  });

  if (banner) {
    res.status(201).json(banner);
  } else {
    res.status(400);
    throw new Error('Invalid banner data');
  }
});

// @desc    Delete a banner (Admin Only)
// @route   DELETE /api/banners/:id
// @access  Private/Admin
export const deleteBanner = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);

  if (banner) {
    await banner.deleteOne();
    res.json({ message: 'Banner removed successfully' });
  } else {
    res.status(404);
    throw new Error('Banner not found');
  }
});

// @desc    Toggle Banner Status - Active/Inactive (Admin Only)
// @route   PUT /api/banners/:id/toggle
// @access  Private/Admin
export const toggleBannerStatus = asyncHandler(async (req, res) => {
  const banner = await Banner.findById(req.params.id);

  if (banner) {
    banner.isActive = !banner.isActive;
    const updatedBanner = await banner.save();
    res.json(updatedBanner);
  } else {
    res.status(404);
    throw new Error('Banner not found');
  }
});