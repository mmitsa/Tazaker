import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '@components/common/Button';
import { MdHome } from 'react-icons/md';

export default function NotFoundPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-600 mb-4">404</h1>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">الصفحة غير موجودة</h2>
          <p className="text-gray-600">عذراً، الصفحة التي تبحث عنها غير موجودة</p>
        </div>

        <Button onClick={() => navigate('/dashboard')} variant="primary" size="lg">
          <MdHome className="w-5 h-5 ml-2" />
          {t('nav.dashboard')}
        </Button>
      </div>
    </div>
  );
}
