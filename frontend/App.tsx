import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useI18n } from './context/I18nContext';
import Navbar from './components/Navbar';
import TriageChat from './components/TriageChat';
import AppointmentScheduler from './components/AppointmentScheduler';
import AdminDashboard from './components/AdminDashboard';
import AppointmentPublicView from './components/AppointmentPublicView';
import WaitlistSubscription from './components/WaitlistSubscription';
import Login from './components/Login';
import Register from './components/Register';
import Spinner from './components/ui/Spinner';
import { Stethoscope, CalendarCheck, ArrowRight, MoonStar, SunMedium } from 'lucide-react';
import { UserRole } from './types/auth';

const PrivateRoute: React.FC<{ children: React.ReactNode; allowedRoles?: UserRole[] }> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user, loading } = useAuth();
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner label={t('app.loading')} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const HomePage: React.FC = () => {
  const { t } = useI18n();

  const features = [
    {
      icon: <CalendarCheck className="w-6 h-6" />,
      iconBg: 'bg-blue-100 text-blue-600',
      title: t('home.feat1.title'),
      text: t('home.feat1.text'),
      pulse: false,
      link: '/booking',
      action: t('home.cta.know'),
    },
    {
      icon: <Stethoscope className="w-6 h-6" />,
      iconBg: 'bg-purple-100 text-purple-600',
      title: t('home.feat2.title'),
      text: t('home.feat2.text'),
      pulse: false,
      link: '/triage',
      action: t('home.cta.help'),
    },
    {
      icon: <CalendarCheck className="w-6 h-6" />,
      iconBg: 'bg-green-100 text-green-600',
      title: t('home.feat3.title'),
      text: t('home.feat3.text'),
      pulse: true,
      link: '/waitlist',
      action: t('home.feat3.title'),
    },
  ];

  return (
    <div className="py-12 md:py-20">
      <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
          {t('home.title1')} <br />
          <span className="text-blue-600">{t('home.title2')}</span>
        </h1>
        <p className="text-lg text-slate-600 mb-8">{t('home.subtitle')}</p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/booking"
            className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-100 rounded-xl font-bold text-lg shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
          >
            <CalendarCheck className="w-5 h-5" />
            {t('home.cta.know')}
          </Link>
          <Link
            to="/triage"
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 bg-animate-grad text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-blue-500/30 transition-all duration-200 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
          >
            <Stethoscope className="w-5 h-5" />
            {t('home.cta.help')}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4 stagger">
        {features.map((feature) => (
          <Link
            key={feature.title}
            to={feature.link}
            className="block bg-white p-6 rounded-xl shadow-sm border border-slate-100 transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
          >
            <div
              className={`w-12 h-12 ${feature.iconBg} rounded-lg flex items-center justify-center mb-4`}
            >
              {feature.pulse ? (
                <div className="relative">
                  <div className="absolute top-0 right-0">
                    <div className="absolute bottom-0 right-0 w-2 h-2 bg-green-500 rounded-full animate-ping"></div>
                    {feature.icon}
                  </div>
                </div>
              ) : (
                feature.icon
              )}
            </div>
            <h3 className="font-bold text-lg mb-2 text-slate-900">{feature.title}</h3>
            <p className="text-slate-600 text-sm">{feature.text}</p>
            <div className="mt-4 inline-flex items-center gap-2 text-blue-600 font-semibold text-sm">
              {feature.action}
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

const NotFoundPage: React.FC = () => {
  const { t } = useI18n();

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-6xl font-bold text-blue-600 mb-4">404</p>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('common.notFound')}</h2>
        <p className="text-gray-600 mb-6">{t('common.notFoundText')}</p>
        <Link
          to="/"
          className="inline-flex px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          {t('public.backHome')}
        </Link>
      </div>
    </main>
  );
};

const App: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { t } = useI18n();
  const currentYear = new Date().getFullYear();
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    document.body.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <button
        type="button"
        onClick={() => setIsDark((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        {isDark ? <SunMedium className="w-4 h-4" /> : <MoonStar className="w-4 h-4" />}
        <span>{isDark ? 'Claro' : 'Nocturno'}</span>
      </button>

      {isAuthenticated && <Navbar />}

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/appointment/:token" element={<AppointmentPublicView />} />

        <Route
          path="/"
          element={
            <PrivateRoute>
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                <HomePage />
              </main>
            </PrivateRoute>
          }
        />

        <Route
          path="/triage"
          element={
            <PrivateRoute>
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 py-10">
                <Link
                  to="/"
                  className="mb-6 text-slate-500 hover:text-blue-600 flex items-center gap-2 transition-colors"
                >
                  ← {t('common.back')}
                </Link>
                <TriageChat />
              </main>
            </PrivateRoute>
          }
        />

        <Route
          path="/booking"
          element={
            <PrivateRoute allowedRoles={[UserRole.PATIENT]}>
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                <AppointmentScheduler />
              </main>
            </PrivateRoute>
          }
        />

        <Route
          path="/waitlist"
          element={
            <PrivateRoute>
              <WaitlistSubscription />
            </PrivateRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <PrivateRoute allowedRoles={[UserRole.ADMIN]}>
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                <AdminDashboard />
              </main>
            </PrivateRoute>
          }
        />

        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Routes>

      {isAuthenticated && (
        <footer className="bg-slate-900 text-slate-400 py-8">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p>{t('footer.rights', { year: currentYear })}</p>
            <p className="text-xs mt-2">{t('footer.powered')}</p>
          </div>
        </footer>
      )}
    </div>
  );
};

export default App;