import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/useAuthStore';
import type { SearchResultItem, PaginatedResponse } from '../types/search.types';

interface SearchResultsTableProps {
  results: PaginatedResponse<SearchResultItem> | null;
  onPageChange: (page: number) => void;
  isLoading: boolean;
  selectedTags: string;
  onTagClick: (tagText: string) => void;
}

export const SearchResultsTable = ({ results, onPageChange, isLoading, selectedTags, onTagClick }: SearchResultsTableProps) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const activeTagsSet = new Set(
    selectedTags
      ? selectedTags.split(/[,\n]+/).map(t => t.trim().toLowerCase()).filter(Boolean)
      : []
  );

  if (isLoading) {
    return <div className="text-center py-10 text-gray-500">{t('search_results.loading', 'Загрузка результатов...')}</div>;
  }

  if (!results || results.data.length === 0) {
    return <div className="text-center py-10 text-gray-500">{t('search_results.empty', 'Ничего не найдено')}</div>;
  }

  const totalPages = (results as any).pages || (results as any).totalPages || 0;
  const currentPage = results.page ?? 0;
  const limit = results.limit || 10;
  const totalItems = results.total || 0;
  const startIndex = (currentPage * limit) + 1;
  const endIndex = Math.min((currentPage + 1) * limit, totalItems);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto w-full">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 md:px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                {t('search_results.columns.title', 'Название объекта')}
              </th>
              <th className="px-4 md:px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                {t('search_results.columns.author', 'Автор')}
              </th>
              <th className="px-4 md:px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                {t('search_results.columns.tags', 'Теги')}
              </th>
              <th className="px-4 md:px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">
                {t('search_results.columns.actions', 'Действия')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {results.data.map((item) => {
              const typedItem = item as SearchResultItem & { deletionFlag?: boolean; created_by?: number; author_name?: string };
              const isDeleted = !!typedItem.deletionFlag;

              const titleText = typedItem.title || '';
              const escapedTitle = titleText
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
              const titleHtml = isDeleted ? `<del>${escapedTitle}</del>` : escapedTitle;

              return (
                <tr key={typedItem.id} className="hover:bg-blue-50 transition-colors">
                  <td className="px-4 md:px-6 py-4 font-medium text-gray-900 min-w-50">
                    <div className="flex items-center gap-2">
                      <span dangerouslySetInnerHTML={{ __html: titleHtml }} />
                      {isDeleted && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700 rounded border border-red-200 uppercase whitespace-nowrap">
                          {t('search_results.status.deleted', 'Удалён')}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-gray-600 whitespace-nowrap">
                    {(() => {
                      if (!typedItem.author) return '-';
                      if (typedItem.author_name) return typedItem.author_name;
                      if (user) {
                        const isCurrentUser = 
                          typedItem.author === user.login || 
                          typedItem.created_by === user.id;
                        if (isCurrentUser) {
                          return user.name || typedItem.author || user.login;
                        }
                      }
                      return typedItem.author;
                    })()}
                  </td>
                  <td className="px-4 md:px-6 py-4 min-w-50">
                    <div className="flex flex-wrap gap-1">
                      {(() => {
                        const rawTags = typedItem.tags;
                        if (!rawTags) return null;

                        let tagsArray: unknown[] = [];
                        if (Array.isArray(rawTags)) {
                          tagsArray = rawTags;
                        } else if (typeof rawTags === 'string') {
                          try {
                            const parsed = JSON.parse(rawTags as string);
                            tagsArray = Array.isArray(parsed) ? parsed : [rawTags];
                          } catch (_) {
                            tagsArray = (rawTags as string).split(',').map((t: string) => t.trim());
                          }
                        }

                        if (tagsArray.length === 0) return null;

                        return tagsArray.map((tag: unknown, idx: number) => {
                          if (tag === null || tag === undefined) return null;

                          let textToShow = '';
                          if (typeof tag === 'object') {
                            const obj = tag as Record<string, unknown>;
                            textToShow = String(obj.name || obj.value || obj.title || JSON.stringify(tag));
                          } else {
                            textToShow = String(tag).trim();
                          }

                          if (!textToShow || textToShow === 'undefined' || textToShow === '[object Object]') {
                            return (
                              <span key={`fallback-${idx}`} className="px-2 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-md text-xs font-mono">
                                {JSON.stringify(tag)}
                              </span>
                            );
                          }

                          const isSelected = activeTagsSet.has(textToShow.toLowerCase());

                          const tagClass = isSelected
                            ? "px-2 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 font-bold rounded-md text-xs cursor-pointer select-none"
                            : "px-2 py-1 bg-gray-100 border border-gray-200 text-gray-700 rounded-md text-xs cursor-pointer select-none hover:bg-gray-200 transition-colors";

                          const handleTagClickInternal = (e: React.MouseEvent) => {
                            if (e.ctrlKey || e.metaKey) {
                              e.preventDefault();
                              onTagClick(textToShow);
                            }
                          };

                          return (
                            <span 
                              key={`${idx}-${textToShow}`} 
                              className={tagClass}
                              onClick={handleTagClickInternal}
                              title={t('search_results.tag_tooltip', 'Зажмите Ctrl + клик, чтобы добавить в поиск')}
                            >
                              {textToShow}
                            </span>
                          );
                        });
                      })()}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <Link to={`/io/view/${typedItem.id}`} className="text-blue-600 hover:text-blue-800 font-medium mr-4">
                      {t('search_results.actions.view', 'Просмотр')}
                    </Link>
                    <Link to={`/io/edit/${typedItem.id}`} className="text-gray-600 hover:text-gray-800 font-medium">
                      {t('search_results.actions.edit', 'Редактировать')}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-4 md:px-6 py-4 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between bg-gray-50 gap-4">
          <div className="text-sm text-gray-600 text-center md:text-left">
            {t('search_results.pagination.showing', 'Показано')} {startIndex} - {endIndex} {t('search_results.pagination.from', 'из')} {totalItems}
          </div>
          <div className="flex gap-2 w-full md:w-auto justify-center">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 disabled:opacity-50 disabled:bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              {t('search_results.pagination.prev', 'Назад')}
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage + 1 >= totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 disabled:opacity-50 disabled:bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              {t('search_results.pagination.next', 'Вперед')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};