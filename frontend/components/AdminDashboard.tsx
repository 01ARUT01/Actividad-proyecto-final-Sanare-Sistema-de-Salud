import React, { useState, useEffect, useMemo } from 'react';
import { Users, Calendar, Activity, TrendingUp, UserCog, CalendarCheck, LogOut } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import DoctorManagement from './DoctorManagement';
import AppointmentsCalendar from './AppointmentsCalendar';
import UserManagement from './UserManagement';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { weekdays } from '../utils/format';
import { API_URL } from '../services/apiConfig';

type TabType = 'overview' | 'doctors' | 'calendar' | 'users';

interface AdminAppointment {
  date: string;
  status: string;
  doctor: {
    name: string;
    specialty: { name: string };
  } | null;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const { logout } = useAuth();
  const { t, locale } = useI18n();
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    pending: 0,
    cancelled: 0,
  });
  const [appointments, setAppointments] = useState<AdminAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [statsRes, appointmentsRes] = await Promise.all([
        fetch(`${API_URL}/appointments/stats`, { headers }),
        fetch(`${API_URL}/appointments`, { headers }),
      ]);

      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
      if (appointmentsRes.ok) {
        setAppointments(await appointmentsRes.json());
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const appointmentsBySpecialty = useMemo(() => {
    const counts = new Map<string, number>();
    appointments.forEach((appt) => {
      const name = appt.doctor?.specialty?.name ?? t('admin.chart.unknown');
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([specialty, count]) => ({ specialty, count }))
      .sort((a, b) => b.count - a.count);
  }, [appointments, t]);

  const appointmentsByDay = useMemo(() => {
    const days = weekdays(locale, 'short');
    const counts = new Array(7).fill(0);
    appointments.forEach((appt) => {
      counts[new Date(appt.date).getDay()] += 1;
    });
    return days.map((day, i) => ({ day, count: counts[i] }));
  }, [appointments, locale]);

  const tabs = [
    { id: 'overview' as TabType, label: t('admin.tab.overview'), icon: TrendingUp },
    { id: 'doctors' as TabType, label: t('admin.tab.doctors'), icon: UserCog },
    { id: 'calendar' as TabType, label: t('admin.tab.calendar'), icon: CalendarCheck },
    { id: 'users' as TabType, label: t('admin.tab.users'), icon: Users },
  ];

  const statsCards = [
    { label: t('admin.stat.total'), value: stats.total, color: 'text-gray-800', icon: Calendar, iconColor: 'text-blue-600 opacity-20' },
    { label: t('admin.stat.confirmed'), value: stats.confirmed, color: 'text-green-600', icon: Activity, iconColor: 'text-green-600 opacity-20' },
    { label: t('admin.stat.pending'), value: stats.pending, color: 'text-yellow-600', icon: Calendar, iconColor: 'text-yellow-600 opacity-20' },
    { label: t('admin.stat.cancelled'), value: stats.cancelled, color: 'text-red-600', icon: Calendar, iconColor: 'text-red-600 opacity-20' },
  ];

  const quickActions = [
    {
      onClick: () => setActiveTab('doctors'),
      bg: 'bg-blue-50 hover:bg-blue-100',
      icon: UserCog,
      iconColor: 'text-blue-600',
      title: t('admin.quick.doctors'),
      text: t('admin.quick.doctorsText'),
    },
    {
      onClick: () => setActiveTab('calendar'),
      bg: 'bg-purple-50 hover:bg-purple-100',
      icon: CalendarCheck,
      iconColor: 'text-purple-600',
      title: t('admin.quick.calendar'),
      text: t('admin.quick.calendarText'),
    },
    {
      onClick: () => setActiveTab('overview'),
      bg: 'bg-green-50 hover:bg-green-100',
      icon: Activity,
      iconColor: 'text-green-600',
      title: t('admin.quick.reports'),
      text: t('admin.quick.reportsText'),
    },
  ];

  return (
    <div className="py-8 space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Users className="w-8 h-8 text-blue-600" />
          <h2 className="text-3xl font-bold text-gray-800">{t('admin.title')}</h2>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
          title={t('nav.logoutFull')}
        >
          <LogOut className="w-4 h-4" />
          <span className="font-medium">{t('nav.logout')}</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {statsCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{card.label}</p>
                      <p className={`text-3xl font-bold mt-1 ${card.color}`}>
                        {loading ? '...' : card.value}
                      </p>
                    </div>
                    <Icon className={`w-12 h-12 ${card.iconColor}`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">{t('admin.chart.specialty')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={appointmentsBySpecialty}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="specialty" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#3B82F6" name={t('admin.chart.turnos')} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">{t('admin.chart.day')}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={appointmentsByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} name={t('admin.chart.turnos')} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">{t('admin.quick.title')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.title}
                    onClick={action.onClick}
                    className={`flex items-center gap-3 p-4 rounded-lg transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] text-left ${action.bg}`}
                  >
                    <Icon className={`w-8 h-8 ${action.iconColor}`} />
                    <div>
                      <p className="font-medium text-gray-900">{action.title}</p>
                      <p className="text-sm text-gray-600">{action.text}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'doctors' && <DoctorManagement />}
      {activeTab === 'calendar' && <AppointmentsCalendar />}
      {activeTab === 'users' && <UserManagement />}
    </div>
  );
};

export default AdminDashboard;