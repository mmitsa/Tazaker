import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  clinics: [],
  currentClinic: null,
  isLoading: false,
  error: null,
};

const clinicSlice = createSlice({
  name: 'clinics',
  initialState,
  reducers: {
    setClinics: (state, action) => {
      state.clinics = action.payload;
    },
    setCurrentClinic: (state, action) => {
      state.currentClinic = action.payload;
    },
    updateClinic: (state, action) => {
      const index = state.clinics.findIndex((c) => c.clinic_id === action.payload.clinic_id);
      if (index !== -1) {
        state.clinics[index] = action.payload;
      }
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setClinics, setCurrentClinic, updateClinic, setLoading, setError } = clinicSlice.actions;

export default clinicSlice.reducer;
