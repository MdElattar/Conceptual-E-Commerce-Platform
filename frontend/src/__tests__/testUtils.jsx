import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import currencyReducer from '../slices/currencySlice.js';

const defaultCurrencyState = {
  countryCode: 'US',
  currencyCode: 'USD',
  symbol: '$',
  rate: 1,
  shippingFee: 0,
  isLoading: false,
  availableCurrencies: {},
};

export function renderWithProviders(ui, { preloadedState, route } = {}) {
  const store = configureStore({
    reducer: { currency: currencyReducer },
    preloadedState: {
      currency: defaultCurrencyState,
      ...preloadedState,
    },
  });

  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={route ? [route] : undefined}>
          {children}
        </MemoryRouter>
      </Provider>
    );
  }

  return { ...render(ui, { wrapper: Wrapper }), store };
}
