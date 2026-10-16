import asyncHandler from "express-async-handler";
import Order from "../models/orderModel.js";
import stripePackage from "stripe";
import User from "../models/userModel.js";
import ShippingRate from "../models/shippingRateModel.js"; 
import Product from "../models/productModel.js"; 
import Coupon from "../models/couponModel.js";
import EliteSubscription from '../models/eliteSubscriptionModel.js';
import admin from "../config/firebaseAdmin.js"; 
import WalletTransaction from "../models/walletTransactionModel.js"; 

const stripe = stripePackage(process.env.STRIPE_SECRET_KEY);

const sendPushNotification = async (fcmToken, title, body) => {
  if (!fcmToken) return;
  const message = {
    token: fcmToken,
    notification: { title, body },
  };
  try {
    await admin.messaging().send(message);
    console.log("✅ FCM Notification sent successfully");
  } catch (error) {
    console.error("❌ Firebase Error:", error.message);
  }
};

// Calculate shipping rates based on country and weight configuration
export const calculateOrderShipping = async (cartItems, countryCode, isElite = false) => {
  if (isElite) return 0;
  let totalShippingCost = 0;
  const rates = await ShippingRate.find({ country: countryCode?.toUpperCase() }).sort({ minWeight: 1 });
  
  if (!rates || rates.length === 0) return 0;

  // 🌟 التعديل السحري: حساب الوزن الإجمالي أولاً زي الفرونت إند بالظبط
  const totalWeight = cartItems.reduce((acc, item) => {
    const physical = Number(item.weight || 0);
    const volumetric = (Number(item.length || 0) * Number(item.width || 0) * Number(item.height || 0)) / 5000;
    return acc + (Math.max(physical, volumetric) * item.qty);
  }, 0);

  // 🌟 البحث عن شريحة الشحن التي تطابق الوزن الإجمالي
  const matchedRate = rates.find(r => totalWeight >= r.minWeight && totalWeight <= r.maxWeight);

  if (matchedRate) {
    return matchedRate.cost;
  } else {
    // لو الوزن تخطى كل الشرائح، نأخذ أعلى شريحة شحن
    return rates[rates.length - 1].cost;
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = asyncHandler(async (req, res) => {
  const {
  orderItems, customerName, phoneNumber, phone, address, countryCode, paymentMethod, 
    itemsPrice, taxPrice, currency, exchangeRate, savedCardId, totalWeight, discountPrice, couponCode
  } = req.body;

  // Check Elite membership for benefits
  let isEliteMember = false;
  let eliteDiscountRate = 0;
  try {
    const eliteSub = await EliteSubscription.findOne({
      user: req.user._id,
      status: 'active',
      expiresAt: { $gt: new Date() },
    });
    if (eliteSub) {
      isEliteMember = true;
      eliteDiscountRate = 20;
    }
  } catch (e) {
    // Elite check failure should not block order
  }

  const originalItemsPrice = Number(itemsPrice);
  const effectiveItemsPrice = isEliteMember ? originalItemsPrice * (1 - eliteDiscountRate / 100) : originalItemsPrice;
  const eliteSavingsAmount = isEliteMember ? originalItemsPrice - effectiveItemsPrice : 0;

const calculatedShippingPrice = await calculateOrderShipping(orderItems, address?.countryCode || 'EG', isEliteMember);
  const calculatedTotalPrice = effectiveItemsPrice + calculatedShippingPrice + Number(taxPrice || 0) - Number(discountPrice || 0);

  let totalPlatformCommission = 0;

  // 🌟 المعالجة الآلية لعناصر السلة وحساب أرباح التاجر والموقع
  const processedOrderItems = orderItems.map((item) => {
    const effectivePrice = isEliteMember ? item.price * (1 - eliteDiscountRate / 100) : item.price;
    const itemTotal = effectivePrice * item.qty;
    const commissionRate = 10;
    const commissionEarned = (itemTotal * commissionRate) / 100;
    const vendorEarnings = itemTotal - commissionEarned;
    
    totalPlatformCommission += commissionEarned;

    return {
      name: item.name,
      qty: item.qty,
      image: item.image,
      price: effectivePrice,
      product: item._id,
      vendor: item.vendor || item.user,
      commissionRate,
      commissionEarned,
      vendorEarnings,
      eliteDiscounted: isEliteMember,
      payoutStatus: "Holding",
      itemStatus: "Pending"
    };
  });

  // 1. Inputs validation
  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error("No order items found in the request.");
  }

  if (!phoneNumber || phoneNumber.trim().length < 11) {
    res.status(400);
    throw new Error("Please provide a valid phone number to complete the order.");
  }

  // Extract coupon code cleanly from multiple formats
  let actualCouponCode = null;
  if (typeof req.body.couponCode === "string") {
    actualCouponCode = req.body.couponCode.trim();
  } else if (typeof req.body.coupon === "string") {
    actualCouponCode = req.body.coupon.trim();
  } else if (req.body.coupon && typeof req.body.coupon.code === "string") {
    actualCouponCode = req.body.coupon.code.trim();
  } else if (typeof req.body.promoCode === "string") {
    actualCouponCode = req.body.promoCode.trim();
  } else if (typeof req.body.code === "string") {
    actualCouponCode = req.body.code.trim();
  }

  if (Number(discountPrice) > 0 && !actualCouponCode) {
    console.warn(
      "⚠️ Warning: Frontend sent a discount value but missing coupon code. Body keys received:",
      Object.keys(req.body),
    );
  }

  // Extract country code securely
  const orderCountryCode =
    address?.country || address?.countryCode || req.body.countryCode || "EG";

  // 2. Fetch User Profile
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User profile not found.");
  }

  // Auto-sync user phone number if updated
  if (user.phone !== phoneNumber) {
    user.phone = phoneNumber;
    await user.save();
  }

  let customerId = user.stripeCustomerId;

  // 3. Handle Stripe Customer Setup
  if (paymentMethod === "Stripe") {
    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
      } catch (e) {
        customerId = null;
      }
    }

    if (!customerId) {
      try {
        const customer = await stripe.customers.create({
          email: user.email,
          name: customerName || user.name,
          phone: phoneNumber,
          metadata: { userId: user._id.toString() },
        });
        customerId = customer.id;
        user.stripeCustomerId = customerId;
        await user.save();
      } catch (error) {
        res.status(500);
        throw new Error("Payment gateway customer registration failed: " + error.message);
      }
    }
  }

  // 4. Initialize Database Order Instance
  const order = new Order({
    user: req.user._id,
    customerName,
    phone: phone || phoneNumber, 
    address,
    itemsPrice: effectiveItemsPrice,
    shippingPrice: calculatedShippingPrice, 
    taxPrice,
    couponCode: actualCouponCode, 
    discountPrice: discountPrice || 0, 
    totalPrice: calculatedTotalPrice, 
    totalWeight: totalWeight || 0,
    paymentMethod,
    currency: currency || "USD",
    totalPlatformCommission,
    exchangeRate: exchangeRate || 1,
    isEliteOrder: isEliteMember,
    eliteSavings: eliteSavingsAmount,
    orderItems: orderItems.map((item) => {
      const effectivePrice = isEliteMember ? item.price * (1 - eliteDiscountRate / 100) : item.price;
      return {
        name: item.name,
        qty: item.qty,
        image: item.image,
        price: effectivePrice,
        color: item.selectedColor,
        size: item.selectedSize,
        weight: item.weight || 0,
        product: item._id,
        vendor: item.vendor || item.user,
        eliteDiscounted: isEliteMember,
      };
    }),
  });

  const createdOrder = await order.save();

  // Deduct product stock safely
  for (const item of orderItems) {
    try {
      await Product.findByIdAndUpdate(item._id, {
        $inc: { countInStock: -item.qty },
      });
    } catch (stockError) {
      console.error(`🚨 Failed to update stock for product ID ${item._id}:`, stockError.message);
    }
  }

  // 5. Stripe Gateway Processing
  if (paymentMethod === "Stripe") {
    try {
      // --- Case A: Direct Charge with Saved Card Token ---
      if (savedCardId && customerId) {
        const amount = Math.round(calculatedTotalPrice * 100); 
        console.log("FINAL AMOUNT SENT TO STRIPE:", amount);
        
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amount, 
          currency: currency?.toLowerCase() || "usd",
          customer: customerId,
          payment_method: savedCardId,
          confirm: true,
          off_session: false,
          description: `Order ${createdOrder._id} - Phone: ${phoneNumber}`,
          return_url: `${process.env.FRONTEND_URL}/success`,
        });

        if (paymentIntent.status === "succeeded") {
          createdOrder.isPaid = true;
          createdOrder.paidAt = Date.now();

          // Increment coupon usage
          if (createdOrder.couponCode) {
            await Coupon.findOneAndUpdate(
              { code: createdOrder.couponCode.toUpperCase() },
              { $inc: { usedCount: 1 } },
            );
            console.log(`[Success] Coupon counter incremented for: ${createdOrder.couponCode}`);
          }

          createdOrder.paymentResult = {
            id: paymentIntent.id,
            status: paymentIntent.status,
            email_address: user.email,
          };
          const updatedOrder = await createdOrder.save();
          return res.status(201).json(updatedOrder);
        } else if (paymentIntent.status === "requires_action") {
          return res.status(200).json({
            status: "requires_action",
            clientSecret: paymentIntent.client_secret,
            orderId: createdOrder._id,
          });
        }
      }

      // --- Case B: Initialize Stripe Checkout Session ---
      let stripeDiscounts = [];
      if (Number(discountPrice) > 0) {
        try {
          const coupon = await stripe.coupons.create({
            amount_off: Math.round(Number(discountPrice) * 100),
            currency: "usd", 
            duration: "once",
          });
          stripeDiscounts.push({ coupon: coupon.id });
        } catch (couponError) {
          console.error("Stripe Coupon Generation Error:", couponError.message);
        }
      }

      // 🌟 جلب العملة وسعر الصرف المرسل من الفرونت إند
      const targetCurrency = currency ? currency.toLowerCase() : "usd";
      const rate = Number(exchangeRate) || 1;

      // ... داخل الـ Session الخاصة بـ Stripe
      const stripeLineItems = orderItems.map((item) => ({
        price_data: {
          currency: targetCurrency, // 🌟 العملة تتغير تلقائياً
          product_data: {
            name: `${item.name} (${item.selectedColor || "N/A"} - ${item.selectedSize || "N/A"})`,
            images: [item.image],
          },
          unit_amount: Math.round(item.price * rate * 100), // 🌟 الضرب في سعر الصرف المحلي
        },
        quantity: item.qty,
      }));

      if (calculatedShippingPrice > 0) {
        stripeLineItems.push({
          price_data: {
            currency: targetCurrency,
            product_data: { name: "Shipping Cost" },
            unit_amount: Math.round(calculatedShippingPrice * rate * 100), // 🌟 شحن بالعملة المحلية
          },
          quantity: 1,
        });
      }

      // Append Tax item
      if (taxPrice > 0) {
        stripeLineItems.push({
          price_data: {
            currency: "usd",
            product_data: { name: "Tax" },
            unit_amount: Math.round(taxPrice * 100),
          },
          quantity: 1,
        });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        customer: customerId,
        line_items: stripeLineItems,
        discounts: stripeDiscounts, 
        mode: "payment",
        payment_intent_data: {
          setup_future_usage: "off_session",
        },
        metadata: {
          orderId: createdOrder._id.toString(),
          userId: user._id.toString(),
          customerPhone: phoneNumber,
        },
        success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}&orderId=${createdOrder._id}`,
        cancel_url: `${process.env.FRONTEND_URL}/cart`,
      });

      // Secure coupon slot immediately for Checkout flows
      if (createdOrder.couponCode) {
        await Coupon.findOneAndUpdate(
          { code: createdOrder.couponCode.toUpperCase() },
          { $inc: { usedCount: 1 } },
        );
        console.log(`[Pending Checkout] Coupon counter incremented for: ${createdOrder.couponCode}`);
      }

      createdOrder.paymentResult = { id: session.id, status: "Pending" };
      await createdOrder.save();

      return res.status(201).json({ url: session.url, _id: createdOrder._id });
    } catch (error) {
      console.error("Stripe Logic Error: ", error.message);
      res.status(500);
      throw new Error("Payment processing failed: " + error.message);
    }
  } else {
    // Handle Alternative Methods (e.g., COD / Wallet)
    if (actualCouponCode) {
      const cleanCode = actualCouponCode.trim().toUpperCase();
      const updateResult = await Coupon.updateOne(
        { code: cleanCode },
        { $inc: { usedCount: 1 } },
      );

      if (updateResult.modifiedCount > 0) {
        console.log(`✅ [Confirmed] Database coupon counter updated for: ${cleanCode}`);
      } else {
        console.error(`❌ [Error] Target coupon not found matching code: "${cleanCode}"`);
      }
    }
    return res.status(201).json(createdOrder);
  }
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({
    createdAt: -1,
  });
  res.json(orders);
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .populate("user", "id name email phone")
    .sort({ createdAt: -1 });
  res.json(orders);
});

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
export const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentResult = {
      id: req.body.id || order.paymentResult.id,
      status: req.body.status || "COMPLETED",
      update_time: req.body.update_time || new Date().toISOString(),
      email_address: req.body.payer
        ? req.body.payer.email_address
        : req.user.email,
    };
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error("Order not found.");
  }
});


// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 🛡️ تريكة الأمان: لو الفرونت إند بعت ID فاضي أو كلمة undefined، نرفض الطلب بشياكة بدون كراش
  if (!id || id === 'undefined' || id === 'null') {
    res.status(400);
    throw new Error("Invalid Order ID format.");
  }

  const order = await Order.findById(id).populate(
    "user",
    "name email phone",
  );

  if (order) {
    res.json(order);
  } else {
    res.status(404);
    throw new Error("Order not found.");
  }
});

// @desc    Update order to processed
// @route   PUT /api/orders/:id/process
// @access  Private/Admin
export const updateOrderToProcessed = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (order) {
    order.isProcessed = true;
    order.processedAt = Date.now();
    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error("Order not found.");
  }
});

// @desc    Update order to on way
// @route   PUT /api/orders/:id/onway
// @access  Private/Admin
export const updateOrderToOnWay = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "fcmToken",
  );

  if (order) {
    order.isOnWay = true;
    order.onWayAt = Date.now();
    order.status = "On the Way"; 
    const updatedOrder = await order.save();

    const io = req.app.get("socketio");

    // Socket Dispatch
    if (io) {
      io.to(order.user._id.toString()).emit("orderUpdate", {
        orderId: order._id,
        status: "On the Way",
        message: "Great news! Your order is now on its way to you 🚚",
      });
    }

    // FCM Push Notification Dispatch
    if (order.user && order.user.fcmToken) {
      await sendPushNotification(
        order.user.fcmToken,
        "Your order is on the way! 🚚",
        `Order #${order._id} is out for shipping and heading towards you.`,
      );
    }

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error("Order not found.");
  }
});

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
export const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "fcmToken",
  );

  if (order) {
    order.isDelivered = true;
    order.deliveredAt = Date.now();
    order.status = "Delivered";
    const updatedOrder = await order.save();

    const io = req.app.get("socketio");
    const message = `Order #${order._id} has been delivered! 🏁`;

    // 1. Socket Live update
    if (io) {
      io.to(order.user._id.toString()).emit("orderUpdate", {
        message,
        orderId: order._id,
        status: "Delivered",
      });
    }

    // 2. Firebase Push Notification dispatch
    if (order.user && order.user.fcmToken) {
      await sendPushNotification(
        order.user.fcmToken,
        "Your order has been delivered! 🏁",
        `Order #${order._id} was successfully delivered. Thank you for choosing us!`,
      );
    }

    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error("Order not found.");
  }
});
// =========================================================================
// 1. Cancel Order Handler (Invoked by Customer or Automatic System Process)
// =========================================================================
export const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found.");
  }

  if (order.isCancelled || order.status === "Cancelled") {
    res.status(400);
    throw new Error("Order is already cancelled.");
  }

  // Pure Protection: If the order is unpaid, cancel immediately without touching wallet assets
  if (!order.isPaid) {
    await Order.updateOne(
      { _id: req.params.id },
      {
        $set: {
          isCancelled: true,
          status: "Cancelled",
          cancelledAt: Date.now(),
        },
      },
    );
    const updatedOrder = await Order.findById(req.params.id);
    return res.json(updatedOrder);
  }

  // If the order is paid, reverse the funds back to the user's secure wallet balance
  if (
    order.isPaid &&
    ["Wallet", "Stripe", "Visa", "Card"].includes(order.paymentMethod)
  ) {
    const user = await User.findById(order.user);
    if (user) {
      user.storeCredit = (user.storeCredit || 0) + order.totalPrice;
      await user.save();

      // Log wallet deposit automatic transaction history entries securely
      await WalletTransaction.create({
        user: user._id,
        transactionType: 'Deposit', 
        amount: order.totalPrice,
        balanceAfter: user.storeCredit, 
        order: order._id,
        actionBy: req.user._id,
        description: `Automatic wallet refund due to cancellation of paid order #${order._id.toString().slice(-6).toUpperCase()}.`,
      });

      console.log(`💰 Successfully reversed ${order.totalPrice} to wallet and logged transaction history entry.`);
    }
  }

  // Commit order status changes in the database after ledger adjustments
  await Order.updateOne(
    { _id: req.params.id },
    {
      $set: { isCancelled: true, status: "Cancelled", cancelledAt: Date.now() },
    },
  );

  const updatedOrder = await Order.findById(req.params.id);
  res.json(updatedOrder);
});


