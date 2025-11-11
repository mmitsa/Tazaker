import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ticketService from '@services/ticketService';
import clinicService from '@services/clinicService';
import socketService from '@services/socketService';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function DisplayPage() {
  const { clinicId } = useParams();
  const { t, i18n } = useTranslation();
  const [currentServing, setCurrentServing] = useState(null);
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [clinic, setClinic] = useState(null);
  const [lastCalled, setLastCalled] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clinicId) {
      fetchClinicDetails();
      fetchDisplayData();

      // Connect to WebSocket (no authentication needed for display)
      socketService.connect(null);
      socketService.subscribeToDisplay();
      socketService.subscribeToClinic(parseInt(clinicId));

      // Setup WebSocket listeners for this display
      const socket = socketService.getSocket();
      if (socket) {
        socket.on('patient:called', (data) => {
          if (data.clinic_id === parseInt(clinicId)) {
            handlePatientCalled(data);
          }
        });

        socket.on('ticket:status_changed', (data) => {
          if (data.clinic_id === parseInt(clinicId)) {
            handleTicketStatusChanged(data);
          }
        });

        socket.on('queue:updated', (data) => {
          if (data.clinic_id === parseInt(clinicId)) {
            fetchDisplayData();
          }
        });
      }

      // Refresh data every 30 seconds as fallback
      const interval = setInterval(fetchDisplayData, 30000);

      return () => {
        clearInterval(interval);
        socketService.disconnect();
      };
    }
  }, [clinicId]);

  const fetchClinicDetails = async () => {
    try {
      const response = await clinicService.getClinicById(clinicId);
      setClinic(response.data.data);
    } catch (error) {
      console.error('Error fetching clinic details:', error);
    }
  };

  const fetchDisplayData = async () => {
    try {
      setLoading(true);

      // Get currently serving ticket
      const servingResponse = await ticketService.getClinicQueue(clinicId, 'serving');
      if (servingResponse.data.data && servingResponse.data.data.length > 0) {
        setCurrentServing(servingResponse.data.data[0]);
      } else {
        // If no serving, check for called tickets
        const calledResponse = await ticketService.getClinicQueue(clinicId, 'called');
        if (calledResponse.data.data && calledResponse.data.data.length > 0) {
          setCurrentServing(calledResponse.data.data[0]);
        } else {
          setCurrentServing(null);
        }
      }

      // Get waiting queue
      const waitingResponse = await ticketService.getClinicQueue(clinicId, 'waiting');
      setWaitingQueue(waitingResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching display data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientCalled = (data) => {
    // Add to last called list (keep last 3)
    setLastCalled((prev) => [data, ...prev].slice(0, 3));

    // Set as current serving
    setCurrentServing(data);

    // Play sound notification
    playNotificationSound();

    // Remove from waiting queue
    setWaitingQueue((prev) => prev.filter((t) => t.ticket_id !== data.ticket_id));
  };

  const handleTicketStatusChanged = (data) => {
    if (data.status === 'completed' || data.status === 'cancelled' || data.status === 'no_show') {
      if (currentServing?.ticket_id === data.ticket_id) {
        setCurrentServing(null);
      }
    }
  };

  const playNotificationSound = () => {
    // Create a simple beep sound
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  if (loading && !clinic) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className="text-6xl">🏥</span>
          <div>
            <h1 className="text-5xl font-bold mb-2">
              {i18n.language === 'ar' ? clinic?.clinic_name_ar : clinic?.clinic_name_en}
            </h1>
            <p className="text-xl text-primary-200">{clinic?.department}</p>
          </div>
        </div>
        <div className="text-lg text-primary-200">
          {format(new Date(), 'EEEE, MMMM d, yyyy - HH:mm')}
        </div>
      </div>

      {/* Current Serving - Large Display */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-center mb-6">{t('display.nowServing')}</h2>
        <AnimatePresence mode="wait">
          {currentServing ? (
            <motion.div
              key={currentServing.ticket_id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white text-gray-900 rounded-3xl p-12 shadow-2xl max-w-4xl mx-auto"
            >
              <div className="text-center">
                <p className="text-2xl text-gray-600 mb-4">{t('ticket.ticketNumber')}</p>
                <motion.p
                  className="text-9xl font-bold text-primary-600 mb-8 font-mono"
                  animate={{
                    scale: [1, 1.05, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: 'reverse',
                  }}
                >
                  {currentServing.ticket_number}
                </motion.p>
                <div className="text-2xl text-gray-700">
                  <p className="mb-2">{currentServing.patient_name}</p>
                  <p className="text-success-600 font-semibold">{t('display.proceedToClinic')}</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <p className="text-4xl text-primary-200">{t('display.pleaseWait')}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Waiting Queue */}
      <div className="max-w-6xl mx-auto">
        <h3 className="text-2xl font-bold text-center mb-6">{t('queue.waitingInQueue')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {waitingQueue.slice(0, 9).map((ticket, index) => (
            <motion.div
              key={ticket.ticket_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-primary-200 mb-1">#{index + 1}</p>
                  <p className="text-2xl font-bold font-mono">{ticket.ticket_number}</p>
                  <p className="text-sm text-primary-200 mt-1 truncate">
                    {ticket.patient_name}
                  </p>
                </div>
                {ticket.priority > 0 && (
                  <div className="bg-warning-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    أولوية
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {waitingQueue.length === 0 && (
          <div className="text-center text-2xl text-primary-200 py-12">
            {t('queue.queueEmpty')}
          </div>
        )}
      </div>

      {/* Recently Called (Bottom Ticker) */}
      {lastCalled.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 bg-opacity-90 backdrop-blur-sm border-t border-white border-opacity-20 p-4">
          <div className="max-w-6xl mx-auto">
            <p className="text-sm text-primary-200 mb-2">آخر المناداة:</p>
            <div className="flex gap-6">
              {lastCalled.map((ticket, index) => (
                <motion.div
                  key={ticket.ticket_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-xl font-mono font-bold">{ticket.ticket_number}</span>
                  <span className="text-sm text-primary-200">{ticket.patient_name}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer - System Info */}
      <div className="fixed bottom-4 right-4 text-sm text-primary-300 bg-gray-900 bg-opacity-50 backdrop-blur-sm px-4 py-2 rounded-lg">
        <p>تذاكر - Hospital Queue Management System</p>
        <p className="text-xs">عدد المنتظرين: {waitingQueue.length}</p>
      </div>
    </div>
  );
}
