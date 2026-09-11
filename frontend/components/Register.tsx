import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { UserPlus, Mail, Lock, User, Phone, CreditCard } from 'lucide-react';
import Button from './ui/Button';
import Field from './ui/Field';
import Banner from './ui/Banner';
import LanguageSelect from './LanguageSelect';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    dni: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError(t('register.errorMismatch'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('register.errorLength'));
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, phone, dni, ...rest } = formData;
      await register({
        ...rest,
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        ...(dni.trim() ? { dni: dni.trim() } : {}),
      });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('register.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 animate-fade-up">
        <div className="flex justify-end -mb-8">
          <LanguageSelect variant="page" />
        </div>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t('register.title')}</h1>
          <p className="text-gray-600 mt-2">{t('register.subtitle')}</p>
        </div>

        {error && <Banner variant="error" className="mb-6">{error}</Banner>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field id="firstName" label={t('register.firstName')} icon={<User className="w-5 h-5" />} required>
              <input
                id="firstName"
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder={t('ph.firstName')}
              />
            </Field>

            <Field id="lastName" label={t('register.lastName')} icon={<User className="w-5 h-5" />} required>
              <input
                id="lastName"
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder={t('ph.lastName')}
              />
            </Field>
          </div>

          <Field id="email" label={t('common.email')} icon={<Mail className="w-5 h-5" />} required>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={inputClass}
              placeholder={t('ph.email')}
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field id="phone" label={t('common.phone')} icon={<Phone className="w-5 h-5" />}>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className={inputClass}
                placeholder={t('ph.phone')}
              />
            </Field>

            <Field id="dni" label={t('register.dniLabel')} icon={<CreditCard className="w-5 h-5" />}>
              <input
                id="dni"
                name="dni"
                type="text"
                value={formData.dni}
                onChange={handleChange}
                className={inputClass}
                placeholder={t('ph.dni')}
                pattern="\d{7,8}"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field id="password" label={t('common.password')} icon={<Lock className="w-5 h-5" />} required>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="••••••••"
              />
            </Field>

            <Field id="confirmPassword" label={t('register.confirmPassword')} icon={<Lock className="w-5 h-5" />} required>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="••••••••"
              />
            </Field>
          </div>

          <Button type="submit" full loading={loading} size="lg">
            {loading ? t('register.creating') : t('register.submit')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {t('register.haveAccount')}{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700">
              {t('register.loginLink')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}