// =========================================================================
// 2. Admin Specific Cancel Order Handler (Dashboard Execution Flow)
// =========================================================================
export const updateOrderToCancelled = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found.");
  }

  if (order.isCancelled || order.status === "Cancelled") {
    res.status(400);
    throw new Error("Order is already cancelled.");
  }

  // Admin reversal logic: Return financial stakes to wallet only if order state indicates it is paid
  if (
    order.isPaid &&
    ["Wallet", "Stripe", "Visa", "Card"].includes(order.paymentMethod)
  ) {
    const user = await User.findById(order.user);
    if (user) {
      user.storeCredit = (user.storeCredit || 0) + order.totalPrice;
      await user.save();

      // Log structured deposit ledger entry performed directly by admin staff
      await WalletTransaction.create({
        user: user._id,
        transactionType: 'Deposit', 
        amount: order.totalPrice,
        balanceAfter: user.storeCredit, 
        order: order._id,
        actionBy: req.user._id, 
        description: `Wallet refund deposited by Admin for cancelling order #${order._id.toString().slice(-6).toUpperCase()}.`,
      });

      console.log(`💰 [Admin Action] Successfully refunded ${order.totalPrice} to wallet by admin and logged financially.`);
    }
  }

  // Terminate order pipeline state cleanly
  await Order.updateOne(
    { _id: req.params.id },
    {
      $set: { isCancelled: true, status: "Cancelled", cancelledAt: Date.now() },
    },
  );

  const updatedOrder = await Order.findById(req.params.id);
  res.json(updatedOrder);
});

