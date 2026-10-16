// 🧠 العقل المدبر لمنظومة التجار والعمولات - بمواصفات أمازون وعلي بابا
import asyncHandler from "express-async-handler";
import User from "../models/userModel.js"; 
import Product from "../models/productModel.js";
import Order from "../models/orderModel.js";
import WalletTransaction from '../models/walletTransactionModel.js';
import { auditOrderItemShip, auditOrderItemCancel, auditPayoutRequest } from '../services/auditService.js';

/**
 * @desc    جلب إحصائيات لوحة تحكم التاجر (Dashboard Stats)
 * @route   GET /api/vendor/stats
 * @access  Private/Vendor
 */
export const getVendorStats = asyncHandler(async (req, res) => {
    const vendorId = req.user._id;

    // 1. جلب رصيد المحفظة الحالي من ملف المستخدم نفسه
    const vendor = await User.findById(vendorId);
    const walletBalance = vendor.vendorProfile ? vendor.vendorProfile.availableBalance : 0;

    // 2. حساب عدد منتجات التاجر في الموقع
    const totalProducts = await Product.countDocuments({ user: vendorId });

    // 3. جلب كل الطلبات التي تحتوي على منتجات لهذا التاجر
    const orders = await Order.find({ "orderItems.vendor": vendorId });

    // 4. حساب مبيعات التاجر الإجمالية والطلبات المعلقة والمكتملة
    let totalSalesValue = 0;
    let pendingOrdersCount = 0;
    let completedOrdersCount = 0;

    orders.forEach((order) => {
      order.orderItems.forEach((item) => {
        if (item.vendor.toString() === vendorId.toString()) {
          // حساب المبيعات بناءً على صافي أرباح التاجر المستحقة
          if (order.isPaid) {
            totalSalesValue += item.vendorEarnings * item.qty;
          }
          
          if (item.itemStatus === "Delivered") {
            completedOrdersCount++;
          } else if (item.itemStatus !== "Cancelled") {
            pendingOrdersCount++;
          }
        }
      });
    });

    res.status(200).json({
      success: true,
      stats: {
        walletBalance,
        totalProducts,
        totalOrders: orders.length,
        pendingOrdersCount,
        completedOrdersCount,
        totalEarnings: Number(totalSalesValue.toFixed(2)),
      },
    });
});

/**
 * @desc    جلب الطلبات الخاصة بمنتجات التاجر فقط
 * @route   GET /api/vendor/orders
 * @access  Private/Vendor
 */
export const getVendorOrders = asyncHandler(async (req, res) => {
    const vendorId = req.user._id;

    // جلب الأوردرات وفلترة المصفوفة الداخلية ليعود للتاجر منتجاته هو فقط لعدم كشف بيانات التجار الآخرين
    const orders = await Order.find({ "orderItems.vendor": vendorId })
      .sort({ createdAt: -1 })
      .populate("user", "name email");

    const vendorSpecificOrders = orders.map((order) => {
      const filteredItems = order.orderItems.filter(
        (item) => item.vendor.toString() === vendorId.toString()
      );

      // حساب إجمالي هذا التاجر في هذا الأوردر المعين
      const vendorItemsPrice = filteredItems.reduce((acc, item) => acc + item.price * item.qty, 0);

      return {
        _id: order._id,
        customerName: order.customerName,
        phone: order.phone,
        address: order.address,
        paymentMethod: order.paymentMethod,
        isPaid: order.isPaid,
        currency: order.currency,
        createdAt: order.createdAt,
        vendorItems: filteredItems,
        vendorTotalEarned: vendorItemsPrice,
      };
    });

    res.status(200).json({ success: true, orders: vendorSpecificOrders });
});

/**
 * @desc    🌟 [تريكة الـ Escrow] تحديث حالة المنتج وفك حجز الأموال للتاجر عند التوصيل
 * @route   PUT /api/vendor/orders/:orderId/item/:itemId
 * @access  Private/Vendor
 */
