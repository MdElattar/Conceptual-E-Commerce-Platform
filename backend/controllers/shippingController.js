import asyncHandler from 'express-async-handler';
import ShippingRate from '../models/shippingRateModel.js';

// @desc    Get all shipping rates (Vendor Isolated)
// @route   GET /api/shipping-rates
// @access  Private/Vendor or Admin
export const getShippingRates = asyncHandler(async (req, res) => {
  // 🌟 TRICK: If the user is an admin, fetch all. Otherwise, fetch ONLY the logged-in vendor's rates.
  const query = req.user.isAdmin ? {} : { vendor: req.user._id };
  
  const rates = await ShippingRate.find(query)
    .populate('vendor', 'name email') // Optional: Useful for Admins to see rate owners
    .sort({ country: 1, minWeight: 1 })
    .lean(); // 🚀 OPTIMIZATION: .lean() drastically speeds up read-only queries

  res.json(rates);
});

// @desc    Create a new shipping rate with overlap & vendor validation
// @route   POST /api/shipping-rates
// @access  Private/Vendor
export const createShippingRate = asyncHandler(async (req, res) => {
  const { country, minWeight, maxWeight, cost, isFallback } = req.body;
  const vendorId = req.user._id;

  // Layer Protection: Validate that weight ranges do not overlap for THIS specific vendor and country
  const overlappingRate = await ShippingRate.findOne({
    vendor: vendorId,
    country: country || 'EG',
    $or: [
      { minWeight: { $lte: minWeight }, maxWeight: { $gte: minWeight } },
      { minWeight: { $lte: maxWeight }, maxWeight: { $gte: maxWeight } }
    ]
  }).lean();

  if (overlappingRate) {
    res.status(400);
    throw new Error(`Weight range configuration overlaps with your existing matrix rule for ${country || 'EG'}`);
  }

  const rate = new ShippingRate({ 
    vendor: vendorId, // 🔒 Bind rate to the vendor
    country: country || 'EG', 
    minWeight, 
    maxWeight, 
    cost,
    isFallback: isFallback || false // Mark as a generic fallback rate if requested
  });
  
  const createdRate = await rate.save();
  res.status(201).json(createdRate);
});

// @desc    Delete an explicit logistics shipping rate rule
// @route   DELETE /api/shipping-rates/:id
// @access  Private/Vendor or Admin
export const deleteShippingRate = asyncHandler(async (req, res) => {
  const rate = await ShippingRate.findById(req.params.id);

  if (!rate) {
    res.status(404);
    throw new Error('Shipping rate rule target reference index not found.');
  }

  // 🔒 SECURITY GATE: Ensure the user deleting the rate is the vendor who owns it (or an Admin)
  if (rate.vendor.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    res.status(403);
    throw new Error('Unauthorized action. You can only delete your own logistics rules.');
  }

  await rate.deleteOne();
  res.json({ message: 'Logistic matrix rate rule cleared successfully.' });
});

// =========================================================================
// 🌟 ADVANCED TRICK: The Fallback Calculator (Never drop an order)
// =========================================================================

// @desc    Calculate exact shipping cost with fail-safe fallbacks
// @route   POST /api/shipping-rates/calculate
// @access  Public/Private
export const calculateShippingCost = asyncHandler(async (req, res) => {
  const { vendorId, country, totalWeight } = req.body;
  const targetCountry = country || 'EG';

  // Step 1: Attempt to find the exact mathematical match
  let applicableRate = await ShippingRate.findOne({
    vendor: vendorId,
    country: targetCountry,
    minWeight: { $lte: totalWeight },
    maxWeight: { $gte: totalWeight }
  }).lean();

  // Step 2: Fallback A - Check if the vendor set a "Global Fallback Rate" for this country
  if (!applicableRate) {
    applicableRate = await ShippingRate.findOne({
      vendor: vendorId,
      country: targetCountry,
      isFallback: true
    }).lean();
  }

  // Step 3: Fallback B - System-Wide Absolute Default
  // If the vendor configured absolutely nothing, guarantee a numeric value so the UI doesn't crash
  const SYSTEM_DEFAULT_COST = 50.00; 
  const finalCost = applicableRate ? applicableRate.cost : SYSTEM_DEFAULT_COST;

  res.json({
    cost: finalCost,
    appliedFallback: !applicableRate,
    message: applicableRate 
      ? 'Exact vendor rate applied.' 
      : 'Standard flat-rate shipping applied due to missing vendor matrix.'
  });
});