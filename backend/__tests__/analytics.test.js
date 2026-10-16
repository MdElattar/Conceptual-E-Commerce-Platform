import request from 'supertest';
import { createTestApp, addErrorHandlers } from './helpers/testApp.js';
import { startTestDB, stopTestDB, clearTestDB, createTestVendor, createTestUser, generateToken, authHeader, setTestEnv } from './helpers/setup.js';
import { createTestProduct, createDeliveredOrderItem } from './helpers/factories.js';
import vendorRoutes from '../routes/vendorRoutes.js';

describe('Vendor Analytics Endpoint', () => {
  let app;
  let vendor, vendorToken;

  beforeAll(async () => {
    setTestEnv();
    await startTestDB();
  });

  afterAll(async () => {
    await stopTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    vendor = await createTestVendor();
    vendorToken = generateToken(vendor._id);
    app = createTestApp();
    app.use('/api/vendor', vendorRoutes);
    addErrorHandlers(app);
  });

  it('should return analytics with expected shape', async () => {
    const product = await createTestProduct(vendor._id, { name: 'Widget', price: 50 });
    await createDeliveredOrderItem(vendor._id, product._id, { name: 'Widget', price: 50, vendorEarnings: 45, qty: 3 });

    const res = await request(app)
      .get('/api/vendor/analytics')
      .set('Authorization', authHeader(vendorToken));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.analytics).toBeDefined();
    expect(res.body.analytics.weeklyTrends).toBeInstanceOf(Array);
    expect(res.body.analytics.comparisons).toBeDefined();
    expect(res.body.analytics.comparisons.revenue).toBeDefined();
    expect(res.body.analytics.comparisons.orders).toBeDefined();
    expect(res.body.analytics.comparisons.earnings).toBeDefined();
    expect(res.body.analytics.topProducts).toBeInstanceOf(Array);
    expect(res.body.analytics.worstProducts).toBeInstanceOf(Array);
    expect(res.body.analytics.profitMargins).toBeDefined();
    expect(res.body.analytics.profitMargins.overall).toBeDefined();
    expect(res.body.analytics.profitMargins.byCategory).toBeInstanceOf(Array);
    expect(res.body.analytics.inventoryInsights).toBeDefined();
    expect(res.body.analytics.inventoryInsights.totalStock).toBe(50);
    expect(res.body.analytics.inventoryInsights.lowStockItems).toBeInstanceOf(Array);
    expect(res.body.analytics.inventoryInsights.outOfStockItems).toBeInstanceOf(Array);
    expect(res.body.analytics.inventoryInsights.turnoverRate).toBeDefined();
    expect(res.body.analytics.forecast).toBeDefined();
    expect(res.body.analytics.forecast.trend).toMatch(/^(up|down|stable)$/);
    expect(res.body.analytics.forecast.basedOn).toBe('3-month moving average');
  });

  it('should include delivered product in topProducts', async () => {
    const product = await createTestProduct(vendor._id, { name: 'TopSeller', price: 100 });
    await createDeliveredOrderItem(vendor._id, product._id, { name: 'TopSeller', price: 100, vendorEarnings: 90, qty: 5 });

    const res = await request(app)
      .get('/api/vendor/analytics')
      .set('Authorization', authHeader(vendorToken));

    expect(res.body.analytics.topProducts.length).toBeGreaterThanOrEqual(1);
    expect(res.body.analytics.topProducts[0].name).toBe('TopSeller');
    expect(res.body.analytics.topProducts[0].qtySold).toBe(5);
    expect(res.body.analytics.topProducts[0].revenue).toBe(500);
    expect(res.body.analytics.topProducts[0].earnings).toBe(450);
  });

  it('should return total revenue from comparisons', async () => {
    const p1 = await createTestProduct(vendor._id, { name: 'A', price: 100 });
    const p2 = await createTestProduct(vendor._id, { name: 'B', price: 200 });
    await createDeliveredOrderItem(vendor._id, p1._id, { name: 'A', price: 100, vendorEarnings: 90, qty: 2 });
    await createDeliveredOrderItem(vendor._id, p2._id, { name: 'B', price: 200, vendorEarnings: 180, qty: 1 });

    const res = await request(app)
      .get('/api/vendor/analytics')
      .set('Authorization', authHeader(vendorToken));

    expect(res.body.analytics.comparisons.revenue.current).toBe(400);
    expect(res.body.analytics.comparisons.earnings.current).toBe(360);
    expect(res.body.analytics.comparisons.orders.current).toBe(2);
  });

  it('should reject non-vendor user', async () => {
    const user = await createTestUser();
    const userToken = generateToken(user._id);

    const res = await request(app)
      .get('/api/vendor/analytics')
      .set('Authorization', authHeader(userToken));

    expect(res.status).toBe(403);
  });

  it('should reject unauthenticated request', async () => {
    const res = await request(app).get('/api/vendor/analytics');
    expect(res.status).toBe(401);
  });

  it('should handle vendor with no orders or products gracefully', async () => {
    const emptyVendor = await createTestVendor({ email: 'empty@example.com' });
    const emptyToken = generateToken(emptyVendor._id);

    const res = await request(app)
      .get('/api/vendor/analytics')
      .set('Authorization', authHeader(emptyToken));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.analytics.topProducts).toHaveLength(0);
    expect(res.body.analytics.weeklyTrends).toBeInstanceOf(Array);
    expect(res.body.analytics.comparisons.revenue.current).toBe(0);
    expect(res.body.analytics.comparisons.orders.current).toBe(0);
  });
});
