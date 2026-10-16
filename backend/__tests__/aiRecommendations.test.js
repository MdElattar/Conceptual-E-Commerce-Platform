import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp, addErrorHandlers } from './helpers/testApp.js';
import { startTestDB, stopTestDB, clearTestDB, createTestVendor, createTestUser, generateToken, authHeader, setTestEnv } from './helpers/setup.js';
import { createTestProduct } from './helpers/factories.js';
import userBehaviorRoutes from '../routes/userBehaviorRoutes.js';
import productRoutes from '../routes/productRoutes.js';
import UserBehavior from '../models/userBehaviorModel.js';

describe('AI Product Recommendations', () => {
  let app;
  let user, userToken, vendor;
  let prod1, prod2, prod3;

  beforeAll(async () => {
    setTestEnv();
    await startTestDB();
  });

  afterAll(async () => {
    await stopTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    user = await createTestUser();
    userToken = generateToken(user._id);
    vendor = await createTestVendor();

    prod1 = await createTestProduct(vendor._id, {
      name: 'Product 1', category: 'Electronics', brand: 'BrandX',
    });
    prod2 = await createTestProduct(vendor._id, {
      name: 'Product 2', category: 'Electronics', brand: 'BrandY',
    });
    prod3 = await createTestProduct(vendor._id, {
      name: 'Product 3', category: 'Home', brand: 'BrandX',
    });
  });

  describe('User Behavior Tracking — POST /api/user-behavior', () => {
    beforeEach(() => {
      app = createTestApp();
      app.use('/api/user-behavior', userBehaviorRoutes);
      addErrorHandlers(app);
    });

    it('should log a view event', async () => {
      const res = await request(app)
        .post('/api/user-behavior')
        .set('Authorization', authHeader(userToken))
        .send({ eventType: 'view', product: prod1._id.toString() });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Event logged');

      const events = await UserBehavior.find({ user: user._id });
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('view');
    });

    it('should log a purchase event', async () => {
      const res = await request(app)
        .post('/api/user-behavior')
        .set('Authorization', authHeader(userToken))
        .send({ eventType: 'purchase', product: prod1._id.toString() });

      expect(res.status).toBe(201);
    });

    it('should log a search event', async () => {
      const res = await request(app)
        .post('/api/user-behavior')
        .set('Authorization', authHeader(userToken))
        .send({ eventType: 'search', searchQuery: 'drill machine' });

      expect(res.status).toBe(201);
    });

    it('should reject invalid event type', async () => {
      const res = await request(app)
        .post('/api/user-behavior')
        .set('Authorization', authHeader(userToken))
        .send({ eventType: 'invalid' });

      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app)
        .post('/api/user-behavior')
        .send({ eventType: 'view', product: prod1._id.toString() });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/user-behavior', () => {
    beforeEach(() => {
      app = createTestApp();
      app.use('/api/user-behavior', userBehaviorRoutes);
      addErrorHandlers(app);
    });

    it('should return logged events for the user', async () => {
      await UserBehavior.create({ user: user._id, eventType: 'view', product: prod1._id });
      await UserBehavior.create({ user: user._id, eventType: 'view', product: prod2._id });

      const res = await request(app)
        .get('/api/user-behavior')
        .set('Authorization', authHeader(userToken));

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('should filter by event type', async () => {
      await UserBehavior.create({ user: user._id, eventType: 'view', product: prod1._id });
      await UserBehavior.create({ user: user._id, eventType: 'purchase', product: prod2._id });

      const res = await request(app)
        .get('/api/user-behavior')
        .set('Authorization', authHeader(userToken))
        .query({ eventType: 'purchase' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].eventType).toBe('purchase');
    });
  });

  describe('Enhanced Recommendations — GET /api/products/recommendations', () => {
    beforeEach(() => {
      app = createTestApp();
      app.use('/api/products', productRoutes);
      addErrorHandlers(app);
    });

    it('should return alsoViewed recommendations with behavior data', async () => {
      const otherUser = await createTestUser({ email: 'other@test.com' });
      const otherToken = generateToken(otherUser._id);

      await UserBehavior.create({ user: otherUser._id, eventType: 'view', product: prod1._id });
      await UserBehavior.create({ user: otherUser._id, eventType: 'view', product: prod2._id });
      await UserBehavior.create({ user: otherUser._id, eventType: 'view', product: prod3._id });
      await UserBehavior.create({ user: user._id, eventType: 'view', product: prod1._id });

      const res = await request(app)
        .get('/api/products/recommendations')
        .query({ type: 'alsoViewed', productId: prod1._id.toString(), limit: 10 });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should fall back to similar products when no view data for alsoViewed', async () => {
      const res = await request(app)
        .get('/api/products/recommendations')
        .query({ type: 'alsoViewed', productId: prod1._id.toString(), limit: 10 });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