// @desc    Pay order using Wallet credits securely
// @route   PUT /api/orders/:id/wallet-pay
// @access  Private
export const payOrderWithWallet = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  const user = await User.findById(req.user._id);

  if (order && user) {
    if (user.storeCredit >= order.totalPrice) {
      user.storeCredit -= order.totalPrice;
      await user.save();
      
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentMethod = "Wallet";
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(400);
      throw new Error("Insufficient wallet credit balance to process this checkout transaction.");
    }
  } else {
    res.status(404);
    throw new Error("Target order or user account context could not be resolved.");
  }
});

// @desc    Add new shipping rate configuration criteria matrix entry
// @route   POST /api/shipping-rates
// @access  Private/Admin
export const addShippingRate = asyncHandler(async (req, res) => {
  const { country, minWeight, maxWeight, cost, isDefault } = req.body;

  const rate = new ShippingRate({
    country: country.toUpperCase(),
    minWeight,
    maxWeight,
    cost,
    isDefault,
  });

  const createdRate = await rate.save();
  res.status(201).json(createdRate);
});

// @desc    Calculate and fetch accurate shipping price preview estimates
// @route   POST /api/shipping-rates/estimate
// @access  Public
export const getShippingEstimate = asyncHandler(async (req, res) => {
  const { cartItems, countryCode } = req.body;

  // 1. Calculate combined volumetric or physical cargo weights accurately
  const totalWeight = cartItems.reduce((acc, item) => {
    const physical = Number(item.weight || 0);
    const volumetric =
      (Number(item.length || 0) *
        Number(item.width || 0) *
        Number(item.height || 0)) /
      5000;
    return acc + Math.max(physical, volumetric) * item.qty;
  }, 0);

  // 2. Fetch matched rule bounds mapping targeting region specs
  const rateRule = await ShippingRate.findOne({
    country: countryCode?.toUpperCase(),
    minWeight: { $lte: totalWeight },
    maxWeight: { $gte: totalWeight },
  });

  if (rateRule) {
    res.json({
      shippingPrice: rateRule.cost,
      weight: totalWeight,
      ruleFound: true,
    });
  } else {
    res.json({
      shippingPrice: 0,
      weight: totalWeight,
      ruleFound: false,
    });
  }
});

