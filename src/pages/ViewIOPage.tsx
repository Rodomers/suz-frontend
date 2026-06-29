import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ioApi } from '../api/io';
import { api } from '../api';
import { useAuthStore } from '../store/useAuthStore';
import { parseMarkdownToHtml } from '../utils/markdownParser';
import type { InfoObjectDTO, MediaFileDTO } from '../types/dto.types';

export const ViewIOPage = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const { user } = useAuthStore();
  
  const [data, setData] = useState<InfoObjectDTO | null>(null);
  const [files, setFiles] = useState<MediaFileDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (id) {
      Promise.all([
        ioApi.getIO(id),
        ioApi.getFiles(id).catch(() => ({ data: [] }))
      ]).then(([ioRes, filesRes]) => {
        setData(ioRes.data as unknown as InfoObjectDTO);
        setFiles(Array.isArray(filesRes.data) ? filesRes.data : []);
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
      });
    }
  }, [id]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleDownload = async (fileId: number, fileName: string) => {
    try {
      const response = await api.get(`/files/info-objects/${id}/${fileId}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      setNotification({ message: t('view_io.download_error'), type: 'error' });
    }
  };

  const handleExport = async () => {
    try {
      setNotification({ message: t('view_io.exporting'), type: 'success' });
      const response = await api.get(`/info-objects/${id}/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `export_${id}.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      setNotification({ message: t('view_io.export_error'), type: 'error' });
    }
  };

  const handleDeletionRequest = async () => {
    if (!deleteReason.trim()) return;
    setIsSubmitting(true);
    try {
      await api.post(`/deletion-requests/info-objects/${id}`, { reason: deleteReason });
      setNotification({ message: t('view_io.delete_request_success'), type: 'success' });
      setIsDeleteModalOpen(false);
      setDeleteReason('');
    } catch {
      setNotification({ message: t('view_io.delete_request_error'), type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="p-6 text-center text-gray-600">{t('view_io.loading')}</div>;
  if (!data) return <div className="p-6 text-center text-red-500">{t('view_io.not_found')}</div>;

  const isOwner = user?.id === data.created_by;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 bg-white rounded-xl shadow-sm border border-gray-200 relative">
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 transition-opacity ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {notification.message}
        </div>
      )}

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-lg border border-gray-100">
            <h3 className="text-lg font-bold mb-4 text-gray-900">{t('view_io.delete_request_title')}</h3>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-red-500 resize-none text-sm"
              rows={4}
              placeholder={t('view_io.delete_reason_placeholder')}
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 font-medium transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDeletionRequest}
                disabled={!deleteReason.trim() || isSubmitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:bg-red-400 hover:bg-red-700 font-medium transition-colors"
              >
                {isSubmitting ? t('common.sending') : t('common.send')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start mb-6 border-b border-gray-100 pb-4 gap-4">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight">{data.title}</h1>
          <div className="text-sm text-gray-500 flex flex-wrap gap-4">
            <span>{t('view_io.author')} <span className="font-medium text-gray-700">{data.author || t('view_io.not_specified')}</span></span>
            <span>{t('view_io.source')} <span className="font-medium text-gray-700">{data.source || t('view_io.not_specified')}</span></span>
          </div>
        </div>
        <div className="flex shrink-0 gap-2 flex-wrap">
          <button 
            onClick={handleExport}
            className="px-4 py-2 bg-blue-50 text-blue-700 font-medium rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
          >
            {t('view_io.export_zip')}
          </button>
          
          {isOwner && (
            <>
              <Link to={`/io/edit/${id}`} className="px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg border border-transparent hover:bg-gray-200 transition-colors">
                {t('view_io.edit')}
              </Link>
              <button 
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg border border-red-100 hover:bg-red-100 transition-colors"
              >
                {t('view_io.request_delete')}
              </button>
            </>
          )}
        </div>
      </div>

      <div 
        className="text-gray-800 break-words prose prose-sm max-w-none space-y-1 mb-8"
        dangerouslySetInnerHTML={{ __html: parseMarkdownToHtml(data.content || '') }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-5 rounded-xl mb-6 border border-gray-100">
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{t('view_io.tags')}</h3>
          <div className="flex flex-wrap gap-2">
            {data.tags && data.tags.length > 0 ? (data.tags as unknown as string[]).map((tag: string, idx: number) => (
              <span key={idx} className="px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                {tag}
              </span>
            )) : <span className="text-sm text-gray-500">{t('view_io.no_tags')}</span>}
          </div>
        </div>
        
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{t('view_io.metadata')}</h3>
          <ul className="text-sm space-y-2 text-gray-700">
            <li><span className="font-medium text-gray-900">{t('view_io.meta_doi')}</span> {data.doi || '-'}</li>
            <li>
              <span className="font-medium text-gray-900">{t('view_io.meta_url')}</span>{' '}
              {data.url ? <a href={data.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{data.url}</a> : '-'}
            </li>
          </ul>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3">{t('view_io.files_title')}</h3>
        {files.length > 0 ? (
          <div className="space-y-2">
            {files.map((file: MediaFileDTO) => (
              <div key={file.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <span className="text-sm text-gray-800 font-medium truncate pr-4" title={file.original_name}>{file.original_name}</span>
                <div className="space-x-3 text-sm shrink-0">
                  <button 
                    onClick={() => handleDownload(file.id, file.original_name)}
                    className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    {t('view_io.download')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg border border-gray-100 text-center">{t('view_io.no_files')}</p>
        )}
      </div>
    </div>
  );
};