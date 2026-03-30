import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentBooking: {
    businessId: null,
    date: null,
    time: null,
    customer: {
      name: '',
      email: '',
      phone: '',
    },
  },
  status: 'idle', // 'idle' | 'selecting' | 'confirming' | 'completed'
  error: null,
};

export const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    startBooking: (state, action) => {
      state.currentBooking.businessId = action.payload.businessId;
      state.status = 'selecting';
    },
    selectSlot: (state, action) => {
      state.currentBooking.date = action.payload.date;
      state.currentBooking.time = action.payload.time;
      state.status = 'confirming';
    },
    updateCustomer: (state, action) => {
      state.currentBooking.customer = { ...state.currentBooking.customer, ...action.payload };
    },
    resetBooking: (state) => {
      return initialState;
    },
  },
});

export const { startBooking, selectSlot, updateCustomer, resetBooking } = bookingSlice.actions;
export default bookingSlice.reducer;
