import "dotenv/config";
import path from "path";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import colors from "colors";
import cookieParser from "cookie-parser";
import stripePackage from "stripe";
import http from 'http';
import { Server } from 'socket.io';
import admin from './config/firebaseAdmin.js';
import cron from 'node-cron';
import { initCache } from './utils/cacheService.js';

// استيراد قواعد البيانات والموديلز
import connectDB from "./config/db.js";
import Order from "./models/orderModel.js";
import User from "./models/userModel.js";

// استيراد المسارات (Routes)
import productRoutes from "./routes/productRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import inquiryRoutes from "./routes/inquiryRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import shippingRoutes from './routes/shippingRoutes.js'; 
import couponRoutes from './routes/couponRoutes.js';
import vendorRoutes from "./routes/vendorRoutes.js";
import categoryRequestRoutes from './routes/categoryRequestRoutes.js';
import advertisingRoutes from './routes/advertisingRoutes.js';
import { checkAndExpireAds } from './controllers/advertisingController.js';
import bannerRoutes from './routes/bannerRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import returnRoutes from './routes/returnRoutes.js';
import eliteRoutes from './routes/eliteRoutes.js';
import vendorSubscriptionRoutes from './routes/vendorSubscriptionRoutes.js';
import recentlyViewedRoutes from './routes/recentlyViewedRoutes.js';
import userBehaviorRoutes from './routes/userBehaviorRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import auditLogRoutes from './routes/auditLogRoutes.js';
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

// تهيئة الاتصال بقاعدة البيانات
connectDB();
initCache();

const stripe = stripePackage(process.env.STRIPE_SECRET_KEY);
const app = express();
const server = http.createServer(app);

// 🌟 تحديث إعدادات الـ CORS لـ Socket.io لتشمل الموقع اللايف ومحلياً
const allowedOrigins = [
  "http://localhost:5173",
  "https://conceptual-e-commerce-platform.vercel.app"
];

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

let connectedUsers = {};

io.on('connection', (socket) => {
  console.log('⚡ A user connected:', socket.id);

  socket.on('setup', (userId) => {
    socket.join(userId);
    connectedUsers[userId] = socket.id;
    console.log(`👤 User ${userId} is now ready for private notifications`);
  });

  socket.on('disconnect', () => {
    console.log('❌ User disconnected');
    for (let userId in connectedUsers) {
      if (connectedUsers[userId] === socket.id) {
        delete connectedUsers[userId];
        break;
      }
    }
  });
});

cron.schedule('0 * * * *', () => {
    console.log('⏰ Running Ad Expiration Check...');
    checkAndExpireAds();
});

// ==========================================
// 1. مسار الـ Webhook (يجب أن يكون قبل express.json)
// ==========================================
app.post(
  "/api/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(`❌ Webhook Signature Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;

      try {
        if (orderId) {
          const order = await Order.findById(orderId);
          if (order) {
            order.isPaid = true;
            order.paidAt = Date.now();
            order.paymentResult = {
              id: session.payment_intent,
              status: "succeeded",
              email_address: session.customer_details?.email,
            };
            await order.save();
            console.log(`✅ Order ${orderId} updated to PAID via Webhook`);
          }
        }
      } catch (error) {
        console.error("❌ Webhook Database/Stripe Update Error:", error.message);
      }
    }

    if (event.type === "identity.verification_session.verified") {
      const session = event.data.object;
      const userId = session.metadata?.userId;

      try {
        if (userId) {
          const user = await User.findById(userId);
          if (user) {
            user.role = "vendor";
            if (!user.vendorProfile) {
                user.vendorProfile = {};
            }
            user.vendorProfile.isVerified = true; 
            user.vendorProfile.kyc = {
              ...user.vendorProfile.kyc,
              stripeSessionId: session.id,
              verifiedAt: Date.now(),
              status: "Verified_By_Stripe_AI"
            };
            await user.save();
            console.log(`✅ User ${userId} successfully upgraded to VERIFIED VENDOR via Stripe AI`);
          }
        }
      } catch (error) {
        console.error("❌ Stripe Identity Webhook Error:", error.message);
      }
    }

    res.json({ received: true });
  }
);

// ==========================================
// 2. إعدادات الـ Middlewares
// ==========================================
app.use(helmet());

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(generalLimiter);

// 🌟 تحديث إعدادات الـ CORS العامة للسيرفر لتشمل الدومين اللايف للفرونت إند
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    exposedHeaders: ["ratelimit-remaining", "x-ratelimit-remaining"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ==========================================
// 3. تعريف المسارات (Routes)
// ==========================================
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/payments", paymentRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/coupons', couponRoutes);
app.use("/api/vendor", vendorRoutes); 
app.use('/api/category-requests', categoryRequestRoutes);
app.use('/api/advertising', advertisingRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/returns', returnRoutes);
app.use('/api/elite', eliteRoutes);
app.use('/api/vendor-subscription', vendorSubscriptionRoutes);
app.use('/api/recently-viewed', recentlyViewedRoutes);
app.use('/api/user-behavior', userBehaviorRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditLogRoutes);

const __dirname = path.resolve();
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

app.set('socketio', io);

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use(notFound);
app.use(errorHandler);

// ==========================================
// 4. تشغيل السيرفر
// ==========================================
const PORT = process.PORT || 5000;

server.listen(PORT, () => { 
  console.log(
    `Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`
      .yellow.bold
  );
});