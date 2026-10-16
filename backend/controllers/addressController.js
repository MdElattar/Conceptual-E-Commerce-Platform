import asyncHandler from "express-async-handler";
import User from "../models/userModel.js";

// @desc    Get all saved addresses for logged in user
// @route   GET /api/addresses
// @access  Private
export const getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.json(user.addresses);
  } else {
    res.status(404);
    throw new Error("User not found.");
  }
});

// @desc    Add a new address
// @route   POST /api/addresses
// @access  Private
export const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  const {
    fullName, phone, city, district, addressLine, country,
    state, building, apartment, zipCode, addressLabel, notes, isDefault
  } = req.body;

  if (!fullName || !phone || !addressLine || !city) {
    res.status(400);
    throw new Error("Full name, phone, address line, and city are required.");
  }

  const newAddress = {
    fullName, phone, city, district: district || '',
    addressLine, country: country || 'EG',
    state: state || '', building: building || '',
    apartment: apartment || '', zipCode: zipCode || '',
    addressLabel: addressLabel || 'Home',
    notes: notes || '',
    isDefault: isDefault || false,
  };

  if (newAddress.isDefault) {
    user.addresses.forEach(addr => { addr.isDefault = false; });
  }

  user.addresses.push(newAddress);
  await user.save();
  res.status(201).json(user.addresses);
});

// @desc    Update an address
// @route   PUT /api/addresses/:id
// @access  Private
export const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  const address = user.addresses.id(req.params.id);
  if (!address) {
    res.status(404);
    throw new Error("Address not found.");
  }

  const {
    fullName, phone, city, district, addressLine, country,
    state, building, apartment, zipCode, addressLabel, notes, isDefault
  } = req.body;

  if (fullName !== undefined) address.fullName = fullName;
  if (phone !== undefined) address.phone = phone;
  if (city !== undefined) address.city = city;
  if (district !== undefined) address.district = district;
  if (addressLine !== undefined) address.addressLine = addressLine;
  if (country !== undefined) address.country = country;
  if (state !== undefined) address.state = state;
  if (building !== undefined) address.building = building;
  if (apartment !== undefined) address.apartment = apartment;
  if (zipCode !== undefined) address.zipCode = zipCode;
  if (addressLabel !== undefined) address.addressLabel = addressLabel;
  if (notes !== undefined) address.notes = notes;

  if (isDefault !== undefined) {
    if (isDefault) {
      user.addresses.forEach(addr => { addr.isDefault = false; });
    }
    address.isDefault = isDefault;
  }

  await user.save();
  res.json(user.addresses);
});

// @desc    Delete an address
// @route   DELETE /api/addresses/:id
// @access  Private
export const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  const address = user.addresses.id(req.params.id);
  if (!address) {
    res.status(404);
    throw new Error("Address not found.");
  }

  address.deleteOne();
  await user.save();
  res.json(user.addresses);
});

// @desc    Set address as default
// @route   PUT /api/addresses/:id/default
// @access  Private
export const setDefaultAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found.");
  }

  const address = user.addresses.id(req.params.id);
  if (!address) {
    res.status(404);
    throw new Error("Address not found.");
  }

  user.addresses.forEach(addr => { addr.isDefault = false; });
  address.isDefault = true;
  await user.save();
  res.json(user.addresses);
});
