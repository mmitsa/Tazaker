import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectAccessToken } from '@store/slices/authSlice';
import socketService from '@services/socketService';

// Layouts
import MainLayout from '@layouts/MainLayout';

// Pages
import LoginPage from '@pages/auth/LoginPage';
import DashboardPage from '@pages/dashboard/DashboardPage';
import TicketsPage from '@pages/tickets/TicketsPage';
import QueuePage from '@pages/queue/QueuePage';
import NotFoundPage from '@pages/NotFoundPage';

// Components
import ProtectedRoute from '@components/common/ProtectedRoute';

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
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
          }
        />

        {/* Protected Routes */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Tickets Management */}
          <Route path="/tickets" element={<TicketsPage />} />

          {/* Queue Management (Doctor Interface) */}
          <Route
            path="/queue"
            element={
              <ProtectedRoute allowedRoles={['doctor', 'admin', 'super_admin']}>
                <QueuePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patients"
            element={
              <div className="text-center py-20">
                <h1 className="text-2xl font-bold mb-2">إدارة المرضى</h1>
                <p className="text-gray-600">قيد التطوير...</p>
              </div>
            }
          />
          <Route
            path="/clinics"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <div className="text-center py-20">
                  <h1 className="text-2xl font-bold mb-2">إدارة العيادات</h1>
                  <p className="text-gray-600">قيد التطوير...</p>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/doctors"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <div className="text-center py-20">
                  <h1 className="text-2xl font-bold mb-2">إدارة الأطباء</h1>
                  <p className="text-gray-600">قيد التطوير...</p>
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
                <div className="text-center py-20">
                  <h1 className="text-2xl font-bold mb-2">التقارير والإحصائيات</h1>
                  <p className="text-gray-600">قيد التطوير...</p>
                </div>
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Redirect root to dashboard if authenticated, otherwise to login */}
        <Route
          path="/"
          element={
            <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
          }
        />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;
