import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import { apiSlice } from './slices/apiSlice.js';
import currencyReducer from './slices/currencySlice.js';
import locationReducer from './slices/locationSlice.js';

const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
    currency: currencyReducer,
    location: locationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
  devTools: true,
});

export default store;