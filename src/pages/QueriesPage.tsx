// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useTranslation } from 'react-i18next';
// import { searchApi } from '../api/search';
// import type { SearchHistoryItem } from '../types/search.types';

// export const QueriesPage = () => {
//   const { t } = useTranslation();
//   const [history, setHistory] = useState<SearchHistoryItem[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchHistory = async () => {
//       setIsLoading(true);
//       try {
//         const data = await searchApi.getSearchHistory();
//         setHistory(data);
//       } catch (error) {
//         console.error(error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchHistory();
//   }, []);

//   const handleRepeat = (filters: SearchHistoryItem['filters']) => {
//     navigate('/search', { state: { initialFilters: filters } });
//   };

//   const formatFilters = (filters: SearchHistoryItem['filters']) => {
//     const activeFilters = [];
//     if (filters.text) activeFilters.push(`${t('queries.filter_text')}: ${filters.text}`);
//     if (filters.author) activeFilters.push(`${t('queries.filter_author')}: ${filters.author}`);
//     if (filters.tags) activeFilters.push(`${t('queries.filter_tags')}: ${filters.tags}`);
//     if (filters.everywhere) activeFilters.push(t('queries.filter_everywhere'));
    
//     return activeFilters.length > 0 ? activeFilters.join(' | ') : t('queries.filter_none');
//   };

//   return (
//     <div className="max-w-6xl mx-auto p-2">
//       <h1 className="text-2xl font-bold mb-6 text-gray-800">{t('queries.title')}</h1>
      
//       <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
//         <table className="w-full text-left border-collapse min-w-150">
//           <thead>
//             <tr className="bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
//               <th className="p-4">{t('queries.col_time')}</th>
//               <th className="p-4">{t('queries.col_name')}</th>
//               <th className="p-4">{t('queries.col_criteria')}</th>
//               <th className="p-4 text-right">{t('queries.col_actions')}</th>
//             </tr>
//           </thead>
//           <tbody className="text-sm divide-y divide-gray-100">
//             {isLoading ? (
//               <tr>
//                 <td colSpan={4} className="p-8 text-center text-gray-500">{t('queries.loading')}</td>
//               </tr>
//             ) : history.length === 0 ? (
//               <tr>
//                 <td colSpan={4} className="p-8 text-center text-gray-500">{t('queries.empty')}</td>
//               </tr>
//             ) : (
//               history.map((item) => (
//                 <tr key={item.id} className="hover:bg-gray-50 transition-colors">
//                   <td className="p-4 text-gray-700 whitespace-nowrap">
//                     {new Date(item.timestamp).toLocaleString()}
//                   </td>
//                   <td className="p-4 text-gray-900 font-medium">
//                     {item.title || '—'}
//                   </td>
//                   <td className="p-4 text-gray-600 truncate max-w-xs">
//                     {formatFilters(item.filters)}
//                   </td>
//                   <td className="p-4 text-right">
//                     <button
//                       onClick={() => handleRepeat(item.filters)}
//                       className="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
//                     >
//                       {t('queries.repeat')}
//                     </button>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// };

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api';

export interface SearchQueryDTO {
  id: number;
  created_at: string;
  name: string;
  search_everywhere: string | null;
  title: string | null;
  text: string | null;
  source: string | null;
  author: string | null;
  publication_title: string | null;
  url: string | null;
  doi: string | null;
  tags: string[];
  tag_mode: string | null;
  created_after_raw: string | null;
  created_before_raw: string | null;
  info_object_id: number | null;
  user_id: number;
}

