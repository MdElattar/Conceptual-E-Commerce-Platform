import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp, addErrorHandlers } from './helpers/testApp.js';
import { startTestDB, stopTestDB, clearTestDB, createTestUser, generateToken, authHeader, setTestEnv } from './helpers/setup.js';
import bannerRoutes from '../routes/bannerRoutes.js';
import Banner from '../models/bannerModel.js';

describe('Banner Management', () => {
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

  describe('GET /api/banners (public)', () => {
    let app;

    beforeEach(() => {
      app = createTestApp();
      app.use('/api/banners', bannerRoutes);
      addErrorHandlers(app);
    });

    it('should return empty array when no banners exist', async () => {
      const res = await request(app).get('/api/banners');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should return only active banners', async () => {
      await Banner.create({ title: 'Active 1', isActive: true });
      await Banner.create({ title: 'Inactive 1', isActive: false });
      await Banner.create({ title: 'Active 2', isActive: true });

      const res = await request(app).get('/api/banners');
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.every(b => b.isActive)).toBe(true);
    });
  });

  describe('GET /api/banners/admin', () => {
    let app, admin, adminToken;

    beforeEach(() => {
      app = createTestApp();
      app.use('/api/banners', bannerRoutes);
      addErrorHandlers(app);
    });

    it('should return all banners for admin', async () => {
      admin = await createTestUser({ email: 'admin@test.com', isAdmin: true });
      adminToken = generateToken(admin._id);

      await Banner.create({ title: 'Active', isActive: true });
      await Banner.create({ title: 'Inactive', isActive: false });

      const res = await request(app)
        .get('/api/banners/admin')
        .set('Authorization', authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it('should reject non-admin user', async () => {
      const user = await createTestUser();
      const token = generateToken(user._id);

      const res = await request(app)
        .get('/api/banners/admin')
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(401);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/banners/admin');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/banners', () => {
    let app;

    beforeEach(() => {
      app = createTestApp();
      app.use('/api/banners', bannerRoutes);
      addErrorHandlers(app);
    });

    it('should create a banner as admin', async () => {
      const admin = await createTestUser({ email: 'admin@test.com', isAdmin: true });
      const token = generateToken(admin._id);

      const res = await request(app)
        .post('/api/banners')
        .set('Authorization', authHeader(token))
        .send({ title: 'New Banner', subTitle: 'Subtitle', ctaText: 'Shop Now' });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('New Banner');
      expect(res.body.subTitle).toBe('Subtitle');
    });

    it('should reject non-admin user', async () => {
      const user = await createTestUser();
      const token = generateToken(user._id);

      const res = await request(app)
        .post('/api/banners')
        .set('Authorization', authHeader(token))
        .send({ title: 'New Banner' });

      expect(res.status).toBe(401);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/banners')
        .send({ title: 'New Banner' });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/banners/:id', () => {
    let app, admin, adminToken, banner;

    beforeEach(async () => {
      app = createTestApp();
      app.use('/api/banners', bannerRoutes);
      addErrorHandlers(app);

      admin = await createTestUser({ email: 'admin@test.com', isAdmin: true });
      adminToken = generateToken(admin._id);
      banner = await Banner.create({ title: 'To Delete' });
    });

    it('should delete a banner as admin', async () => {
      const res = await request(app)
        .delete(`/api/banners/${banner._id}`)
        .set('Authorization', authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Banner removed successfully');

      const deleted = await Banner.findById(banner._id);
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent banner', async () => {
      const res = await request(app)
        .delete(`/api/banners/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', authHeader(adminToken));

      expect(res.status).toBe(404);
    });

    it('should reject non-admin user', async () => {
      const user = await createTestUser();
      const token = generateToken(user._id);

      const res = await request(app)
        .delete(`/api/banners/${banner._id}`)
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/banners/:id/toggle', () => {
    let app, admin, adminToken, banner;

    beforeEach(async () => {
      app = createTestApp();
      app.use('/api/banners', bannerRoutes);
      addErrorHandlers(app);

      admin = await createTestUser({ email: 'admin@test.com', isAdmin: true });
      adminToken = generateToken(admin._id);
      banner = await Banner.create({ title: 'Toggle Me', isActive: true });
    });

    it('should toggle banner from active to inactive', async () => {
      const res = await request(app)
        .put(`/api/banners/${banner._id}/toggle`)
        .set('Authorization', authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.isActive).toBe(false);
    });

    it('should toggle banner from inactive to active', async () => {
      banner.isActive = false;
      await banner.save();

      const res = await request(app)
        .put(`/api/banners/${banner._id}/toggle`)
        .set('Authorization', authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.isActive).toBe(true);
    });

    it('should return 404 for non-existent banner', async () => {
      const res = await request(app)
        .put(`/api/banners/${new mongoose.Types.ObjectId()}/toggle`)
        .set('Authorization', authHeader(adminToken));

      expect(res.status).toBe(404);
    });

    it('should reject non-admin user', async () => {
      const user = await createTestUser();
      const token = generateToken(user._id);

      const res = await request(app)
        .put(`/api/banners/${banner._id}/toggle`)
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(401);
    });
  });
});
