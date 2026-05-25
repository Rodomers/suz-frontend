import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { SearchResultItem, PaginatedResponse } from '../types/search.types';

interface SearchResultsTableProps {
  results: PaginatedResponse<SearchResultItem> | null;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

export const SearchResultsTable = ({ results, onPageChange, isLoading }: SearchResultsTableProps) => {
  const { t } = useTranslation();

  if (isLoading) {
    return <div className="text-center py-10 text-gray-500">{t('search_results.loading')}</div>;
  }

  if (!results || results.data.length === 0) {
    return <div className="text-center py-10 text-gray-500">{t('search_results.empty')}</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto w-full">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 md:px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">{t('search_results.columns.title')}</th>
              <th className="px-4 md:px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">{t('search_results.columns.author')}</th>
              <th className="px-4 md:px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">{t('search_results.columns.tags')}</th>
              <th className="px-4 md:px-6 py-3 text-left font-semibold text-gray-700 whitespace-nowrap">{t('search_results.columns.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {results.data.map((item) => (
              <tr key={item.id} className="hover:bg-blue-50 transition-colors">
                <td className="px-4 md:px-6 py-4 font-medium text-gray-900 min-w-50">{item.title}</td>
                <td className="px-4 md:px-6 py-4 text-gray-600 whitespace-nowrap">{item.author || '-'}</td>
                <td className="px-4 md:px-6 py-4 min-w-50">
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 border border-gray-200 text-gray-700 rounded-md text-xs">{tag}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                  <Link to={`/io/view/${item.id}`} className="text-blue-600 hover:text-blue-800 font-medium mr-4">
                    {t('search_results.actions.view')}
                  </Link>
                  <Link to={`/io/edit/${item.id}`} className="text-gray-600 hover:text-gray-800 font-medium">
                    {t('search_results.actions.edit')}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {results.totalPages > 1 && (
        <div className="px-4 md:px-6 py-4 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between bg-gray-50 gap-4">
          <div className="text-sm text-gray-600 text-center md:text-left">
            {t('search_results.pagination.showing')} {((results.page - 1) * results.limit) + 1} - {Math.min(results.page * results.limit, results.total)} {t('search_results.pagination.from')} {results.total}
          </div>
          <div className="flex gap-2 w-full md:w-auto justify-center">
            <button
              onClick={() => onPageChange(results.page - 1)}
              disabled={results.page === 1}
              className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 disabled:opacity-50 disabled:bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              {t('search_results.pagination.prev')}
            </button>
            <button
              onClick={() => onPageChange(results.page + 1)}
              disabled={results.page === results.totalPages}
              className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 disabled:opacity-50 disabled:bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              {t('search_results.pagination.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};