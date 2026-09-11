import React, { useState, useEffect } from 'react';
import { appointmentService } from '../services/appointmentService';
import { AppointmentWithDetails } from '../types/doctor';
import { Calendar, ChevronLeft, ChevronRight, Clock, User, Stethoscope, Phone, Mail, X } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { formatTime, formatMonth, formatDate, weekdays } from '../utils/format';
import Banner from './ui/Banner';
import Spinner from './ui/Spinner';

const STATUS_COLOR: Record<string, string> = {
  CONFIRMED: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  CANCELLED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
};

export default function AppointmentsCalendar() {
  const { t, locale } = useI18n();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const dayLabels = weekdays(locale, 'narrow');

  useEffect(() => {
    loadAppointments();
  }, [selectedDate]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const data = await appointmentService.getByDate(selectedDate);
      setAppointments(data);
    } catch (err) {
      setError(t('calendar.errorLoad'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (id: string) => {
    if (!window.confirm(t('calendar.confirmCancel'))) return;

    try {
      await appointmentService.cancel(id);
      await loadAppointments();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('calendar.errorCancel'));
    }
  };

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const generateCalendarDays = () => {
    const days: (number | null)[] = [];
    const firstDay = firstDayOfMonth(currentMonth);
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let day = 1; day <= daysInMonth(currentMonth); day++) days.push(day);
    return days;
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const now = new Date();
    return day === now.getDate() && currentMonth.getMonth() === now.getMonth() && currentMonth.getFullYear() === now.getFullYear();
  };

  const isSelectedDate = (day: number | null) => {
    if (!day) return false;
    return day === selectedDate.getDate() && currentMonth.getMonth() === selectedDate.getMonth() && currentMonth.getFullYear() === selectedDate.getFullYear();
  };

  const selectDay = (day: number) => setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day));
  const previousMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t('calendar.title')}</h2>
        <p className="text-gray-600 mt-1">{t('calendar.subtitle')}</p>
      </div>

      {error && <Banner variant="error">{error}</Banner>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">{formatMonth(currentMonth, locale)}</h3>
            <div className="flex gap-2">
              <button onClick={previousMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayLabels.map((day, i) => (
              <div key={i} className="text-center text-xs font-medium text-gray-500 py-2">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {generateCalendarDays().map((day, index) => (
              <button
                key={index}
                onClick={() => day && selectDay(day)}
                disabled={!day}
                className={`
                  aspect-square flex items-center justify-center rounded-lg text-sm transition-colors
                  ${!day ? 'invisible' : ''}
                  ${isToday(day) ? 'bg-blue-100 text-blue-900 font-bold' : ''}
                  ${isSelectedDate(day) ? 'bg-blue-600 text-white font-bold' : ''}
                  ${!isToday(day) && !isSelectedDate(day) ? 'hover:bg-gray-100' : ''}
                `}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Appointments List */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">{formatDate(selectedDate, locale)}</h3>
            <span className="text-sm text-gray-500">
              {t('common.appointmentCount', { n: appointments.length })}
            </span>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <Spinner />
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t('common.noAppointments')}</h3>
              <p className="mt-1 text-sm text-gray-500">{t('common.noAppointmentsDay')}</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {appointments
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                .map((appointment) => (
                  <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Clock className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-lg">
                            {formatTime(appointment.date, locale)}
                          </p>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[appointment.status] || 'bg-gray-100 text-gray-800'}`}>
                            {t(`status.${appointment.status.toLowerCase()}`)}
                          </span>
                        </div>
                      </div>

                      {appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleCancelAppointment(appointment.id)}
                          className="text-red-600 hover:text-red-800 p-2 transition-colors"
                          title={t('calendar.cancelTitle')}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pl-12">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{appointment.patientName}</span>
                        </div>
                        {appointment.patientEmail && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{appointment.patientEmail}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{appointment.patientPhone}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Stethoscope className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{appointment.doctor?.name}</span>
                        </div>
                        <div className="text-sm text-gray-600 pl-6">{appointment.doctor?.specialty?.name}</div>
                        <div className="text-sm text-gray-600 pl-6">{appointment.doctor?.hospital}</div>
                      </div>
                    </div>

                    {appointment.notes && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">{t('common.notes')}:</span> {appointment.notes}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}