// @desc    Deduct money from user wallet after manual bank transfer execution flow
// @route   PUT /api/orders/:id/admin-bank-refund
// @access  Private/Admin
export const adminBankRefundAndDeductWallet = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error("Order not found.");
  }

  // 1. Strict Protection check: Verify order state structure matches flags
  if (!order.isCancelled || !order.isPaid) {
    res.status(400);
    throw new Error("Deduction rejected. The order target must be explicitly cancelled and paid first.");
  }

  // 2. Race Condition Guard: Avoid duplicate manual execution flows
  if (order.refundStatus === "Refunded_To_Bank") {
    res.status(400);
    throw new Error("A standard bank return refund mechanism has already been settled for this order instance.");
  }

  const user = await User.findById(order.user);
  if (!user) {
    res.status(404);
    throw new Error("The user who placed the target order could not be located.");
  }

  // 3. Asset coverage validation checks
  if ((user.storeCredit || 0) < order.totalPrice) {
    res.status(400);
    throw new Error(`Customer's current wallet balance (${user.storeCredit}) is lower than the order amount to deduct (${order.totalPrice}).`);
  }

  // =========================================================================
  // Atomic Database State Lock Mechanism: Evade duplicate processing loops
  // =========================================================================
  const updatedOrder = await Order.findOneAndUpdate(
    { _id: order._id, refundStatus: { $ne: "Refunded_To_Bank" } },
    { $set: { refundStatus: "Refunded_To_Bank" } },
    { returnDocument: 'after' },
  );

  if (!updatedOrder) {
    res.status(400);
    throw new Error("Security Warning: This request has already been processed successfully. Duplicate deduction prevented!");
  }

  // 4. Secure deduction processing window execution safely
  user.storeCredit -= order.totalPrice;
  await user.save();

  // Create auditable transaction records inside accounting history structures
  await WalletTransaction.create({
    user: user._id,
    transactionType: "Deduction",
    amount: order.totalPrice,
    balanceAfter: user.storeCredit, 
    order: order._id,
    actionBy: req.user._id, 
    description: `An amount of $${order.totalPrice} was withdrawn from the customer's wallet following manual support bank transfer execution.`,
  });

  console.log(`❌ [Admin Action] Admin ${req.user?._id || "Admin"} successfully deducted ${order.totalPrice} from wallet of user ${user.name}.`);

  res.json({
    message: "Funds successfully debited from the account wallet and order reference flags updated.",
    currentBalance: user.storeCredit,
    order: updatedOrder, 
  });
});

