import mongoose from 'mongoose';
import Order from '../../models/orderModel.js';
import Product from '../../models/productModel.js';

export async function createTestProduct(vendorId, overrides = {}) {
  return Product.create({
    user: vendorId,
    name: 'Test Product',
    price: 100,
    countInStock: 50,
    category: 'Test',
    brand: 'TestBrand',
    description: 'A test product',
    image: '/test.jpg',
    numSales: 0,
    status: 'active',
    ...overrides,
  });
}

export async function createTestOrder(vendorId, productId, overrides = {}) {
  return Order.create({
    user: new mongoose.Types.ObjectId(),
    customerName: 'Test Customer',
    phone: '01000000001',
    address: { addressLine: '123 Test St', city: 'Cairo', country: 'EG' },
    itemsPrice: 200,
    shippingPrice: 20,
    taxPrice: 0,
    totalPrice: 220,
    paymentMethod: 'wallet',
    isPaid: true,
    paidAt: new Date(),
    orderItems: [{
      name: 'Test Product',
      qty: 2,
      image: '/test.jpg',
      price: 100,
      product: productId,
      vendor: vendorId,
      vendorEarnings: 90,
      commissionRate: 10,
      payoutStatus: 'Holding',
      itemStatus: 'Pending',
      ...overrides.orderItemOverrides,
    }],
    ...overrides,
  });
}

export async function createDeliveredOrderItem(vendorId, productId, overrides = {}) {
  return Order.create({
    user: new mongoose.Types.ObjectId(),
    customerName: 'Test Customer',
    phone: '01000000001',
    address: { addressLine: '123 Test St', city: 'Cairo', country: 'EG' },
    itemsPrice: overrides.price || 100,
    shippingPrice: 10,
    taxPrice: 0,
    totalPrice: (overrides.price || 100) + 10,
    paymentMethod: 'wallet',
    isPaid: true,
    paidAt: new Date(),
    orderItems: [{
      name: overrides.name || 'Test Product',
      qty: overrides.qty || 1,
      image: '/test.jpg',
      price: overrides.price || 100,
      product: productId,
      vendor: vendorId,
      vendorEarnings: overrides.vendorEarnings || 90,
      commissionRate: 10,
      payoutStatus: 'Released',
      itemStatus: 'Delivered',
      deliveredAt: new Date(),
      ...overrides.orderItemOverrides,
    }],
  });
}
