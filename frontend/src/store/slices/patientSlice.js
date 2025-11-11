import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  patients: [],
  currentPatient: null,
  isLoading: false,
  error: null,
};

const patientSlice = createSlice({
  name: 'patients',
  initialState,
  reducers: {
    setPatients: (state, action) => {
      state.patients = action.payload;
    },
    setCurrentPatient: (state, action) => {
      state.currentPatient = action.payload;
    },
    addPatient: (state, action) => {
      state.patients.unshift(action.payload);
    },
    updatePatient: (state, action) => {
      const index = state.patients.findIndex((p) => p.patient_id === action.payload.patient_id);
      if (index !== -1) {
        state.patients[index] = action.payload;
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

export const { setPatients, setCurrentPatient, addPatient, updatePatient, setLoading, setError } =
  patientSlice.actions;

export default patientSlice.reducer;
