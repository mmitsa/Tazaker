import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  doctors: [],
  currentDoctor: null,
  isLoading: false,
  error: null,
};

const doctorSlice = createSlice({
  name: 'doctors',
  initialState,
  reducers: {
    setDoctors: (state, action) => {
      state.doctors = action.payload;
    },
    setCurrentDoctor: (state, action) => {
      state.currentDoctor = action.payload;
    },
    updateDoctorStatus: (state, action) => {
      const { doctor_id, current_status, is_available } = action.payload;
      const index = state.doctors.findIndex((d) => d.doctor_id === doctor_id);
      if (index !== -1) {
        state.doctors[index].current_status = current_status;
        state.doctors[index].is_available = is_available;
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

export const { setDoctors, setCurrentDoctor, updateDoctorStatus, setLoading, setError } = doctorSlice.actions;

export default doctorSlice.reducer;