// @desc    Get logged in user wallet ledger transactions records trace mapping
// @route   GET /api/orders/my-wallet-history
// @access  Private
export const getMyWalletHistory = asyncHandler(async (req, res) => {
  const transactions = await WalletTransaction.find({ user: req.user._id })
    .populate('order', '_id totalPrice') 
    .populate('actionBy', 'name')
    .sort({ createdAt: -1 });

  res.json(transactions);
});

// @desc    Get all wallet system transaction logs ledger records securely
// @route   GET /api/orders/admin/wallet-history
// @access  Private/Admin
export const getAllWalletHistory = asyncHandler(async (req, res) => {
  const transactions = await WalletTransaction.find({})
    .populate('user', 'name email')
    .populate('order', '_id totalPrice')
    .populate('actionBy', 'name')
    .sort({ createdAt: -1 });

  res.json(transactions);
});


// @desc    Get orders for the logged-in vendor (orders containing their products)
// @route   GET /api/orders/vendor
// @access  Private
export const getVendorOrders = asyncHandler(async (req, res) => {
  // 1. جلب جميع معرفات (IDs) المنتجات التي يمتلكها التاجر الحالي
  const vendorProducts = await Product.find({ user: req.user._id }).select('_id');

  // إذا كان التاجر لا يملك أي منتجات، إذن ليس لديه طلبات
  if (!vendorProducts || vendorProducts.length === 0) {
    return res.json([]);
  }

  // استخراج الـ IDs في مصفوفة عادية
  const vendorProductIds = vendorProducts.map(product => product._id);

  // 2. البحث في الطلبات عن أي طلب يحتوي حقل orderItems.product الخاص به على أي من منتجات التاجر
  const orders = await Order.find({
    "orderItems.product": { $in: vendorProductIds }
  })
    .populate("user", "name email phone") // جلب بيانات العميل صاحب الطلب
    .sort({ createdAt: -1 }); // ترتيب من الأحدث للأقدم

  // 3. إرسال الطلبات للفرونت إند
  res.json(orders);
});

