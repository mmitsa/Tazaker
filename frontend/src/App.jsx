import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectAccessToken } from '@store/slices/authSlice';
import socketService from '@services/socketService';

// Layouts (to be implemented)
// import MainLayout from '@layouts/MainLayout';
// import AuthLayout from '@layouts/AuthLayout';

// Pages (to be implemented)
// import LoginPage from '@pages/auth/LoginPage';
// import DashboardPage from '@pages/dashboard/DashboardPage';
// import TicketsPage from '@pages/tickets/TicketsPage';
// import QueuePage from '@pages/queue/QueuePage';
// import PatientsPage from '@pages/patients/PatientsPage';
// import ClinicsPage from '@pages/clinics/ClinicsPage';
// import DoctorsPage from '@pages/doctors/DoctorsPage';
// import ReportsPage from '@pages/reports/ReportsPage';
// import DisplayPage from '@pages/display/DisplayPage';
// import NotFoundPage from '@pages/NotFoundPage';

function App() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const accessToken = useSelector(selectAccessToken);

  // Connect to WebSocket when authenticated
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      socketService.connect(accessToken);
    }

    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, accessToken]);

  return (
    <div className="h-full">
      <Routes>
        {/* Temporary placeholder routes */}
        <Route
          path="/"
          element={
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-primary-500 to-primary-700">
              <div className="text-center text-white p-8">
                <h1 className="text-5xl font-bold mb-4">🏥 تذاكر</h1>
                <h2 className="text-3xl font-semibold mb-4">Tazaker</h2>
                <p className="text-xl mb-2">Hospital Queue Management System</p>
                <p className="text-lg">Frontend Structure Ready</p>
                <div className="mt-8 space-y-2">
                  <p className="text-sm opacity-90">✅ React 18 + Vite</p>
                  <p className="text-sm opacity-90">✅ Tailwind CSS</p>
                  <p className="text-sm opacity-90">✅ Redux Toolkit</p>
                  <p className="text-sm opacity-90">✅ i18next (Arabic/English)</p>
                  <p className="text-sm opacity-90">✅ Socket.IO Client</p>
                  <p className="text-sm opacity-90">✅ Axios with Interceptors</p>
                </div>
                <div className="mt-8">
                  <p className="text-sm italic">Ready for UI implementation...</p>
                </div>
              </div>
            </div>
          }
        />

        {/* Authentication routes */}
        {/* <Route path="/login" element={<AuthLayout><LoginPage /></AuthLayout>} /> */}

        {/* Protected routes */}
        {/* <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/queue/:clinicId" element={<QueuePage />} />
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/clinics" element={<ClinicsPage />} />
          <Route path="/doctors" element={<DoctorsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Route> */}

        {/* Public display route */}
        {/* <Route path="/display/:clinicId" element={<DisplayPage />} /> */}

        {/* 404 Not found */}
        {/* <Route path="*" element={<NotFoundPage />} /> */}
      </Routes>
    </div>
  );
}

export default App;
