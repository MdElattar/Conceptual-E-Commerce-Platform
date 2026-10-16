import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from './testUtils';

const mockProducts = [
  { _id: 'p1', name: 'Bought Product 1', price: 50, image: '/img1.jpg', rating: 4 },
  { _id: 'p2', name: 'Bought Product 2', price: 75, image: '/img2.jpg', rating: 3.5 },
  { _id: 'p3', name: 'Bought Product 3', price: 120, image: '/img3.jpg', rating: 5 },
];

let mockReturnValue = { data: mockProducts, isLoading: false, error: null };
let mockSkip = false;

vi.mock('../slices/productsApiSlice', () => ({
  useGetRecommendationsQuery: (args, opts) => {
    if (opts?.skip || mockSkip) {
      return { data: undefined, isLoading: false, error: null };
    }
    return mockReturnValue;
  },
}));

import { BoughtTogetherSection } from '../pages/ProductDetails';

function mockQuery(overrides = {}) {
  mockReturnValue = { data: mockProducts, isLoading: false, error: null, ...overrides };
}

describe('BoughtTogetherSection', () => {
  beforeEach(() => {
    mockReturnValue = { data: mockProducts, isLoading: false, error: null };
    mockSkip = false;
  });

  it('renders section title when products are returned', () => {
    mockQuery();
    renderWithProviders(<BoughtTogetherSection productId="test123" />);

    expect(screen.getByText('Customers Who Bought This Also Bought')).toBeTruthy();
  });

  it('renders product names from recommendation data', () => {
    mockQuery();
    renderWithProviders(<BoughtTogetherSection productId="test123" />);

    expect(screen.getByText('Bought Product 1')).toBeTruthy();
    expect(screen.getByText('Bought Product 2')).toBeTruthy();
    expect(screen.getByText('Bought Product 3')).toBeTruthy();
  });

  it('renders product prices', () => {
    mockQuery();
    renderWithProviders(<BoughtTogetherSection productId="test123" />);

    expect(screen.getByText('USD 50.00')).toBeTruthy();
    expect(screen.getByText('USD 75.00')).toBeTruthy();
    expect(screen.getByText('USD 120.00')).toBeTruthy();
  });

  it('does not render when data is empty', () => {
    mockQuery({ data: [] });
    renderWithProviders(<BoughtTogetherSection productId="test123" />);

    expect(screen.queryByText('Customers Who Bought This Also Bought')).toBeNull();
  });

  it('does not render while loading', () => {
    mockQuery({ isLoading: true, data: undefined });
    renderWithProviders(<BoughtTogetherSection productId="test123" />);

    expect(screen.queryByText('Customers Who Bought This Also Bought')).toBeNull();
  });

  it('does not render when productId is not provided', () => {
    mockQuery();
    renderWithProviders(<BoughtTogetherSection productId={null} />);

    expect(screen.queryByText('Customers Who Bought This Also Bought')).toBeNull();
  });

  it('each product links to the correct product page', () => {
    mockQuery();
    renderWithProviders(<BoughtTogetherSection productId="test123" />);

    const links = screen.getAllByRole('link');
    expect(links.length).toBe(3);
    expect(links[0].getAttribute('href')).toBe('/product/p1');
    expect(links[1].getAttribute('href')).toBe('/product/p2');
    expect(links[2].getAttribute('href')).toBe('/product/p3');
  });
});
