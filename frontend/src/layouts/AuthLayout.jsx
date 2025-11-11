import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@components/common/LanguageSwitcher';

export default function AuthLayout({ children }) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center p-4">
      {/* Language Switcher */}
      <div className="fixed top-4 right-4 z-10">
        <div className="bg-white rounded-lg shadow-lg">
          <LanguageSwitcher />
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
            <span className="text-4xl">🏥</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">{t('common.appName')}</h1>
          <p className="text-primary-100 text-lg">Hospital Queue Management System</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">{children}</div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white text-sm opacity-90">
            © 2024 Tazaker - جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </div>
  );
}
