import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@store/slices/authSlice';
import reportService from '@services/reportService';
import Card from '@components/common/Card';
import Loading from '@components/common/Loading';
import {
  MdConfirmationNumber,
  MdCheckCircle,
  MdHourglassEmpty,
  MdCancel,
  MdLocalHospital,
  MdPerson,
  MdPeople,
  MdTimer,
} from 'react-icons/md';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { t } = useTranslation();
  const user = useSelector(selectCurrentUser);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const response = await reportService.getSystemOverview();
      setOverview(response.data.data);
    } catch (error) {
      toast.error('فشل في تحميل البيانات');
      console.error('Error fetching overview:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading fullScreen text="جاري تحميل البيانات..." />;
  }

  const StatCard = ({ icon: Icon, label, value, color, subtext }) => (
    <Card hover className="relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </div>
        <div className={`w-16 h-16 rounded-full bg-${color}-100 flex items-center justify-center`}>
          <Icon className={`w-8 h-8 text-${color}-600`} />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-2">
          {t('common.welcome')}, {user?.full_name || user?.username}!
        </h1>
        <p className="text-primary-100">{t('dashboard.overview')}</p>
      </div>

      {/* Today's Statistics */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('dashboard.todayStatistics')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={MdConfirmationNumber}
            label={t('dashboard.totalTickets')}
            value={overview?.today?.total_tickets || 0}
            color="primary"
          />
          <StatCard
            icon={MdCheckCircle}
            label={t('dashboard.completedTickets')}
            value={overview?.today?.completed_today || 0}
            color="success"
          />
          <StatCard
            icon={MdHourglassEmpty}
            label={t('dashboard.waitingTickets')}
            value={overview?.today?.currently_waiting || 0}
            color="warning"
          />
          <StatCard
            icon={MdTimer}
            label={t('dashboard.averageWaitTime')}
            value={`${overview?.today?.avg_wait_time || 0} ${t('ticket.estimatedTime')}`}
            color="secondary"
            subtext="دقيقة"
          />
        </div>
      </div>

      {/* System Statistics */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">إحصائيات النظام</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={MdPeople}
            label={t('dashboard.totalPatients')}
            value={overview?.system?.total_patients || 0}
            color="primary"
          />
          <StatCard
            icon={MdLocalHospital}
            label={t('dashboard.activeClinics')}
            value={overview?.system?.total_clinics || 0}
            color="success"
          />
          <StatCard
            icon={MdPerson}
            label={t('dashboard.onlineDoctors')}
            value={overview?.system?.active_doctors || 0}
            color="warning"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <Card title={t('dashboard.recentActivity')}>
        <div className="text-center py-8 text-gray-500">
          <p>سيتم عرض النشاط الأخير هنا</p>
        </div>
      </Card>

      {/* Quick Actions based on role */}
      {(user?.role === 'receptionist' || user?.role === 'admin' || user?.role === 'super_admin') && (
        <Card title="إجراءات سريعة">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="btn btn-primary p-4 text-left">
              <MdConfirmationNumber className="w-6 h-6 mb-2" />
              <p className="font-semibold">إصدار تذكرة جديدة</p>
            </button>
            <button className="btn btn-outline p-4 text-left">
              <MdPeople className="w-6 h-6 mb-2" />
              <p className="font-semibold">تسجيل مريض جديد</p>
            </button>
            <button className="btn btn-outline p-4 text-left">
              <MdLocalHospital className="w-6 h-6 mb-2" />
              <p className="font-semibold">عرض العيادات</p>
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
