import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import reportService from '@services/reportService';
import Card from '@components/common/Card';
import Button from '@components/common/Button';
import Loading from '@components/common/Loading';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MdRefresh, MdDownload, MdDateRange } from 'react-icons/md';
import { format, subDays } from 'date-fns';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState(null);
  const [clinicPerformance, setClinicPerformance] = useState([]);
  const [doctorPerformance, setDoctorPerformance] = useState([]);
  const [waitTimeAnalytics, setWaitTimeAnalytics] = useState([]);
  const [smsStats, setSmsStats] = useState([]);
  const [dateRange, setDateRange] = useState({
    start_date: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    fetchAllReports();
  }, [dateRange]);

  const fetchAllReports = async () => {
    try {
      setLoading(true);

      // Fetch all reports in parallel
      const [daily, clinics, doctors, waitTime, sms] = await Promise.all([
        reportService.getDailyStatistics(format(new Date(), 'yyyy-MM-dd')),
        reportService.getClinicPerformance(dateRange),
        reportService.getDoctorPerformance(dateRange),
        reportService.getWaitTimeAnalytics(dateRange),
        reportService.getSMSStatistics(dateRange),
      ]);

      setDailyStats(daily.data.data.statistics);
      setClinicPerformance(clinics.data.data.clinics || []);
      setDoctorPerformance(doctors.data.data.doctors || []);
      setWaitTimeAnalytics(waitTime.data.data.analytics || []);
      setSmsStats(sms.data.data.statistics || []);
    } catch (error) {
      toast.error('فشل في تحميل التقارير');
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    toast.success('جاري تصدير التقرير...');
    // TODO: Implement export functionality
  };

  const COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return <Loading fullScreen />;
  }

  // Prepare chart data
  const ticketStatusData = dailyStats ? [
    { name: 'مكتمل', value: parseInt(dailyStats.completed_tickets), color: '#22c55e' },
    { name: 'ملغي', value: parseInt(dailyStats.cancelled_tickets), color: '#ef4444' },
    { name: 'غائب', value: parseInt(dailyStats.no_show_tickets), color: '#8b5cf6' },
    { name: 'في الانتظار', value: parseInt(dailyStats.waiting_tickets), color: '#f59e0b' },
  ] : [];

  const clinicChartData = clinicPerformance.map(clinic => ({
    name: clinic.clinic_name_ar,
    'إجمالي التذاكر': clinic.total_tickets,
    'المكتملة': clinic.completed_tickets,
    'الملغاة': clinic.cancelled_tickets,
  }));

  const doctorChartData = doctorPerformance.slice(0, 10).map(doctor => ({
    name: doctor.full_name,
    'المرضى': doctor.total_patients,
    'متوسط الوقت': parseFloat(doctor.avg_service_time),
  }));

  const waitTimeChartData = waitTimeAnalytics.map(item => ({
    date: format(new Date(item.date), 'MM/dd'),
    'متوسط الانتظار': parseFloat(item.avg_wait_time),
    'الحد الأدنى': parseFloat(item.min_wait_time),
    'الحد الأقصى': parseFloat(item.max_wait_time),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('report.title')}</h1>
          <p className="text-gray-600 mt-1">التقارير والتحليلات الشاملة</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={fetchAllReports} variant="outline">
            <MdRefresh className="w-5 h-5" />
          </Button>
          <Button onClick={handleExport} variant="primary">
            <MdDownload className="w-5 h-5 ml-2" />
            تصدير
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <Card>
        <div className="flex items-center gap-4">
          <MdDateRange className="w-6 h-6 text-gray-400" />
          <div className="flex items-center gap-4 flex-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">من</label>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">إلى</label>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
                className="input"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Daily Statistics Cards */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">إحصائيات اليوم</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-1">إجمالي التذاكر</p>
              <p className="text-4xl font-bold text-primary-600">{dailyStats?.total_tickets || 0}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-1">المكتملة</p>
              <p className="text-4xl font-bold text-success-600">{dailyStats?.completed_tickets || 0}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-1">متوسط وقت الخدمة</p>
              <p className="text-4xl font-bold text-warning-600">{dailyStats?.avg_service_time || 0}</p>
              <p className="text-xs text-gray-500">دقيقة</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-600 text-sm mb-1">معدل الإنجاز</p>
              <p className="text-4xl font-bold text-primary-600">
                {dailyStats?.total_tickets > 0
                  ? ((dailyStats.completed_tickets / dailyStats.total_tickets) * 100).toFixed(1)
                  : 0}%
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Status Distribution */}
        <Card title="توزيع حالات التذاكر">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={ticketStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {ticketStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Wait Time Trend */}
        <Card title="تطور أوقات الانتظار">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={waitTimeChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="متوسط الانتظار" stroke="#0ea5e9" strokeWidth={2} />
              <Line type="monotone" dataKey="الحد الأدنى" stroke="#22c55e" strokeWidth={1} />
              <Line type="monotone" dataKey="الحد الأقصى" stroke="#ef4444" strokeWidth={1} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clinic Performance */}
        <Card title="أداء العيادات">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={clinicChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="إجمالي التذاكر" fill="#0ea5e9" />
              <Bar dataKey="المكتملة" fill="#22c55e" />
              <Bar dataKey="الملغاة" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Doctor Performance */}
        <Card title="أداء الأطباء (أفضل 10)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={doctorChartData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="المرضى" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clinic Performance Table */}
        <Card title="تفاصيل أداء العيادات">
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>العيادة</th>
                  <th>التذاكر</th>
                  <th>المكتملة</th>
                  <th>معدل الإنجاز</th>
                </tr>
              </thead>
              <tbody>
                {clinicPerformance.slice(0, 5).map((clinic) => (
                  <tr key={clinic.clinic_id}>
                    <td>{clinic.clinic_name_ar}</td>
                    <td>{clinic.total_tickets}</td>
                    <td>{clinic.completed_tickets}</td>
                    <td>
                      <span className="badge badge-success">{clinic.completion_rate}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* SMS Statistics */}
        <Card title="إحصائيات الرسائل النصية">
          <div className="space-y-4">
            {smsStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold text-gray-900">{stat.notification_type}</p>
                  <p className="text-sm text-gray-600">معدل النجاح: {stat.success_rate}%</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary-600">{stat.total_sent}</p>
                  <p className="text-xs text-gray-500">إجمالي الرسائل</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Doctor Performance Detailed Table */}
      <Card title="تقرير أداء الأطباء الشامل">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>اسم الطبيب</th>
                <th>التخصص</th>
                <th>العيادة</th>
                <th>إجمالي المرضى</th>
                <th>المكتملة</th>
                <th>متوسط الوقت</th>
                <th>معدل الإنجاز</th>
              </tr>
            </thead>
            <tbody>
              {doctorPerformance.map((doctor) => (
                <tr key={doctor.doctor_id}>
                  <td>{doctor.full_name}</td>
                  <td>{doctor.specialization}</td>
                  <td>{doctor.clinic_name_ar}</td>
                  <td>{doctor.total_patients}</td>
                  <td>{doctor.completed_patients}</td>
                  <td>{doctor.avg_service_time} دقيقة</td>
                  <td>
                    <span
                      className={`badge ${
                        doctor.completion_rate >= 90
                          ? 'badge-success'
                          : doctor.completion_rate >= 70
                          ? 'badge-warning'
                          : 'badge-danger'
                      }`}
                    >
                      {doctor.completion_rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
