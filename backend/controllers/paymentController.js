import asyncHandler from '../middleware/asyncHandler.js';
import Stripe from 'stripe';
import User from '../models/userModel.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * @desc    Create Setup Intent to securely attach a new payment card method
 * @route   POST /api/payment/setup-intent
 * @access  Private
 */
export const createSetupIntent = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  if (!user) {
    res.status(404);
    throw new Error('User profile record context could not be resolved.');
  }

  let customerId = user.stripeCustomerId;

  // Verification step: Verify that the customer account reference exists actively inside Stripe dashboard logs
  if (customerId) {
    try {
      await stripe.customers.retrieve(customerId);
    } catch (error) {
      // Fault tolerance: reset local pointer mapping if the instance was deleted from gateway dashboard manually
      customerId = null;
    }
  }

  // Provision a new customer profile instance context within Stripe infrastructure if none is bound
  if (!customerId) {
    try {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user._id.toString() }
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    } catch (error) {
      res.status(500);
      throw new Error('Failed to create customer account registry profile in payment gateway service pipeline.');
    }
  }

  // Generate Setup Intent
  try {
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
    });

    res.status(200).json({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    res.status(500);
    throw new Error('Failed to initialize payment integration configuration attributes: ' + error.message);
  }
});

/**
 * @desc    Fetch all stored credit card instruments saved under user account
 * @route   GET /api/payment/cards
 * @access  Private
 */
export const getSavedCards = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  
  // Guard clause: return empty array safely if customer token is missing or unbound from payment processor
  if (!user || !user.stripeCustomerId) {
    return res.status(200).json([]);
  }

  try {
    // List payment source configurations tied directly to target identifier reference mapping codes
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
    });

    // Inspect user settings matrix parameters to accurately identify default primary card flag properties
    const customer = await stripe.customers.retrieve(user.stripeCustomerId);
    const defaultPm = customer.invoice_settings?.default_payment_method;

    // Normalize structural responses formatting layouts cleanly for frontend UI cards rendering modules
    const formattedCards = paymentMethods.data.map(pm => ({
      id: pm.id,
      brand: pm.card.brand,
      last4: pm.card.last4,
      expMonth: pm.card.exp_month,
      expYear: pm.card.exp_year,
      isDefault: pm.id === defaultPm
    }));

    res.status(200).json(formattedCards);
  } catch (error) {
    console.error('Stripe Fetch Cards Error Trace:', error.message);
    // Secure Fallback: return empty array rather than disrupting runtime server lifecycle process states
    res.status(200).json([]);
  }
});

/**
 * @desc    Detach a saved payment card instrument reference from user registration entries
 * @route   DELETE /api/payment/cards/:paymentMethodId
 * @access  Private
 */
export const detachCard = asyncHandler(async (req, res) => {
  const { paymentMethodId } = req.params;

  if (!paymentMethodId) {
    res.status(400);
    throw new Error('Payment Method ID attribute field is strictly required.');
  }

  try {
    await stripe.paymentMethods.detach(paymentMethodId);
    res.status(200).json({ message: 'Payment card method reference detached successfully.' });
  } catch (error) {
    res.status(500);
    throw new Error('Failed to process payment card resource detachment flow: ' + error.message);
  }
});

/**
 * @desc    Set a specific card configuration to serve as the default invoice payment instrument
 * @route   PUT /api/payment/cards/default
 * @access  Private
 */
export const setDefaultCard = asyncHandler(async (req, res) => {
  const { paymentMethodId } = req.body;
  
  if (!paymentMethodId) {
    res.status(400);
    throw new Error('Payment Method ID structural attribute parameter is required.');
  }

  const user = await User.findById(req.user._id);

  if (!user || !user.stripeCustomerId) {
    res.status(404);
    throw new Error('User payment processing credentials mapping could not be identified.');
  }

  try {
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });
    
    res.status(200).json({ message: 'Primary billing card instrument updated successfully.' });
  } catch (error) {
    res.status(500);
    throw new Error('Failed to reconfigure account primary default payment system settings: ' + error.message);
  }
});