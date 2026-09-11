import React, { useState, useEffect } from 'react';
import { doctorService } from '../services/doctorService';
import { Doctor, CreateDoctorData, Specialty } from '../types/doctor';
import { Plus, Edit, Trash2, X, UserPlus, Mail, Phone, Building, Stethoscope } from 'lucide-react';
import DoctorDetailModal from './DoctorDetailModal';
import { useI18n } from '../context/I18nContext';
import Button from './ui/Button';
import Field from './ui/Field';
import Banner from './ui/Banner';
import Spinner from './ui/Spinner';

export default function DoctorManagement() {
  const { t } = useI18n();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [viewingDoctor, setViewingDoctor] = useState<Doctor | null>(null);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<CreateDoctorData>({
    name: '',
    email: '',
    phone: '',
    hospital: '',
    specialtyId: '',
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [doctorsData, specialtiesData] = await Promise.all([
        doctorService.getAll(),
        doctorService.getSpecialties(),
      ]);
      setDoctors(doctorsData);
      setSpecialties(specialtiesData);
    } catch (err) {
      setError(t('doctors.errorLoad'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (editingDoctor) {
        await doctorService.update(editingDoctor.id, formData);
      } else {
        await doctorService.create(formData);
      }

      await loadData();
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('doctors.errorSave'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('doctors.confirmDelete'))) return;

    try {
      await doctorService.delete(id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('doctors.errorDelete'));
    }
  };

  const openModal = (doctor?: Doctor) => {
    if (doctor) {
      setEditingDoctor(doctor);
      setFormData({
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        hospital: doctor.hospital,
        specialtyId: doctor.specialtyId,
      });
    } else {
      setEditingDoctor(null);
      setFormData({ name: '', email: '', phone: '', hospital: '', specialtyId: '' });
    }
    setShowModal(true);
    setError('');
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingDoctor(null);
    setError('');
  };

  if (loading) {
    return <Spinner className="py-12" />;
  }

  const inputBase =
    'w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none';
  const selectBase =
    'w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none appearance-none';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('doctors.title')}</h2>
          <p className="text-gray-600 mt-1">{t('doctors.subtitle')}</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="w-5 h-5" />
          {t('doctors.add')}
        </Button>
      </div>

      {/* Error Message */}
      {error && <Banner variant="error">{error}</Banner>}

      {/* Doctors List - Desktop Table */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('doctors.th.doctor')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('doctors.th.specialty')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('doctors.th.hospital')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('doctors.th.contact')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('doctors.th.appointments')}
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('doctors.th.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {doctors.map((doctor) => (
              <tr key={doctor.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => setViewingDoctor(doctor)}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                  >
                    {doctor.name}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {doctor.specialty?.name}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{doctor.hospital}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{doctor.email}</div>
                  <div className="text-sm text-gray-500">{doctor.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {t('common.appointmentCount', { n: doctor._count?.appointments || 0 })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => openModal(doctor)}
                    className="text-blue-600 hover:text-blue-900 mr-4 transition-colors"
                    title={t('doctors.titleEdit')}
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(doctor.id)}
                    className="text-red-600 hover:text-red-900 transition-colors"
                    title={t('doctors.titleDelete')}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {doctors.length === 0 && (
          <div className="text-center py-12">
            <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('doctors.empty')}</h3>
            <p className="mt-1 text-sm text-gray-500">{t('doctors.emptyText')}</p>
          </div>
        )}
      </div>

      {/* Doctors List - Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {doctors.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('doctors.empty')}</h3>
            <p className="mt-1 text-sm text-gray-500">{t('doctors.emptyText')}</p>
          </div>
        ) : (
          doctors.map((doctor) => (
            <article
              key={doctor.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 transition-all duration-200 hover:shadow-md"
            >
              <div className="flex justify-between items-start mb-3">
                <button
                  onClick={() => setViewingDoctor(doctor)}
                  className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline text-left"
                >
                  {doctor.name}
                </button>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {doctor.specialty?.name}
                </span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span>{doctor.hospital}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span>{doctor.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{doctor.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Stethoscope className="w-4 h-4 text-gray-400" />
                  <span>{t('common.appointmentCount', { n: doctor._count?.appointments || 0 })}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <Button
                  variant="secondary"
                  full
                  size="sm"
                  onClick={() => openModal(doctor)}
                >
                  <Edit className="w-4 h-4" />
                  {t('doctors.saveBtn')}
                </Button>
                <Button
                  variant="danger"
                  full
                  size="sm"
                  onClick={() => handleDelete(doctor.id)}
                >
                  <Trash2 className="w-4 h-4" />
                  {t('doctors.deleteBtn')}
                </Button>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-up">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                {editingDoctor ? t('doctors.editTitle') : t('doctors.addTitle')}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && <Banner variant="error">{error}</Banner>}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Field id="doctorName" label={t('doctors.fullName')} icon={<UserPlus className="w-5 h-5" />} required>
                    <input
                      id="doctorName"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className={inputBase}
                      placeholder={t('doctors.ph.name')}
                    />
                  </Field>
                </div>

                <Field id="doctorEmail" label={t('common.email')} icon={<Mail className="w-5 h-5" />} required>
                  <input
                    id="doctorEmail"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className={inputBase}
                    placeholder={t('doctors.ph.email')}
                  />
                </Field>

                <Field id="doctorPhone" label={t('common.phone')} icon={<Phone className="w-5 h-5" />} required>
                  <input
                    id="doctorPhone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className={inputBase}
                    placeholder={t('ph.phone')}
                  />
                </Field>

                <Field id="doctorHospital" label={t('common.hospital')} icon={<Building className="w-5 h-5" />} required>
                  <input
                    id="doctorHospital"
                    type="text"
                    value={formData.hospital}
                    onChange={(e) => setFormData({ ...formData, hospital: e.target.value })}
                    required
                    className={inputBase}
                    placeholder={t('doctors.ph.hospital')}
                  />
                </Field>

                <Field id="doctorSpecialty" label={t('common.specialty')} icon={<Stethoscope className="w-5 h-5" />} required>
                  <select
                    id="doctorSpecialty"
                    value={formData.specialtyId}
                    onChange={(e) => setFormData({ ...formData, specialtyId: e.target.value })}
                    required
                    className={selectBase}
                  >
                    <option value="">{t('doctors.specialtyPlaceholder')}</option>
                    {specialties.map((specialty) => (
                      <option key={specialty.id} value={specialty.id}>
                        {specialty.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <Button variant="ghost" type="button" onClick={closeModal}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit">
                  {editingDoctor ? t('doctors.submitUpdate') : t('doctors.submitCreate')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Doctor Detail Modal */}
      {viewingDoctor && (
        <DoctorDetailModal doctor={viewingDoctor} onClose={() => setViewingDoctor(null)} />
      )}
    </div>
  );
}