import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp, addErrorHandlers } from './helpers/testApp.js';
import { startTestDB, stopTestDB, clearTestDB, createTestUser, createTestVendor, generateToken, authHeader, setTestEnv } from './helpers/setup.js';
import { createTestProduct, createTestOrder, createDeliveredOrderItem } from './helpers/factories.js';
import orderRoutes from '../routes/orderRoutes.js';
import vendorRoutes from '../routes/vendorRoutes.js';
import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import WalletTransaction from '../models/walletTransactionModel.js';

describe('Order Flow', () => {
  let app;

  beforeAll(async () => {
    setTestEnv();
    await startTestDB();
  });

  afterAll(async () => {
    await stopTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('GET /api/orders/myorders', () => {
    beforeEach(() => {
      app = createTestApp();
      app.use('/api/orders', orderRoutes);
      addErrorHandlers(app);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).get('/api/orders/myorders');
      expect(res.status).toBe(401);
    });

    it('should return empty array for user with no orders', async () => {
      const user = await createTestUser();
      const token = generateToken(user._id);

      const res = await request(app)
        .get('/api/orders/myorders')
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should return orders only for the authenticated user', async () => {
      const user = await createTestUser();
      const token = generateToken(user._id);
      const vendor = await createTestVendor();
      const product = await createTestProduct(vendor._id);

      await createTestOrder(vendor._id, product._id, {
        user: user._id,
        customerName: 'My Order',
      });
      await createTestOrder(vendor._id, product._id, {
        user: new mongoose.Types.ObjectId(),
        customerName: 'Other Order',
      });

      const res = await request(app)
        .get('/api/orders/myorders')
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].customerName).toBe('My Order');
    });
  });

  describe('GET /api/orders/:id', () => {
    beforeEach(() => {
      app = createTestApp();
      app.use('/api/orders', orderRoutes);
      addErrorHandlers(app);
    });

    it('should return order by ID', async () => {
      const user = await createTestUser();
      const token = generateToken(user._id);
      const vendor = await createTestVendor();
      const product = await createTestProduct(vendor._id);
      const order = await createTestOrder(vendor._id, product._id, { user: user._id });

      const res = await request(app)
        .get(`/api/orders/${order._id}`)
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(order._id.toString());
    });

    it('should return 404 for non-existent order', async () => {
      const user = await createTestUser();
      const token = generateToken(user._id);
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .get(`/api/orders/${fakeId}`)
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(404);
    });

    it('should return 401 without token', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/orders/${fakeId}`);
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/orders/:id/pay-wallet', () => {
    beforeEach(() => {
      app = createTestApp();
      app.use('/api/orders', orderRoutes);
      addErrorHandlers(app);
    });

    it('should pay an unpaid order with wallet credit', async () => {
      const user = await createTestUser({ storeCredit: 500 });
      const token = generateToken(user._id);
      const vendor = await createTestVendor();
      const product = await createTestProduct(vendor._id);
      const order = await createTestOrder(vendor._id, product._id, {
        user: user._id,
        isPaid: false,
        paidAt: undefined,
        totalPrice: 200,
      });

      const res = await request(app)
        .put(`/api/orders/${order._id}/pay-wallet`)
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(200);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.storeCredit).toBe(300);

      const updatedOrder = await Order.findById(order._id);
      expect(updatedOrder.isPaid).toBe(true);
      expect(updatedOrder.paymentMethod).toBe('Wallet');
    });

    it('should return 400 if insufficient wallet credit', async () => {
      const user = await createTestUser({ storeCredit: 50 });
      const token = generateToken(user._id);
      const vendor = await createTestVendor();
      const product = await createTestProduct(vendor._id);
      const order = await createTestOrder(vendor._id, product._id, {
        user: user._id,
        isPaid: false,
        totalPrice: 200,
      });

      const res = await request(app)
        .put(`/api/orders/${order._id}/pay-wallet`)
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(400);
    });

    it('should return 401 without token', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).put(`/api/orders/${fakeId}/pay-wallet`);
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/orders/:id/cancel', () => {
    beforeEach(() => {
      app = createTestApp();
      app.use('/api/orders', orderRoutes);
      addErrorHandlers(app);
    });

    it('should cancel unpaid order without refund', async () => {
      const user = await createTestUser();
      const token = generateToken(user._id);
      const vendor = await createTestVendor();
      const product = await createTestProduct(vendor._id);
      const order = await createTestOrder(vendor._id, product._id, {
        user: user._id,
        isPaid: false,
        paidAt: undefined,
      });

      const res = await request(app)
        .put(`/api/orders/${order._id}/cancel`)
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(200);

      const updatedOrder = await Order.findById(order._id);
      expect(updatedOrder.isCancelled).toBe(true);
    });

    it('should refund store credit for paid order', async () => {
      const user = await createTestUser({ storeCredit: 100 });
      const token = generateToken(user._id);
      const vendor = await createTestVendor();
      const product = await createTestProduct(vendor._id);
      const order = await createTestOrder(vendor._id, product._id, {
        user: user._id,
        isPaid: true,
        paidAt: new Date(),
        totalPrice: 200,
        paymentMethod: 'Wallet',
      });

      const res = await request(app)
        .put(`/api/orders/${order._id}/cancel`)
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(200);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.storeCredit).toBe(300);

      const tx = await WalletTransaction.findOne({ user: user._id });
      expect(tx).not.toBeNull();
      expect(tx.transactionType).toBe('Deposit');
      expect(tx.amount).toBe(200);
    });

    it('should return 400 for already cancelled order', async () => {
      const user = await createTestUser();
      const token = generateToken(user._id);
      const vendor = await createTestVendor();
      const product = await createTestProduct(vendor._id);
      const order = await createTestOrder(vendor._id, product._id, {
        user: user._id,
        isCancelled: true,
      });

      const res = await request(app)
        .put(`/api/orders/${order._id}/cancel`)
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(400);
    });

    it('should return 401 without token', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).put(`/api/orders/${fakeId}/cancel`);
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/orders/:orderId/item/:itemId/confirm-delivery (escrow release)', () => {
    beforeEach(() => {
      app = createTestApp();
      app.use('/api/orders', orderRoutes);
      addErrorHandlers(app);
    });

    it('should release escrow when customer confirms delivery', async () => {
      const vendor = await createTestVendor();
      const product = await createTestProduct(vendor._id);
      const buyer = await createTestUser({ email: 'buyer@test.com' });
      const token = generateToken(buyer._id);
      const order = await createTestOrder(vendor._id, product._id, {
        user: buyer._id,
        orderItems: [{
          name: 'Test Product',
          qty: 2,
          image: '/test.jpg',
          price: 100,
          product: product._id,
          vendor: vendor._id,
          vendorEarnings: 90,
          commissionRate: 10,
          payoutStatus: 'Holding',
          itemStatus: 'Shipped',
          shippedAt: new Date(),
        }],
      });

      const itemId = order.orderItems[0]._id;

      const res = await request(app)
        .put(`/api/orders/${order._id}/item/${itemId}/confirm-delivery`)
        .set('Authorization', authHeader(token))
        .send({ deliveryProofImage: '/proof.jpg' });

      expect(res.status).toBe(200);

      const updatedVendor = await User.findById(vendor._id);
      expect(updatedVendor.vendorProfile.availableBalance).toBe(1000 + 90);

      const updatedOrder = await Order.findById(order._id);
      const item = updatedOrder.orderItems[0];
      expect(item.payoutStatus).toBe('Released');
      expect(item.itemStatus).toBe('Delivered');
      expect(item.customerConfirmedDelivery).toBe(true);
    });

    it('should return 400 without deliveryProofImage', async () => {
      const vendor = await createTestVendor();
      const product = await createTestProduct(vendor._id);
      const buyer = await createTestUser({ email: 'buyer2@test.com' });
      const token = generateToken(buyer._id);
      const order = await createTestOrder(vendor._id, product._id, {
        user: buyer._id,
        orderItems: [{
          name: 'Test Product',
          qty: 1,
          image: '/test.jpg',
          price: 100,
          product: product._id,
          vendor: vendor._id,
          vendorEarnings: 90,
          commissionRate: 10,
          payoutStatus: 'Holding',
          itemStatus: 'Shipped',
          shippedAt: new Date(),
        }],
      });

      const itemId = order.orderItems[0]._id;

      const res = await request(app)
        .put(`/api/orders/${order._id}/item/${itemId}/confirm-delivery`)
        .set('Authorization', authHeader(token))
        .send({});

      expect(res.status).toBe(400);
    });

    it('should return 403 for non-owner user', async () => {
      const vendor = await createTestVendor();
      const product = await createTestProduct(vendor._id);
      const buyer = await createTestUser({ email: 'buyer3@test.com' });
      const otherUser = await createTestUser({ email: 'other@test.com' });
      const token = generateToken(otherUser._id);
      const order = await createTestOrder(vendor._id, product._id, {
        user: buyer._id,
        orderItems: [{
          name: 'Test Product',
          qty: 1,
          image: '/test.jpg',
          price: 100,
          product: product._id,
          vendor: vendor._id,
          vendorEarnings: 90,
          commissionRate: 10,
          payoutStatus: 'Holding',
          itemStatus: 'Shipped',
          shippedAt: new Date(),
        }],
      });

      const itemId = order.orderItems[0]._id;

      const res = await request(app)
        .put(`/api/orders/${order._id}/item/${itemId}/confirm-delivery`)
        .set('Authorization', authHeader(token))
        .send({ deliveryProofImage: '/proof.jpg' });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/orders/vendor/payout', () => {
    beforeEach(() => {
      app = createTestApp();
      app.use('/api/orders', orderRoutes);
      addErrorHandlers(app);
    });

    it('should create a payout request and deduct balance', async () => {
      const vendor = await createTestVendor();
      const token = generateToken(vendor._id);

      const res = await request(app)
        .post('/api/orders/vendor/payout')
        .set('Authorization', authHeader(token))
        .send({ amount: 300 });

      expect(res.status).toBe(200);

      const updatedVendor = await User.findById(vendor._id);
      expect(updatedVendor.vendorProfile.availableBalance).toBe(700);
    });

    it('should reject payout exceeding available balance', async () => {
      const vendor = await createTestVendor();
      const token = generateToken(vendor._id);

      const res = await request(app)
        .post('/api/orders/vendor/payout')
        .set('Authorization', authHeader(token))
        .send({ amount: 9999 });

      expect(res.status).toBe(400);
    });

    it('should reject payout with zero amount', async () => {
      const vendor = await createTestVendor();
      const token = generateToken(vendor._id);

      const res = await request(app)
        .post('/api/orders/vendor/payout')
        .set('Authorization', authHeader(token))
        .send({ amount: 0 });

      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated payout request', async () => {
      const res = await request(app)
        .post('/api/orders/vendor/payout')
        .send({ amount: 100 });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/orders (admin)', () => {
    beforeEach(() => {
      app = createTestApp();
      app.use('/api/orders', orderRoutes);
      addErrorHandlers(app);
    });

    it('should return all orders for admin', async () => {
      const admin = await createTestUser({ email: 'admin@test.com', isAdmin: true });
      const adminToken = generateToken(admin._id);
      const vendor = await createTestVendor();
      const product = await createTestProduct(vendor._id);

      await createTestOrder(vendor._id, product._id);
      await createTestOrder(vendor._id, product._id);

      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it('should reject non-admin user', async () => {
      const user = await createTestUser();
      const token = generateToken(user._id);

      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/orders/my-wallet-history', () => {
    beforeEach(() => {
      app = createTestApp();
      app.use('/api/orders', orderRoutes);
      addErrorHandlers(app);
    });

    it('should return wallet transactions for the user', async () => {
      const user = await createTestUser();
      const token = generateToken(user._id);

      await WalletTransaction.create({
        user: user._id,
        actionBy: user._id,
        transactionType: 'Deposit',
        amount: 100,
        balanceAfter: 100,
        description: 'Test deposit',
        status: 'Completed',
      });
      await WalletTransaction.create({
        user: user._id,
        actionBy: user._id,
        transactionType: 'Withdrawal',
        amount: 50,
        balanceAfter: 50,
        description: 'Test withdrawal',
        status: 'Pending',
      });

      const res = await request(app)
        .get('/api/orders/my-wallet-history')
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });
  });
});
