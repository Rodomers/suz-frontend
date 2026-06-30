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
  access_start: string | null;
  access_end: string | null;
  organization: string | null;
  position: string | null;
  phone: string | null;
  comment: string | null;
  rules_accepted?: boolean;
  rules_accepted_at?: string | null;
}

export const AdminUsersPage = () => {
  const { t } = useTranslation();
  const currentUser = useAuthStore(state => state.user);
  const [users, setUsers] = useState<UserResponseDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [batchStartDate, setBatchStartDate] = useState('');
  const [batchEndDate, setBatchEndDate] = useState('');
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false);
  
  const [createDaysInput, setCreateDaysInput] = useState('30');
  const [editDaysInput, setEditDaysInput] = useState('30');
  const [globalRulesUrl, setGlobalRulesUrl] = useState('');

  const [infoModal, setInfoModal] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; userId: number | null }>({
    isOpen: false,
    userId: null
  });
  
  const [formData, setFormData] = useState({
    login: '',
    password: '',
    full_name: '',
    email: '',
    organization: '',
    position: '',
    phone: '',
    comment: '',
    access_start: '',
    access_end: '',
    is_user_admin: false,
    is_data_admin: false,
    is_super_admin: false
  });

  const [editFormData, setEditFormData] = useState({
    login: '',
    full_name: '',
    email: '',
    organization: '',
    position: '',
    phone: '',
    comment: '',
    access_start: '',
    access_end: '',
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
    api.get('/users/rules-link').then(res => setGlobalRulesUrl(res.data?.rules_url || ''));
  }, []);

  const handleSaveRulesUrl = async () => {
    try {
      new URL(globalRulesUrl);
    } catch {
      setInfoModal({
        isOpen: true,
        title: t('common.error'),
        message: t('admin_users.invalid_url_error')
      });
      return;
    }

    try {
      await api.put('/users/rules-link', { rules_url: globalRulesUrl });
      setInfoModal({
        isOpen: true,
        title: t('common.success'),
        message: t('admin_users.rules_url_success')
      });
    } catch {
      setInfoModal({
        isOpen: true,
        title: t('common.error'),
        message: t('admin_users.rules_url_error')
      });
    }
  };

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
        organization: formData.organization || null,
        position: formData.position || null,
        phone: formData.phone || null,
        comment: formData.comment || null,
        access_start: formData.access_start || null,
        access_end: formData.access_end || null,
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
        organization: '',
        position: '',
        phone: '',
        comment: '',
        access_start: '',
        access_end: '',
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

  const handleOpenEditModal = async (user: UserResponseDTO) => {
    setEditingUserId(user.id);
    setSubmitError(null);
    try {
      const response = await api.get(`/users/info?login=${user.login}`);
      const fullUser = response.data || user;
      setEditFormData({
        login: fullUser.login || '',
        full_name: fullUser.full_name || '',
        email: fullUser.email || '',
        organization: fullUser.organization || '',
        position: fullUser.position || '',
        phone: fullUser.phone || '',
        comment: fullUser.comment || '',
        access_start: fullUser.access_start ? fullUser.access_start.split('T')[0] : '',
        access_end: fullUser.access_end ? fullUser.access_end.split('T')[0] : '',
        is_user_admin: !!fullUser.is_user_admin,
        is_data_admin: !!fullUser.is_data_admin,
        is_super_admin: !!fullUser.is_super_admin
      });
      setIsEditModalOpen(true);
    } catch {
      setEditFormData({
        login: user.login,
        full_name: user.full_name || '',
        email: user.email || '',
        organization: user.organization || '',
        position: user.position || '',
        phone: user.phone || '',
        comment: user.comment || '',
        access_start: user.access_start ? user.access_start.split('T')[0] : '',
        access_end: user.access_end ? user.access_end.split('T')[0] : '',
        is_user_admin: user.is_user_admin,
        is_data_admin: user.is_data_admin,
        is_super_admin: user.is_super_admin
      });
      setIsEditModalOpen(true);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await api.put(`/users/${editingUserId}`, {
        login: editFormData.login,
        full_name: editFormData.full_name || null,
        email: editFormData.email || null,
        organization: editFormData.organization || null,
        position: editFormData.position || null,
        phone: editFormData.phone || null,
        comment: editFormData.comment || null,
        access_start: editFormData.access_start || null,
        access_end: editFormData.access_end || null,
        is_user_admin: currentUser?.is_super_admin ? editFormData.is_user_admin : false,
        is_data_admin: currentUser?.is_super_admin ? editFormData.is_data_admin : false,
        is_super_admin: currentUser?.is_super_admin ? editFormData.is_super_admin : false
      });

      setIsEditModalOpen(false);
      setEditingUserId(null);
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

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password: result }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(users.map(u => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectUser = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedUserIds(prev => [...prev, id]);
    } else {
      setSelectedUserIds(prev => prev.filter(userId => userId !== id));
    }
  };

  const handleBatchUpdate = async () => {
    setIsSubmitting(true);
    try {
      await Promise.all(
        selectedUserIds.map(id =>
          api.put(`/users/${id}/access-dates`, {
            access_start_date: batchStartDate || null,
            access_end_date: batchEndDate || null
          })
        )
      );
      setSelectedUserIds([]);
      setBatchStartDate('');
      setBatchEndDate('');
      await fetchUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setBatchConfirmOpen(false);
    }
  };

  const applyDaysPreset = (isEdit: boolean) => {
    const daysStr = isEdit ? editDaysInput : createDaysInput;
    const days = parseInt(daysStr, 10);
    if (isNaN(days) || days < 1) return;
    const today = new Date();
    today.setDate(today.getDate() + days);
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}-${mm}-${dd}`;

    if (isEdit) {
      setEditFormData(prev => ({ ...prev, access_end: formattedDate }));
    } else {
      setFormData(prev => ({ ...prev, access_end: formattedDate }));
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

      <ConfirmModal
        isOpen={batchConfirmOpen}
        title={t('admin_users.batch_update_title')}
        message={t('admin_users.batch_update_confirm', { count: selectedUserIds.length })}
        onConfirm={handleBatchUpdate}
        onCancel={() => setBatchConfirmOpen(false)}
        confirmText={t('common.apply')}
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg border border-gray-100 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-800">{t('admin_users.create_title')}</h2>
            
            {submitError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                {submitError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin_users.col_login')} *</label>
                  <input required type="text" value={formData.login} onChange={e => setFormData({...formData, login: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin_users.col_password')} *</label>
                  <div className="flex gap-1">
                    <input required type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="flex-1 p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                    <button type="button" onClick={generatePassword} className="px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-md text-xs transition-colors border border-gray-300">
                      {t('admin_users.generate_short')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin_users.col_name')}</label>
                  <input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin_users.col_email')}</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin_users.col_organization')}</label>
                  <input type="text" value={formData.organization} onChange={e => setFormData({...formData, organization: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin_users.col_position')}</label>
                  <input type="text" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin_users.col_phone')}</label>
                  <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin_users.col_comment')}</label>
                  <input type="text" value={formData.comment} onChange={e => setFormData({...formData, comment: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin_users.col_access_start')}</label>
                  <input type="date" value={formData.access_start} onChange={e => setFormData({...formData, access_start: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin_users.col_access_end')}</label>
                  <div className="space-y-1">
                    <input type="date" value={formData.access_end} onChange={e => setFormData({...formData, access_end: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                    <div className="flex items-center gap-1.5 mt-1">
                      <input type="number" min="1" value={createDaysInput} onChange={e => setCreateDaysInput(e.target.value)} className="w-20 p-1 text-xs border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500" />
                      <button type="button" onClick={() => applyDaysPreset(false)} className="flex-1 py-1 px-2 text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors border border-blue-200 font-medium">
                        {t('admin_users.apply_days')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {currentUser?.is_super_admin && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin_users.roles')}</label>
                  
                  <div className="flex gap-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" checked={formData.is_user_admin} onChange={e => setFormData({...formData, is_user_admin: e.target.checked})} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                      <span className="text-xs text-gray-700">{t('admin_users.role_user_admin')}</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" checked={formData.is_data_admin} onChange={e => setFormData({...formData, is_data_admin: e.target.checked})} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                      <span className="text-xs text-gray-700">{t('admin_users.role_data_admin')}</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" checked={formData.is_super_admin} onChange={e => setFormData({...formData, is_super_admin: e.target.checked})} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                      <span className="text-xs text-gray-700">{t('admin_users.role_super_admin')}</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => { setIsModalOpen(false); setSubmitError(null); }} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors text-sm">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={isSubmitting || !formData.login || !formData.password} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors text-sm">
                  {isSubmitting ? t('common.loading') : t('common.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg border border-gray-100 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-800">{t('admin_users.edit_title')}</h2>
            
            {submitError && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                {submitError}
              </div>
            )}

            <form onSubmit={handleEditUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin_users.col_login')} *</label>
                  <input type="text" value={editFormData.login || ''} onChange={e => setEditFormData({...editFormData, login: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin_users.col_name')}</label>
                  <input type="text" value={editFormData.full_name} onChange={e => setEditFormData({...editFormData, full_name: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin_users.col_email')}</label>
                  <input type="email" value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin_users.col_phone')}</label>
                  <input type="text" value={editFormData.phone} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin_users.col_organization')}</label>
                  <input type="text" value={editFormData.organization} onChange={e => setEditFormData({...editFormData, organization: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin_users.col_position')}</label>
                  <input type="text" value={editFormData.position} onChange={e => setEditFormData({...editFormData, position: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin_users.col_comment')}</label>
                <input type="text" value={editFormData.comment} onChange={e => setEditFormData({...editFormData, comment: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin_users.col_access_start')}</label>
                  <input type="date" value={editFormData.access_start} onChange={e => setEditFormData({...editFormData, access_start: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('admin_users.col_access_end')}</label>
                  <div className="space-y-1">
                    <input type="date" value={editFormData.access_end} onChange={e => setEditFormData({...editFormData, access_end: e.target.value})} className="w-full p-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                    <div className="flex items-center gap-1.5 mt-1">
                      <input type="number" min="1" value={editDaysInput} onChange={e => setEditDaysInput(e.target.value)} className="w-20 p-1 text-xs border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500" />
                      <button type="button" onClick={() => applyDaysPreset(true)} className="flex-1 py-1 px-2 text-[10px] bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors border border-blue-200 font-medium">
                        {t('admin_users.apply_days')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {currentUser?.is_super_admin && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('admin_users.roles')}</label>
                  
                  <div className="flex gap-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" checked={editFormData.is_user_admin} onChange={e => setEditFormData({...editFormData, is_user_admin: e.target.checked})} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                      <span className="text-xs text-gray-700">{t('admin_users.role_user_admin')}</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" checked={editFormData.is_data_admin} onChange={e => setEditFormData({...editFormData, is_data_admin: e.target.checked})} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                      <span className="text-xs text-gray-700">{t('admin_users.role_data_admin')}</span>
                    </label>

                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" checked={editFormData.is_super_admin} onChange={e => setEditFormData({...editFormData, is_super_admin: e.target.checked})} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                      <span className="text-xs text-gray-700">{t('admin_users.role_super_admin')}</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => { setIsEditModalOpen(false); setSubmitError(null); }} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors text-sm">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors text-sm">
                  {isSubmitting ? t('common.loading') : t('common.save')}
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

      {currentUser?.is_super_admin && (
        <div className="mb-6 p-4 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center justify-between gap-4">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
              {t('admin_users.global_rules_label')}
            </label>
            <input
              type="text"
              value={globalRulesUrl}
              onChange={e => setGlobalRulesUrl(e.target.value)}
              placeholder="https://example.com/rules"
              className="w-full p-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
            />
          </div>
          <button
            type="button"
            onClick={handleSaveRulesUrl}
            className="mt-5 px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {t('admin_users.save_rules_btn')}
          </button>
        </div>
      )}

      {selectedUserIds.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-blue-800">
              {t('admin_users.selected_count', { count: selectedUserIds.length })}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-600">{t('admin_users.batch_start_label')}</label>
              <input type="date" value={batchStartDate} onChange={e => setBatchStartDate(e.target.value)} className="p-1.5 text-sm border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-600">{t('admin_users.batch_end_label')}</label>
              <input type="date" value={batchEndDate} onChange={e => setBatchEndDate(e.target.value)} className="p-1.5 text-sm border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
            <button type="button" onClick={() => setBatchConfirmOpen(true)} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
              {t('admin_users.apply_changes_btn')}
            </button>
            <button type="button" onClick={() => setSelectedUserIds([])} className="px-3 py-1.5 text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors">
              {t('admin_users.reset_btn')}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto max-h-[600px] overflow-y-auto relative">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
              <th className="p-4 w-[48px] min-w-[48px] sticky left-0 top-0 bg-gray-50 z-30">
                <input type="checkbox" checked={users.length > 0 && selectedUserIds.length === users.length} onChange={e => handleSelectAll(e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
              </th>
              <th className="p-4 w-[64px] min-w-[64px] sticky left-[48px] top-0 bg-gray-50 z-30">{t('admin_users.col_id')}</th>
              <th className="p-4 w-[150px] min-w-[150px] sticky left-[112px] top-0 bg-gray-50 z-30">{t('admin_users.col_login')}</th>
              <th className="p-4 sticky top-0 bg-gray-50 z-10">{t('admin_users.col_rules_status')}</th>
              <th className="p-4 sticky top-0 bg-gray-50 z-10">{t('admin_users.col_name')}</th>
              <th className="p-4 sticky top-0 bg-gray-50 z-10">{t('admin_users.col_profile_contacts')}</th>
              <th className="p-4 sticky top-0 bg-gray-50 z-10">{t('admin_users.col_access_period')}</th>
              <th className="p-4 sticky top-0 bg-gray-50 z-10">{t('admin_users.col_role')}</th>
              <th className="p-4 text-center sticky top-0 bg-gray-50 z-10">{t('common.actions')}</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={9} className="p-8 text-center text-gray-500">{t('common.loading')}</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={9} className="p-8 text-center text-gray-500">{t('admin_users.empty')}</td></tr>
            ) : (
              users.map(u => (
                <tr key={u.id} className="group hover:bg-gray-50 transition-colors">
                  <td className="p-4 w-[48px] min-w-[48px] sticky left-0 bg-white z-20 group-hover:bg-gray-50 transition-colors">
                    <input type="checkbox" checked={selectedUserIds.includes(u.id)} onChange={e => handleSelectUser(u.id, e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                  </td>
                  <td className="p-4 w-[64px] min-w-[64px] sticky left-[48px] bg-white z-20 text-gray-500 group-hover:bg-gray-50 transition-colors">{u.id}</td>
                  <td className="p-4 w-[150px] min-w-[150px] sticky left-[112px] bg-white z-20 font-medium text-gray-900 group-hover:bg-gray-50 transition-colors">
                    <div>{u.login}</div>
                  </td>
                  <td className="p-4 text-gray-700">
                    {(() => {
                      if (!u.rules_accepted || !u.rules_accepted_at || u.rules_accepted_at.startsWith('1970')) {
                        return (
                          <span className="text-[10px] text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200 inline-block font-normal">
                            {t('admin_users.rules_not_accepted')}
                          </span>
                        );
                      }
                      const dateValid = new Date(u.rules_accepted_at);
                      return (
                        <span className="text-[10px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-200 inline-block font-normal">
                          {t('admin_users.rules_accepted_at_date', { date: dateValid.toLocaleDateString(), time: dateValid.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) })}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="p-4 text-gray-700">
                    <div className="font-semibold">{u.full_name || '—'}</div>
                    {u.comment && (
                      <div className="text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded mt-1 inline-block max-w-[200px] truncate" title={u.comment}>
                        {u.comment}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-gray-600">
                    <div className="font-medium text-gray-800">{u.organization || '—'}</div>
                    <div className="text-xs text-gray-500">{u.position || '—'}</div>
                    <div className="text-xs text-gray-400 mt-1">{u.email} {u.phone ? `| ${u.phone}` : ''}</div>
                  </td>
                  <td className="p-4 text-gray-600">
                    {u.access_start || u.access_end ? (
                      <div className="text-xs space-y-0.5">
                        <div>С: {u.access_start || '—'}</div>
                        <div>По: {u.access_end || '—'}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
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
                    <div className="flex items-center justify-center gap-3">
                      <button onClick={() => handleOpenEditModal(u)} className="text-blue-600 hover:text-blue-800 font-medium transition-colors">
                        {t('common.edit')}
                      </button>
                      {u.id !== currentUser?.id && (currentUser?.is_super_admin || !u.is_super_admin) && (
                        <button onClick={() => requestDeleteUser(u.id)} className="text-red-600 hover:text-red-800 font-medium transition-colors">
                          {t('common.delete')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        isOpen={infoModal.isOpen}
        title={infoModal.title}
        message={infoModal.message}
        onConfirm={() => setInfoModal({ isOpen: false, title: '', message: '' })}
        onCancel={() => setInfoModal({ isOpen: false, title: '', message: '' })}
        confirmText={t('common.ok')}
        isDanger={false}
      />
    </div>
  );
};