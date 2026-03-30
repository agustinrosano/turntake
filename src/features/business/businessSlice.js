import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  activeBusiness: null,
  loading: false,
  error: null,
};

export const businessSlice = createSlice({
  name: 'business',
  initialState,
  reducers: {
    setActiveBusiness: (state, action) => {
      state.activeBusiness = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setActiveBusiness, setLoading, setError } = businessSlice.actions;
export default businessSlice.reducer;
