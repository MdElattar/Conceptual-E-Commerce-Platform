import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from './testUtils';

vi.mock('../slices/orderApiSlice', () => ({
  useGetVendorAnalyticsQuery: vi.fn(),
}));

import { useGetVendorAnalyticsQuery } from '../slices/orderApiSlice';
import AdvancedAnalytics from '../components/AdvancedAnalytics';

const mockAnalytics = {
  analytics: {
    weeklyTrends: [
      { week: 'W1', sales: 1200, earnings: 1080, orders: 10, delivered: 8 },
      { week: 'W2', sales: 1500, earnings: 1350, orders: 12, delivered: 11 },
      { week: 'W3', sales: 900, earnings: 810, orders: 8, delivered: 7 },
    ],
    comparisons: {
      revenue: { current: 5000, momChange: 12.5, yoyChange: 25, previousYear: 4000 },
      orders: { current: 50, momChange: 8, yoyChange: 15, previousYear: 43 },
      earnings: { current: 4500, momChange: 10.5, yoyChange: 20 },
    },
    topProducts: [
      { id: 'p1', name: 'Top Seller A', qtySold: 100, revenue: 10000, earnings: 9000, image: '/img-a.jpg' },
      { id: 'p2', name: 'Top Seller B', qtySold: 50, revenue: 5000, earnings: 4500, image: null },
    ],
    worstProducts: [
      { id: 'p3', name: 'Slow Mover', numSales: 2, price: 100, countInStock: 15, image: null },
      { id: 'p4', name: 'Dud Product', numSales: 0, price: 200, countInStock: 3, image: null },
    ],
    profitMargins: {
      overall: 28.5,
      byCategory: [
        { category: 'Electronics', margin: 35 },
        { category: 'Tools', margin: 22 },
      ],
    },
    inventoryInsights: {
      totalStock: 450,
      turnoverRate: 3.2,
      lowStockItems: [
        { name: 'Running Low', countInStock: 3, threshold: 10 },
      ],
      outOfStockItems: [
        { name: 'Completely Out', countInStock: 0, threshold: 5 },
      ],
    },
    forecast: {
      nextMonthRevenue: 5500,
      trend: 'up',
      basedOn: '3-month moving average',
    },
  },
};

function mockQuery(overrides = {}) {
  useGetVendorAnalyticsQuery.mockReturnValue({
    data: mockAnalytics,
    isLoading: false,
    error: null,
    ...overrides,
  });
}

describe('AdvancedAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading spinner while fetching', () => {
    mockQuery({ isLoading: true, data: null });
    renderWithProviders(<AdvancedAnalytics />);
    expect(screen.getByTestId('analytics-spinner')).toBeInTheDocument();
  });

  it('shows error state on fetch failure', () => {
    mockQuery({ isLoading: false, data: null, error: { data: { message: 'Server error' } } });
    renderWithProviders(<AdvancedAnalytics />);
    expect(screen.getByText('Failed to load analytics')).toBeInTheDocument();
    expect(screen.getByText('Server error')).toBeInTheDocument();
  });

  it('returns null when analytics data is missing', () => {
    mockQuery({ data: {} });
    const { container } = renderWithProviders(<AdvancedAnalytics />);
    expect(container.innerHTML).toBe('');
  });

  it('renders comparison cards with correct values', () => {
    mockQuery();
    renderWithProviders(<AdvancedAnalytics />);
    expect(screen.getByText('Revenue (this month)')).toBeInTheDocument();
    expect(screen.getByText('Orders (this month)')).toBeInTheDocument();
    expect(screen.getByText('Earnings (this month)')).toBeInTheDocument();
    expect(screen.getAllByText('USD 5,000.00').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getAllByText('USD 4,500.00').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('MoM: +12.5%')).toBeInTheDocument();
    expect(screen.getByText('MoM: +8%')).toBeInTheDocument();
    expect(screen.getByText('MoM: +10.5%')).toBeInTheDocument();
  });

  it('renders weekly trends section', () => {
    mockQuery();
    renderWithProviders(<AdvancedAnalytics />);
    expect(screen.getByText('Weekly Trends (12 weeks)')).toBeInTheDocument();
  });

  it('hides weekly trends when no data', () => {
    mockQuery({ data: { analytics: { ...mockAnalytics.analytics, weeklyTrends: [] } } });
    renderWithProviders(<AdvancedAnalytics />);
    expect(screen.queryByText('Weekly Trends (12 weeks)')).not.toBeInTheDocument();
  });

  it('renders top 10 best sellers list', () => {
    mockQuery();
    renderWithProviders(<AdvancedAnalytics />);
    expect(screen.getByText('Top 10 Best Sellers')).toBeInTheDocument();
    expect(screen.getByText('Top Seller A')).toBeInTheDocument();
    expect(screen.getByText('Top Seller B')).toBeInTheDocument();
    expect(screen.getByText('100 sold')).toBeInTheDocument();
    expect(screen.getByText('50 sold')).toBeInTheDocument();
  });

  it('hides top products section when empty', () => {
    mockQuery({ data: { analytics: { ...mockAnalytics.analytics, topProducts: [] } } });
    renderWithProviders(<AdvancedAnalytics />);
    expect(screen.queryByText('Top 10 Best Sellers')).not.toBeInTheDocument();
  });

  it('renders bottom 10 performers list', () => {
    mockQuery();
    renderWithProviders(<AdvancedAnalytics />);
    expect(screen.getByText('Bottom 10 Performers')).toBeInTheDocument();
    expect(screen.getByText('Slow Mover')).toBeInTheDocument();
    expect(screen.getByText('Dud Product')).toBeInTheDocument();
  });

  it('renders profit margins section', () => {
    mockQuery();
    renderWithProviders(<AdvancedAnalytics />);
    expect(screen.getByText('Profit Margins')).toBeInTheDocument();
    expect(screen.getByText('28.5%')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('35%')).toBeInTheDocument();
  });

  it('renders inventory insights', () => {
    mockQuery();
    renderWithProviders(<AdvancedAnalytics />);
    expect(screen.getByText('Inventory Insights')).toBeInTheDocument();
    expect(screen.getByText('450')).toBeInTheDocument();
    expect(screen.getByText('3.2')).toBeInTheDocument();
    expect(screen.getByText('Running Low')).toBeInTheDocument();
    expect(screen.getByText('Completely Out')).toBeInTheDocument();
  });

  it('renders forecast card', () => {
    mockQuery();
    renderWithProviders(<AdvancedAnalytics />);
    expect(screen.getByText('Revenue Forecast')).toBeInTheDocument();
    expect(screen.getByText('USD 5,500.00')).toBeInTheDocument();
    expect(screen.getByText('UP')).toBeInTheDocument();
  });

  it('displays arrow-down icon for down trend', () => {
    const downData = {
      analytics: {
        ...mockAnalytics.analytics,
        forecast: { nextMonthRevenue: 3000, trend: 'down', basedOn: '3-month moving average' },
      },
    };
    mockQuery({ data: downData });
    renderWithProviders(<AdvancedAnalytics />);
    expect(screen.getByText('DOWN')).toBeInTheDocument();
  });

  it('displays minus icon for stable trend', () => {
    const stableData = {
      analytics: {
        ...mockAnalytics.analytics,
        forecast: { nextMonthRevenue: 4000, trend: 'stable', basedOn: '3-month moving average' },
      },
    };
    mockQuery({ data: stableData });
    renderWithProviders(<AdvancedAnalytics />);
    expect(screen.getByText('STABLE')).toBeInTheDocument();
  });
});
