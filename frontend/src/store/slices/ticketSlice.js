import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  tickets: [],
  currentTicket: null,
  isLoading: false,
  error: null,
};

const ticketSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    setTickets: (state, action) => {
      state.tickets = action.payload;
    },
    setCurrentTicket: (state, action) => {
      state.currentTicket = action.payload;
    },
    addTicket: (state, action) => {
      state.tickets.unshift(action.payload);
    },
    updateTicket: (state, action) => {
      const index = state.tickets.findIndex((t) => t.ticket_id === action.payload.ticket_id);
      if (index !== -1) {
        state.tickets[index] = action.payload;
      }
    },
    removeTicket: (state, action) => {
      state.tickets = state.tickets.filter((t) => t.ticket_id !== action.payload);
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setTickets, setCurrentTicket, addTicket, updateTicket, removeTicket, setLoading, setError } =
  ticketSlice.actions;

export default ticketSlice.reducer;
