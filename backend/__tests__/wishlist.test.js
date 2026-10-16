import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp, addErrorHandlers } from './helpers/testApp.js';
import { startTestDB, stopTestDB, clearTestDB, createTestUser, createTestVendor, generateToken, authHeader, setTestEnv } from './helpers/setup.js';
import { createTestProduct } from './helpers/factories.js';
import wishlistRoutes from '../routes/wishlistRoutes.js';
import Wishlist from '../models/wishlistModel.js';

describe('Wishlist', () => {
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

  describe('GET /api/wishlist', () => {
    let app, user, token, vendor, product;

    beforeEach(async () => {
      app = createTestApp();
      app.use('/api/wishlist', wishlistRoutes);
      addErrorHandlers(app);

      user = await createTestUser();
      token = generateToken(user._id);
      vendor = await createTestVendor();
      product = await createTestProduct(vendor._id);
    });

    it('should return an empty wishlist if none exists', async () => {
      const res = await request(app)
        .get('/api/wishlist')
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.products).toEqual([]);
      expect(res.body.user.toString()).toBe(user._id.toString());
    });

    it('should return existing wishlist with products', async () => {
      await Wishlist.create({ user: user._id, products: [{ product: product._id }] });

      const res = await request(app)
        .get('/api/wishlist')
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.products.length).toBe(1);
      expect(res.body.products[0].product._id.toString()).toBe(product._id.toString());
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/wishlist');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/wishlist', () => {
    let app, user, token, vendor, product;

    beforeEach(async () => {
      app = createTestApp();
      app.use('/api/wishlist', wishlistRoutes);
      addErrorHandlers(app);

      user = await createTestUser();
      token = generateToken(user._id);
      vendor = await createTestVendor();
      product = await createTestProduct(vendor._id);
    });

    it('should add a product to wishlist', async () => {
      const res = await request(app)
        .post('/api/wishlist')
        .set('Authorization', authHeader(token))
        .send({ productId: product._id });

      expect(res.status).toBe(201);
      expect(res.body.products.length).toBe(1);
      expect(res.body.products[0].product._id.toString()).toBe(product._id.toString());
    });

    it('should return 400 for duplicate product', async () => {
      await Wishlist.create({ user: user._id, products: [{ product: product._id }] });

      const res = await request(app)
        .post('/api/wishlist')
        .set('Authorization', authHeader(token))
        .send({ productId: product._id });

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post('/api/wishlist')
        .set('Authorization', authHeader(token))
        .send({ productId: fakeId });

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/wishlist')
        .send({ productId: product._id });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/wishlist/:productId', () => {
    let app, user, token, vendor, product;

    beforeEach(async () => {
      app = createTestApp();
      app.use('/api/wishlist', wishlistRoutes);
      addErrorHandlers(app);

      user = await createTestUser();
      token = generateToken(user._id);
      vendor = await createTestVendor();
      product = await createTestProduct(vendor._id);
    });

    it('should remove a product from wishlist', async () => {
      await Wishlist.create({ user: user._id, products: [{ product: product._id }] });

      const res = await request(app)
        .delete(`/api/wishlist/${product._id}`)
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.products.length).toBe(0);
    });

    it('should return 404 if wishlist does not exist', async () => {
      const res = await request(app)
        .delete(`/api/wishlist/${product._id}`)
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .delete(`/api/wishlist/${product._id}`);

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/wishlist/clear', () => {
    let app, user, token, vendor, product;

    beforeEach(async () => {
      app = createTestApp();
      app.use('/api/wishlist', wishlistRoutes);
      addErrorHandlers(app);

      user = await createTestUser();
      token = generateToken(user._id);
      vendor = await createTestVendor();
      product = await createTestProduct(vendor._id);
    });

    it('should clear all items from wishlist', async () => {
      await Wishlist.create({ user: user._id, products: [{ product: product._id }] });

      const res = await request(app)
        .post('/api/wishlist/clear')
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Wishlist cleared');
    });

    it('should not fail when clearing empty wishlist', async () => {
      const res = await request(app)
        .post('/api/wishlist/clear')
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(200);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).post('/api/wishlist/clear');
      expect(res.status).toBe(401);
    });
  });
});
