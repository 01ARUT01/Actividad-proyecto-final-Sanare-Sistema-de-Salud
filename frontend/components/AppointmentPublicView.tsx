import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, MapPin, User, Phone, Mail, AlertCircle, CheckCircle, XCircle,
} from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { formatDate, formatTime } from '../utils/format';
import { API_URL, readErrorMessage } from '../services/apiConfig';
import Button from './ui/Button';
import Banner from './ui/Banner';
import Spinner from './ui/Spinner';

interface AppointmentDetails {
  id: string;
  patientName: string;
  patientEmail: string | null;
  patientPhone: string;
  date: string;
  notes: string | null;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  doctor: {
    id: string;
    name: string;
    hospital: string;
    specialty: {
      name: string;
    };
  };
}

const AppointmentPublicView: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    loadAppointment();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'cancel') {
      setShowCancelDialog(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadAppointment = async () => {
    if (!token) {
      setError(t('public.invalidToken'));
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/appointments-public/token/${token}`);
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, t('public.errorLoad')));
      }
      const data = await response.json();
      setAppointment(data);
    } catch (err: any) {
      setError(err.message || t('public.errorLoadGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!token) {
      return;
    }

    setShowCancelDialog(false);
    setCancelling(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/appointments-public/cancel/${token}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, t('public.errorCancel')));
      }

      setCancelled(true);
      await loadAppointment();
    } catch (err: any) {
      setError(err.message || t('public.errorCancel'));
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <Spinner label={t('public.loading')} />
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full animate-fade-up">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('public.errorTitle')}</h2>
            <p className="text-gray-600 mb-6">{error || t('public.notFound')}</p>
            <Button onClick={() => navigate('/')}>{t('public.backHome')}</Button>
          </div>
        </div>
      </div>
    );
  }

  const formattedDate = formatDate(appointment.date, locale);
  const formattedTime = formatTime(appointment.date, locale);
  const appointmentDate = new Date(appointment.date);
  const isPast = appointmentDate < new Date();
  const canCancel =
    appointment.status !== 'CANCELLED' &&
    appointment.status !== 'COMPLETED' &&
    !isPast;

  const statusConfig: Record<AppointmentDetails['status'], { headerKey: string; bg: string }> = {
    PENDING: { headerKey: 'public.headerPending', bg: 'bg-yellow-500' },
    CONFIRMED: { headerKey: 'public.headerConfirmed', bg: 'bg-green-500' },
    CANCELLED: { headerKey: 'public.headerCancelled', bg: 'bg-red-500' },
    COMPLETED: { headerKey: 'public.headerCompleted', bg: 'bg-blue-500' },
  };
  const isCancelled = appointment.status === 'CANCELLED';
  const isPending = appointment.status === 'PENDING';

  const infoRows = [
    {
      icon: <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />,
      label: t('public.dateTime'),
      value: <p className="text-lg text-gray-900 capitalize">{formattedDate} · {formattedTime}</p>,
    },
    {
      icon: <User className="w-5 h-5 text-gray-400 mt-0.5" />,
      label: t('common.doctor'),
      value: (
        <>
          <p className="text-lg text-gray-900">{appointment.doctor.name}</p>
          <p className="text-sm text-gray-600">{appointment.doctor.specialty.name}</p>
        </>
      ),
    },
    {
      icon: <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />,
      label: t('common.hospital'),
      value: <p className="text-lg text-gray-900">{appointment.doctor.hospital}</p>,
    },
  ];

  const patientRows = [
    {
      icon: <User className="w-5 h-5 text-gray-400 mt-0.5" />,
      label: t('common.name'),
      value: <p className="text-lg text-gray-900">{appointment.patientName}</p>,
    },
    {
      icon: <Phone className="w-5 h-5 text-gray-400 mt-0.5" />,
      label: t('common.phone'),
      value: <p className="text-lg text-gray-900">{appointment.patientPhone}</p>,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && canCancel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fade-up">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <h3 className="text-xl font-bold text-gray-900">{t('public.cancelTitle')}</h3>
            </div>
            <p className="text-gray-600 mb-6">{t('public.cancelConfirm')}</p>
            <div className="flex space-x-3">
              <Button
                variant="secondary"
                full
                onClick={() => setShowCancelDialog(false)}
              >
                {t('public.cancelKeep')}
              </Button>
              <Button variant="danger" full onClick={handleCancel}>
                {t('public.cancelYes')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-fade-up">
          {/* Header */}
          <div className={`px-8 py-6 ${statusConfig[appointment.status].bg}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-white">
                {isCancelled ? (
                  <XCircle className="w-8 h-8" />
                ) : isPending ? (
                  <Clock className="w-8 h-8" />
                ) : (
                  <CheckCircle className="w-8 h-8" />
                )}
                <div>
                  <h1 className="text-2xl font-bold">
                    {t(statusConfig[appointment.status].headerKey)}
                  </h1>
                  <p className="text-sm opacity-90">ID: {appointment.id.slice(0, 8)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Success Message after cancellation */}
          {cancelled && (
            <div className="mx-8 mt-6">
              <Banner variant="success">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <p>{t('public.cancelledMessage')}</p>
                </div>
              </Banner>
            </div>
          )}

          {/* Error Message */}
          {error && !cancelled && (
            <div className="mx-8 mt-6">
              <Banner variant="error">{error}</Banner>
            </div>
          )}

          {/* Content */}
          <div className="p-8 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('public.details')}</h2>
              <div className="space-y-4">
                {infoRows.map((row) => (
                  <div key={row.label} className="flex items-start space-x-3">
                    <span className="mt-0.5 flex">{row.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-500">{row.label}</p>
                      {row.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('public.patientData')}</h2>
              <div className="space-y-4">
                {patientRows.map((row) => (
                  <div key={row.label} className="flex items-start space-x-3">
                    <span className="mt-0.5 flex">{row.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-500">{row.label}</p>
                      {row.value}
                    </div>
                  </div>
                ))}

                {appointment.patientEmail && (
                  <div className="flex items-start space-x-3">
                    <span className="mt-0.5 flex">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-500">{t('common.email')}</p>
                      <p className="text-lg text-gray-900">{appointment.patientEmail}</p>
                    </div>
                  </div>
                )}
              </div>

              {appointment.notes && (
                <div className="mt-4 bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-500 mb-1">{t('common.notes')}</p>
                  <p className="text-gray-900">{appointment.notes}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t pt-6 space-y-4">
              {canCancel && (
                <Button
                  onClick={() => setShowCancelDialog(true)}
                  disabled={cancelling}
                  variant="danger"
                  full
                >
                  {cancelling ? (
                    <>
                      <Clock className="w-5 h-5 animate-spin" />
                      <span>{t('public.cancelling')}</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      <span>{t('public.cancelTitle')}</span>
                    </>
                  )}
                </Button>
              )}

              {appointment.status === 'CANCELLED' && (
                <Banner variant="warning">{t('public.cancelledBanner')}</Banner>
              )}

              {isPast && appointment.status !== 'CANCELLED' && (
                <Banner variant="info">{t('public.pastBanner')}</Banner>
              )}

              <Button onClick={() => navigate('/')} full>
                {t('public.backHome')}
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>{t('public.footer', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </div>
  );
};

export default AppointmentPublicView;