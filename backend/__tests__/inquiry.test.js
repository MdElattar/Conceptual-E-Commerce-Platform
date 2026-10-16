import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp, addErrorHandlers } from './helpers/testApp.js';
import { startTestDB, stopTestDB, clearTestDB, createTestUser, generateToken, authHeader, setTestEnv } from './helpers/setup.js';
import inquiryRoutes from '../routes/inquiryRoutes.js';
import Inquiry from '../models/inquiryModel.js';

describe('Inquiry Management', () => {
  beforeAll(async () => {
    process.env.EMAIL_USER = 'test@example.com';
    process.env.EMAIL_PASS = 'test-password';
    setTestEnv();
    await startTestDB();
  });

  afterAll(async () => {
    await stopTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
  });

  describe('POST /api/inquiries (public)', () => {
    let app;

    beforeEach(() => {
      app = createTestApp();
      app.use('/api/inquiries', inquiryRoutes);
      addErrorHandlers(app);
    });

    it('should create an inquiry', async () => {
      const res = await request(app)
        .post('/api/inquiries')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          phone: '01000000000',
          productTitle: 'Excavator',
          message: 'I want to buy this product',
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('John Doe');
      expect(res.body.productTitle).toBe('Excavator');
      expect(res.body.status).toBe('Pending');
    });

    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/inquiries')
        .send({ name: 'John' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/inquiries (admin)', () => {
    let app, admin, adminToken;

    beforeEach(() => {
      app = createTestApp();
      app.use('/api/inquiries', inquiryRoutes);
      addErrorHandlers(app);
    });

    it('should list all inquiries for admin', async () => {
      admin = await createTestUser({ email: 'admin@test.com', isAdmin: true });
      adminToken = generateToken(admin._id);

      await Inquiry.create({ name: 'A', email: 'a@test.com', phone: '01000000001', productTitle: 'P1', message: 'M1' });
      await Inquiry.create({ name: 'B', email: 'b@test.com', phone: '01000000002', productTitle: 'P2', message: 'M2' });

      const res = await request(app)
        .get('/api/inquiries')
        .set('Authorization', authHeader(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it('should reject non-admin user', async () => {
      const user = await createTestUser();
      const token = generateToken(user._id);

      const res = await request(app)
        .get('/api/inquiries')
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(401);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/inquiries');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/inquiries/:id (admin)', () => {
    let app, admin, adminToken, inquiry;

    beforeEach(async () => {
      app = createTestApp();
      app.use('/api/inquiries', inquiryRoutes);
      addErrorHandlers(app);

      admin = await createTestUser({ email: 'admin@test.com', isAdmin: true });
      adminToken = generateToken(admin._id);
      inquiry = await Inquiry.create({
        name: 'Test', email: 'test@test.com', phone: '01000000000',
        productTitle: 'Product', message: 'Message',
      });
    });

    it('should update inquiry status', async () => {
      const res = await request(app)
        .put(`/api/inquiries/${inquiry._id}`)
        .set('Authorization', authHeader(adminToken))
        .send({ status: 'Contacted' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('Contacted');
    });

    it('should return 404 for non-existent inquiry', async () => {
      const res = await request(app)
        .put(`/api/inquiries/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', authHeader(adminToken))
        .send({ status: 'Closed' });

      expect(res.status).toBe(404);
    });

    it('should reject non-admin user', async () => {
      const user = await createTestUser();
      const token = generateToken(user._id);

      const res = await request(app)
        .put(`/api/inquiries/${inquiry._id}`)
        .set('Authorization', authHeader(token))
        .send({ status: 'Contacted' });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/inquiries/:id (admin)', () => {
    let app, admin, adminToken, inquiry;

    beforeEach(async () => {
      app = createTestApp();
      app.use('/api/inquiries', inquiryRoutes);
      addErrorHandlers(app);

      admin = await createTestUser({ email: 'admin@test.com', isAdmin: true });
      adminToken = generateToken(admin._id);
      inquiry = await Inquiry.create({
        name: 'Delete', email: 'del@test.com', phone: '01000000000',
        productTitle: 'Product', message: 'To delete',
      });
    });

    it('should delete an inquiry as admin', async () => {
      const res = await request(app)
        .delete(`/api/inquiries/${inquiry._id}`)
        .set('Authorization', authHeader(adminToken));

      expect(res.status).toBe(200);

      const deleted = await Inquiry.findById(inquiry._id);
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent inquiry', async () => {
      const res = await request(app)
        .delete(`/api/inquiries/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', authHeader(adminToken));

      expect(res.status).toBe(404);
    });

    it('should reject non-admin user', async () => {
      const user = await createTestUser();
      const token = generateToken(user._id);

      const res = await request(app)
        .delete(`/api/inquiries/${inquiry._id}`)
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(401);
    });
  });
});
