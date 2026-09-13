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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-sm transition hover:border-blue-200 hover:text-blue-600"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              S
            </div>
            SaludPublica
          </Link>

          <LanguageSelect variant="page" />
        </div>

        <div className="grid items-center gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="hidden lg:flex flex-col justify-center rounded-[28px] bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-10 text-white shadow-[0_35px_80px_-25px_rgba(15,23,42,0.85)]">
            <div className="inline-flex items-center gap-2 self-start rounded-full bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur-sm">
              <UserPlus className="w-4 h-4" />
              Crea tu cuenta
            </div>

            <h2 className="mt-6 text-4xl font-bold leading-tight">
              Únete y disfruta una experiencia más ordenada para tu salud.
            </h2>

            <p className="mt-4 max-w-md text-lg text-slate-200">
              Regístrate para reservar citas, seguir turnos y acceder a una atención más clara y organizada.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                <UserPlus className="w-5 h-5 text-blue-100" />
                <span className="text-sm">Registro rápido y simple</span>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                <UserPlus className="w-5 h-5 text-blue-100" />
                <span className="text-sm">Control por roles y seguridad</span>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-white/90 p-8 shadow-[0_25px_60px_-20px_rgba(15,23,42,0.25)] backdrop-blur-sm animate-fade-up">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 shadow-lg shadow-blue-500/30">
                <UserPlus className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900">{t('register.title')}</h1>
              <p className="mt-2 text-slate-600">{t('register.subtitle')}</p>
            </div>

            {error && <Banner variant="error" className="mb-6">{error}</Banner>}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
              <p className="text-slate-600">
                {t('register.haveAccount')}{' '}
                <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
                  {t('register.loginLink')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}