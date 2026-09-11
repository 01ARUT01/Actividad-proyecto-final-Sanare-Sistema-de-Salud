import React, { useEffect, useState } from 'react';
import { Clock3, Users, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { appointmentService } from '../services/appointmentService';
import { doctorService } from '../services/doctorService';
import { Specialty } from '../types/doctor';
import Button from './ui/Button';
import Banner from './ui/Banner';

const WaitlistSubscription: React.FC = () => {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loadingSpecialties, setLoadingSpecialties] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [form, setForm] = useState({
    specialtyId: '',
    patientName: '',
    patientPhone: '',
    patientEmail: '',
  });

  useEffect(() => {
    const loadSpecialties = async () => {
      try {
        const data = await doctorService.getSpecialties();
        setSpecialties(data);
      } catch (err) {
        console.error(err);
        setError('No se pudieron cargar las especialidades disponibles.');
      } finally {
        setLoadingSpecialties(false);
      }
    };

    loadSpecialties();
  }, []);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.specialtyId || !form.patientName || !form.patientPhone) {
      setError('Completa especialidad, nombre y teléfono para inscribirte.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await appointmentService.createWaitingList({
        specialtyId: form.specialtyId,
        patientName: form.patientName,
        patientEmail: form.patientEmail || undefined,
        patientPhone: form.patientPhone,
      });

      setSuccess('Te inscribiste correctamente en la lista de espera. Cuando haya disponibilidad, te avisaremos.');
      setForm({
        specialtyId: '',
        patientName: '',
        patientPhone: '',
        patientEmail: '',
      });
    } catch (err: any) {
      setError(err.message || 'No se pudo registrar tu solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-fade-up">
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-6 text-white">
          <div className="flex items-center gap-3">
            <Clock3 className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Lista de Espera Activa</h1>
              <p className="text-green-100">Si no hay turnos disponibles, deja tu solicitud y te contactaremos cuando se libere uno.</p>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
                <select
                  value={form.specialtyId}
                  onChange={(e) => handleChange('specialtyId', e.target.value)}
                  disabled={loadingSpecialties}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                >
                  <option value="">Selecciona una especialidad</option>
                  {specialties.map((specialty) => (
                    <option key={specialty.id} value={specialty.id}>
                      {specialty.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={form.patientName}
                  onChange={(e) => handleChange('patientName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                  placeholder="Ej: Camilo Hernández"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={form.patientPhone}
                    onChange={(e) => handleChange('patientPhone', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                    placeholder="Ej: +54 11 1234-5678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.patientEmail}
                    onChange={(e) => handleChange('patientEmail', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
                    placeholder="Ej: tu@email.com"
                  />
                </div>
              </div>

              {error && (
                <Banner variant="error">
                  {error}
                </Banner>
              )}

              {success && (
                <Banner variant="success">
                  {success}
                </Banner>
              )}

              <Button type="submit" full size="lg" loading={loading} disabled={loadingSpecialties}>
                <Send className="w-5 h-5" />
                {loading ? 'Guardando solicitud...' : 'Unirme a la lista de espera'}
              </Button>
            </form>

            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-6 h-6 text-green-700" />
                  <h3 className="font-semibold text-green-900">¿Cómo funciona?</h3>
                </div>
                <ul className="text-sm text-green-800 space-y-2">
                  <li>• Elegís la especialidad que te interesa.</li>
                  <li>• Dejás tus datos para ser contactado.</li>
                  <li>• Cuando alguien cancela, la primera persona en la cola recibe la notificación.</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="w-6 h-6 text-blue-700" />
                  <h3 className="font-semibold text-blue-900">Recomendación</h3>
                </div>
                <p className="text-sm text-blue-800">
                  Si querés agendar rápido, podés usar el triaje inteligente o ir directamente a reservar turno.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle className="w-6 h-6 text-yellow-700" />
                  <h3 className="font-semibold text-yellow-900">Importante</h3>
                </div>
                <p className="text-sm text-yellow-800">
                  Este flujo está preparado para demo y para el backend real, con notificaciones de lista de espera activas en la lógica del sistema.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitlistSubscription;
