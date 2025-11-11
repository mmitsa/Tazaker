import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ticketService from '@services/ticketService';
import clinicService from '@services/clinicService';
import patientService from '@services/patientService';
import Button from '@components/common/Button';
import Input from '@components/common/Input';
import { MdClose, MdSearch } from 'react-icons/md';
import toast from 'react-hot-toast';

export default function NewTicketModal({ onClose, onSuccess }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(1); // 1: Patient Selection, 2: Clinic Selection, 3: Confirmation
  const [loading, setLoading] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [priority, setPriority] = useState(0);

  useEffect(() => {
    fetchClinics();
    fetchPatients();
  }, []);

  const fetchClinics = async () => {
    try {
      const response = await clinicService.getActiveClinics();
      setClinics(response.data.data || []);
    } catch (error) {
      console.error('Error fetching clinics:', error);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await patientService.getAllPatients({ limit: 100 });
      setPatients(response.data.data.patients || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const handleSearchPatients = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await patientService.searchPatients(searchQuery);
      setPatients(response.data.data || []);
    } catch (error) {
      toast.error('فشل في البحث عن المرضى');
    }
  };

  const handleSubmit = async () => {
    if (!selectedPatient || !selectedClinic) {
      toast.error('يرجى اختيار المريض والعيادة');
      return;
    }

    try {
      setLoading(true);
      const response = await ticketService.createTicket({
        patient_id: selectedPatient.patient_id,
        clinic_id: selectedClinic.clinic_id,
        priority,
      });

      const newTicket = response.data.data;
      toast.success(
        `تم إصدار التذكرة: ${newTicket.ticket_number}\nالموقع في القائمة: ${newTicket.queue_position}`
      );
      onSuccess(newTicket);
    } catch (error) {
      toast.error(error.message || 'فشل في إصدار التذكرة');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.national_id?.includes(searchQuery) ||
      patient.phone?.includes(searchQuery)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{t('ticket.issueTicket')}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-4">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                1
              </div>
              <div className="w-16 h-1 bg-gray-200">
                <div
                  className={`h-full transition-all ${step >= 2 ? 'bg-primary-600' : ''}`}
                  style={{ width: step >= 2 ? '100%' : '0%' }}
                />
              </div>
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                2
              </div>
            </div>
          </div>

          {/* Step 1: Patient Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">{t('ticket.selectPatient')}</h3>

              {/* Search */}
              <div className="flex gap-2">
                <Input
                  placeholder="ابحث بالاسم أو رقم الهوية أو الهاتف..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchPatients()}
                />
                <Button onClick={handleSearchPatients} variant="outline">
                  <MdSearch className="w-5 h-5" />
                </Button>
              </div>

              {/* Patients List */}
              <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
                {filteredPatients.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">لا توجد مرضى</div>
                ) : (
                  filteredPatients.map((patient) => (
                    <div
                      key={patient.patient_id}
                      onClick={() => setSelectedPatient(patient)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedPatient?.patient_id === patient.patient_id
                          ? 'bg-primary-50 border-l-4 border-l-primary-600'
                          : ''
                      }`}
                    >
                      <p className="font-semibold text-gray-900">{patient.full_name}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span>هوية: {patient.national_id}</span>
                        <span>هاتف: {patient.phone}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {selectedPatient && (
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-primary-900 mb-1">المريض المحدد:</p>
                  <p className="text-primary-700">{selectedPatient.full_name}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Clinic Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">{t('ticket.selectClinic')}</h3>

              {/* Clinics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {clinics.map((clinic) => (
                  <div
                    key={clinic.clinic_id}
                    onClick={() => setSelectedClinic(clinic)}
                    className={`p-4 border-2 rounded-lg cursor-pointer hover:border-primary-300 transition-colors ${
                      selectedClinic?.clinic_id === clinic.clinic_id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <p className="font-semibold text-gray-900">{clinic.clinic_name_ar}</p>
                    <p className="text-sm text-gray-600 mt-1">{clinic.clinic_name_en}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">{clinic.department}</span>
                      <span className="badge badge-primary">{clinic.clinic_code}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Priority Selection */}
              {selectedClinic && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    {t('ticket.priority')}
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPriority(0)}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                        priority === 0
                          ? 'border-primary-600 bg-primary-50 text-primary-700 font-semibold'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {t('ticket.normalPriority')}
                    </button>
                    <button
                      onClick={() => setPriority(1)}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                        priority === 1
                          ? 'border-warning-600 bg-warning-50 text-warning-700 font-semibold'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {t('ticket.mediumPriority')}
                    </button>
                    <button
                      onClick={() => setPriority(2)}
                      className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                        priority === 2
                          ? 'border-danger-600 bg-danger-50 text-danger-700 font-semibold'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {t('ticket.highPriority')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <Button onClick={onClose} variant="outline" disabled={loading}>
            {t('common.cancel')}
          </Button>

          <div className="flex gap-3">
            {step > 1 && (
              <Button onClick={() => setStep(step - 1)} variant="outline" disabled={loading}>
                {t('common.back')}
              </Button>
            )}

            {step === 1 && (
              <Button
                onClick={() => setStep(2)}
                variant="primary"
                disabled={!selectedPatient || loading}
              >
                {t('common.next')}
              </Button>
            )}

            {step === 2 && (
              <Button
                onClick={handleSubmit}
                variant="success"
                disabled={!selectedClinic || loading}
                loading={loading}
              >
                {t('ticket.issueTicket')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
