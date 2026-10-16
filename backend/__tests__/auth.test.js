import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp, addErrorHandlers } from './helpers/testApp.js';
import { startTestDB, stopTestDB, clearTestDB, createTestUser, createTestVendor, generateToken, authHeader, setTestEnv } from './helpers/setup.js';
import { protect, isVendor } from '../middleware/authMiddleware.js';

describe('Auth Middleware', () => {
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
    app = createTestApp();
    app.get('/test-protect', protect, (req, res) => {
      res.json({ userId: req.user._id.toString(), email: req.user.email });
    });
    addErrorHandlers(app);
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app).get('/test-protect');
    expect(res.status).toBe(401);
  });

  it('should return 401 when an invalid token is provided', async () => {
    const res = await request(app).get('/test-protect').set('Authorization', 'Bearer invalid-token');
    expect(res.status).toBe(401);
  });

  it('should pass with valid token and attach user to req', async () => {
    const user = await createTestUser();
    const token = generateToken(user._id);
    const res = await request(app).get('/test-protect').set('Authorization', authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(user.email);
  });

  it('should return user id in response', async () => {
    const user = await createTestUser();
    const token = generateToken(user._id);
    const res = await request(app).get('/test-protect').set('Authorization', authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe(user._id.toString());
  });
});

describe('Vendor middleware (isVendor)', () => {
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
    app = createTestApp();
    app.get('/test-vendor', protect, isVendor, (req, res) => {
      res.json({ role: req.user.role });
    });
    addErrorHandlers(app);
  });

  it('should allow vendor role through', async () => {
    const vendor = await createTestVendor();
    const token = generateToken(vendor._id);
    const res = await request(app).get('/test-vendor').set('Authorization', authHeader(token));
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('vendor');
  });

  it('should reject non-vendor user (role=user)', async () => {
    const user = await createTestUser();
    const token = generateToken(user._id);
    const res = await request(app).get('/test-vendor').set('Authorization', authHeader(token));
    expect(res.status).toBe(403);
  });

  it('should reject admin role', async () => {
    const admin = await createTestUser({ role: 'admin', isAdmin: true });
    const token = generateToken(admin._id);
    const res = await request(app).get('/test-vendor').set('Authorization', authHeader(token));
    expect(res.status).toBe(403);
  });
});
