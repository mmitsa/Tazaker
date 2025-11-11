import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ticketService from '@services/ticketService';
import Card from '@components/common/Card';
import Button from '@components/common/Button';
import Loading from '@components/common/Loading';
import StatusBadge from '@components/common/StatusBadge';
import NewTicketModal from '@components/tickets/NewTicketModal';
import { MdAdd, MdRefresh, MdSearch } from 'react-icons/md';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function TicketsPage() {
  const { t } = useTranslation();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTodayTickets();
  }, []);

  const fetchTodayTickets = async () => {
    try {
      setLoading(true);
      const response = await ticketService.getTodayTickets();
      setTickets(response.data.data.tickets || []);
    } catch (error) {
      toast.error('فشل في تحميل التذاكر');
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTicketCreated = (newTicket) => {
    setTickets((prev) => [newTicket, ...prev]);
    setShowNewTicketModal(false);
    toast.success(t('ticket.ticketCreated'));
  };

  const filteredTickets = tickets.filter(
    (ticket) =>
      ticket.ticket_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.clinic_name_ar?.includes(searchQuery) ||
      ticket.clinic_name_en?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('ticket.title')}</h1>
          <p className="text-gray-600 mt-1">إدارة تذاكر اليوم</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={fetchTodayTickets} variant="outline">
            <MdRefresh className="w-5 h-5" />
          </Button>
          <Button onClick={() => setShowNewTicketModal(true)} variant="primary">
            <MdAdd className="w-5 h-5 ml-2" />
            {t('ticket.newTicket')}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">الإجمالي</p>
            <p className="text-3xl font-bold text-gray-900">{tickets.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">في الانتظار</p>
            <p className="text-3xl font-bold text-warning-600">
              {tickets.filter((t) => t.status === 'waiting').length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">مكتمل</p>
            <p className="text-3xl font-bold text-success-600">
              {tickets.filter((t) => t.status === 'completed').length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-600 text-sm mb-1">ملغي</p>
            <p className="text-3xl font-bold text-danger-600">
              {tickets.filter((t) => t.status === 'cancelled').length}
            </p>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <MdSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('ticket.searchTicket') || 'بحث عن تذكرة...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pr-10"
            />
          </div>
        </div>
      </Card>

      {/* Tickets Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>{t('ticket.ticketNumber')}</th>
                <th>اسم المريض</th>
                <th>العيادة</th>
                <th>{t('ticket.queuePosition')}</th>
                <th>{t('common.status')}</th>
                <th>{t('ticket.issuedAt')}</th>
                <th>{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">
                    لا توجد تذاكر
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.ticket_id}>
                    <td>
                      <span className="font-mono font-semibold text-primary-600">
                        {ticket.ticket_number}
                      </span>
                    </td>
                    <td>{ticket.patient_name}</td>
                    <td>{ticket.clinic_name_ar}</td>
                    <td>
                      {ticket.queue_position ? (
                        <span className="badge badge-secondary">{ticket.queue_position}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td>
                      <span className="text-sm text-gray-600">
                        {format(new Date(ticket.issued_at), 'HH:mm')}
                      </span>
                    </td>
                    <td>
                      <Button size="sm" variant="outline">
                        {t('common.view')}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <NewTicketModal
          onClose={() => setShowNewTicketModal(false)}
          onSuccess={handleTicketCreated}
        />
      )}
    </div>
  );
}
