import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp, addErrorHandlers } from './helpers/testApp.js';
import { startTestDB, stopTestDB, clearTestDB, createTestVendor, createTestUser, generateToken, authHeader, setTestEnv } from './helpers/setup.js';
import { createTestProduct } from './helpers/factories.js';
import productRoutes from '../routes/productRoutes.js';
import RecentlyViewed from '../models/recentlyViewedModel.js';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';

describe('Recommendation Engine', () => {
  let app;
  let user, userToken, vendor;
  let catAprod1, catAprod2, catBprod1;

  beforeAll(async () => {
    setTestEnv();
    await startTestDB();
  });

  afterAll(async () => {
    await stopTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();

    app = createTestApp();
    app.use('/api/products', productRoutes);
    addErrorHandlers(app);

    user = await createTestUser();
    userToken = generateToken(user._id);
    vendor = await createTestVendor();

    catAprod1 = await createTestProduct(vendor._id, {
      name: 'Product A1',
      category: 'Electronics',
      brand: 'BrandX',
      price: 100,
      numSales: 50,
      rating: 4.5,
      features: ['wireless', 'bluetooth'],
    });

    catAprod2 = await createTestProduct(vendor._id, {
      name: 'Product A2',
      category: 'Electronics',
      brand: 'BrandY',
      price: 200,
      numSales: 30,
      rating: 4.0,
      features: ['wireless'],
    });

    catBprod1 = await createTestProduct(vendor._id, {
      name: 'Product B1',
      category: 'Home',
      brand: 'BrandX',
      price: 50,
      numSales: 10,
      rating: 3.5,
      features: ['portable'],
    });

    await createTestProduct(vendor._id, {
      name: 'Inactive Product',
      category: 'Electronics',
      brand: 'BrandX',
      price: 99,
      status: 'draft',
    });
  });

  describe('GET /api/products/recommendations', () => {
    it('should return trending recommendations for unauthenticated user', async () => {
      const res = await request(app)
        .get('/api/products/recommendations')
        .query({ type: 'trending', limit: 5 });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should return trending recommendations by default (no type)', async () => {
      const res = await request(app)
        .get('/api/products/recommendations')
        .query({ limit: 5 });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should return personalized recommendations for logged-in user with browsing history', async () => {
      await RecentlyViewed.create({
        user: user._id,
        products: [{ product: catAprod1._id, viewedAt: new Date() }],
      });

      const res = await request(app)
        .get('/api/products/recommendations')
        .set('Authorization', authHeader(userToken))
        .query({ type: 'personalized', limit: 10 });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const ids = res.body.map(p => p._id);
      expect(ids).not.toContain(catAprod1._id.toString());
    });

    it('should return personalized recommendations falling back to trending when no history', async () => {
      const res = await request(app)
        .get('/api/products/recommendations')
        .set('Authorization', authHeader(userToken))
        .query({ type: 'personalized', limit: 10 });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return similar products based on category and brand', async () => {
      const res = await request(app)
        .get('/api/products/recommendations')
        .query({ type: 'similar', productId: catAprod1._id.toString(), limit: 10 });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const ids = res.body.map(p => p._id);
      expect(ids).not.toContain(catAprod1._id.toString());
    });

    it('should return products frequently bought together', async () => {
      const otherUser = await createTestUser({ email: 'other@test.com' });

      await Order.create({
        user: otherUser._id,
        customerName: 'Other',
        phone: '01000000001',
        address: { addressLine: '123 St', city: 'Cairo', country: 'EG' },
        itemsPrice: 300,
        shippingPrice: 20,
        taxPrice: 0,
        totalPrice: 320,
        paymentMethod: 'wallet',
        isPaid: true,
        paidAt: new Date(),
        isDelivered: true,
        deliveredAt: new Date(),
        orderItems: [
          { name: 'Product A1', qty: 1, image: '/test.jpg', price: 100, product: catAprod1._id, vendor: vendor._id, vendorEarnings: 90, commissionRate: 10, payoutStatus: 'Released', itemStatus: 'Delivered' },
          { name: 'Product A2', qty: 1, image: '/test.jpg', price: 200, product: catAprod2._id, vendor: vendor._id, vendorEarnings: 180, commissionRate: 10, payoutStatus: 'Released', itemStatus: 'Delivered' },
        ],
      });

      const res = await request(app)
        .get('/api/products/recommendations')
        .query({ type: 'boughtTogether', productId: catAprod1._id.toString(), limit: 10 });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      const ids = res.body.map(p => p._id);
      expect(ids).toContain(catAprod2._id.toString());
    });

    it('should return empty array for boughtTogether with no co-occurrence', async () => {
      const res = await request(app)
        .get('/api/products/recommendations')
        .query({ type: 'boughtTogether', productId: catBprod1._id.toString(), limit: 10 });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it('should respect limit parameter', async () => {
      const res = await request(app)
        .get('/api/products/recommendations')
        .query({ type: 'trending', limit: 2 });

      expect(res.status).toBe(200);
      expect(res.body.length).toBeLessThanOrEqual(2);
    });

    it('should not exceed max limit of 50', async () => {
      const res = await request(app)
        .get('/api/products/recommendations')
        .query({ type: 'trending', limit: 100 });

      expect(res.status).toBe(200);
      expect(res.body.length).toBeLessThanOrEqual(50);
    });
  });
});