// =========================================================================
// 🌟 [تريكة حماية التاجر] العميل يؤكد الاستلام بصورة، ويُحرر المال للتاجر (Bulletproof)
// =========================================================================
// @route   PUT /api/orders/:id/item/:itemId/confirm-delivery
// @access  Private (Customer Only)
export const customerConfirmItemDelivery = asyncHandler(async (req, res) => {
  try {
    // 🌟 التعديل السحري: سحب معرف الطلب سواء كان اسمه id أو orderId في الـ Routes
    const orderId = req.params.orderId || req.params.id; 
    const itemId = req.params.itemId;
    const { deliveryProofImage } = req.body; 

    // حماية إضافية لمنع الـ CastError لو بالغلط وصل undefined
    if (!orderId || orderId === 'undefined') {
      return res.status(400).json({ message: "معرف الطلب مفقود أو غير صالح." });
    }

    if (!deliveryProofImage) {
      return res.status(400).json({ message: "يجب إرفاق صورة إثبات الاستلام لتحرير الأموال." });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "الأوردر غير موجود." });

    // التأكد من أن الذي يؤكد هو صاحب الطلب
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "غير مصرح لك بتأكيد هذا الطلب." });
    }

    const item = order.orderItems.id(itemId);
    if (!item) return res.status(404).json({ message: "القطعة غير موجودة في هذا الطلب." });

    if (item.customerConfirmedDelivery) {
      return res.status(400).json({ message: "تم تأكيد استلام هذا المنتج مسبقاً والأموال حُررت بالفعل." });
    }

    // 1. تحديث حالة القطعة
    item.customerConfirmedDelivery = true;
    item.deliveryProofImage = deliveryProofImage;
    item.itemStatus = "Delivered";
    item.deliveredAt = Date.now();
    item.payoutStatus = "Released"; // 🔥 تحرير الأموال من الـ Escrow

    // 2. ترحيل الأموال لحساب التاجر بأمان (Clearing)
    if (item.vendor) {
      const vendor = await User.findById(item.vendor);
      if (vendor && vendor.vendorProfile) {
        
        // 🛡️ تريكة أمان للمنتجات القديمة
        const earnings = item.vendorEarnings || ((item.price * item.qty) * 0.9);

        // الأموال تصبح متاحة للسحب
        vendor.vendorProfile.availableBalance = (vendor.vendorProfile.availableBalance || 0) + earnings;
        
        // تسجيل حركة في الدفاتر المالية (Ledger) للتاجر
        await WalletTransaction.create({
          user: vendor._id,
          transactionType: "Deposit",
          amount: earnings,
          balanceAfter: vendor.vendorProfile.availableBalance,
          order: order._id,
          actionBy: req.user._id, // العميل الذي قام بالإجراء
          description: `أموال محررة: استلم العميل القطعة (${item.name}) من الأوردر #${order._id.toString().slice(-6)}.`,
        });
        
        await vendor.save();
      }
    }

    // 3. فحص هل كل القطع تم استلامها لنغلق الأوردر بالكامل
    const allDelivered = order.orderItems.every(i => i.customerConfirmedDelivery);
    if (allDelivered) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();
    }

    await order.save();
    res.status(200).json({ message: "تم تأكيد الاستلام وتحرير الأموال بنجاح!", order });

  } catch (error) {
    console.error("🚨 Escrow Release Error:", error);
    res.status(500).json({ message: `فشل النظام في تحرير الأموال: ${error.message}` });
  }
});

