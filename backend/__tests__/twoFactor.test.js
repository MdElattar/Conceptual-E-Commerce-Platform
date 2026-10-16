jest.mock('stripe', () => {
  return jest.fn(() => ({
    customers: { create: jest.fn(), retrieve: jest.fn() },
    checkout: { sessions: { create: jest.fn(), retrieve: jest.fn() } },
    paymentIntents: { create: jest.fn(), retrieve: jest.fn(), update: jest.fn() },
    refunds: { create: jest.fn() },
    webhooks: { constructEvent: jest.fn() },
  }));
});

import request from 'supertest';
import mongoose from 'mongoose';
import speakeasy from 'speakeasy';
import jwt from 'jsonwebtoken';
import { createTestApp, addErrorHandlers } from './helpers/testApp.js';
import { startTestDB, stopTestDB, clearTestDB, createTestUser, generateToken, authHeader, setTestEnv } from './helpers/setup.js';
import userRoutes from '../routes/userRoutes.js';
import User from '../models/userModel.js';

describe('Two-Factor Authentication (2FA)', () => {
  let app;
  let user, userToken;

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
    app = createTestApp();
    app.use('/api/users', userRoutes);
    addErrorHandlers(app);
  });

  describe('GET /api/users/2fa/secret', () => {
    it('should return a secret and QR code when authenticated', async () => {
      const res = await request(app)
        .get('/api/users/2fa/secret')
        .set('Authorization', authHeader(userToken));

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('secret');
      expect(res.body).toHaveProperty('qrCode');
      expect(typeof res.body.secret).toBe('string');
      expect(res.body.qrCode).toMatch(/^otpauth:\/\/totp\//);
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get('/api/users/2fa/secret');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/users/2fa/enable', () => {
    it('should enable 2FA and return backup codes', async () => {
      const secret = speakeasy.generateSecret();
      const code = speakeasy.totp({ secret: secret.base32, encoding: 'base32' });

      const res = await request(app)
        .post('/api/users/2fa/enable')
        .set('Authorization', authHeader(userToken))
        .send({ secret: secret.base32, token: code });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('2FA enabled successfully');
      expect(res.body.backupCodes).toHaveLength(8);

      const updatedUser = await User.findById(user._id);
      expect(updatedUser.twoFactorEnabled).toBe(true);
      expect(updatedUser.twoFactorSecret).toBe(secret.base32);
      expect(updatedUser.backupCodes).toHaveLength(8);
    });

    it('should reject invalid TOTP code', async () => {
      const secret = speakeasy.generateSecret();

      const res = await request(app)
        .post('/api/users/2fa/enable')
        .set('Authorization', authHeader(userToken))
        .send({ secret: secret.base32, token: '000000' });

      expect(res.status).toBe(400);
    });

    it('should reject request without secret or code', async () => {
      const res = await request(app)
        .post('/api/users/2fa/enable')
        .set('Authorization', authHeader(userToken))
        .send({ secret: 'abc123' });

      expect(res.status).toBe(400);
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app)
        .post('/api/users/2fa/enable')
        .send({ secret: 'abc', token: '123456' });

      expect(res.status).toBe(401);
    });
  });

  describe('Disable 2FA flow', () => {
    beforeEach(async () => {
      const secret = speakeasy.generateSecret();
      const code = speakeasy.totp({ secret: secret.base32, encoding: 'base32' });
      await request(app)
        .post('/api/users/2fa/enable')
        .set('Authorization', authHeader(userToken))
        .send({ secret: secret.base32, token: code });
    });

    describe('POST /api/users/2fa/disable', () => {
      it('should disable 2FA with correct password', async () => {
        const res = await request(app)
          .post('/api/users/2fa/disable')
          .set('Authorization', authHeader(userToken))
          .send({ password: 'Test@1234' });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('2FA disabled successfully');

        const updatedUser = await User.findById(user._id);
        expect(updatedUser.twoFactorEnabled).toBe(false);
        expect(updatedUser.twoFactorSecret).toBe('');
        expect(updatedUser.backupCodes).toEqual([]);
      });

      it('should reject wrong password', async () => {
        const res = await request(app)
          .post('/api/users/2fa/disable')
          .set('Authorization', authHeader(userToken))
          .send({ password: 'wrong-password' });

        expect(res.status).toBe(401);
      });

      it('should reject request without password', async () => {
        const res = await request(app)
          .post('/api/users/2fa/disable')
          .set('Authorization', authHeader(userToken))
          .send({});

        expect(res.status).toBe(400);
      });
    });

    describe('GET /api/users/2fa/backup-codes', () => {
      it('should return unused backup codes', async () => {
        const res = await request(app)
          .get('/api/users/2fa/backup-codes')
          .set('Authorization', authHeader(userToken));

        expect(res.status).toBe(200);
        expect(res.body.backupCodes).toHaveLength(8);
        expect(res.body.usedCount).toBe(0);
        expect(res.body.totalCount).toBe(8);
      });

      it('should reject unauthenticated requests', async () => {
        const res = await request(app).get('/api/users/2fa/backup-codes');
        expect(res.status).toBe(401);
      });
    });

    describe('POST /api/users/2fa/regenerate-backup-codes', () => {
      it('should regenerate backup codes with correct password', async () => {
        const res = await request(app)
          .post('/api/users/2fa/regenerate-backup-codes')
          .set('Authorization', authHeader(userToken))
          .send({ password: 'Test@1234' });

        expect(res.status).toBe(200);
        expect(res.body.backupCodes).toHaveLength(8);
      });

      it('should reject wrong password', async () => {
        const res = await request(app)
          .post('/api/users/2fa/regenerate-backup-codes')
          .set('Authorization', authHeader(userToken))
          .send({ password: 'wrong-password' });

        expect(res.status).toBe(401);
      });

      it('should reject request without password', async () => {
        const res = await request(app)
          .post('/api/users/2fa/regenerate-backup-codes')
          .set('Authorization', authHeader(userToken))
          .send({});

        expect(res.status).toBe(400);
      });
    });
  });

  describe('2FA login flow', () => {
    let tempToken;

    beforeEach(async () => {
      const secret = speakeasy.generateSecret();
      const code = speakeasy.totp({ secret: secret.base32, encoding: 'base32' });
      await request(app)
        .post('/api/users/2fa/enable')
        .set('Authorization', authHeader(userToken))
        .send({ secret: secret.base32, token: code });

      const loginRes = await request(app)
        .post('/api/users/login')
        .send({ email: 'test@example.com', password: 'Test@1234' });

      tempToken = loginRes.body.tempToken;
    });

    describe('POST /api/users/verify-2fa', () => {
      it('should return full JWT with valid TOTP code', async () => {
        const userDoc = await User.findById(user._id);
        const code = speakeasy.totp({ secret: userDoc.twoFactorSecret, encoding: 'base32' });

        const res = await request(app)
          .post('/api/users/verify-2fa')
          .send({ tempToken, token: code });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.twoFactorEnabled).toBe(true);
        expect(res.body.email).toBe('test@example.com');
      });

      it('should return full JWT with valid backup code', async () => {
        const userDoc = await User.findById(user._id);
        const backupCode = userDoc.backupCodes[0].code;

        const res = await request(app)
          .post('/api/users/verify-2fa')
          .send({ tempToken, token: backupCode });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');

        const usedUser = await User.findById(user._id);
        expect(usedUser.backupCodes[0].used).toBe(true);
      });

      it('should reject invalid TOTP code', async () => {
        const res = await request(app)
          .post('/api/users/verify-2fa')
          .send({ tempToken, token: '000000' });

        expect(res.status).toBe(401);
      });

      it('should reject expired tempToken', async () => {
        const expiredTempToken = jwt.sign(
          { id: user._id, twoFactorPending: true },
          process.env.JWT_SECRET,
          { expiresIn: '0s' }
        );

        const res = await request(app)
          .post('/api/users/verify-2fa')
          .send({ tempToken: expiredTempToken, token: '123456' });

        expect(res.status).toBe(401);
      });

      it('should reject request without tempToken or code', async () => {
        const res = await request(app)
          .post('/api/users/verify-2fa')
          .send({ tempToken });

        expect(res.status).toBe(400);
      });
    });
  });
});
