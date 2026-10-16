import asyncHandler from 'express-async-handler';
import CategoryRequest from '../models/categoryRequestModel.js';

// @desc    Create a new category request
// @route   POST /api/category-requests
// @access  Private/Vendor
const createCategoryRequest = asyncHandler(async (req, res) => {
  const { requestedCategoryName, reason, exampleProducts } = req.body;

  const request = new CategoryRequest({
    vendor: req.user._id,
    requestedCategoryName,
    reason,
    exampleProducts,
  });

  const createdRequest = await request.save();
  res.status(201).json(createdRequest);
});

// @desc    Get all category requests
// @route   GET /api/category-requests
// @access  Private/Admin
const getCategoryRequests = asyncHandler(async (req, res) => {
  const requests = await CategoryRequest.find({}).populate('vendor', 'name email vendorProfile');
  res.json(requests);
});

// @desc    Approve or reject a category request
// @route   PUT /api/category-requests/:id
// @access  Private/Admin
const updateCategoryRequest = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const request = await CategoryRequest.findById(req.params.id);

  if (!request) {
    res.status(404);
    throw new Error('Category request not found');
  }

  request.status = status;
  const updated = await request.save();
  res.json(updated);
});

export { createCategoryRequest, getCategoryRequests, updateCategoryRequest };