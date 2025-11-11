import { useTranslation } from 'react-i18next';
import { MdLanguage } from 'react-icons/md';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 rounded-lg hover:bg-gray-100 transition-colors"
      title={i18n.language === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
    >
      <MdLanguage className="w-5 h-5" />
      <span>{i18n.language === 'ar' ? 'English' : 'العربية'}</span>
    </button>
  );
}
