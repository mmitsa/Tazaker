import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import ticketReducer from './slices/ticketSlice';
import clinicReducer from './slices/clinicSlice';
import patientReducer from './slices/patientSlice';
import doctorReducer from './slices/doctorSlice';
import queueReducer from './slices/queueSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    tickets: ticketReducer,
    clinics: clinicReducer,
    patients: patientReducer,
    doctors: doctorReducer,
    queue: queueReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
