import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../api';

interface ImportResult {
  users?: number;
  tags?: number;
  info_objects?: number;
  tag_links?: number;
  user_agreements?: number;
  search_queries?: number;
  deletion_requests?: number;
  media_files?: number;
  attachments?: number;
}

export const AdminPage = () => {
  const { t } = useTranslation();
  const [loginExport, setLoginExport] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleExport = async (type: 'all' | 'kms' | 'user') => {
    if (type === 'user' && !loginExport.trim()) {
      showNotification(t('admin.export_user_empty', 'Введите логин пользователя'), 'error');
      return;
    }
    
    setIsExporting(true);
    try {
      showNotification(t('admin.export_started', 'Начат экспорт, подождите...'), 'success');
      
      let url = `/admin/export/${type}`;
      if (type === 'user') {
        url = `/admin/export/user/${encodeURIComponent(loginExport.trim())}`;
      }

      const response = await api.get(url, { responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = `export_${type}.zip`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      } else {
        const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
        filename = type === 'user' ? `export_${loginExport}_${dateStr}.zip` : `export_${type}_${dateStr}.zip`;
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      showNotification(t('admin.export_success', 'Экспорт успешно завершен!'), 'success');
      if (type === 'user') setLoginExport('');
    } catch {
      showNotification(t('admin.export_error', 'Ошибка при экспорте. Убедитесь, что пользователь существует.'), 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) return;

    setIsImporting(true);
    try {
      showNotification(t('admin.import_started', 'Начат импорт базы данных, пожалуйста, подождите...'), 'success');
      
      const formData = new FormData();
      formData.append('file', importFile);

      const response = await api.post<ImportResult>('/admin/import/zip', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data = response.data;
      const details = [
        data.users !== undefined && `Пользователи: ${data.users}`,
        data.tags !== undefined && `Теги: ${data.tags}`,
        data.info_objects !== undefined && `KMS объекты: ${data.info_objects}`,
        data.tag_links !== undefined && `Связи тегов: ${data.tag_links}`,
        data.user_agreements !== undefined && `Соглашения: ${data.user_agreements}`,
        data.search_queries !== undefined && `Поисковые запросы: ${data.search_queries}`,
        data.deletion_requests !== undefined && `Запросы на удаление: ${data.deletion_requests}`,
        data.media_files !== undefined && `Медиафайлы: ${data.media_files}`,
        data.attachments !== undefined && `Вложения: ${data.attachments}`,
      ].filter(Boolean).join(' | ');

      showNotification(`${t('admin.import_success', 'Импорт успешно завершен.')} Детали: ${details}`, 'success');
      setImportFile(null);
    } catch {
      showNotification(t('admin.import_error', 'Ошибка при импорте. Проверьте формат архива и повторите попытку.'), 'error');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 relative">
      {notification && (
        <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 transition-opacity ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {notification.message}
        </div>
      )}

      <h1 className="text-2xl font-bold mb-6 text-gray-800">{t('admin.dashboard', 'Панель администратора')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t('admin.export_full_title', 'Полный дамп БД')}</h2>
          <p className="text-sm text-gray-600 mb-4">{t('admin.export_full_desc', 'Скачать полную резервную копию всей базы данных системы в формате ZIP.')}</p>
          <button 
            onClick={() => handleExport('all')}
            disabled={isExporting || isImporting}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
          >
            {t('admin.export_all_btn', 'Экспорт всей БД')}
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t('admin.export_kms_title', 'Дамп объектов (KMS)')}</h2>
          <p className="text-sm text-gray-600 mb-4">{t('admin.export_kms_desc', 'Скачать только информационные объекты, файлы и связанные метаданные.')}</p>
          <button 
            onClick={() => handleExport('kms')}
            disabled={isExporting || isImporting}
            className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
          >
            {t('admin.export_kms_btn', 'Экспорт базы KMS')}
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 md:col-span-2">
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t('admin.export_user_title', 'Дамп пользователя')}</h2>
          <p className="text-sm text-gray-600 mb-4">{t('admin.export_user_desc', 'Скачать данные конкретного пользователя по его логину.')}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              value={loginExport}
              onChange={(e) => setLoginExport(e.target.value)}
              placeholder={t('admin.export_user_placeholder', 'Введите логин пользователя')}
              className="flex-1 p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              onClick={() => handleExport('user')}
              disabled={isExporting || isImporting || !loginExport.trim()}
              className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors shrink-0"
            >
              {t('admin.export_user_btn', 'Экспорт данных')}
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 md:col-span-2">
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t('admin.import_title', 'Импорт базы данных')}</h2>
          <p className="text-sm text-gray-600 mb-4">{t('admin.import_desc', 'Восстановление базы данных или отдельных сущностей из ранее созданного ZIP-архива.')}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              key={importFile ? 'selected' : 'empty'}
              type="file"
              accept=".zip"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              className="flex-1 p-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button 
              onClick={handleImport}
              disabled={isImporting || isExporting || !importFile}
              className="px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 disabled:bg-orange-400 transition-colors shrink-0"
            >
              {t('admin.import_btn', 'Импортировать базу')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};