export const updateVendorOrderItemStatus = asyncHandler(async (req, res) => {
    const { orderId, itemId } = req.params;
    const { status, trackingNumber, reason } = req.body;
    const vendorId = req.user._id;

    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404);
      throw new Error("الطلب غير موجود");
    }

    const item = order.orderItems.find(
      (i) => i._id.toString() === itemId && i.vendor.toString() === vendorId.toString()
    );

    if (!item) {
      res.status(403);
      throw new Error("غير مسموح لك بتعديل هذا المنتج");
    }

    item.itemStatus = status;

    if (status === "Shipped") {
      item.trackingNumber = trackingNumber || '';
      item.shippedAt = new Date();
      item.vendorShipped = true;
      await auditOrderItemShip({ user: vendorId, orderId, itemId, itemName: item.name, trackingNumber, req });
    }

    if (status === "Delivered") {
      item.deliveredAt = new Date();

      if (order.isPaid && item.payoutStatus === "Holding") {
        item.payoutStatus = "Released";

        const vendorUser = await User.findById(vendorId);
        const earningsToAdd = item.vendorEarnings * item.qty;
        vendorUser.vendorProfile.availableBalance += earningsToAdd;
        await vendorUser.save();

        await WalletTransaction.create({
          user: vendorUser._id,
          transactionType: "Deposit",
          amount: earningsToAdd,
          balanceAfter: vendorUser.vendorProfile.availableBalance,
          order: order._id,
          actionBy: vendorId,
          description: `Escrow released: vendor marked item (${item.name}) as delivered for order #${order._id.toString().slice(-6)}.`,
        });

        await Product.findByIdAndUpdate(item.product, {
          $inc: { numSales: item.qty },
        });
      }
    }

    if (status === "Cancelled") {
      item.cancelledAt = new Date();
      item.cancelledReason = reason || '';
      await auditOrderItemCancel({ user: vendorId, orderId, itemId, itemName: item.name, reason, req });
    }

    await order.save();

    const allDelivered = order.orderItems.every((i) => i.itemStatus === "Delivered");
    if (allDelivered && !order.isDelivered) {
      order.isDelivered = true;
      order.deliveredAt = new Date();
      await order.save();
    }

    res.status(200).json({
      success: true,
      message: `Item status updated to ${status}`,
      order,
    });
});

/**
 * @desc    📊 Seller Performance Metrics Dashboard
 * @route   GET /api/vendor/performance
 * @access  Private/Vendor
 */
