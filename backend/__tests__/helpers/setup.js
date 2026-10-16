import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../../models/userModel.js';

let mongoServer;

export async function startTestDB() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
}

export async function stopTestDB() {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
}

export async function clearTestDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

export async function createTestUser(overrides = {}) {
  return User.create({
    name: 'Test User',
    email: 'test@example.com',
    password: 'Test@1234',
    phone: '01000000000',
    role: 'user',
    isVerified: true,
    ...overrides,
  });
}

export async function createTestVendor(overrides = {}) {
  return createTestUser({
    name: 'Test Vendor',
    email: 'vendor@example.com',
    role: 'vendor',
    vendorProfile: {
      storeName: 'Test Store',
      isVerified: true,
      availableBalance: 1000,
      escrowBalance: 500,
      ...overrides.vendorProfile,
    },
    ...overrides,
  });
}

export function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

export function authHeader(token) {
  return `Bearer ${token}`;
}

export function setTestEnv() {
  process.env.JWT_SECRET = 'test-jwt-secret-' + Date.now();
  process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_mock';
  process.env.CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
}
