import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { globalCurrencies } from "../utils/currencies";

const getStoredCurrency = () => {
  try {
    const item = localStorage.getItem("userCurrency");
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error("Error reading currency from storage", error);
    return null;
  }
};

const savedCurrency = getStoredCurrency();

const initialState = {
  countryCode: savedCurrency?.countryCode || "US",
  currencyCode: savedCurrency?.currencyCode || "USD",
  symbol: savedCurrency?.symbol || "$",
  rate: Number(savedCurrency?.rate) || 1,
  shippingFee: Number(savedCurrency?.shippingFee) || 0,
  isLoading: !savedCurrency,
  availableCurrencies: globalCurrencies,
};

const persistCurrency = (state) => {
  const currentStorage = getStoredCurrency() || {};
  localStorage.setItem("userCurrency", JSON.stringify({
    countryCode: state.countryCode,
    currencyCode: state.currencyCode,
    symbol: state.symbol,
    rate: state.rate,
    shippingFee: state.shippingFee,
    allRates: currentStorage.allRates,
  }));
};

export const updateAllRates = createAsyncThunk(
  "currency/updateAllRates",
  async (_, { rejectWithValue }) => {
    try {
      const lastUpdate = localStorage.getItem("lastRatesUpdate");
      const now = new Date().getTime();
      const twelveHours = 12 * 60 * 60 * 1000;

      const stored = getStoredCurrency();
      if (lastUpdate && (now - lastUpdate < twelveHours) && stored?.allRates) {
        return { rates: stored.allRates, fromCache: true };
      }

      const API_KEY = "7fcb6bc90de755fce53b03a5";
      const response = await axios.get(`https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`);

      if (response.data && response.data.conversion_rates) {
        localStorage.setItem("lastRatesUpdate", now.toString());
        return { rates: response.data.conversion_rates, fromCache: false };
      }
      return rejectWithValue("Invalid API response");
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const detectLocationAndCurrency = createAsyncThunk(
  "currency/detect",
  async (_, { rejectWithValue }) => {
    try {
      const stored = getStoredCurrency();
      if (stored) return stored;

      const geoRes = await axios.get("https://ipapi.co/json/");
      const countryCode = geoRes.data.country_code;

      const countryData = globalCurrencies[countryCode] || globalCurrencies["US"];
      const targetCurrencyCode = countryData.code;

      let finalRate = countryData.defaultRate;

      try {
        const API_KEY = "7fcb6bc90de755fce53b03a5";
        const rateRes = await axios.get(`https://v6.exchangerate-api.com/v6/${API_KEY}/latest/USD`);
        if (rateRes.data && rateRes.data.conversion_rates[targetCurrencyCode]) {
          finalRate = rateRes.data.conversion_rates[targetCurrencyCode];
        }
      } catch {
        console.log("Failed to fetch live rate, using default.");
      }

      const result = {
        countryCode,
        currencyCode: targetCurrencyCode,
        symbol: countryData.symbol,
        rate: finalRate,
        shippingFee: countryData.shippingFee || 0,
        allRates: null,
      };

      localStorage.setItem("userCurrency", JSON.stringify(result));
      return result;
    } catch {
      return rejectWithValue({
        countryCode: "US",
        currencyCode: "USD",
        symbol: "$",
        rate: 1,
        shippingFee: 0,
      });
    }
  }
);

// 🌟 3. تعريف الـ Slice الخاص بالعملات
const currencySlice = createSlice({
  name: "currency",
  initialState,
  reducers: {
    setCurrency: (state, action) => {
      const { currencyCode, rate, shippingFee, countryCode, symbol } = action.payload;

      if (currencyCode) state.currencyCode = currencyCode;
      if (rate) state.rate = Number(rate);
      if (shippingFee !== undefined) state.shippingFee = Number(shippingFee);
      if (countryCode) state.countryCode = countryCode;
      if (symbol) state.symbol = symbol;

      persistCurrency(state);
    },
    setManualCurrency: (state, action) => {
      const { currencyCode, symbol, rate, countryCode, shippingFee } = action.payload;

      state.currencyCode = currencyCode;
      state.symbol = symbol;
      state.rate = Number(rate);
      state.countryCode = countryCode;
      state.shippingFee = Number(shippingFee) || 0;

      persistCurrency(state);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(detectLocationAndCurrency.fulfilled, (state, action) => {
        state.isLoading = false;
        state.countryCode = action.payload.countryCode;
        state.currencyCode = action.payload.currencyCode;
        state.symbol = action.payload.symbol;
        state.rate = Number(action.payload.rate);
        state.shippingFee = Number(action.payload.shippingFee);
      })
      .addCase(detectLocationAndCurrency.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(updateAllRates.fulfilled, (state, action) => {
        const liveRates = action.payload.rates;
        Object.keys(state.availableCurrencies).forEach((key) => {
          const code = state.availableCurrencies[key].code;
          if (liveRates[code]) {
            state.availableCurrencies[key].defaultRate = liveRates[code];
          }
        });

        if (liveRates[state.currencyCode]) {
          state.rate = liveRates[state.currencyCode];
        }

        const currentData = getStoredCurrency() || {};
        if (currentData.currencyCode) {
          localStorage.setItem("userCurrency", JSON.stringify({
            ...currentData,
            rate: state.rate,
            allRates: liveRates,
          }));
        }
      });
  },
});

export const { setManualCurrency, setCurrency } = currencySlice.actions;
export default currencySlice.reducer;