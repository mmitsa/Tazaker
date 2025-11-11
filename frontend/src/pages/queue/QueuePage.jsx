import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@store/slices/authSlice';
import ticketService from '@services/ticketService';
import doctorService from '@services/doctorService';
import socketService from '@services/socketService';
import Card from '@components/common/Card';
import Button from '@components/common/Button';
import Loading from '@components/common/Loading';
import StatusBadge from '@components/common/StatusBadge';
import {
  MdCallEnd,
  MdCheckCircle,
  MdCancel,
  MdPersonOff,
  MdRefresh,
  MdTimer,
} from 'react-icons/md';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function QueuePage() {
  const { t } = useTranslation();
  const user = useSelector(selectCurrentUser);
  const [currentServing, setCurrentServing] = useState(null);
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDoctorProfile();
  }, []);

  useEffect(() => {
    if (doctorProfile?.clinic_id) {
      fetchQueue();
      // Subscribe to clinic updates
      socketService.subscribeToClinic(doctorProfile.clinic_id);
    }

    return () => {
      if (doctorProfile?.clinic_id) {
        socketService.unsubscribeFromClinic(doctorProfile.clinic_id);
      }
    };
  }, [doctorProfile]);

  const fetchDoctorProfile = async () => {
    try {
      const response = await doctorService.getDoctorProfile();
      setDoctorProfile(response.data.data);
    } catch (error) {
      toast.error('فشل في تحميل بيانات الطبيب');
      console.error('Error fetching doctor profile:', error);
    }
  };

  const fetchQueue = async () => {
    if (!doctorProfile?.clinic_id) return;

    try {
      setLoading(true);
      const response = await ticketService.getClinicQueue(doctorProfile.clinic_id, 'waiting');
      setWaitingQueue(response.data.data || []);

      // Get currently serving ticket
      const servingResponse = await ticketService.getClinicQueue(
        doctorProfile.clinic_id,
        'serving'
      );
      if (servingResponse.data.data && servingResponse.data.data.length > 0) {
        setCurrentServing(servingResponse.data.data[0]);
      }
    } catch (error) {
      toast.error('فشل في تحميل قائمة الانتظار');
      console.error('Error fetching queue:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCallNext = async () => {
    if (!doctorProfile?.clinic_id) return;

    try {
      setActionLoading(true);
      const response = await ticketService.callNextPatient(doctorProfile.clinic_id);
      const ticket = response.data.data;

      setCurrentServing(ticket);
      setWaitingQueue((prev) => prev.filter((t) => t.ticket_id !== ticket.ticket_id));

      toast.success(`تم نداء المريض: ${ticket.patient_name}\nتذكرة: ${ticket.ticket_number}`);
    } catch (error) {
      toast.error(error.message || 'فشل في نداء المريض');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartServing = async () => {
    if (!currentServing) return;

    try {
      setActionLoading(true);
      await ticketService.startServing(currentServing.ticket_id);
      setCurrentServing((prev) => ({ ...prev, status: 'serving' }));
      toast.success('بدأت الخدمة');
    } catch (error) {
      toast.error('فشل في بدء الخدمة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!currentServing) return;

    try {
      setActionLoading(true);
      await ticketService.completeTicket(currentServing.ticket_id, {});
      toast.success('تم إنهاء الخدمة بنجاح');
      setCurrentServing(null);
      fetchQueue(); // Refresh queue
    } catch (error) {
      toast.error('فشل في إنهاء الخدمة');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNoShow = async () => {
    if (!currentServing) return;

    if (!window.confirm('هل أنت متأكد من تعليم المريض كغائب؟')) {
      return;
    }

    try {
      setActionLoading(true);
      await ticketService.markNoShow(currentServing.ticket_id);
      toast.success('تم تعليم المريض كغائب');
      setCurrentServing(null);
      fetchQueue();
    } catch (error) {
      toast.error('فشل في تعليم المريض كغائب');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!currentServing) return;

    const reason = window.prompt('سبب الإلغاء (اختياري):');
    if (reason === null) return; // User clicked cancel

    try {
      setActionLoading(true);
      await ticketService.cancelTicket(currentServing.ticket_id, { notes: reason });
      toast.success('تم إلغاء التذكرة');
      setCurrentServing(null);
      fetchQueue();
    } catch (error) {
      toast.error('فشل في إلغاء التذكرة');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('queue.title')}</h1>
          <p className="text-gray-600 mt-1">
            {doctorProfile?.clinic_name_ar} - د. {doctorProfile?.full_name}
          </p>
        </div>
        <Button onClick={fetchQueue} variant="outline">
          <MdRefresh className="w-5 h-5" />
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">في الانتظار</p>
            <p className="text-3xl font-bold text-warning-600">{waitingQueue.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">يتم خدمته حالياً</p>
            <p className="text-3xl font-bold text-success-600">{currentServing ? 1 : 0}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">حالة الطبيب</p>
            <StatusBadge status={doctorProfile?.current_status || 'offline'} />
          </div>
        </Card>
      </div>

      {/* Current Patient */}
      <Card title={t('queue.currentServing')}>
        {currentServing ? (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">رقم التذكرة</p>
                  <p className="text-3xl font-bold text-primary-700 font-mono">
                    {currentServing.ticket_number}
                  </p>
                </div>
                <StatusBadge status={currentServing.status} />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">اسم المريض</p>
                  <p className="font-semibold text-gray-900">{currentServing.patient_name}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">رقم الهاتف</p>
                  <p className="font-semibold text-gray-900">{currentServing.patient_phone}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">وقت الإصدار</p>
                  <p className="font-semibold text-gray-900">
                    {format(new Date(currentServing.issued_at), 'HH:mm')}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">الأولوية</p>
                  <p className="font-semibold text-gray-900">
                    {currentServing.priority === 0
                      ? 'عادية'
                      : currentServing.priority === 1
                      ? 'متوسطة'
                      : 'عالية'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {currentServing.status === 'called' && (
                <Button
                  onClick={handleStartServing}
                  variant="primary"
                  disabled={actionLoading}
                  loading={actionLoading}
                >
                  <MdTimer className="w-5 h-5 ml-2" />
                  {t('ticket.startServing')}
                </Button>
              )}

              {currentServing.status === 'serving' && (
                <Button
                  onClick={handleComplete}
                  variant="success"
                  disabled={actionLoading}
                  loading={actionLoading}
                >
                  <MdCheckCircle className="w-5 h-5 ml-2" />
                  {t('ticket.completeService')}
                </Button>
              )}

              <Button onClick={handleNoShow} variant="outline" disabled={actionLoading}>
                <MdPersonOff className="w-5 h-5 ml-2" />
                {t('ticket.markNoShow')}
              </Button>

              <Button onClick={handleCancel} variant="danger" disabled={actionLoading}>
                <MdCancel className="w-5 h-5 ml-2" />
                {t('ticket.cancelTicket')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">لا يوجد مريض يتم خدمته حالياً</p>
            {waitingQueue.length > 0 && (
              <Button
                onClick={handleCallNext}
                variant="primary"
                size="lg"
                disabled={actionLoading}
                loading={actionLoading}
              >
                <MdCallEnd className="w-5 h-5 ml-2" />
                {t('queue.callNextPatient')}
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Waiting Queue */}
      <Card title={t('queue.waitingInQueue')}>
        {waitingQueue.length === 0 ? (
          <div className="text-center py-8 text-gray-500">{t('queue.queueEmpty')}</div>
        ) : (
          <div className="space-y-2">
            {waitingQueue.map((ticket, index) => (
              <div
                key={ticket.ticket_id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-primary-100 text-primary-700 rounded-full font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-mono font-semibold text-primary-600">
                      {ticket.ticket_number}
                    </p>
                    <p className="text-sm text-gray-900">{ticket.patient_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {ticket.priority > 0 && (
                    <span className="badge badge-warning">أولوية {ticket.priority}</span>
                  )}
                  <span className="text-sm text-gray-600">
                    {format(new Date(ticket.issued_at), 'HH:mm')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
