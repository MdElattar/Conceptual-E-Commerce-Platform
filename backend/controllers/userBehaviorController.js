import asyncHandler from 'express-async-handler';
import UserBehavior from '../models/userBehaviorModel.js';

export const logEvent = asyncHandler(async (req, res) => {
  const { eventType, product, searchQuery, metadata } = req.body;

  if (!eventType) {
    res.status(400);
    throw new Error('Event type is required');
  }

  const validEvents = ['view', 'add_to_cart', 'purchase', 'search', 'wishlist'];
  if (!validEvents.includes(eventType)) {
    res.status(400);
    throw new Error(`Invalid event type. Must be one of: ${validEvents.join(', ')}`);
  }

  if (eventType === 'search' && !searchQuery) {
    res.status(400);
    throw new Error('Search query is required for search events');
  }

  if (eventType !== 'search' && !product) {
    res.status(400);
    throw new Error('Product ID is required for this event type');
  }

  const event = await UserBehavior.create({
    user: req.user._id,
    eventType,
    product,
    searchQuery,
    metadata,
  });

  res.status(201).json({ message: 'Event logged', eventId: event._id });
});

export const getMyBehavior = asyncHandler(async (req, res) => {
  const { eventType, limit = 50 } = req.query;

  const filter = { user: req.user._id };
  if (eventType) filter.eventType = eventType;

  const events = await UserBehavior.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(parseInt(limit), 200))
    .populate('product', 'name images price category brand');

  res.json(events);
});
