import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isAxiosError } from 'axios';
import { api } from '../api';
import { searchApi } from '../api/search';
import { SearchForm } from '../components/SearchForm';
import { SearchResultsTable } from '../components/SearchResultsTable';
import type { SearchFilters, SearchParams, PaginatedResponse, SearchResultItem } from '../types/search.types';

const defaultFilters: SearchFilters = {
  title: '',
  text: '',
  author: '',
  tags: '',
  dateFrom: '',
  dateTo: '',
  doi: '',
  everywhere: false,
};

export const SearchPage = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const initialFiltersFromHistory = location.state?.initialFilters as SearchFilters | undefined;

  const [filters, setFilters] = useState<SearchFilters | null>(initialFiltersFromHistory || null);
  const [results, setResults] = useState<PaginatedResponse<SearchResultItem> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  
  const limit = 10;

  const performSearch = async (currentFilters: SearchFilters, page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const params: SearchParams = { ...currentFilters, page, limit };
      const response = await searchApi.searchIO(params);
      setResults(response);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 400) {
        setError(t('search.error_no_tags') || 'Указанные теги не найдены в системе');
        setResults(null);
      } else {
        setError(t('search.error_general') || 'Произошла ошибка при поиске');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    
    const activeFilters: Partial<SearchFilters> = { ...newFilters };
    if (!activeFilters.title) delete activeFilters.title;
    if (!activeFilters.text) delete activeFilters.text;
    
    performSearch(activeFilters as SearchFilters, 0);
  };

  const handleSaveSearch = async (currentFilters: SearchFilters) => {
    try {
      const { tags, ...restFilters } = currentFilters;
      const parsedTags = tags
        ? tags.split(/[,\n]+/).map(t => t.trim()).filter(t => t !== '')
        : [];

      await api.post('/search-queries/', {
        name: "Поиск от " + new Date().toLocaleDateString(),
        ...restFilters,
        tags: parsedTags,
        tags_text: tags
      });
      setNotification(t('search.save_success', 'Поиск сохранен'));
      setTimeout(() => setNotification(null), 3000);
    } catch {
      setError(t('search.error_save', 'Произошла ошибка при сохранении поиска'));
    }
  };

  const handlePageChange = (newPage: number) => {
    if (filters) {
      performSearch(filters, newPage);
    }
  };

  useEffect(() => {
    const startingFilters = initialFiltersFromHistory || defaultFilters;
    handleSearch(startingFilters);
  }, [initialFiltersFromHistory]);

  return (
    <div className="max-w-6xl mx-auto relative">
      {notification && (
        <div className="fixed top-4 right-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg shadow-md z-50 animate-fade-in-down">
          {notification}
        </div>
      )}
      <h1 className="text-2xl font-bold mb-6 text-gray-900 tracking-tight">{t('search.title', 'Поиск')}</h1>
      <SearchForm 
        key={initialFiltersFromHistory ? JSON.stringify(initialFiltersFromHistory) : 'default'}
        onSearch={handleSearch}
        onSaveSearch={handleSaveSearch}
        isLoading={isLoading} 
        error={error} 
        initialFilters={initialFiltersFromHistory}
      />
      <div className="mt-6">
        <SearchResultsTable results={results} onPageChange={handlePageChange} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default SearchPage;