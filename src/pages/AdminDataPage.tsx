import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { adminApi } from '../api/admin';
import type { AdminTag, IOPreview, AdminUser } from '../types/admin.types';

interface DeletionRequest {
  id: string;
  info_object_id: number;
  requested_by: number;
  reason: string;
}

export const AdminDataPage = () => {
  const { t } = useTranslation();
  const [tags, setTags] = useState<AdminTag[]>([]);
  const [ios, setIos] = useState<IOPreview[]>([]);
  const [_users, setUsers] = useState<AdminUser[]>([]);
  const [selectedIoIds, setSelectedIoIds] = useState<string[]>([]);
  const [deletionRequests, setDeletionRequests] = useState<DeletionRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTagName, setNewTagName] = useState('');
  const [editingTag, setEditingTag] = useState<AdminTag | null>(null);
  const [editingTagName, setEditingTagName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const tagsData = await adminApi.getTags();
      setTags(tagsData);
    } catch {
      setError(t('admin_data.error_fetch'));
    }

    try {
      const iosData = await adminApi.getIOPreviews();
      setIos(iosData);
      setSelectedIoIds([]);
    } catch {
      setError(t('admin_data.error_fetch'));
    }

    try {
      const usersData = await adminApi.getUsers();
      setUsers(usersData);
    } catch {
      setError(t('admin_data.error_fetch'));
    }

    try {
      const response = await api.get('/deletion-requests');
      const extractedData = response && response.data ? response.data : response;
      setDeletionRequests(Array.isArray(extractedData) ? extractedData : []);
    } catch {
      setDeletionRequests([]);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    setIsLoading(true);
    try {
      await adminApi.createTag(newTagName.trim());
      setNewTagName('');
      await fetchData();
    } catch {
      setError(t('admin_data.error_create_tag'));
      setIsLoading(false);
    }
  };

  const handleUpdateTag = async (tagId: string) => {
    if (!editingTagName.trim()) return;
    setIsLoading(true);
    try {
      await adminApi.updateTag(tagId, editingTagName.trim());
      setEditingTag(null);
      setEditingTagName('');
      await fetchData();
    } catch {
      setError(t('admin_data.error_update_tag'));
      setIsLoading(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    setIsLoading(true);
    try {
      await adminApi.deleteTag(tagId);
      await fetchData();
    } catch {
      setError(t('admin_data.error_delete_tag'));
      setIsLoading(false);
    }
  };

  const handleIoSelect = (id: string) => {
    setSelectedIoIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleMassDeleteIO = async () => {
    if (selectedIoIds.length === 0) return;
    setIsLoading(true);
    try {
      await adminApi.massDeleteIO(selectedIoIds);
      await fetchData();
    } catch {
      setError(t('admin_data.error_delete_io'));
      setIsLoading(false);
    }
  };

  const handleApproveDelete = async (requestId: string) => {
    setIsLoading(true);
    try {
      await api.post(`/deletion-requests/${requestId}/approve-delete`, {});
      await fetchData();
    } catch {
      setError(t('admin_data.error_approve_delete'));
      setIsLoading(false);
    }
  };

  const handleRejectDelete = async (requestId: string) => {
    setIsLoading(true);
    try {
      await api.delete(`/deletion-requests/${requestId}`);
      await fetchData();
    } catch {
      setError(t('admin_data.error_reject_delete'));
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
      {error && (
        <div className="col-span-full bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-900 font-bold text-lg">&times;</button>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4 text-gray-800">{t('admin_data.title')}</h2>
        <div className="mb-4">
          <button
            onClick={handleMassDeleteIO}
            disabled={selectedIoIds.length === 0 || isLoading}
            className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg disabled:bg-gray-300 transition-colors"
          >
            {t('admin_data.delete_selected', { count: selectedIoIds.length })}
          </button>
        </div>
        <div className="border border-gray-200 rounded-md max-h-96 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="p-3 w-10"><input type="checkbox" disabled className="rounded border-gray-300" /></th>
                <th className="p-3 text-gray-700 font-semibold">{t('admin_data.table_title')}</th>
                <th className="p-3 w-24 text-gray-700 font-semibold">{t('admin_data.table_date')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ios.map(io => (
                <tr key={io.id} className="hover:bg-gray-50">
                  <td className="p-3">
                    <input type="checkbox" checked={selectedIoIds.includes(io.id)} onChange={() => handleIoSelect(io.id)} disabled={isLoading} className="rounded border-gray-300" />
                  </td>
                  <td className="p-3 font-medium text-gray-800">{io.title}</td>
                  <td className="p-3 text-gray-500 whitespace-nowrap">{io.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4 text-gray-800">{t('admin_data.tags_title')}</h2>
        <div className="flex mb-6 space-x-2">
          <input type="text" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} placeholder={t('admin_data.new_tag')} disabled={isLoading} className="flex-1 p-2 border border-gray-300 rounded-md outline-none" />
          <button onClick={handleCreateTag} disabled={isLoading || !newTagName.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-blue-300 font-medium transition-colors">
            {t('admin_data.add')}
          </button>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
          {tags.map(tag => (
            <div key={tag.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-md gap-2">
              {editingTag?.id === tag.id ? (
                <div className="flex-1 flex flex-wrap gap-2 w-full">
                  <input type="text" value={editingTagName} onChange={(e) => setEditingTagName(e.target.value)} className="flex-1 p-1 border border-gray-300 rounded outline-none" />
                  <div className="flex space-x-2">
                    <button onClick={() => handleUpdateTag(tag.id)} className="text-green-600 font-medium text-sm px-2">{t('admin_data.save')}</button>
                    <button onClick={() => { setEditingTag(null); setEditingTagName(''); }} className="text-gray-500 font-medium text-sm px-2">{t('admin_data.cancel')}</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                    <span className="font-medium text-gray-800">{tag.name}</span>
                    <span className="text-xs text-gray-600 bg-gray-200 px-2 py-0.5 rounded-full">{t('admin_data.links_count', { count: tag.linkedObjectsCount })}</span>
                  </div>
                  <div className="flex space-x-3 self-end sm:self-auto mt-2 sm:mt-0">
                    <button onClick={() => { setEditingTag(tag); setEditingTagName(tag.name); }} className="text-blue-600 text-sm font-medium">{t('admin_data.edit')}</button>
                    <button onClick={() => handleDeleteTag(tag.id)} className="text-red-600 text-sm font-medium">{t('admin_data.delete')}</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="col-span-full bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold mb-4 text-gray-800">{t('admin_data.deletion_requests_title')}</h2>
        <div className="border border-gray-200 rounded-md max-h-96 overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th className="p-3 text-gray-700 font-semibold">{t('admin_data.table_io_id')}</th>
                <th className="p-3 text-gray-700 font-semibold">{t('admin_data.table_author_login')}</th>
                <th className="p-3 text-gray-700 font-semibold">{t('admin_data.table_reason')}</th>
                <th className="p-3 text-gray-700 font-semibold w-40">{t('admin_data.table_actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {deletionRequests.map(req => (
                <tr key={req.id} className="hover:bg-gray-50">
                  <td className="p-3 font-medium break-all">
                    <Link to={`/io/view/${req.info_object_id}`} className="text-blue-600 hover:underline">
                      {req.info_object_id}
                    </Link>
                  </td>
                  <td className="p-3 text-gray-600">
                    {_users.find(u => Number(u.id) === req.requested_by)?.login || req.requested_by}
                  </td>
                  <td className="p-3 text-gray-600">{req.reason}</td>
                  <td className="p-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApproveDelete(req.id)}
                        disabled={isLoading}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md disabled:bg-gray-300 transition-colors"
                      >
                        {t('admin_data.approve_delete')}
                      </button>
                      <button
                        onClick={() => handleRejectDelete(req.id)}
                        disabled={isLoading}
                        className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs font-medium rounded-md disabled:bg-gray-300 transition-colors"
                      >
                        {t('admin_data.reject_delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {deletionRequests.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">
                    {t('admin_data.no_deletion_requests')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};