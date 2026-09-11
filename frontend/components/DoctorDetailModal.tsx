import React, { useState, useEffect } from 'react';
import { Doctor, AppointmentWithDetails } from '../types/doctor';
import { appointmentService } from '../services/appointmentService';
import {
  X, User, Mail, Phone, Building, Stethoscope, Calendar,
  ChevronLeft, ChevronRight, Clock,
} from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { formatTime, formatMonth, formatDate, weekdays } from '../utils/format';
import Spinner from './ui/Spinner';

interface DoctorDetailModalProps {
  doctor: Doctor;
  onClose: () => void;
}

const STATUS_COLOR: Record<string, string> = {
  CONFIRMED: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  CANCELLED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
};

export default function DoctorDetailModal({ doctor, onClose }: DoctorDetailModalProps) {
  const { t, locale } = useI18n();
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const dayLabels = weekdays(locale, 'narrow');

  useEffect(() => {
    loadAllAppointments();
  }, [doctor.id]);

  const loadAllAppointments = async () => {
    try {
      setLoading(true);
      const allAppointments = await appointmentService.getAll();
      setAppointments(allAppointments.filter((apt) => apt.doctorId === doctor.id));
    } catch (error) {
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAppointmentsForDate = (date: Date): AppointmentWithDetails[] => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return appointments.filter((apt) => {
      const aptDate = new Date(apt.date);
      return aptDate >= startOfDay && aptDate <= endOfDay;
    });
  };

  const getAppointmentsForMonth = (date: Date): Map<number, number> => {
    const map = new Map<number, number>();
    appointments.forEach((apt) => {
      const d = new Date(apt.date);
      if (d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear()) {
        const day = d.getDate();
        map.set(day, (map.get(day) || 0) + 1);
      }
    });
    return map;
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

  const dayAppointments = getAppointmentsForDate(selectedDate);
  const monthAppointments = getAppointmentsForMonth(currentMonth);

  const infoItems = [
    { icon: <User className="w-5 h-5 text-blue-600" />, label: t('common.doctor'), value: doctor.name },
    { icon: <Stethoscope className="w-5 h-5 text-blue-600" />, label: t('common.specialty'), value: doctor.specialty?.name },
    { icon: <Building className="w-5 h-5 text-blue-600" />, label: t('common.hospital'), value: doctor.hospital },
    { icon: <Mail className="w-5 h-5 text-blue-600" />, label: t('common.email'), value: doctor.email },
    { icon: <Phone className="w-5 h-5 text-blue-600" />, label: t('common.phone'), value: doctor.phone },
    { icon: <Calendar className="w-5 h-5 text-blue-600" />, label: t('modal.totalAppointments'), value: t('common.appointmentCount', { n: appointments.length }) },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-start z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{doctor.name}</h2>
            <p className="text-gray-600 mt-1">{t('modal.subtitle')}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Doctor Info Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {infoItems.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span>{item.icon}</span>
                  <div>
                    <p className="text-sm text-gray-600">{item.label}</p>
                    <p className="font-medium text-gray-900">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar and Appointments Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {formatMonth(currentMonth, locale)}
                </h3>
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
                {generateCalendarDays().map((day, index) => {
                  const count = day ? monthAppointments.get(day) || 0 : 0;
                  return (
                    <button
                      key={index}
                      onClick={() => day && selectDay(day)}
                      disabled={!day}
                      className={`
                        relative aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors
                        ${!day ? 'invisible' : ''}
                        ${isToday(day) ? 'bg-blue-100 text-blue-900 font-bold' : ''}
                        ${isSelectedDate(day) ? 'bg-blue-600 text-white font-bold' : ''}
                        ${!isToday(day) && !isSelectedDate(day) ? 'hover:bg-gray-100' : ''}
                      `}
                    >
                      <span>{day}</span>
                      {count > 0 && (
                        <span className={`text-xs mt-0.5 ${isSelectedDate(day) ? 'text-blue-200' : 'text-blue-600'}`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Daily Appointments */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {formatDate(selectedDate, locale)}
                </h3>
                <span className="text-sm text-gray-500">
                  {t('common.appointmentCount', { n: dayAppointments.length })}
                </span>
              </div>

              {loading ? (
                <div className="py-12 flex justify-center">
                  <Spinner />
                </div>
              ) : dayAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">{t('common.noAppointments')}</h3>
                  <p className="mt-1 text-sm text-gray-500">{t('modal.noAppointmentsText')}</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto">
                  {dayAppointments
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((appointment) => (
                      <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 bg-blue-100 rounded-lg flex flex-col items-center justify-center">
                            <Clock className="w-5 h-5 text-blue-600 mb-1" />
                            <span className="text-xs font-semibold text-blue-900">
                              {formatTime(appointment.date, locale)}
                            </span>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-semibold text-gray-900">{appointment.patientName}</p>
                                <p className="text-sm text-gray-600">{appointment.patientPhone}</p>
                                {appointment.patientEmail && (
                                  <p className="text-sm text-gray-600">{appointment.patientEmail}</p>
                                )}
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLOR[appointment.status] || 'bg-gray-100 text-gray-800'}`}>
                                {t(`status.${appointment.status.toLowerCase()}`)}
                              </span>
                            </div>

                            {appointment.notes && (
                              <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                                <span className="font-medium">{t('common.notes')}:</span> {appointment.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}