// @desc    Vendor Requests Payout (Real Money Transfer Trigger)
// @route   POST /api/orders/vendor/payout
// @access  Private/Vendor
export const requestVendorPayout = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const user = await User.findById(req.user._id);

  if (!user || user.role !== "vendor" || !user.vendorProfile) {
    res.status(403); throw new Error("صلاحيات التاجر مطلوبة.");
  }

  const requestedAmount = Number(amount);
  if (requestedAmount <= 0 || requestedAmount > user.vendorProfile.availableBalance) {
    res.status(400); throw new Error("المبلغ المطلوب غير صالح أو يتجاوز رصيدك المتاح للسحب.");
  }

  // 1. خصم المبلغ من الرصيد المتاح
  user.vendorProfile.availableBalance -= requestedAmount;
  await user.save();

  // 2. تسجيل طلب السحب ليقوم الأدمن/النظام بمعالجته عبر Vesto أو تحويل بنكي
  await WalletTransaction.create({
    user: user._id,
    actionBy: user._id,
    transactionType: "Withdrawal",
    amount: requestedAmount,
    balanceAfter: user.vendorProfile.availableBalance,
    description: `طلب سحب أرباح إلى الحساب البنكي.`,
    status: "Pending" // يحتاج موافقة نظام الإدارة
  });

  res.json({ message: "تم تسجيل طلب السحب بنجاح. قيد المعالجة." });
});

