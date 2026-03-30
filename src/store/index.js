import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import businessReducer from '../features/business/businessSlice';
import bookingReducer from '../features/booking/bookingSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    business: businessReducer,
    booking: bookingReducer,
  },
});
