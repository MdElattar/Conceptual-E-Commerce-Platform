import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp, addErrorHandlers } from './helpers/testApp.js';
import { startTestDB, stopTestDB, clearTestDB, createTestUser, createTestVendor, generateToken, authHeader, setTestEnv } from './helpers/setup.js';
import { createTestProduct, createTestOrder } from './helpers/factories.js';
import returnRoutes from '../routes/returnRoutes.js';
import ReturnRequest from '../models/returnModel.js';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';

describe('Return Flow', () => {
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

  describe('GET /api/returns/policy', () => {
    it('should return the return policy', async () => {
      app = createTestApp();
      app.use('/api/returns', returnRoutes);
      addErrorHandlers(app);

      const res = await request(app).get('/api/returns/policy');
      expect(res.status).toBe(200);
      expect(res.body.policy.returnPeriod).toContain('30 days');
    });
  });

  describe('POST /api/returns', () => {
    let user, token, vendor, product, order, itemId;

    beforeEach(async () => {
      app = createTestApp();
      app.use('/api/returns', returnRoutes);
      addErrorHandlers(app);

      user = await createTestUser();
      token = generateToken(user._id);
      vendor = await createTestVendor();
      product = await createTestProduct(vendor._id);
      order = await createTestOrder(vendor._id, product._id, {
        user: user._id,
        isDelivered: true,
        deliveredAt: new Date(),
        orderItems: [{
          name: 'Test Product',
          qty: 1,
          image: '/test.jpg',
          price: 100,
          product: product._id,
          vendor: vendor._id,
          vendorEarnings: 90,
          commissionRate: 10,
          payoutStatus: 'Released',
          itemStatus: 'Delivered',
          deliveredAt: new Date(),
        }],
      });
      itemId = order.orderItems[0]._id;
    });

    it('should create a return request', async () => {
      const res = await request(app)
        .post('/api/returns')
        .set('Authorization', authHeader(token))
        .send({
          orderId: order._id,
          orderItemId: itemId,
          productId: product._id,
          reason: 'Defective item',
        });

      expect(res.status).toBe(201);
      expect(res.body.reason).toBe('Defective item');
      expect(res.body.status).toBe('pending');
      expect(res.body.refundAmount).toBe(100);
    });

    it('should reject if order does not belong to user', async () => {
      const otherUser = await createTestUser({ email: 'other@test.com' });
      const otherToken = generateToken(otherUser._id);

      const res = await request(app)
        .post('/api/returns')
        .set('Authorization', authHeader(otherToken))
        .send({
          orderId: order._id,
          orderItemId: itemId,
          productId: product._id,
          reason: 'Not mine',
        });

      expect(res.status).toBe(401);
    });

    it('should reject duplicate return request', async () => {
      await ReturnRequest.create({
        user: user._id,
        order: order._id,
        orderItemId: itemId,
        product: product._id,
        reason: 'First request',
        refundAmount: 100,
      });

      const res = await request(app)
        .post('/api/returns')
        .set('Authorization', authHeader(token))
        .send({
          orderId: order._id,
          orderItemId: itemId,
          productId: product._id,
          reason: 'Duplicate',
        });

      expect(res.status).toBe(400);
    });

    it('should reject if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/returns')
        .set('Authorization', authHeader(token))
        .send({ reason: 'Missing fields' });

      expect(res.status).toBe(400);
    });

    it('should return 401 without token', async () => {
      const res = await request(app).post('/api/returns').send({ reason: 'x' });
      expect(res.status).toBe(401);
    });
  });

  describe('Vendor return approval flow', () => {
    let vendor, vendorToken, user, token, product, order, itemId, returnReq;

    beforeEach(async () => {
      app = createTestApp();
      app.use('/api/returns', returnRoutes);
      addErrorHandlers(app);

      vendor = await createTestVendor();
      vendorToken = generateToken(vendor._id);
      user = await createTestUser();
      token = generateToken(user._id);
      product = await createTestProduct(vendor._id);
      order = await createTestOrder(vendor._id, product._id, {
        user: user._id,
        isDelivered: true,
        deliveredAt: new Date(),
        orderItems: [{
          name: 'Test Product',
          qty: 1,
          image: '/test.jpg',
          price: 100,
          product: product._id,
          vendor: vendor._id,
          vendorEarnings: 90,
          commissionRate: 10,
          payoutStatus: 'Released',
          itemStatus: 'Delivered',
          deliveredAt: new Date(),
        }],
      });
      itemId = order.orderItems[0]._id;

      returnReq = await ReturnRequest.create({
        user: user._id,
        order: order._id,
        orderItemId: itemId,
        product: product._id,
        reason: 'Defective',
        refundAmount: 100,
        status: 'pending',
      });
    });

    it('should allow vendor to approve a pending return', async () => {
      const res = await request(app)
        .put(`/api/returns/${returnReq._id}/vendor-status`)
        .set('Authorization', authHeader(vendorToken))
        .send({ status: 'approved' });

      expect(res.status).toBe(200);

      const updated = await ReturnRequest.findById(returnReq._id);
      expect(updated.status).toBe('approved');
    });

    it('should allow vendor to reject a pending return', async () => {
      const res = await request(app)
        .put(`/api/returns/${returnReq._id}/vendor-status`)
        .set('Authorization', authHeader(vendorToken))
        .send({ status: 'rejected' });

      expect(res.status).toBe(200);

      const updated = await ReturnRequest.findById(returnReq._id);
      expect(updated.status).toBe('rejected');
    });

    it('should reject non-vendor user approving returns', async () => {
      const res = await request(app)
        .put(`/api/returns/${returnReq._id}/vendor-status`)
        .set('Authorization', authHeader(token))
        .send({ status: 'approved' });

      expect(res.status).toBe(403);
    });

    it('should return 400 for invalid status transition by vendor', async () => {
      await ReturnRequest.findByIdAndUpdate(returnReq._id, { status: 'approved' });

      const res = await request(app)
        .put(`/api/returns/${returnReq._id}/vendor-status`)
        .set('Authorization', authHeader(vendorToken))
        .send({ status: 'approved' });

      expect(res.status).toBe(400);
    });
  });

  describe('Admin return status transitions', () => {
    let admin, adminToken, vendor, user, product, order, itemId, returnReq;

    beforeEach(async () => {
      app = createTestApp();
      app.use('/api/returns', returnRoutes);
      addErrorHandlers(app);

      admin = await createTestUser({ email: 'admin@test.com', isAdmin: true });
      adminToken = generateToken(admin._id);
      vendor = await createTestVendor();
      user = await createTestUser({ storeCredit: 0 });
      product = await createTestProduct(vendor._id);
      order = await createTestOrder(vendor._id, product._id, {
        user: user._id,
        isDelivered: true,
        deliveredAt: new Date(),
        orderItems: [{
          name: 'Test Product',
          qty: 1,
          image: '/test.jpg',
          price: 100,
          product: product._id,
          vendor: vendor._id,
          vendorEarnings: 90,
          commissionRate: 10,
          payoutStatus: 'Released',
          itemStatus: 'Delivered',
          deliveredAt: new Date(),
        }],
      });
      itemId = order.orderItems[0]._id;

      returnReq = await ReturnRequest.create({
        user: user._id,
        order: order._id,
        orderItemId: itemId,
        product: product._id,
        reason: 'Defective',
        refundAmount: 100,
        status: 'approved',
      });
    });

    it('should transition from approved to received', async () => {
      const res = await request(app)
        .put(`/api/returns/${returnReq._id}`)
        .set('Authorization', authHeader(adminToken))
        .send({ status: 'received' });

      expect(res.status).toBe(200);

      const updated = await ReturnRequest.findById(returnReq._id);
      expect(updated.status).toBe('received');
    });

    it('should refund user and clawback vendor on refunded status', async () => {
      await ReturnRequest.findByIdAndUpdate(returnReq._id, { status: 'received' });

      const res = await request(app)
        .put(`/api/returns/${returnReq._id}`)
        .set('Authorization', authHeader(adminToken))
        .send({ status: 'refunded', refundAmount: 100 });

      expect(res.status).toBe(200);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.storeCredit).toBe(100);

      const updatedVendor = await User.findById(vendor._id);
      expect(updatedVendor.vendorProfile.availableBalance).toBe(900);

      const updatedProduct = await Product.findById(product._id);
      expect(updatedProduct.countInStock).toBe(51);
    });

    it('should reject invalid status transition (pending -> received)', async () => {
      await ReturnRequest.findByIdAndUpdate(returnReq._id, { status: 'pending' });

      const res = await request(app)
        .put(`/api/returns/${returnReq._id}`)
        .set('Authorization', authHeader(adminToken))
        .send({ status: 'received' });

      expect(res.status).toBe(400);
    });

    it('should reject non-admin user updating return status', async () => {
      const user2 = await createTestUser({ email: 'user@test.com' });
      const token2 = generateToken(user2._id);

      const res = await request(app)
        .put(`/api/returns/${returnReq._id}`)
        .set('Authorization', authHeader(token2))
        .send({ status: 'received' });

      expect(res.status).toBe(401);
    });

    it('should reject unknown status value', async () => {
      const res = await request(app)
        .put(`/api/returns/${returnReq._id}`)
        .set('Authorization', authHeader(adminToken))
        .send({ status: 'invalid_status' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/returns/:id', () => {
    let user, token, vendor, product, order, itemId, returnReq;

    beforeEach(async () => {
      app = createTestApp();
      app.use('/api/returns', returnRoutes);
      addErrorHandlers(app);

      user = await createTestUser();
      token = generateToken(user._id);
      vendor = await createTestVendor();
      product = await createTestProduct(vendor._id);
      order = await createTestOrder(vendor._id, product._id, {
        user: user._id,
        isDelivered: true,
        deliveredAt: new Date(),
        orderItems: [{
          name: 'Test Product',
          qty: 1,
          image: '/test.jpg',
          price: 100,
          product: product._id,
          vendor: vendor._id,
          vendorEarnings: 90,
          commissionRate: 10,
          payoutStatus: 'Released',
          itemStatus: 'Delivered',
          deliveredAt: new Date(),
        }],
      });
      itemId = order.orderItems[0]._id;

      returnReq = await ReturnRequest.create({
        user: user._id,
        order: order._id,
        orderItemId: itemId,
        product: product._id,
        reason: 'Defective',
        refundAmount: 100,
      });
    });

    it('should return return request by ID', async () => {
      const res = await request(app)
        .get(`/api/returns/${returnReq._id}`)
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(returnReq._id.toString());
    });

    it('should return 404 for non-existent return', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/returns/${fakeId}`)
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(404);
    });
  });
});
