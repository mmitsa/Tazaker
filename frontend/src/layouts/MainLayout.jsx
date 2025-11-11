import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { logout, selectCurrentUser } from '@store/slices/authSlice';
import LanguageSwitcher from '@components/common/LanguageSwitcher';
import {
  MdDashboard,
  MdConfirmationNumber,
  MdPeople,
  MdLocalHospital,
  MdPerson,
  MdBarChart,
  MdMenu,
  MdClose,
  MdLogout,
  MdViewList,
} from 'react-icons/md';
import toast from 'react-hot-toast';

export default function MainLayout() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(selectCurrentUser);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      toast.success(t('auth.logoutSuccess'));
      navigate('/login');
    } catch (error) {
      toast.error('حدث خطأ أثناء تسجيل الخروج');
    }
  };

  // Navigation items based on user role
  const getNavItems = () => {
    const commonItems = [
      { path: '/dashboard', icon: MdDashboard, label: t('nav.dashboard') },
    ];

    const roleBasedItems = {
      super_admin: [
        { path: '/tickets', icon: MdConfirmationNumber, label: t('nav.tickets') },
        { path: '/patients', icon: MdPeople, label: t('nav.patients') },
        { path: '/clinics', icon: MdLocalHospital, label: t('nav.clinics') },
        { path: '/doctors', icon: MdPerson, label: t('nav.doctors') },
        { path: '/reports', icon: MdBarChart, label: t('nav.reports') },
      ],
      admin: [
        { path: '/tickets', icon: MdConfirmationNumber, label: t('nav.tickets') },
        { path: '/patients', icon: MdPeople, label: t('nav.patients') },
        { path: '/clinics', icon: MdLocalHospital, label: t('nav.clinics') },
        { path: '/doctors', icon: MdPerson, label: t('nav.doctors') },
        { path: '/reports', icon: MdBarChart, label: t('nav.reports') },
      ],
      receptionist: [
        { path: '/tickets', icon: MdConfirmationNumber, label: t('nav.tickets') },
        { path: '/patients', icon: MdPeople, label: t('nav.patients') },
      ],
      doctor: [
        { path: '/queue', icon: MdViewList, label: t('nav.queue') },
      ],
    };

    return [...commonItems, ...(roleBasedItems[user?.role] || [])];
  };

  const navItems = getNavItems();

  const NavLink = ({ item }) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    return (
      <Link
        to={item.path}
        onClick={() => setSidebarOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
          isActive
            ? 'bg-primary-100 text-primary-700 font-semibold'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <Icon className="w-5 h-5" />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            {sidebarOpen ? <MdClose className="w-6 h-6" /> : <MdMenu className="w-6 h-6" />}
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏥</span>
            <div>
              <h1 className="text-xl font-bold text-primary-600">تذاكر</h1>
              <p className="text-xs text-gray-500">Hospital Queue System</p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            {/* User Info */}
            <div className="hidden sm:flex items-center gap-3 px-3 py-2 bg-gray-100 rounded-lg">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{user?.full_name || user?.username}</p>
                <p className="text-xs text-gray-500">{t(`roles.${user?.role}`)}</p>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
              title={t('common.logout')}
            >
              <MdLogout className="w-5 h-5" />
              <span className="hidden sm:inline">{t('common.logout')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-20 transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.path} item={item} />
          ))}
        </nav>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="pt-16 lg:pr-64 min-h-screen">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
