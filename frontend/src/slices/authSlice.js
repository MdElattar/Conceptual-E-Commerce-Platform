import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userInfo: localStorage.getItem("userInfo")
    ? JSON.parse(localStorage.getItem("userInfo"))
    : null,
  // العناوين المفترض تيجي من الـ API لكن بنخلي الـ localStorage كـ backup سريع
  addresses: localStorage.getItem("addresses")
    ? JSON.parse(localStorage.getItem("addresses"))
    : [],
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.userInfo = action.payload;
      localStorage.setItem("userInfo", JSON.stringify(action.payload));
    },
    logout: (state) => {
      state.userInfo = null;
      state.addresses = [];
      localStorage.removeItem("userInfo");
      localStorage.removeItem("addresses");
    },
    // تحديث قائمة العناوين بالكامل في الـ Store
    setAddresses: (state, action) => {
      state.addresses = action.payload;
      localStorage.setItem("addresses", JSON.stringify(action.payload));
    },
    addAddress: (state, action) => {
      state.addresses.push(action.payload);
      localStorage.setItem("addresses", JSON.stringify(state.addresses));
    },
    updateAddress: (state, action) => {
      const index = state.addresses.findIndex((addr) => addr._id === action.payload._id);
      if (index !== -1) {
        state.addresses[index] = action.payload;
        localStorage.setItem("addresses", JSON.stringify(state.addresses));
      }
    },
    setDefaultAddress: (state, action) => {
      state.addresses = state.addresses.map((addr) => ({
        ...addr,
        isDefault: addr._id === action.payload,
      }));
      localStorage.setItem("addresses", JSON.stringify(state.addresses));
    },
    deleteAddress: (state, action) => {
      state.addresses = state.addresses.filter((addr) => addr._id !== action.payload);
      localStorage.setItem("addresses", JSON.stringify(state.addresses));
    },
  },
});

export const {
  setCredentials,
  logout,
  setAddresses,
  addAddress,
  deleteAddress,
  updateAddress,
  setDefaultAddress,
} = authSlice.actions;

export default authSlice.reducer;