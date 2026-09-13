import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
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
import { appointmentService } from './services/appointmentService';
import { UserRole } from './types/auth';
import { AppointmentWithDetails } from './types/doctor';

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
  const { user, isAuthenticated } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setAppointments([]);
      return;
    }

    let isMounted = true;

    const loadAppointments = async () => {
      try {
        setAppointmentsLoading(true);
        const data = await appointmentService.getAll();

        if (isMounted) {
          setAppointments(data);
        }
      } catch (error) {
        console.error('Error loading appointments summary:', error);
        if (isMounted) {
          setAppointments([]);
        }
      } finally {
        if (isMounted) {
          setAppointmentsLoading(false);
        }
      }
    };

    void loadAppointments();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user]);

  const landingDestination = user?.role === UserRole.ADMIN ? '/admin' : user?.role === UserRole.DOCTOR ? '/triage' : '/booking';

  const features = [
    {
      icon: <CalendarCheck className="w-6 h-6" />,
      iconBg: 'bg-blue-100 text-blue-600',
      title: 'Agenda inteligente',
      text: 'Gestiona citas, turnos y disponibilidad desde una sola vista.',
      link: isAuthenticated ? (user?.role === UserRole.ADMIN ? '/admin' : '/booking') : '/login',
      action: isAuthenticated ? 'Abrir' : 'Entrar',
    },
    {
      icon: <Stethoscope className="w-6 h-6" />,
      iconBg: 'bg-purple-100 text-purple-600',
      title: 'Triage asistido',
      text: 'Orientación rápida con apoyo de IA para priorizar la atención.',
      link: isAuthenticated ? '/triage' : '/login',
      action: isAuthenticated ? 'Ir a triage' : 'Ir a login',
    },
    {
      icon: <CalendarCheck className="w-6 h-6" />,
      iconBg: 'bg-green-100 text-green-600',
      title: 'Lista de espera',
      text: 'Mantén a pacientes registrados y notificados sin perder tiempo.',
      link: isAuthenticated ? '/waitlist' : '/register',
      action: isAuthenticated ? 'Ver lista' : 'Crear cuenta',
    },
  ];

  const stats = [
    { value: '24/7', label: 'Acceso online' },
    { value: '+10k', label: 'Turnos gestionados' },
    { value: '99.9%', label: 'Disponibilidad' },
  ];

  const visibleAppointments = appointments
    .filter((appointment) => appointment.status !== 'CANCELLED')
    .slice(0, 3);

  const formatAppointmentDate = (value: string) =>
    new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));

  const roleCards = (() => {
    if (!user) {
      return [];
    }

    if (user.role === UserRole.ADMIN) {
      return [
        { title: 'Panel administrativo', text: 'Revisa estadísticas, gestiona médicos y usuarios desde un solo lugar.', link: '/admin', action: 'Abrir dashboard' },
        { title: 'Gestión de médicos', text: 'Agrega, edita y elimina profesionales del sistema.', link: '/admin', action: 'Ir a doctores' },
        { title: 'Usuarios del sistema', text: 'Administra pacientes, médicos y permisos del acceso.', link: '/admin', action: 'Ver usuarios' },
      ];
    }

    if (user.role === UserRole.DOCTOR) {
      return [
        { title: 'Triage asistido', text: 'Usa la IA para priorizar síntomas y orientar la atención.', link: '/triage', action: 'Abrir triage' },
        { title: 'Reservas y agenda', text: 'Consulta la disponibilidad, turnos y programación del día.', link: '/booking', action: 'Ver agenda' },
        { title: 'Atención del paciente', text: 'Mantén el control de citas y seguimiento de consultas.', link: '/booking', action: 'Gestionar citas' },
      ];
    }

    return [
      { title: 'Reservar turno', text: 'Busca la especialidad adecuada y agenda tu cita.', link: '/booking', action: 'Reservar' },
      { title: 'Triage inteligente', text: 'Evalúa tus síntomas y recibe una orientación rápida.', link: '/triage', action: 'Usar triage' },
      { title: 'Lista de espera', text: 'Si no hay turnos disponibles, inscríbete y te avisaremos.', link: '/waitlist', action: 'Inscribirme' },
    ];
  })();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
              S
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">SaludPublica</p>
              <p className="text-xs text-slate-500">Gestión de turnos</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <a href="#servicios" className="transition-colors hover:text-blue-600">Servicios</a>
            <a href="#beneficios" className="transition-colors hover:text-blue-600">Beneficios</a>
            <a href="#contacto" className="transition-colors hover:text-blue-600">Contacto</a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to={landingDestination}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
              >
                Ir a mi área
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:text-blue-600"
                >
                  Iniciar sesión
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                >
                  Registrarse
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 lg:px-8">
        {isAuthenticated && user && (
          <>
            <section className="mb-12 rounded-[28px] border border-blue-100 bg-white/80 p-6 shadow-[0_18px_40px_-24px_rgba(37,99,235,0.45)] backdrop-blur-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                {user.role === UserRole.ADMIN ? 'Acceso administrativo' : user.role === UserRole.DOCTOR ? 'Acceso médico' : 'Acceso paciente'}
              </p>
              <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <h2 className="text-3xl font-black text-slate-900">
                    {user.role === UserRole.ADMIN ? 'Bienvenido, administrador' : user.role === UserRole.DOCTOR ? 'Bienvenido, doctor' : 'Bienvenido, paciente'}
                  </h2>
                  <p className="mt-2 max-w-2xl text-slate-600">
                    {user.role === UserRole.ADMIN
                      ? 'Gestiona turnos, doctores, usuarios y métricas del sistema desde un único panel.'
                      : user.role === UserRole.DOCTOR
                        ? 'Revisa la atención, prioriza el triage y accede rápidamente a la agenda y reservas.'
                        : 'Accede a tus turnos, triage y herramientas para reservar citas o dejarte en lista de espera.'}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {roleCards.map((card) => (
                  <Link
                    key={card.title}
                    to={card.link}
                    className="group rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-all duration-200 hover:-translate-y-1 hover:border-blue-200 hover:bg-blue-50"
                  >
                    <p className="text-lg font-bold text-slate-900">{card.title}</p>
                    <p className="mt-2 text-sm text-slate-600">{card.text}</p>
                    <span className="mt-4 inline-flex items-center text-sm font-semibold text-blue-600">
                      {card.action}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="mb-12 rounded-[28px] border border-slate-200 bg-white/80 p-6 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.2)] backdrop-blur-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                    {user.role === UserRole.ADMIN ? 'Turnos del sistema' : user.role === UserRole.DOCTOR ? 'Agenda del doctor' : 'Mis turnos'}
                  </p>
                  <h3 className="mt-2 text-2xl font-black text-slate-900">
                    {user.role === UserRole.ADMIN ? 'Resumen de citas' : user.role === UserRole.DOCTOR ? 'Turnos programados' : 'Próximas citas'}
                  </h3>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                  {appointmentsLoading ? 'Cargando...' : `${visibleAppointments.length} próximos`}
                </span>
              </div>

              {appointmentsLoading ? (
                <div className="mt-6 flex justify-center py-10">
                  <Spinner label="Cargando turnos..." />
                </div>
              ) : visibleAppointments.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-slate-600">
                  {user.role === UserRole.ADMIN
                    ? 'Todavía no hay citas confirmadas para mostrar.'
                    : user.role === UserRole.DOCTOR
                      ? 'Aún no tienes turnos asignados en el sistema.'
                      : 'Todavía no tenés turnos programados.'}
                </div>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {visibleAppointments.map((appointment) => (
                    <article
                      key={appointment.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-blue-700">
                          {appointment.doctor?.specialty?.name ?? 'Consulta'}
                        </p>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                            appointment.status === 'CONFIRMED'
                              ? 'bg-emerald-100 text-emerald-700'
                              : appointment.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {appointment.status}
                        </span>
                      </div>

                      <h4 className="mt-3 text-lg font-bold text-slate-900">
                        {user.role === UserRole.PATIENT
                          ? appointment.doctor?.name ?? 'Profesional'
                          : appointment.patientName}
                      </h4>

                      <p className="mt-2 text-sm text-slate-600">
                        {user.role === UserRole.PATIENT
                          ? appointment.doctor?.hospital ?? 'Hospital'
                          : `${appointment.doctor?.name ?? 'Profesional'} • ${appointment.doctor?.hospital ?? 'Hospital'}`}
                      </p>

                      <p className="mt-4 text-sm font-medium text-slate-700">
                        {formatAppointmentDate(appointment.date)}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        <section className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
              Salud pública moderna
            </span>

            <h1 className="mt-6 text-4xl font-black leading-tight text-slate-900 md:text-6xl">
              Gestiona turnos,
              <span className="block text-blue-600">más rápido y claro.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg text-slate-600">
              Una plataforma para coordinar citas, atención inicial y seguimiento con una experiencia simple para pacientes y administración.
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              {isAuthenticated ? (
                <Link
                  to={landingDestination}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700"
                >
                  Ir a mi área
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors hover:bg-blue-700"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-base font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:text-blue-600"
                  >
                    Crear cuenta
                  </Link>
                </>
              )}
            </div>

            <ul className="mt-10 flex flex-wrap gap-6 text-sm text-slate-600">
              {stats.map((item) => (
                <li key={item.label} className="list-none">
                  <p className="text-2xl font-black text-slate-900">{item.value}</p>
                  <p>{item.label}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[32px] bg-gradient-to-tr from-blue-500/20 to-indigo-500/10 blur-3xl" />
            <div className="relative rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_25px_60px_-20px_rgba(15,23,42,0.25)]">
              <div className="rounded-2xl bg-slate-900 p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Panel principal</p>
                    <h2 className="mt-2 text-2xl font-bold">Agenda del día</h2>
                  </div>
                  <span className="rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold text-blue-50">
                    Activo
                  </span>
                </div>

                <div className="mt-6 space-y-3">
                  {[
                    { label: 'Consulta general', detail: '08:30 - Dra. López', tone: 'emerald' },
                    { label: 'Triage', detail: '09:15 - Paciente nuevo', tone: 'amber' },
                    { label: 'Control', detail: '10:00 - Sr. González', tone: 'cyan' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-xl bg-slate-800 p-3"
                    >
                      <div>
                        <p className="text-sm text-slate-300">{item.label}</p>
                        <p className="font-semibold">{item.detail}</p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          item.tone === 'emerald'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : item.tone === 'amber'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-cyan-500/20 text-cyan-300'
                        }`}
                      >
                        {item.tone === 'emerald'
                          ? 'Confirmado'
                          : item.tone === 'amber'
                            ? 'En espera'
                            : 'Programado'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="servicios" className="mt-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Servicios</p>
            <h2 className="mt-3 text-3xl font-black text-slate-900">
              Todo lo que necesitas para una atención organizada
            </h2>
          </div>

          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <li key={feature.title} className="list-none">
                <Link
                  to={feature.link}
                  className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  <article className="h-full">
                    <div
                      className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${feature.iconBg}`}
                    >
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">{feature.title}</h3>
                    <p className="mt-3 text-slate-600">{feature.text}</p>
                    <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600">
                      {feature.action}
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </article>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section id="beneficios" className="mt-20 rounded-[32px] bg-slate-900 px-6 py-10 md:px-10">
          <div className="grid items-center gap-8 md:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-300">Beneficios</p>
              <h2 className="mt-3 text-3xl font-black text-white">
                Diseñado para equipos de salud y pacientes
              </h2>
              <ul className="mt-6 space-y-4 text-slate-300">
                <li>• Mejor organización del flujo de atención.</li>
                <li>• Menos errores en citas y priorización.</li>
                <li>• Experiencia más clara para usuarios y personal.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <ul className="grid grid-cols-2 gap-4">
                {[
                  ['35%', 'menos tiempos muertos'],
                  ['4.8/5', 'satisfacción'],
                  ['1 click', 'gestión rápida'],
                  ['100%', 'digital'],
                ].map(([value, label]) => (
                  <li key={label} className="list-none rounded-xl bg-white/5 p-4">
                    <p className="text-2xl font-black text-white">{value}</p>
                    <p className="text-sm text-slate-300">{label}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>

      <footer id="contacto" className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-slate-600 sm:px-6 lg:px-8">
          SaludPublica • Gestión de turnos • Contacto: soporte@saludpublica.com
        </div>
      </footer>
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
  const location = useLocation();
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    const staticHome = document.getElementById('static-home');

    if (staticHome) {
      staticHome.style.display = 'none';
    }

    document.body.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark, location.pathname]);

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

        <Route path="/" element={<HomePage />} />

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