// =========================================================================
// 🌟 [جديد] دوال الأدمن للتحكم في السحوبات (Admin Payout Controllers)
// =========================================================================

// @desc    Get all pending vendor payout requests
// @route   GET /api/orders/payout-requests
// @access  Private/Admin
export const getPayoutRequests = asyncHandler(async (req, res) => {
  // نبحث في المعاملات عن سحوبات التجار المعلقة
  const requests = await WalletTransaction.find({ 
    transactionType: 'Withdrawal', 
    status: 'Pending' 
  }).populate('user', 'name email vendorProfile').sort({ createdAt: -1 });

  // نعيد صياغة الداتا لتناسب الفرونت إند الذي يستقبل (request.vendor)
  const formattedRequests = requests.map(req => ({
    _id: req._id,
    amount: req.amount,
    createdAt: req.createdAt,
    status: req.status,
    vendor: req.user // نرسل بيانات المستخدم كـ vendor للفرونت
  }));

  res.json(formattedRequests);
});

// @desc    Resolve a payout request (Approve/Reject)
// @route   PUT /api/orders/payout-requests/:id
// @access  Private/Admin
export const resolvePayoutRequest = asyncHandler(async (req, res) => {
  const { status } = req.body; // يجب أن تكون 'completed' أو 'rejected'
  const transactionId = req.params.id;

  const transaction = await WalletTransaction.findById(transactionId).populate('user');

  if (!transaction) {
    res.status(404); throw new Error("طلب السحب غير موجود.");
  }

  if (transaction.status !== 'Pending') {
    res.status(400); throw new Error("هذا الطلب تمت معالجته مسبقاً.");
  }

  const vendor = transaction.user;

  if (status === 'completed') {
    // تحديث حالة العملية إلى مكتملة (تم التحويل البنكي)
    transaction.status = 'Completed';
    transaction.actionBy = req.user._id;
    transaction.description = transaction.description + ' (تم تأكيد التحويل بواسطة الإدارة)';
    await transaction.save();
    
    res.json({ message: "تم تأكيد تحويل الأموال للتاجر بنجاح." });
  } 
  else if (status === 'rejected') {
    // في حالة الرفض، يجب إرجاع المبلغ المسحوب إلى رصيد التاجر المتاح
    transaction.status = 'Rejected';
    transaction.actionBy = req.user._id;
    transaction.description = transaction.description + ' (مرفوض - تم إرجاع المبلغ للرصيد)';
    await transaction.save();

    if (vendor && vendor.vendorProfile) {
      vendor.vendorProfile.availableBalance += transaction.amount;
      await vendor.save();
    }

    res.json({ message: "تم رفض الطلب وإرجاع المبلغ لرصيد التاجر." });
  } 
  else {
    res.status(400); throw new Error("حالة غير صالحة.");
  }
});

// @desc    Get vendor wallet transaction history
// @route   GET /api/orders/vendor/wallet-transactions
// @access  Private/Vendor
export const getVendorWalletTransactions = asyncHandler(async (req, res) => {
  const transactions = await WalletTransaction.find({ user: req.user._id })
    .populate('order', 'createdAt')
    .populate('actionBy', 'name email')
    .sort('-createdAt');
  res.json(transactions);
});