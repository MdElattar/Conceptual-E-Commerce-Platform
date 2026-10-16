import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp, addErrorHandlers } from './helpers/testApp.js';
import { startTestDB, stopTestDB, clearTestDB, createTestVendor, createTestUser, generateToken, authHeader, setTestEnv } from './helpers/setup.js';
import { createTestProduct, createTestOrder } from './helpers/factories.js';
import vendorRoutes from '../routes/vendorRoutes.js';
import Order from '../models/orderModel.js';
import User from '../models/userModel.js';

describe('Wallet & Escrow Flow', () => {
  let app;
  let vendor, vendorToken, product, order;

  beforeAll(async () => {
    setTestEnv();
    await startTestDB();
  });

  afterAll(async () => {
    await stopTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    vendor = await createTestVendor();
    vendorToken = generateToken(vendor._id);
    product = await createTestProduct(vendor._id);
    order = await createTestOrder(vendor._id, product._id);
  });

  describe('Vendor marks item as Delivered (escrow release)', () => {
    beforeEach(() => {
      app = createTestApp();
      app.use('/api/vendor', vendorRoutes);
      addErrorHandlers(app);
    });

    it('should release escrow and credit vendor balance', async () => {
      const itemId = order.orderItems[0]._id;

      const res = await request(app)
        .put(`/api/vendor/orders/${order._id}/item/${itemId}`)
        .set('Authorization', authHeader(vendorToken))
        .send({ status: 'Shipped' });

      expect(res.status).toBe(200);

      const shipRes = await request(app)
        .put(`/api/vendor/orders/${order._id}/item/${itemId}`)
        .set('Authorization', authHeader(vendorToken))
        .send({ status: 'Delivered' });

      expect(shipRes.status).toBe(200);

      const updatedVendor = await User.findById(vendor._id);
      expect(updatedVendor.vendorProfile.availableBalance).toBe(1000 + (90 * 2));
    });

    it('should not release escrow if order is unpaid', async () => {
      await Order.findByIdAndUpdate(order._id, { isPaid: false });
      const itemId = order.orderItems[0]._id;

      await request(app)
        .put(`/api/vendor/orders/${order._id}/item/${itemId}`)
        .set('Authorization', authHeader(vendorToken))
        .send({ status: 'Shipped' });

      const res = await request(app)
        .put(`/api/vendor/orders/${order._id}/item/${itemId}`)
        .set('Authorization', authHeader(vendorToken))
        .send({ status: 'Delivered' });

      const updatedVendor = await User.findById(vendor._id);
      expect(updatedVendor.vendorProfile.availableBalance).toBe(1000);
    });

    it('should reject non-vendor user', async () => {
      const user = await createTestUser();
      const userToken = generateToken(user._id);
      const itemId = order.orderItems[0]._id;

      const res = await request(app)
        .put(`/api/vendor/orders/${order._id}/item/${itemId}`)
        .set('Authorization', authHeader(userToken))
        .send({ status: 'Shipped' });

      expect(res.status).toBe(403);
    });

    it('should reject unverified vendor', async () => {
      const unverifiedVendor = await createTestVendor({
        email: 'unverified@example.com',
        vendorProfile: { storeName: 'Unverified', isVerified: false, availableBalance: 500 },
      });
      const uvToken = generateToken(unverifiedVendor._id);
      const itemId = order.orderItems[0]._id;

      const res = await request(app)
        .put(`/api/vendor/orders/${order._id}/item/${itemId}`)
        .set('Authorization', authHeader(uvToken))
        .send({ status: 'Shipped' });

      expect(res.status).toBe(403);
    });
  });

  describe('Vendor payout request', () => {
    beforeEach(() => {
      app = createTestApp();
      app.use('/api/vendor', vendorRoutes);
      addErrorHandlers(app);
    });

    it('should deduct balance on valid payout request', async () => {
      const res = await request(app)
        .post('/api/vendor/withdraw')
        .set('Authorization', authHeader(vendorToken))
        .send({ amount: 200 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updatedVendor = await User.findById(vendor._id);
      expect(updatedVendor.vendorProfile.availableBalance).toBe(800);
    });

    it('should reject payout exceeding balance', async () => {
      const res = await request(app)
        .post('/api/vendor/withdraw')
        .set('Authorization', authHeader(vendorToken))
        .send({ amount: 9999 });

      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
    });

    it('should reject payout with zero or negative amount', async () => {
      const res = await request(app)
        .post('/api/vendor/withdraw')
        .set('Authorization', authHeader(vendorToken))
        .send({ amount: 0 });

      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated payout request', async () => {
      const res = await request(app)
        .post('/api/vendor/withdraw')
        .send({ amount: 100 });

      expect(res.status).toBe(401);
    });
  });
});
