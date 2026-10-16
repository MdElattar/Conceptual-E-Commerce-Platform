import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from './testUtils';

vi.mock('../slices/orderApiSlice', () => ({
  useGetVendorPerformanceQuery: vi.fn(),
  useGetVendorAnalyticsQuery: vi.fn(),
}));

import { useGetVendorPerformanceQuery, useGetVendorAnalyticsQuery } from '../slices/orderApiSlice';
import SellerPerformanceTab from '../components/SellerPerformanceTab';

const mockPerformance = {
  performance: {
    performanceScore: 88,
    grade: 'B',
    fulfillmentRate: 94,
    deliveredItems: 188,
    totalItems: 200,
    cancellationRate: 2.5,
    cancelledItems: 5,
    avgShippingHours: 28,
    avgRating: 4.3,
    totalReviews: 120,
    totalSalesValue: 45000,
    totalEarnings: 40500,
    shippedItems: 7,
    pendingItems: 3,
    monthlyTrends: [
      { month: 'Jan', orders: 20, delivered: 18, cancelled: 1, sales: 5000, earnings: 4500 },
      { month: 'Feb', orders: 25, delivered: 23, cancelled: 2, sales: 6000, earnings: 5400 },
      { month: 'Mar', orders: 15, delivered: 14, cancelled: 0, sales: 4000, earnings: 3600 },
    ],
  },
};

function mockPerformanceQuery(overrides = {}) {
  useGetVendorPerformanceQuery.mockReturnValue({
    data: mockPerformance,
    isLoading: false,
    error: null,
    ...overrides,
  });
}

describe('SellerPerformanceTab', () => {
  const mockAnalyticsData = {
    analytics: {
      weeklyTrends: [],
      comparisons: {
        revenue: { current: 0, momChange: 0, yoyChange: 0, previousYear: 0 },
        orders: { current: 0, momChange: 0, yoyChange: 0, previousYear: 0 },
        earnings: { current: 0, momChange: 0 },
      },
      topProducts: [],
      worstProducts: [],
      profitMargins: { overall: 0, byCategory: [] },
      inventoryInsights: { totalStock: 0, turnoverRate: 0, lowStockItems: [], outOfStockItems: [] },
      forecast: { nextMonthRevenue: 0, trend: 'stable', basedOn: '3-month moving average' },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useGetVendorAnalyticsQuery.mockReturnValue({
      data: mockAnalyticsData,
      isLoading: false,
      error: null,
    });
  });

  it('shows loading spinner while fetching', () => {
    mockPerformanceQuery({ isLoading: true, data: null });
    renderWithProviders(<SellerPerformanceTab />);
    expect(screen.getByTestId('performance-spinner')).toBeInTheDocument();
  });

  it('shows error state on fetch failure', () => {
    mockPerformanceQuery({
      isLoading: false,
      data: null,
      error: { data: { message: 'API error' } },
    });
    renderWithProviders(<SellerPerformanceTab />);
    expect(screen.getByText('Could not load performance data')).toBeInTheDocument();
    expect(screen.getByText('API error')).toBeInTheDocument();
  });

  it('shows empty state when no performance data', () => {
    mockPerformanceQuery({ data: {} });
    renderWithProviders(<SellerPerformanceTab />);
    expect(screen.getByText('No performance data available yet.')).toBeInTheDocument();
  });

  it('renders score card with grade', () => {
    mockPerformanceQuery();
    renderWithProviders(<SellerPerformanceTab />);
    expect(screen.getByText('Grade B')).toBeInTheDocument();
    expect(screen.getByText('88')).toBeInTheDocument();
  });

  it('renders core metric cards', () => {
    mockPerformanceQuery();
    renderWithProviders(<SellerPerformanceTab />);
    expect(screen.getByText('Fulfillment Rate')).toBeInTheDocument();
    expect(screen.getByText('94%')).toBeInTheDocument();
    expect(screen.getByText('Cancellation Rate')).toBeInTheDocument();
    expect(screen.getByText('2.5%')).toBeInTheDocument();
    expect(screen.getByText('Avg Shipping')).toBeInTheDocument();
    expect(screen.getByText('28h')).toBeInTheDocument();
    expect(screen.getByText('Avg Rating')).toBeInTheDocument();
    expect(screen.getByText('4.3')).toBeInTheDocument();
  });

  it('renders financial summary', () => {
    mockPerformanceQuery();
    renderWithProviders(<SellerPerformanceTab />);
    expect(screen.getByText('Total Sales Value')).toBeInTheDocument();
    expect(screen.getByText('USD 45,000.00')).toBeInTheDocument();
    expect(screen.getByText('Total Earnings (After Commission)')).toBeInTheDocument();
    expect(screen.getByText('USD 40,500.00')).toBeInTheDocument();
  });

  it('renders order status breakdown', () => {
    mockPerformanceQuery();
    renderWithProviders(<SellerPerformanceTab />);
    expect(screen.getByText('Order Status Breakdown')).toBeInTheDocument();
    expect(screen.getByText('188')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('renders chart sections when monthly trends exist', () => {
    mockPerformanceQuery();
    renderWithProviders(<SellerPerformanceTab />);
    expect(screen.getByText('Monthly Sales & Earnings')).toBeInTheDocument();
    expect(screen.getByText('Monthly Order Trends')).toBeInTheDocument();
    expect(screen.getByText('Order Status Distribution')).toBeInTheDocument();
  });

  it('renders monthly trends table', () => {
    mockPerformanceQuery();
    renderWithProviders(<SellerPerformanceTab />);
    expect(screen.getByText('Monthly Performance Trends')).toBeInTheDocument();
    expect(screen.getByText('Jan')).toBeInTheDocument();
    expect(screen.getByText('Feb')).toBeInTheDocument();
    expect(screen.getByText('Mar')).toBeInTheDocument();
  });

  it('renders AdvancedAnalytics sub-component', () => {
    mockPerformanceQuery();
    renderWithProviders(<SellerPerformanceTab />);
    expect(screen.getByText((content) => content.includes('Advanced Analytics'))).toBeInTheDocument();
  });

  it('shows N/A for shipping when avg is 0', () => {
    mockPerformanceQuery({
      data: {
        performance: { ...mockPerformance.performance, avgShippingHours: 0 },
      },
    });
    renderWithProviders(<SellerPerformanceTab />);
    expect(screen.getByText('N/A')).toBeInTheDocument();
  });

  it('renders empty state when no monthly trends', () => {
    mockPerformanceQuery({
      data: {
        performance: { ...mockPerformance.performance, monthlyTrends: [] },
      },
    });
    renderWithProviders(<SellerPerformanceTab />);
    expect(screen.queryByText('Monthly Sales & Earnings')).not.toBeInTheDocument();
  });
});
