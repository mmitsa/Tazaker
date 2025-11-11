import { io } from 'socket.io-client';
import store from '@store';
import { addTicket, updateTicket } from '@store/slices/ticketSlice';
import { updateQueuePosition, updateTicketStatus, setCurrentServing } from '@store/slices/queueSlice';
import { updateDoctorStatus } from '@store/slices/doctorSlice';
import { updateClinic } from '@store/slices/clinicSlice';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  /**
   * Connect to WebSocket server
   */
  connect(token) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected');
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.connected = false;
    });

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Subscribe to clinic updates
   */
  subscribeToClinic(clinicId) {
    if (this.socket) {
      this.socket.emit('subscribe:clinic', clinicId);
      console.log(`📡 Subscribed to clinic: ${clinicId}`);
    }
  }

  /**
   * Unsubscribe from clinic updates
   */
  unsubscribeFromClinic(clinicId) {
    if (this.socket) {
      this.socket.emit('unsubscribe:clinic', clinicId);
      console.log(`🚫 Unsubscribed from clinic: ${clinicId}`);
    }
  }

  /**
   * Subscribe to display updates (for display screens)
   */
  subscribeToDisplay() {
    if (this.socket) {
      this.socket.emit('subscribe:display');
      console.log('📺 Subscribed to display updates');
    }
  }

  /**
   * Setup event listeners for real-time updates
   */
  setupEventListeners() {
    if (!this.socket) return;

    // Ticket created
    this.socket.on('ticket:created', (data) => {
      console.log('🎫 New ticket created:', data);
      store.dispatch(addTicket(data));
    });

    // Patient called
    this.socket.on('patient:called', (data) => {
      console.log('📢 Patient called:', data);
      store.dispatch(setCurrentServing(data));
      store.dispatch(
        updateTicket({
          ticket_id: data.ticket_id,
          status: 'called',
          called_at: data.called_at,
        })
      );
    });

    // Service completed
    this.socket.on('service:completed', (data) => {
      console.log('✅ Service completed:', data);
      store.dispatch(
        updateTicket({
          ticket_id: data.ticket_id,
          status: 'completed',
          completed_at: data.completed_at,
        })
      );
    });

    // Ticket status changed
    this.socket.on('ticket:status_changed', (data) => {
      console.log('🔄 Ticket status changed:', data);
      store.dispatch(updateTicketStatus(data));
    });

    // Queue updated
    this.socket.on('queue:updated', (data) => {
      console.log('📊 Queue updated:', data);
      // Can be used to update queue counts or positions
    });

    // Doctor status changed
    this.socket.on('doctor:status_changed', (data) => {
      console.log('👨‍⚕️ Doctor status changed:', data);
      store.dispatch(updateDoctorStatus(data));
    });

    // Clinic status changed
    this.socket.on('clinic:status_changed', (data) => {
      console.log('🏥 Clinic status changed:', data);
      store.dispatch(updateClinic(data));
    });

    // Display refresh (for manual refresh)
    this.socket.on('display:refresh', (data) => {
      console.log('🔄 Display refresh requested:', data);
      // Trigger a full data refresh
      window.location.reload();
    });
  }

  /**
   * Check if socket is connected
   */
  isConnected() {
    return this.connected && this.socket?.connected;
  }

  /**
   * Get socket instance
   */
  getSocket() {
    return this.socket;
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;
