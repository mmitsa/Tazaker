import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { login, selectAuthLoading, selectAuthError } from '@store/slices/authSlice';
import AuthLayout from '@layouts/AuthLayout';
import Input from '@components/common/Input';
import Button from '@components/common/Button';
import { MdPerson, MdLock } from 'react-icons/md';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isLoading = useSelector(selectAuthLoading);
  const authError = useSelector(selectAuthError);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = t('errors.required');
    }

    if (!formData.password) {
      newErrors.password = t('errors.required');
    } else if (formData.password.length < 6) {
      newErrors.password = t('errors.minLength', { min: 6 });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await dispatch(login(formData)).unwrap();
      toast.success(t('auth.loginSuccess'));
      navigate('/dashboard');
    } catch (error) {
      toast.error(error || t('auth.loginError'));
    }
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{t('auth.loginButton')}</h2>
          <p className="text-gray-600 text-sm">{t('auth.welcome')}</p>
        </div>

        {authError && (
          <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-sm">
            {authError}
          </div>
        )}

        <Input
          name="username"
          label={t('auth.username')}
          placeholder={t('auth.username')}
          value={formData.username}
          onChange={handleChange}
          error={errors.username}
          required
          disabled={isLoading}
          autoComplete="username"
        />

        <Input
          name="password"
          type="password"
          label={t('auth.password')}
          placeholder={t('auth.password')}
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          required
          disabled={isLoading}
          autoComplete="current-password"
        />

        <Button type="submit" fullWidth loading={isLoading} disabled={isLoading}>
          {t('auth.loginButton')}
        </Button>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs font-semibold text-gray-700 mb-2">حسابات تجريبية / Demo Accounts:</p>
          <div className="space-y-1 text-xs text-gray-600">
            <p>
              <strong>Admin:</strong> admin / Admin@123
            </p>
            <p>
              <strong>Doctor:</strong> doctor1 / Doctor@123
            </p>
            <p>
              <strong>Receptionist:</strong> receptionist1 / Recept@123
            </p>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}
