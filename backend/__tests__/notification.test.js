import request from 'supertest';
import mongoose from 'mongoose';
import { createTestApp, addErrorHandlers } from './helpers/testApp.js';
import { startTestDB, stopTestDB, clearTestDB, createTestUser, generateToken, authHeader, setTestEnv } from './helpers/setup.js';
import notificationRoutes from '../routes/notificationRoutes.js';
import Notification from '../models/notificationModel.js';

describe('Notification Management', () => {
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

  describe('GET /api/notifications', () => {
    let app, user, token;

    beforeEach(async () => {
      app = createTestApp();
      app.use('/api/notifications', notificationRoutes);
      addErrorHandlers(app);

      user = await createTestUser();
      token = generateToken(user._id);
    });

    it('should return empty list when no notifications exist', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.notifications).toEqual([]);
      expect(res.body.unreadCount).toBe(0);
    });

    it('should return user notifications with unread count', async () => {
      await Notification.create({ user: user._id, type: 'system', title: 'Title', message: 'Unread' });
      await Notification.create({ user: user._id, type: 'system', title: 'Title', message: 'Read', read: true });
      await Notification.create({ user: user._id, type: 'system', title: 'Title', message: 'Another unread' });

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.notifications.length).toBe(3);
      expect(res.body.unreadCount).toBe(2);
    });

    it('should not return other users notifications', async () => {
      const otherUser = await createTestUser({ email: 'other@test.com' });
      await Notification.create({ user: otherUser._id, type: 'system', title: 'Title', message: 'Other' });

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.notifications.length).toBe(0);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/notifications/:id/read', () => {
    let app, user, token, notification;

    beforeEach(async () => {
      app = createTestApp();
      app.use('/api/notifications', notificationRoutes);
      addErrorHandlers(app);

      user = await createTestUser();
      token = generateToken(user._id);
      notification = await Notification.create({
        user: user._id, type: 'system', title: 'Title', message: 'Test',
      });
    });

    it('should mark a notification as read', async () => {
      const res = await request(app)
        .put(`/api/notifications/${notification._id}/read`)
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.read).toBe(true);
      expect(res.body.readAt).toBeDefined();
    });

    it('should return 404 when notification does not belong to user', async () => {
      const otherUser = await createTestUser({ email: 'other@test.com' });
      const otherNotif = await Notification.create({
        user: otherUser._id, type: 'system', title: 'Title', message: 'Other',
      });

      const res = await request(app)
        .put(`/api/notifications/${otherNotif._id}/read`)
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(404);
    });

    it('should return 404 for non-existent notification', async () => {
      const res = await request(app)
        .put(`/api/notifications/${new mongoose.Types.ObjectId()}/read`)
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).put(`/api/notifications/${notification._id}/read`);
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/notifications/read-all', () => {
    let app, user, token;

    beforeEach(async () => {
      app = createTestApp();
      app.use('/api/notifications', notificationRoutes);
      addErrorHandlers(app);

      user = await createTestUser();
      token = generateToken(user._id);
    });

    it('should mark all unread notifications as read', async () => {
      await Notification.create({ user: user._id, type: 'system', title: 'Title', message: 'A' });
      await Notification.create({ user: user._id, type: 'system', title: 'Title', message: 'B' });

      const res = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('All notifications marked as read.');

      const unreadCount = await Notification.countDocuments({ user: user._id, read: false });
      expect(unreadCount).toBe(0);
    });

    it('should succeed when no unread notifications exist', async () => {
      const res = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(200);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).put('/api/notifications/read-all');
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    let app, user, token, notification;

    beforeEach(async () => {
      app = createTestApp();
      app.use('/api/notifications', notificationRoutes);
      addErrorHandlers(app);

      user = await createTestUser();
      token = generateToken(user._id);
      notification = await Notification.create({
        user: user._id, type: 'system', title: 'Title', message: 'To delete',
      });
    });

    it('should delete a notification', async () => {
      const res = await request(app)
        .delete(`/api/notifications/${notification._id}`)
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Notification deleted.');

      const deleted = await Notification.findById(notification._id);
      expect(deleted).toBeNull();
    });

    it('should return 404 when notification does not belong to user', async () => {
      const otherUser = await createTestUser({ email: 'other@test.com' });
      const otherNotif = await Notification.create({
        user: otherUser._id, type: 'system', title: 'Title', message: 'Other',
      });

      const res = await request(app)
        .delete(`/api/notifications/${otherNotif._id}`)
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(404);
    });

    it('should return 404 for non-existent notification', async () => {
      const res = await request(app)
        .delete(`/api/notifications/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', authHeader(token));

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).delete(`/api/notifications/${notification._id}`);
      expect(res.status).toBe(401);
    });
  });
});
