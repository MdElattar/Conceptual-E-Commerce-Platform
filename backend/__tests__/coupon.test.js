import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp, addErrorHandlers } from './helpers/testApp.js';
import { startTestDB, stopTestDB, clearTestDB, createTestUser, createTestVendor, generateToken, authHeader, setTestEnv } from './helpers/setup.js';
import couponRoutes from '../routes/couponRoutes.js';
import Coupon from '../models/couponModel.js';

describe('Coupon Management', () => {
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

  describe('POST /api/coupons', () => {
    beforeEach(() => {
      app = createTestApp();
      app.use('/api/coupons', couponRoutes);
      addErrorHandlers(app);
    });

    it('should create a coupon as admin', async () => {
      const admin = await createTestUser({ email: 'admin@test.com', isAdmin: true });
      const token = generateToken(admin._id);

      const res = await request(app)
        .post('/api/coupons')
        .set('Authorization', authHeader(token))
        .send({
          code: 'SAVE10',
          discountType: 'percentage',
          discountAmount: 10,
          minOrderAmount: 50,
          expiryDate: new Date(Date.now() + 86400000).toISOString(),
          usageLimit: 100,
        });

      expect(res.status).toBe(201);
      expect(res.body.code).toBe('SAVE10');
    });

    it('should reject non-admin user creating coupon', async () => {
      const user = await createTestUser();
      const token = generateToken(user._id);

      const res = await request(app)
        .post('/api/coupons')
        .set('Authorization', authHeader(token))
        .send({
          code: 'SAVE10',
          discountType: 'percentage',
          discountAmount: 10,
          expiryDate: new Date(Date.now() + 86400000).toISOString(),
        });

      expect(res.status).toBe(401);
    });

    it('should reject duplicate coupon code', async () => {
      const admin = await createTestUser({ email: 'admin@test.com', isAdmin: true });
      const token = generateToken(admin._id);

      await Coupon.create({
        code: 'SAVE10',
        discountType: 'percentage',
        discountAmount: 10,
        expiryDate: new Date(Date.now() + 86400000),
      });

      const res = await request(app)
        .post('/api/coupons')
        .set('Authorization', authHeader(token))
        .send({
          code: 'SAVE10',
          discountType: 'percentage',
          discountAmount: 10,
          expiryDate: new Date(Date.now() + 86400000).toISOString(),
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/coupons/validate', () => {
    let user, token, admin, adminToken, coupon;

    beforeEach(async () => {
      app = createTestApp();
      app.use('/api/coupons', couponRoutes);
      addErrorHandlers(app);

      user = await createTestUser();
      token = generateToken(user._id);
      admin = await createTestUser({ email: 'admin@test.com', isAdmin: true });
      adminToken = generateToken(admin._id);

      coupon = await Coupon.create({
        code: 'SAVE10',
        discountType: 'percentage',
        discountAmount: 10,
        minOrderAmount: 50,
        expiryDate: new Date(Date.now() + 86400000),
        usageLimit: 100,
        isActive: true,
      });
    });

    it('should validate a valid coupon', async () => {
      const res = await request(app)
        .post('/api/coupons/validate')
        .set('Authorization', authHeader(token))
        .send({
          code: 'SAVE10',
          cartItems: [{ price: 100, qty: 1, vendor: admin._id }],
          subtotal: 100,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.code).toBe('SAVE10');
    });

    it('should reject invalid coupon code', async () => {
      const res = await request(app)
        .post('/api/coupons/validate')
        .set('Authorization', authHeader(token))
        .send({
          code: 'INVALID',
          cartItems: [{ price: 100, qty: 1, vendor: admin._id }],
          subtotal: 100,
        });

      expect(res.status).toBe(404);
    });

    it('should reject expired coupon', async () => {
      await Coupon.findByIdAndUpdate(coupon._id, {
        expiryDate: new Date(Date.now() - 86400000),
      });

      const res = await request(app)
        .post('/api/coupons/validate')
        .set('Authorization', authHeader(token))
        .send({
          code: 'SAVE10',
          cartItems: [{ price: 100, qty: 1, vendor: admin._id }],
          subtotal: 100,
        });

      expect(res.status).toBe(400);
    });

    it('should reject coupon with exhausted usage limit', async () => {
      await Coupon.findByIdAndUpdate(coupon._id, { usageLimit: 1, usedCount: 1 });

      const res = await request(app)
        .post('/api/coupons/validate')
        .set('Authorization', authHeader(token))
        .send({
          code: 'SAVE10',
          cartItems: [{ price: 100, qty: 1, vendor: admin._id }],
          subtotal: 100,
        });

      expect(res.status).toBe(400);
    });

    it('should reject when cart is empty', async () => {
      const res = await request(app)
        .post('/api/coupons/validate')
        .set('Authorization', authHeader(token))
        .send({
          code: 'SAVE10',
          cartItems: [],
          subtotal: 0,
        });

      expect(res.status).toBe(400);
    });

    it('should reject when eligible subtotal is below min order amount', async () => {
      const res = await request(app)
        .post('/api/coupons/validate')
        .set('Authorization', authHeader(token))
        .send({
          code: 'SAVE10',
          cartItems: [{ price: 20, qty: 1, vendor: admin._id }],
          subtotal: 20,
        });

      expect(res.status).toBe(400);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/coupons/validate')
        .send({ code: 'SAVE10', cartItems: [{ price: 100, qty: 1 }], subtotal: 100 });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/coupons', () => {
    beforeEach(() => {
      app = createTestApp();
      app.use('/api/coupons', couponRoutes);
      addErrorHandlers(app);
    });

    it('should list all coupons for admin', async () => {
      const admin = await createTestUser({ email: 'admin@test.com', isAdmin: true });
      const token = generateToken(admin._id);

      await Coupon.create({
        code: 'CODE1', discountType: 'percentage', discountAmount: 10,
        expiryDate: new Date(Date.now() + 86400000),
      });
      await Coupon.create({
        code: 'CODE2', discountType: 'fixed', discountAmount: 5,
        expiryDate: new Date(Date.now() + 86400000),
      });

      const res = await request(app)
        .get('/api/coupons')
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });
  });

  describe('DELETE /api/coupons/:id', () => {
    beforeEach(() => {
      app = createTestApp();
      app.use('/api/coupons', couponRoutes);
      addErrorHandlers(app);
    });

    it('should delete a coupon as admin', async () => {
      const admin = await createTestUser({ email: 'admin@test.com', isAdmin: true });
      const token = generateToken(admin._id);

      const coupon = await Coupon.create({
        code: 'DELETE10', discountType: 'percentage', discountAmount: 10,
        expiryDate: new Date(Date.now() + 86400000),
      });

      const res = await request(app)
        .delete(`/api/coupons/${coupon._id}`)
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(200);

      const deleted = await Coupon.findById(coupon._id);
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent coupon', async () => {
      const admin = await createTestUser({ email: 'admin@test.com', isAdmin: true });
      const token = generateToken(admin._id);

      const res = await request(app)
        .delete(`/api/coupons/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(404);
    });
  });
});
