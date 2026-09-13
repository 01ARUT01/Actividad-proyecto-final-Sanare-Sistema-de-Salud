import React, { useEffect, useState } from 'react';
import { Send, AlertCircle, CheckCircle, Loader, Stethoscope } from 'lucide-react';
import { analyzeSymptoms } from '../services/geminiService';
import { useI18n } from '../context/I18nContext';
import { useAuth } from '../context/AuthContext';
import { appointmentService } from '../services/appointmentService';
import { UserRole } from '../types/auth';
import { AppointmentWithDetails } from '../types/doctor';
import { TriageResult } from '../types';
import Button from './ui/Button';
import Banner from './ui/Banner';

const TriageChat: React.FC = () => {
  const [symptoms, setSymptoms] = useState('');
  const [result, setResult] = useState<TriageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const { t } = useI18n();
  const { user } = useAuth();
  const isDoctor = user?.role === UserRole.DOCTOR;

  useEffect(() => {
    if (!isDoctor) {
      setTodayAppointments([]);
      return;
    }

    let isMounted = true;

    const loadTodayAppointments = async () => {
      try {
        setLoadingAppointments(true);
        const appointments = await appointmentService.getAll();

        if (!isMounted) {
          return;
        }

        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        const filtered = appointments.filter((appointment) => {
          const appointmentDate = new Date(appointment.date);
          return appointmentDate >= startOfDay && appointmentDate <= endOfDay;
        });

        setTodayAppointments(filtered);
      } catch (err) {
        console.error('Error loading today appointments:', err);
      } finally {
        if (isMounted) {
          setLoadingAppointments(false);
        }
      }
    };

    void loadTodayAppointments();

    return () => {
      isMounted = false;
    };
  }, [isDoctor]);

  const handleAnalyze = async () => {
    if (!symptoms.trim()) {
      setError(t('triage.errorEmpty'));
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const triageResult = await analyzeSymptoms(symptoms);
      setResult(triageResult);
    } catch (err) {
      setError(t('triage.errorAnalyze'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Alta':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'Media':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Baja':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8 animate-fade-up">
        <div className="flex items-center space-x-3 mb-6">
          <Stethoscope className="w-8 h-8 text-blue-600" />
          <h2 className="text-3xl font-bold text-gray-800">{t('triage.title')}</h2>
        </div>

        <p className="text-gray-600 mb-6">{t('triage.subtitle')}</p>

        {isDoctor && (
          <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-gray-800">Turnos de hoy</h3>
              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                {loadingAppointments ? 'Cargando...' : `${todayAppointments.length} turnos`}
              </span>
            </div>

            {loadingAppointments ? (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                <Loader className="w-4 h-4 animate-spin" />
                Revisando tu agenda...
              </div>
            ) : todayAppointments.length === 0 ? (
              <p className="mt-3 text-sm text-gray-600">
                Hoy no tenés turnos programados.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {todayAppointments.map((appointment) => (
                  <li
                    key={appointment.id}
                    className="rounded-lg border border-blue-100 bg-white px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-800">{appointment.patientName}</p>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                        {appointment.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(appointment.date).toLocaleTimeString('es-AR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('triage.label')}
            </label>
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder={t('triage.placeholder')}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none resize-none"
              rows={5}
              disabled={loading}
            />
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={loading || !symptoms.trim()}
            full
            size="lg"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                <span>{t('triage.analyzing')}</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>{t('triage.analyze')}</span>
              </>
            )}
          </Button>
        </div>

        {error && (
          <div className="mt-6">
            <Banner variant="error">{error}</Banner>
          </div>
        )}

        {result && (
          <div className="mt-8 space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start space-x-3 mb-4">
                <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">
                    {t('triage.resultTitle')}
                  </h3>
                  <p className="text-gray-600">{result.reasoning}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mt-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">{t('triage.recommended')}</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {result.recommendedSpecialty}
                  </p>
                </div>

                <div className={`rounded-lg p-4 border ${getUrgencyColor(result.urgency)}`}>
                  <p className="text-sm mb-1">{t('triage.urgency')}</p>
                  <p className="text-lg font-semibold">{result.urgency}</p>
                </div>
              </div>

              <div className="mt-6 bg-white rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-gray-600 mb-2">{t('triage.nextSteps')}</p>
                <p className="text-gray-700">
                  {t('triage.nextStepsText', {
                    section: t('nav.booking'),
                    specialty: result.recommendedSpecialty,
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6">
          <Banner variant="warning">{t('triage.warning')}</Banner>
        </div>
      </div>
    </div>
  );
};

export default TriageChat;