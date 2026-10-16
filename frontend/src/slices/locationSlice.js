import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentLocation: localStorage.getItem('currentLocation')
    ? JSON.parse(localStorage.getItem('currentLocation'))
    : null,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setSelectedLocation: (state, action) => {
      state.currentLocation = action.payload;
      localStorage.setItem('currentLocation', JSON.stringify(action.payload));
    },
    clearLocation: (state) => {
      state.currentLocation = null;
      localStorage.removeItem('currentLocation');
    },
  },
});

export const { setSelectedLocation, clearLocation } = locationSlice.actions;
export default locationSlice.reducer;