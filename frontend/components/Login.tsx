import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { LogIn, Mail, Lock, Sparkles, ShieldCheck } from 'lucide-react';
import Button from './ui/Button';
import Field from './ui/Field';
import Banner from './ui/Banner';
import LanguageSelect from './LanguageSelect';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { role: t('login.demo.admin'), email: 'admin@saludpublica.com', password: '123456' },
    { role: t('login.demo.patient'), email: 'paciente1@email.com', password: '123456' },
    { role: t('login.demo.doctor'), email: 'doctor1@email.com', password: '123456' },
  ];

  const fillDemoAccount = (account: { email: string; password: string }) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-sky-100 px-4 py-8">
      <div className="max-w-4xl w-full grid lg:grid-cols-[1.1fr_0.9fr] gap-6 items-center">
        <div className="hidden lg:flex flex-col justify-center rounded-3xl bg-gradient-to-br from-blue-700 via-indigo-700 to-sky-600 p-10 text-white shadow-2xl">
          <div className="inline-flex items-center gap-2 self-start rounded-full bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur-sm">
            <Sparkles className="w-4 h-4" />
            Salud Pública Connect
          </div>

          <h2 className="mt-6 text-4xl font-bold leading-tight">
            Accede a tu cuenta y gestiona turnos con ayuda de IA.
          </h2>

          <p className="mt-4 text-blue-100 text-lg max-w-md">
            Reserva citas, consulta disponibilidad y usa el asistente de triage inteligente para orientarte mejor.
          </p>

          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <ShieldCheck className="w-5 h-5 text-blue-100" />
              <span className="text-sm">Seguridad y control por roles</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <ShieldCheck className="w-5 h-5 text-blue-100" />
              <span className="text-sm">Asistente de IA disponible para orientación rápida</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 animate-fade-up">
          <div className="flex justify-end -mb-8">
            <LanguageSelect variant="page" />
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4 shadow-lg shadow-blue-500/30">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{t('login.title')}</h1>
            <p className="text-gray-600 mt-2">{t('login.subtitle')}</p>
          </div>

          {error && <Banner variant="error" className="mb-6">{error}</Banner>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <Field id="email" label={t('common.email')} icon={<Mail className="w-5 h-5" />}>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={t('ph.email')}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
              />
            </Field>

            <Field id="password" label={t('common.password')} icon={<Lock className="w-5 h-5" />}>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
              />
            </Field>

            <Button type="submit" full loading={loading} size="lg">
              {loading ? t('login.submitting') : t('login.submit')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {t('login.noAccount')}{' '}
              <Link to="/register" className="text-blue-600 font-semibold hover:text-blue-700">
                {t('login.registerLink')}
              </Link>
            </p>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-600 font-semibold mb-3">{t('login.testUsers')}</p>
            <div className="space-y-2 text-xs text-gray-600">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => fillDemoAccount(account)}
                  className="w-full flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-left transition hover:border-blue-300 hover:bg-blue-50"
                >
                  <span>
                    <strong>{account.role}</strong>
                    <span className="ml-2 text-gray-500">{account.email}</span>
                  </span>
                  <span className="text-blue-600 font-semibold">Usar</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}