export const QueriesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [history, setHistory] = useState<SearchQueryDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [renameModalData, setRenameModalData] = useState<{ id: number; name: string } | null>(null);
  const [deleteModalId, setDeleteModalId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/search-queries/my?skip=0&limit=100');
      setHistory(response.data.items || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepeat = (q: SearchQueryDTO) => {
    const filters = {
      search_everywhere: q.search_everywhere || '',
      title: q.title || '',
      text: q.text || '',
      author: q.author || '',
      source: q.source || '',
      publication_title: q.publication_title || '',
      url: q.url || '',
      doi: q.doi || '',
      tags: q.tags || [],
      tag_mode: q.tag_mode || 'AND',
      created_after_raw: q.created_after_raw || '',
      created_before_raw: q.created_before_raw || ''
    };
    navigate('/search', { state: { initialFilters: filters } });
  };

  const handleRename = async () => {
    if (!renameModalData || !renameModalData.name.trim()) return;
    setIsSubmitting(true);
    try {
      await api.put(`/search-queries/${renameModalData.id}/rename`, { name: renameModalData.name });
      setHistory(prev => prev.map(item => item.id === renameModalData.id ? { ...item, name: renameModalData.name } : item));
      setRenameModalData(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModalId) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/search-queries/${deleteModalId}`);
      setHistory(prev => prev.filter(item => item.id !== deleteModalId));
      setDeleteModalId(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFilters = (q: SearchQueryDTO) => {
    const activeFilters: string[] = [];
    if (q.search_everywhere) activeFilters.push(`${t('queries.filter_everywhere', 'Везде')}: ${q.search_everywhere}`);
    if (q.title) activeFilters.push(`${t('queries.filter_title', 'Заголовок')}: ${q.title}`);
    if (q.text) activeFilters.push(`${t('queries.filter_text', 'Текст')}: ${q.text}`);
    if (q.author) activeFilters.push(`${t('queries.filter_author', 'Автор')}: ${q.author}`);
    if (q.source) activeFilters.push(`${t('queries.filter_source', 'Источник')}: ${q.source}`);
    if (q.tags && q.tags.length > 0) activeFilters.push(`${t('queries.filter_tags', 'Теги')}: ${q.tags.join(', ')}`);
    if (q.created_after_raw || q.created_before_raw) activeFilters.push(`${t('queries.filter_date', 'Дата')}: ${q.created_after_raw || ''} - ${q.created_before_raw || ''}`);
    
    return activeFilters.length > 0 ? activeFilters.join(' | ') : t('queries.filter_none', 'Нет фильтров');
  };

  return (
    <div className="max-w-6xl mx-auto p-4 relative">
      {renameModalData && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-lg border border-gray-100">
            <h3 className="text-lg font-bold mb-4 text-gray-900">{t('queries.rename_title', 'Переименовать запрос')}</h3>
            <input
              type="text"
              value={renameModalData.name}
              onChange={(e) => setRenameModalData({ ...renameModalData, name: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setRenameModalData(null)} className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 font-medium">
                {t('common.cancel', 'Отмена')}
              </button>
              <button onClick={handleRename} disabled={!renameModalData.name.trim() || isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 font-medium">
                {isSubmitting ? t('common.loading', 'Сохранение...') : t('common.save', 'Сохранить')}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModalId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-lg border border-gray-100">
            <h3 className="text-lg font-bold mb-2 text-gray-900">{t('queries.delete_title', 'Удалить запрос?')}</h3>
            <p className="text-gray-600 mb-6 text-sm">{t('queries.delete_confirm', 'Вы уверены, что хотите удалить этот поисковый запрос? Это действие нельзя отменить.')}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteModalId(null)} className="px-4 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 font-medium">
                {t('common.cancel', 'Отмена')}
              </button>
              <button onClick={handleDelete} disabled={isSubmitting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 font-medium">
                {isSubmitting ? t('common.loading', 'Удаление...') : t('common.delete', 'Удалить')}
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold mb-6 text-gray-800">{t('queries.title', 'Мои запросы')}</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-200">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
              <th className="p-4 w-48">{t('queries.col_time', 'Дата')}</th>
              <th className="p-4 w-64">{t('queries.col_name', 'Название')}</th>
              <th className="p-4">{t('queries.col_criteria', 'Критерии поиска')}</th>
              <th className="p-4 text-right w-48">{t('queries.col_actions', 'Действия')}</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">{t('queries.loading', 'Загрузка...')}</td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">{t('queries.empty', 'История запросов пуста')}</td>
              </tr>
            ) : (
              history.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="p-4 text-gray-700 whitespace-nowrap">
                    {new Date(item.created_at).toLocaleString()}
                  </td>
                  <td className="p-4 text-gray-900 font-medium">
                    {item.name}
                  </td>
                  <td className="p-4 text-gray-600 truncate max-w-xs" title={formatFilters(item)}>
                    {formatFilters(item)}
                  </td>
                  <td className="p-4 text-right space-x-3">
                    <button
                      onClick={() => handleRepeat(item)}
                      className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      title={t('queries.repeat', 'Повторить поиск')}
                    >
                      {t('queries.repeat_btn', 'Поиск')}
                    </button>
                    <button
                      onClick={() => setRenameModalData({ id: item.id, name: item.name })}
                      className="text-gray-500 hover:text-gray-800 font-medium transition-colors"
                      title={t('queries.rename', 'Переименовать')}
                    >
                      {t('queries.rename_btn', 'Имя')}
                    </button>
                    <button
                      onClick={() => setDeleteModalId(item.id)}
                      className="text-red-500 hover:text-red-700 font-medium transition-colors"
                      title={t('common.delete', 'Удалить')}
                    >
                      {t('queries.delete_btn', 'Удал.')}
                    </button>
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