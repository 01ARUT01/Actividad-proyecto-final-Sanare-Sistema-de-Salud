import React, { useCallback, useEffect, useState } from 'react';
import { Users, Trash2, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { UserRole } from '../types/auth';
import { API_URL, readErrorMessage } from '../services/apiConfig';
import Button from './ui/Button';
import Banner from './ui/Banner';
import Spinner from './ui/Spinner';

interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dni: string | null;
  role: UserRole;
  _count?: { appointments: number };
}

const ROLE_BADGE: Record<UserRole, string> = {
  [UserRole.PATIENT]: 'bg-blue-100 text-blue-800',
  [UserRole.DOCTOR]: 'bg-green-100 text-green-800',
  [UserRole.ADMIN]: 'bg-purple-100 text-purple-800',
};

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { t } = useI18n();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, t('users.errorLoad')));
      }
      setUsers(await response.json());
    } catch (err: any) {
      setError(err.message || t('users.errorLoad'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleDelete = async (id: string) => {
    if (id === currentUser?.id) {
      setError(t('users.cannotDeleteSelf'));
      return;
    }
    if (!window.confirm(t('users.confirmDelete'))) return;

    try {
      setError('');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/auth/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, t('users.errorDelete')));
      }
      await loadUsers();
    } catch (err: any) {
      setError(err.message || t('users.errorDelete'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('users.title')}</h2>
          <p className="text-gray-600 mt-1">{t('users.subtitle')}</p>
        </div>
        <span className="text-sm text-gray-500">{t('users.count', { n: users.length })}</span>
      </div>

      {error && <Banner variant="error">{error}</Banner>}

      {loading ? (
        <Spinner className="py-12" />
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <UserPlus className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">{t('users.empty')}</h3>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('users.th.user')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.email')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('users.th.dni')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('users.th.role')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('users.th.appointments')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('users.th.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => {
                const isMe = user.id === currentUser?.id;
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      {isMe && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-50 text-blue-600 mt-1">
                          {t('users.deleteSelf')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.dni || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[user.role]}`}>
                        {t(`role.${user.role.toLowerCase()}`)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user._count?.appointments ?? 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                        disabled={isMe}
                        title={isMe ? t('users.cannotDeleteSelf') : t('users.titleDelete')}
                      >
                        <Trash2 className="w-4 h-4" />
                        {t('users.delete')}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManagement;