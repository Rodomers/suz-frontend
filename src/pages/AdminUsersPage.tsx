import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api';
import { ConfirmModal } from '../components/ConfirmModal';
import { useAuthStore } from '../store/useAuthStore';

export interface UserResponseDTO {
  id: number;
  login: string;
  full_name: string | null;
  email: string | null;
  is_user_admin: boolean;
  is_data_admin: boolean;
  is_super_admin: boolean;
}

export const AdminUsersPage = () => {
  const { t } = useTranslation();
  const currentUser = useAuthStore(state => state.user);
  const [users, setUsers] = useState<UserResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; userId: number | null }>({
    isOpen: false,
    userId: null
  });
  
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    full_name: '',
    email: '',
    is_user_admin: false,
    is_data_admin: false,
    is_super_admin: false
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/users');
      setUsers(response.data || []);
    } catch {
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      await api.post('/users/admin-create', {
        login: formData.login,
        password: formData.password,
        full_name: formData.full_name || null,
        email: formData.email || null,
        is_user_admin: currentUser?.is_super_admin ? formData.is_user_admin : false,
        is_data_admin: currentUser?.is_super_admin ? formData.is_data_admin : false,
        is_super_admin: currentUser?.is_super_admin ? formData.is_super_admin : false
      });
      
      setIsModalOpen(false);
      setFormData({ 
        login: '', 
        password: '', 
        full_name: '', 
        email: '', 
        is_user_admin: false, 
        is_data_admin: false, 
        is_super_admin: false 
      });
      await fetchUsers();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; detail?: string } } };
      const errorMsg = err.response?.data?.message || err.response?.data?.detail || t('common.error');
      setSubmitError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestDeleteUser = (id: number) => {
    setDeleteDialog({ isOpen: true, userId: id });
  };

  const confirmDeleteUser = async () => {
    if (!deleteDialog.userId) return;
    
    try {
      await api.delete(`/users/${deleteDialog.userId}`);
      setDeleteDialog({ isOpen: false, userId: null });
      await fetchUsers();
    } catch {
      setDeleteDialog({ isOpen: false, userId: null });
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 relative">
      <ConfirmModal
        isOpen={deleteDialog.isOpen}
        title={t('admin_users.delete_title')}
        message={t('admin_users.delete_confirm')}
        onConfirm={confirmDeleteUser}
        onCancel={() => setDeleteDialog({ isOpen: false, userId: null })}
        confirmText={t('common.delete')}
        isDanger={true}
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
            <h2 className="text-xl font-bold mb-4 text-gray-800">{t('admin_users.create_title')}</h2>
            
            {submitError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                {submitError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin_users.col_login')} *</label>
                <input required type="text" value={formData.login} onChange={e => setFormData({...formData, login: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin_users.col_password')} *</label>
                <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin_users.col_name')}</label>
                <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin_users.col_email')}</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              
              {currentUser?.is_super_admin && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin_users.roles')}</label>
                  
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" checked={formData.is_user_admin} onChange={e => setFormData({...formData, is_user_admin: e.target.checked})} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <span className="text-sm text-gray-700">{t('admin_users.role_user_admin')}</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" checked={formData.is_data_admin} onChange={e => setFormData({...formData, is_data_admin: e.target.checked})} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <span className="text-sm text-gray-700">{t('admin_users.role_data_admin')}</span>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" checked={formData.is_super_admin} onChange={e => setFormData({...formData, is_super_admin: e.target.checked})} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                    <span className="text-sm text-gray-700">{t('admin_users.role_super_admin')}</span>
                  </label>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => { setIsModalOpen(false); setSubmitError(null); }} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={isSubmitting || !formData.login || !formData.password} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors">
                  {isSubmitting ? t('common.loading') : t('common.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('admin_users.title')}</h1>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
          {t('admin_users.create_btn')}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
              <th className="p-4 w-16">ID</th>
              <th className="p-4">{t('admin_users.col_login')}</th>
              <th className="p-4">{t('admin_users.col_name')}</th>
              <th className="p-4">{t('admin_users.col_email')}</th>
              <th className="p-4">{t('admin_users.col_role')}</th>
              <th className="p-4 text-center">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">{t('common.loading')}</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-gray-500">{t('admin_users.empty')}</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-gray-500">{u.id}</td>
                  <td className="p-4 font-medium text-gray-900">{u.login}</td>
                  <td className="p-4 text-gray-700">{u.full_name || '—'}</td>
                  <td className="p-4 text-gray-600">{u.email || '—'}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {u.is_super_admin && <span className="px-2 py-1 rounded text-xs font-bold bg-purple-100 text-purple-700">СА</span>}
                      {u.is_data_admin && <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">АД</span>}
                      {u.is_user_admin && <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700">АП</span>}
                      {!u.is_super_admin && !u.is_data_admin && !u.is_user_admin && (
                        <span className="px-2 py-1 rounded text-xs font-bold bg-gray-100 text-gray-700">П</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    {u.id !== currentUser?.id && (currentUser?.is_super_admin || !u.is_super_admin) && (
                      <button onClick={() => requestDeleteUser(u.id)} className="text-red-600 hover:text-red-800 font-medium transition-colors">
                        {t('common.delete')}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};