export const getSellerPerformance = asyncHandler(async (req, res) => {
    const vendorId = req.user._id;

    const orders = await Order.find({ "orderItems.vendor": vendorId }).populate('orderItems.product');
    const vendorItems = [];
    orders.forEach(order => {
      order.orderItems.forEach(item => {
        if (item.vendor.toString() === vendorId.toString()) {
          vendorItems.push({ ...item.toObject(), orderCreatedAt: order.createdAt, isPaid: order.isPaid });
        }
      });
    });

    const totalItems = vendorItems.length;
    const deliveredItems = vendorItems.filter(i => i.itemStatus === 'Delivered');
    const cancelledItems = vendorItems.filter(i => i.itemStatus === 'Cancelled');
    const shippedItems = vendorItems.filter(i => i.itemStatus === 'Shipped');

    const fulfillmentRate = totalItems > 0 ? (deliveredItems.length / totalItems) * 100 : 0;
    const cancellationRate = totalItems > 0 ? (cancelledItems.length / totalItems) * 100 : 0;

    const shippingTimes = deliveredItems
      .filter(i => i.shippedAt && i.deliveredAt)
      .map(i => (new Date(i.deliveredAt) - new Date(i.shippedAt)) / (1000 * 60 * 60));
    const avgShippingHours = shippingTimes.length > 0
      ? shippingTimes.reduce((a, b) => a + b, 0) / shippingTimes.length
      : 0;

    const totalSalesValue = deliveredItems.reduce((acc, i) => acc + (i.price * i.qty), 0);
    const totalEarnings = deliveredItems.reduce((acc, i) => acc + (i.vendorEarnings * i.qty || 0), 0);

    const products = await Product.find({ user: vendorId, status: 'active' });
    const totalRatings = products.reduce((acc, p) => acc + (p.rating || 0) * (p.numReviews || 0), 0);
    const totalReviews = products.reduce((acc, p) => acc + (p.numReviews || 0), 0);
    const avgRating = totalReviews > 0 ? totalRatings / totalReviews : 0;

    const performanceScore = Math.min(100, Math.round(
      (fulfillmentRate * 0.4) +
      (100 - cancellationRate) * 0.2 +
      (avgRating / 5) * 100 * 0.2 +
      Math.min(shippingTimes.length, 50) / 50 * 100 * 0.1 +
      Math.min(deliveredItems.length / 100, 1) * 100 * 0.1
    ));

    const monthlyTrends = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthItems = vendorItems.filter(item => {
        const d = new Date(item.orderCreatedAt || item.createdAt);
        return d >= monthStart && d < monthEnd;
      });
      const monthDelivered = monthItems.filter(i => i.itemStatus === 'Delivered');
      monthlyTrends.push({
        month: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
        orders: monthItems.length,
        delivered: monthDelivered.length,
        cancelled: monthItems.filter(i => i.itemStatus === 'Cancelled').length,
        sales: monthDelivered.reduce((acc, i) => acc + (i.price * i.qty), 0),
        earnings: monthDelivered.reduce((acc, i) => acc + (i.vendorEarnings * i.qty || 0), 0),
      });
    }

    res.status(200).json({
      success: true,
      performance: {
        fulfillmentRate: Number(fulfillmentRate.toFixed(1)),
        cancellationRate: Number(cancellationRate.toFixed(1)),
        avgShippingHours: Number(avgShippingHours.toFixed(1)),
        totalItems,
        deliveredItems: deliveredItems.length,
        cancelledItems: cancelledItems.length,
        shippedItems: shippedItems.length,
        pendingItems: totalItems - deliveredItems.length - cancelledItems.length - shippedItems.length,
        totalSalesValue: Number(totalSalesValue.toFixed(2)),
        totalEarnings: Number(totalEarnings.toFixed(2)),
        avgRating: Number(avgRating.toFixed(2)),
        totalReviews,
        performanceScore,
        grade: performanceScore >= 90 ? 'A+' : performanceScore >= 80 ? 'A' : performanceScore >= 70 ? 'B' : performanceScore >= 60 ? 'C' : 'D',
        monthlyTrends,
      },
    });
});

/**
 * @desc    Advanced Analytics — top/bottom products, weekly trends, comparisons, inventory, forecast
 * @route   GET /api/vendor/analytics
 * @access  Private/Vendor
 */
export const getVendorAnalytics = asyncHandler(async (req, res) => {
    const vendorId = req.user._id;
    const now = new Date();

    // ── Fetch orders ──
    const orders = await Order.find({ "orderItems.vendor": vendorId }).populate('orderItems.product');
    const vendorItems = [];
    orders.forEach(order => {
      order.orderItems.forEach(item => {
        if (item.vendor.toString() === vendorId.toString()) {
          vendorItems.push({ ...item.toObject(), orderCreatedAt: order.createdAt, isPaid: order.isPaid });
        }
      });
    });

    const deliveredItems = vendorItems.filter(i => i.itemStatus === 'Delivered');

    // ── Weekly trends (last 12 weeks) ──
    const weeklyTrends = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() - (i * 7));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const weekItems = vendorItems.filter(item => {
        const d = new Date(item.orderCreatedAt || item.createdAt);
        return d >= weekStart && d < weekEnd;
      });
      const weekDelivered = weekItems.filter(i => i.itemStatus === 'Delivered');
      weeklyTrends.push({
        week: weekStart.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        orders: weekItems.length,
        delivered: weekDelivered.length,
        sales: weekDelivered.reduce((acc, i) => acc + (i.price * i.qty), 0),
        earnings: weekDelivered.reduce((acc, i) => acc + (i.vendorEarnings * i.qty || 0), 0),
      });
    }

    // ── MoM / YoY comparisons ──
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevYearMonthStart = new Date(now.getFullYear() - 1, now.getMonth(), 1);

    const currentMonthItems = vendorItems.filter(item => new Date(item.orderCreatedAt) >= currentMonthStart);
    const prevMonthItems = vendorItems.filter(item => {
      const d = new Date(item.orderCreatedAt);
      return d >= prevMonthStart && d < currentMonthStart;
    });
    const prevYearItems = vendorItems.filter(item => {
      const d = new Date(item.orderCreatedAt);
      return d >= prevYearMonthStart && d < currentMonthStart;
    });

    const calcMonthRevenue = (items) => items.filter(i => i.itemStatus === 'Delivered').reduce((s, i) => s + (i.price * i.qty), 0);
    const calcMonthEarnings = (items) => items.filter(i => i.itemStatus === 'Delivered').reduce((s, i) => s + (i.vendorEarnings * i.qty || 0), 0);

    const curRevenue = calcMonthRevenue(currentMonthItems);
    const curEarnings = calcMonthEarnings(currentMonthItems);
    const curOrders = currentMonthItems.length;

    const prevRevenue = calcMonthRevenue(prevMonthItems);
    const prevOrders = prevMonthItems.length;

    const yoyRevenue = calcMonthRevenue(prevYearItems);
    const yoyOrders = prevYearItems.length;

    // ── Top / worst products ──
    const productSales = {};
    deliveredItems.forEach(item => {
      const pid = item.product?._id?.toString() || item.product?.toString();
      if (!pid) return;
      if (!productSales[pid]) {
        productSales[pid] = {
          id: pid,
          name: item.name || item.product?.name || 'Unknown',
          image: item.image || item.product?.image || '',
          qtySold: 0,
          revenue: 0,
          earnings: 0,
        };
      }
      productSales[pid].qtySold += item.qty || 0;
      productSales[pid].revenue += (item.price || 0) * (item.qty || 0);
      productSales[pid].earnings += (item.vendorEarnings || 0) * (item.qty || 0);
    });

    const sortedProducts = Object.values(productSales).sort((a, b) => b.qtySold - a.qtySold);
    const topProducts = sortedProducts.slice(0, 10);
    const bottomActiveProducts = await Product.find({ user: vendorId, status: 'active' })
      .sort({ numSales: 1 })
      .limit(10)
      .select('name image numSales price countInStock');

    // ── Profit margins ──
    const totalSalesValue = deliveredItems.reduce((acc, i) => acc + (i.price * i.qty), 0);
    const totalEarnings = deliveredItems.reduce((acc, i) => acc + (i.vendorEarnings * i.qty || 0), 0);
    const overallMargin = totalSalesValue > 0 ? (totalEarnings / totalSalesValue) * 100 : 0;

    const catMap = {};
    deliveredItems.forEach(item => {
      const cat = item.product?.category || 'Uncategorized';
      if (!catMap[cat]) catMap[cat] = { sales: 0, earnings: 0 };
      catMap[cat].sales += (item.price * item.qty);
      catMap[cat].earnings += (item.vendorEarnings * item.qty || 0);
    });
    const marginsByCategory = Object.entries(catMap).map(([category, data]) => ({
      category,
      margin: data.sales > 0 ? (data.earnings / data.sales) * 100 : 0,
      sales: data.sales,
    }));

    // ── Inventory insights ──
    const allProducts = await Product.find({ user: vendorId }).select('name countInStock lowStockThreshold status numSales');
    const totalStock = allProducts.reduce((acc, p) => acc + (p.countInStock || 0), 0);
    const lowStockItems = allProducts
      .filter(p => p.status === 'active' && p.countInStock > 0 && p.countInStock <= (p.lowStockThreshold || 5))
      .map(p => ({ id: p._id, name: p.name, countInStock: p.countInStock, threshold: p.lowStockThreshold || 5 }));
    const outOfStockItems = allProducts
      .filter(p => p.status === 'active' && p.countInStock === 0)
      .map(p => ({ id: p._id, name: p.name }));
    const totalSold = allProducts.reduce((acc, p) => acc + (p.numSales || 0), 0);
    const avgInventory = totalStock || 1;
    const turnoverRate = totalSold > 0 ? Number((totalSold / avgInventory).toFixed(1)) : 0;

    // ── Revenue forecast (3-month moving average) ──
    const last3Months = [];
    for (let i = 2; i >= 0; i--) {
      const ms = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const me = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const monthItems = vendorItems.filter(item => {
        const d = new Date(item.orderCreatedAt);
        return d >= ms && d < me;
      });
      last3Months.push(calcMonthRevenue(monthItems));
    }
    const avgMonthlyRevenue = last3Months.length > 0
      ? last3Months.reduce((a, b) => a + b, 0) / last3Months.length
      : 0;
    const trend = last3Months.length >= 2 && last3Months[2] > last3Months[0] ? 'up' :
      last3Months.length >= 2 && last3Months[2] < last3Months[0] ? 'down' : 'stable';

    res.json({
      success: true,
      analytics: {
        weeklyTrends,
        comparisons: {
          revenue: {
            current: Number(curRevenue.toFixed(2)),
            previousMonth: Number(prevRevenue.toFixed(2)),
            momChange: prevRevenue > 0 ? Number((((curRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1)) : 0,
            previousYear: Number(yoyRevenue.toFixed(2)),
            yoyChange: yoyRevenue > 0 ? Number((((curRevenue - yoyRevenue) / yoyRevenue) * 100).toFixed(1)) : 0,
          },
          orders: {
            current: curOrders,
            previousMonth: prevOrders,
            momChange: prevOrders > 0 ? Number((((curOrders - prevOrders) / prevOrders) * 100).toFixed(1)) : 0,
            previousYear: yoyOrders,
            yoyChange: yoyOrders > 0 ? Number((((curOrders - yoyOrders) / yoyOrders) * 100).toFixed(1)) : 0,
          },
          earnings: {
            current: Number(curEarnings.toFixed(2)),
            previousMonth: Number(calcMonthEarnings(prevMonthItems).toFixed(2)),
            momChange: calcMonthEarnings(prevMonthItems) > 0
              ? Number((((curEarnings - calcMonthEarnings(prevMonthItems)) / calcMonthEarnings(prevMonthItems)) * 100).toFixed(1))
              : 0,
          },
        },
        topProducts,
        worstProducts: bottomActiveProducts.map(p => ({
          id: p._id,
          name: p.name,
          image: p.image || '',
          numSales: p.numSales || 0,
          price: p.price,
          countInStock: p.countInStock,
        })),
        profitMargins: {
          overall: Number(overallMargin.toFixed(1)),
          byCategory: marginsByCategory,
        },
        inventoryInsights: {
          totalStock,
          lowStockItems,
          outOfStockItems,
          turnoverRate,
        },
        forecast: {
          nextMonthRevenue: Number(avgMonthlyRevenue.toFixed(2)),
          trend,
          basedOn: '3-month moving average',
        },
      },
    });
});

/**
 * @desc    طلب سحب أرباح من المحفظة إلى الحساب البنكي الرسمي (Payout Request)
 * @route   POST /api/vendor/withdraw
 * @access  Private/Vendor
 */
export const requestPayout = asyncHandler(async (req, res) => {
    const { amount } = req.body;
    const vendorId = req.user._id;

    const vendor = await User.findById(vendorId);

    if (amount <= 0 || vendor.vendorProfile.availableBalance < amount) {
      res.status(400);
      throw new Error("رصيدك غير كافي لإجراء عملية السحب هذه أو المبلغ المدخل غير صحيح");
    }

    // خصم المبلغ من المحفظة موقتاً لحين موافقة الأدمن أو تحويله يدوياً للحساب البنكي المسجل
    vendor.vendorProfile.availableBalance -= amount;
    await vendor.save();

    // تسجيل طلب السحب في دفتر المعاملات المالية (Ledger)
    await WalletTransaction.create({
      user: vendor._id,
      actionBy: vendor._id,
      transactionType: "Withdrawal",
      amount,
      balanceAfter: vendor.vendorProfile.availableBalance,
      description: `طلب سحب أرباح إلى الحساب البنكي عبر /api/vendor/withdraw`,
      status: "Pending",
    });

    // 💡 تريكة ذكية: هنا نقوم بخصم رصيده وإرسال إشعار أو تسجيل "فاتورة طلب سحب" ليراها الأدمن في لوحته ويحول له الفلوس
    res.status(200).json({
      success: true,
      message: `تم تسجيل طلب سحب مبلغ ${amount} بنجاح. سيتم تحويل الأموال إلى حسابك البنكي المسجل خلال 3 أيام عمل بعد مراجعة الإدارة.`,
      remainingBalance: vendor.vendorProfile.availableBalance,
    });
});