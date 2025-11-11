import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentServing: null,
  waitingQueue: [],
  waitingCount: 0,
  clinicId: null,
  isLoading: false,
  error: null,
};

const queueSlice = createSlice({
  name: 'queue',
  initialState,
  reducers: {
    setCurrentServing: (state, action) => {
      state.currentServing = action.payload;
    },
    setWaitingQueue: (state, action) => {
      state.waitingQueue = action.payload;
      state.waitingCount = action.payload.length;
    },
    setClinicId: (state, action) => {
      state.clinicId = action.payload;
    },
    updateQueuePosition: (state, action) => {
      const { ticket_id, queue_position } = action.payload;
      const index = state.waitingQueue.findIndex((t) => t.ticket_id === ticket_id);
      if (index !== -1) {
        state.waitingQueue[index].queue_position = queue_position;
      }
    },
    updateTicketStatus: (state, action) => {
      const { ticket_id, status } = action.payload;

      // Remove from waiting queue if status changed
      if (status !== 'waiting') {
        state.waitingQueue = state.waitingQueue.filter((t) => t.ticket_id !== ticket_id);
        state.waitingCount = state.waitingQueue.length;
      }

      // Update current serving if status is serving or called
      if (status === 'serving' || status === 'called') {
        const ticket = state.waitingQueue.find((t) => t.ticket_id === ticket_id);
        if (ticket) {
          state.currentServing = { ...ticket, status };
        }
      }

      // Clear current serving if completed
      if (status === 'completed' || status === 'cancelled' || status === 'no_show') {
        if (state.currentServing?.ticket_id === ticket_id) {
          state.currentServing = null;
        }
      }
    },
    addToQueue: (state, action) => {
      state.waitingQueue.push(action.payload);
      state.waitingCount = state.waitingQueue.length;
    },
    removeFromQueue: (state, action) => {
      state.waitingQueue = state.waitingQueue.filter((t) => t.ticket_id !== action.payload);
      state.waitingCount = state.waitingQueue.length;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearQueue: (state) => {
      state.currentServing = null;
      state.waitingQueue = [];
      state.waitingCount = 0;
      state.error = null;
    },
  },
});

export const {
  setCurrentServing,
  setWaitingQueue,
  setClinicId,
  updateQueuePosition,
  updateTicketStatus,
  addToQueue,
  removeFromQueue,
  setLoading,
  setError,
  clearQueue,
} = queueSlice.actions;

export default queueSlice.reducer;
