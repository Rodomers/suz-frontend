import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SearchFilters } from '../types/search.types';

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

interface SearchFormProps {
  onSearch: (filters: SearchFilters) => void;
  onSaveSearch: (filters: SearchFilters) => void;
  isLoading: boolean;
  error: string | null;
  initialFilters?: SearchFilters | null;
}

export const SearchForm = ({ onSearch, onSaveSearch, isLoading, error, initialFilters }: SearchFormProps) => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<SearchFilters>(initialFilters || defaultFilters);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(filters);
  };

  const isFormEmpty = !filters.title && !filters.text && !filters.author && !filters.tags && !filters.dateFrom && !filters.dateTo && !filters.doi && !filters.everywhere;

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
      <h2 className="text-lg md:text-xl font-bold mb-4 text-gray-800">
        {t('search_form.title', 'Поиск информационных объектов')}
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            {t('search_form.fields.title', 'Название объекта')}
          </label>
          <input 
            type="text" 
            name="title" 
            value={filters.title} 
            onChange={handleChange} 
            placeholder={t('search_form.fields.title_placeholder', 'Введите название для поиска...')} 
            className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" 
          />
        </div>
        
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            {t('search_form.fields.author', 'Автор')}
          </label>
          <input 
            type="text" 
            name="author" 
            value={filters.author} 
            onChange={handleChange} 
            className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" 
          />
        </div>

        <div className="col-span-1 md:col-span-3">
          <label className="block text-sm font-medium text-gray-700">
            {t('search_form.fields.text', 'Содержимое (текст)')}
          </label>
          <input 
            type="text" 
            name="text" 
            value={filters.text} 
            onChange={handleChange} 
            placeholder={t('search_form.fields.text_placeholder', 'Поиск по внутреннему тексту ИО...')} 
            className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" 
          />
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            {t('search_form.fields.tags', 'Теги (метки)')}
          </label>
          <input 
            type="text" 
            name="tags" 
            value={filters.tags} 
            onChange={handleChange} 
            placeholder={t('search_form.fields.tags_placeholder', 'Вводите теги через запятую...')} 
            className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" 
          />
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            {t('search_form.fields.dateFrom', 'Дата публикации от')}
          </label>
          <input 
            type="date" 
            name="dateFrom" 
            value={filters.dateFrom} 
            onChange={handleChange} 
            className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" 
          />
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            {t('search_form.fields.dateTo', 'Дата публикации до')}
          </label>
          <input 
            type="date" 
            name="dateTo" 
            value={filters.dateTo} 
            onChange={handleChange} 
            className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" 
          />
        </div>

        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">
            {t('search_form.fields.doi', 'Идентификатор DOI')}
          </label>
          <input 
            type="text" 
            name="doi" 
            value={filters.doi} 
            onChange={handleChange} 
            className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none" 
          />
        </div>

        <div className="col-span-1 md:col-span-3 flex items-center mt-2 md:mt-4">
          <input 
            type="checkbox" 
            id="everywhere" 
            name="everywhere" 
            checked={filters.everywhere} 
            onChange={handleChange} 
            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
          />
          <label htmlFor="everywhere" className="ml-2 text-sm text-gray-700 font-medium">
            {t('search_form.fields.everywhere', 'Искать везде')}
          </label>
        </div>
      </div>

      <div className="mt-6 flex flex-col md:flex-row justify-end gap-3 border-t border-gray-100 pt-4">
        <button 
          type="button" 
          onClick={() => onSaveSearch(filters)} 
          disabled={isFormEmpty || isLoading} 
          className={`w-full md:w-auto px-6 py-2.5 font-medium rounded-lg transition-colors shadow-sm ${isFormEmpty || isLoading ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
        >
          {t('search_form.save_search', 'Сохранить поисковый запрос')}
        </button>
        <button 
          type="submit" 
          disabled={isLoading} 
          className={`w-full md:w-auto px-6 py-2.5 text-white font-medium rounded-lg transition-colors shadow-sm ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {isLoading ? t('search_form.searching', 'Поиск...') : t('search_form.submit', 'Найти')}
        </button>
      </div>
    </form>
  );
};