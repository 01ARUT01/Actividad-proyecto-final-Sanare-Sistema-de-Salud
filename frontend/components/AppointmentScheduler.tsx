import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Loader2, MapPin } from 'lucide-react';
import { Doctor, Specialty } from '../types/doctor';
import { doctorService } from '../services/doctorService';
import { appointmentService } from '../services/appointmentService';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { weekdays, formatDate, formatMonth, formatTime } from '../utils/format';
import Button from './ui/Button';
import Field from './ui/Field';
import Select from './ui/Select';
import Banner from './ui/Banner';
import Spinner from './ui/Spinner';

interface AvailableSlot {
  id: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

const AppointmentScheduler: React.FC = () => {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string>('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState({
    specialties: true,
    doctors: false,
    slots: false,
    booking: false,
  });
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [error, setError] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    };
  }, []);

  // Cargar especialidades al montar
  useEffect(() => {
    const loadSpecialties = async () => {
      try {
        const data = await doctorService.getSpecialties();
        setSpecialties(data);
      } catch (err) {
        setError(t('booking.errorSpecialties'));
        console.error(err);
      } finally {
        setLoading((prev) => ({ ...prev, specialties: false }));
      }
    };

    loadSpecialties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prellenar datos del usuario si está autenticado
  useEffect(() => {
    if (user) {
      setPatientName(`${user.firstName || ''} ${user.lastName || ''}`.trim());
      setPatientEmail(user.email || '');
      setPatientPhone(user.phone || '');
    }
  }, [user]);

  // Cargar doctores cuando cambia la especialidad
  useEffect(() => {
    const loadDoctors = async () => {
      if (!selectedSpecialtyId) {
        setDoctors([]);
        setSelectedDoctor(null);
        return;
      }

      setLoading((prev) => ({ ...prev, doctors: true }));
      setError('');

      try {
        const data = await doctorService.getAll(selectedSpecialtyId);
        setDoctors(data);
      } catch (err) {
        setError(t('booking.errorDoctors'));
        console.error(err);
      } finally {
        setLoading((prev) => ({ ...prev, doctors: false }));
      }
    };

    loadDoctors();
  }, [selectedSpecialtyId, t]);

  // Cargar slots disponibles cuando se selecciona un médico y una fecha
  useEffect(() => {
    const loadAvailableSlots = async () => {
      if (!selectedDoctor || !selectedDate) {
        setAvailableSlots([]);
        setSelectedSlot(null);
        return;
      }

      setLoading((prev) => ({ ...prev, slots: true }));
      setError('');

      try {
        const slots = await doctorService.getAvailableSlots(selectedDoctor.id, selectedDate);

        const sortedSlots = [...slots].sort(
          (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
        );

        const now = new Date();
        const futureSlots = sortedSlots.filter((slot) => new Date(slot.startTime) > now);

        setAvailableSlots(futureSlots);
      } catch (err: any) {
        setError(err.message || t('booking.errorSlots'));
        console.error(err);
      } finally {
        setLoading((prev) => ({ ...prev, slots: false }));
      }
    };

    loadAvailableSlots();
  }, [selectedDoctor, selectedDate, t]);

  // Generar días del mes para el calendario
  const generateCalendarDays = (): (Date | null)[] => {
    if (!selectedDoctor) return [];

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDoctor || !selectedSlot || !patientName || !patientPhone) {
      setError(t('booking.errorRequired'));
      return;
    }

    setLoading((prev) => ({ ...prev, booking: true }));
    setError('');

    try {
      await appointmentService.create({
        doctorId: selectedDoctor.id,
        patientName,
        patientPhone,
        patientEmail: patientEmail || undefined,
        date: selectedSlot.startTime,
        notes: notes || undefined,
      });

      setLoading((prev) => ({ ...prev, booking: false }));
      setBookingSuccess(true);

      if (successTimer.current) clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => {
        setBookingSuccess(false);
        setSelectedSlot(null);
        setSelectedDate(null);
        setNotes('');
      }, 3000);
    } catch (err: any) {
      setLoading((prev) => ({ ...prev, booking: false }));
      setError(err.message || t('booking.errorBooking'));
      console.error(err);
    }
  };

  // Navegar al mes anterior/siguiente
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const dayHeaders = weekdays(locale).map((d) => d.charAt(0).toUpperCase() + d.slice(1));
  const monthLabel = formatMonth(currentMonth, locale);
  const inputBase =
    'w-full p-3 border border-gray-300 rounded-lg transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none';

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-fade-up">
        <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <h1 className="text-2xl font-bold">{t('booking.title')}</h1>
          <p className="text-blue-100">{t('booking.subtitle')}</p>
        </div>

        {error && (
          <div className="mt-6 mx-6">
            <Banner variant="error">{error}</Banner>
          </div>
        )}

        {bookingSuccess && (
          <div className="mt-6 mx-6">
            <Banner variant="success">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                <p>{t('booking.success')}</p>
              </div>
            </Banner>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Paso 1: Seleccionar especialidad */}
          <fieldset className="space-y-4 min-w-0">
            <legend className="text-lg font-semibold text-gray-800">{t('booking.step1')}</legend>
            <div className="relative">
              <Select
                value={selectedSpecialtyId}
                onChange={(e) => {
                  setSelectedSpecialtyId(e.target.value);
                  setSelectedDoctor(null);
                  setSelectedDate(null);
                  setSelectedSlot(null);
                }}
                disabled={loading.specialties || loading.doctors}
                required
              >
                <option value="">{t('booking.specialtyPlaceholder')}</option>
                {specialties.map((specialty) => (
                  <option key={specialty.id} value={specialty.id}>
                    {specialty.name}
                  </option>
                ))}
              </Select>
              {loading.specialties && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                </div>
              )}
            </div>
          </fieldset>

          {/* Paso 2: Seleccionar médico */}
          {selectedSpecialtyId && (
            <fieldset className="space-y-4 min-w-0">
              <legend className="text-lg font-semibold text-gray-800">{t('booking.step2')}</legend>
              {loading.doctors ? (
                <Spinner className="py-8" />
              ) : doctors.length === 0 ? (
                <Banner variant="warning">{t('booking.noDoctors')}</Banner>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {doctors.map((doctor) => (
                    <button
                      key={doctor.id}
                      type="button"
                      onClick={() => {
                        setSelectedDoctor(doctor);
                        setSelectedDate(null);
                        setSelectedSlot(null);
                      }}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] text-left focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        selectedDoctor?.id === doctor.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <h3 className="font-semibold text-gray-800">{doctor.name}</h3>
                      <p className="text-sm text-gray-600 flex items-center mt-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        {doctor.hospital}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {doctor.specialty?.name || t('booking.noSpecialty')}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </fieldset>
          )}

          {/* Paso 3: Seleccionar fecha */}
          {selectedDoctor && (
            <fieldset className="space-y-4 min-w-0">
              <legend className="text-lg font-semibold text-gray-800">{t('booking.step3')}</legend>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => navigateMonth('prev')}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={t('common.previousMonth')}
                  >
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h3 className="font-semibold text-gray-800">{monthLabel}</h3>
                  <button
                    type="button"
                    onClick={() => navigateMonth('next')}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={t('common.nextMonth')}
                  >
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {dayHeaders.map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {generateCalendarDays().map((date, index) => {
                    if (!date) {
                      return <div key={`empty-${index}`} className="h-10" />;
                    }

                    const isToday = new Date().toDateString() === date.toDateString();
                    const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();
                    const isPast = date < new Date() && !isToday;

                    return (
                      <button
                        key={date.toISOString()}
                        type="button"
                        onClick={() => {
                          setSelectedDate(date);
                          setSelectedSlot(null);
                        }}
                        disabled={isPast}
                        className={`h-10 rounded-lg flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isSelected
                            ? 'bg-blue-600 text-white scale-105'
                            : isToday
                            ? 'bg-blue-100 text-blue-800'
                            : isPast
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </fieldset>
          )}

          {/* Paso 4: Seleccionar horario */}
          {selectedDate && (
            <fieldset className="space-y-4 min-w-0">
              <legend className="text-lg font-semibold text-gray-800">
                {t('booking.step4', { date: formatDate(selectedDate, locale) })}
              </legend>
              {loading.slots ? (
                <Spinner className="py-8" />
              ) : availableSlots.length === 0 ? (
                <Banner variant="warning">{t('booking.noSlotsHint')}</Banner>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-md font-medium text-gray-700">{t('booking.slotsTitle')}</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 border rounded-lg text-center transition-all duration-200 hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          selectedSlot?.id === slot.id
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                      >
                        <span className="font-medium">{formatTime(slot.startTime, locale)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </fieldset>
          )}

          {/* Paso 5: Datos del paciente */}
          {selectedSlot && (
            <fieldset className="space-y-4 min-w-0">
              <legend className="text-lg font-semibold text-gray-800">{t('booking.step5')}</legend>
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <Field id="patientName" label={t('booking.fullName')} required>
                  <input
                    type="text"
                    id="patientName"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    className={inputBase}
                    required
                  />
                </Field>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field id="patientPhone" label={t('common.phone')} required>
                    <input
                      type="tel"
                      id="patientPhone"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      className={inputBase}
                      required
                    />
                  </Field>

                  <Field id="patientEmail" label={t('common.email')}>
                    <input
                      type="email"
                      id="patientEmail"
                      value={patientEmail}
                      onChange={(e) => setPatientEmail(e.target.value)}
                      className={inputBase}
                    />
                  </Field>
                </div>

                <Field id="notes" label={t('booking.notesLabel')}>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className={inputBase}
                    placeholder={t('booking.notesPlaceholder')}
                  />
                </Field>

                <div className="pt-2">
                  <Button type="submit" full loading={loading.booking} size="lg">
                    {loading.booking ? t('booking.processing') : t('booking.submit')}
                  </Button>
                </div>
              </div>
            </fieldset>
          )}
        </form>
      </div>
    </div>
  );
};

export default AppointmentScheduler;