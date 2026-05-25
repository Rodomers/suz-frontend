// import type { SearchParams, SearchResultItem, PaginatedResponse, SearchFilters } from '../types/search.types';

// export interface SearchHistoryItem {
//   id: string;
//   timestamp: string;
//   title: string | null;
//   filters: SearchFilters;
// }

// const generateMockResults = (count: number): SearchResultItem[] => {
//   return Array.from({ length: count }).map((_, idx) => ({
//     id: `io-mock-${idx}`,
//     title: `Информационный объект №${idx + 1}`,
//     text: `Текст объекта ${idx + 1}...`,
//     author: idx % 2 === 0 ? 'Иванов И.И.' : 'Петров П.П.',
//     source: 'База знаний',
//     tags: idx % 3 === 0 ? ['важное', 'отчет'] : ['черновик'],
//     dateFrom: '2023-01-01T00:00:00',
//     dateTo: '2024-01-01T00:00:00',
//     createdAt: new Date(Date.now() - idx * 10000000).toISOString(),
//     attachments: [] as string[]
//   }));
// };

// const allMockData = generateMockResults(45);

// const mockHistory: SearchHistoryItem[] = [
//   {
//     id: 'hist-1',
//     timestamp: new Date().toISOString(),
//     title: 'Поиск по автору Иванов',
//     filters: { text: '', author: 'Иванов', tags: '', dateFrom: '', dateTo: '', doi: '', everywhere: false }
//   },
//   {
//     id: 'hist-2',
//     timestamp: new Date(Date.now() - 86400000).toISOString(),
//     title: null,
//     filters: { text: 'Отчет', author: '', tags: 'важное', dateFrom: '2023-01-01', dateTo: '2024-01-01', doi: '', everywhere: true }
//   }
// ];

// export const searchApi = {
//   searchIO: async (params: SearchParams): Promise<PaginatedResponse<SearchResultItem>> => {
//     return new Promise((resolve, reject) => {
//       setTimeout(() => {
//         if (params.tags && params.tags.toLowerCase().includes('несуществующая')) {
//           reject(new Error('TAG_NOT_FOUND'));
//           return;
//         }

//         let filtered = [...allMockData];
//         if (params.text) {
//           filtered = filtered.filter(item => item.title.toLowerCase().includes(params.text.toLowerCase()));
//         }
//         if (params.author) {
//           filtered = filtered.filter(item => item.author && item.author.toLowerCase().includes(params.author!.toLowerCase()));
//         }

//         const startIndex = (params.page - 1) * params.limit;
//         const endIndex = startIndex + params.limit;
//         const paginatedData = filtered.slice(startIndex, endIndex);

//         resolve({
//           data: paginatedData,
//           total: filtered.length,
//           page: params.page,
//           limit: params.limit,
//           totalPages: Math.ceil(filtered.length / params.limit)
//         });
//       }, 600);
//     });
//   },

//   getSearchHistory: async (): Promise<SearchHistoryItem[]> => {
//     return new Promise((resolve) => {
//       setTimeout(() => {
//         resolve(mockHistory);
//       }, 400);
//     });
//   }
// };

import { api, mapPaginated, mapSearchResultItem } from '../api';
import type { SearchParams, SearchResultItem, PaginatedResponse, SearchFilters } from '../types/search.types';

export interface SearchHistoryItem {
  id: string;
  timestamp: string;
  title: string | null;
  filters: SearchFilters;
}

interface SearchQueryDTO {
  id: number;
  created_at: string;
  name: string;
  title: string | null;
  text: string | null;
  author: string | null;
  tags_text: string | null;
  publication_date_from: string | null;
  publication_date_to: string | null;
  doi: string | null;
  search_everywhere: string | boolean | null;
}

export const searchApi = {
  searchIO: async (params: SearchParams): Promise<PaginatedResponse<SearchResultItem>> => {
    const queryParams: Record<string, string | number | boolean> = {
      page: params.page,
      size: params.limit,
    };

    if (params.title) queryParams.title = params.title;
    if (params.text) queryParams.text = params.text;
    if (params.author) queryParams.author = params.author;
    if (params.tags) queryParams.tags = params.tags;
    if (params.dateFrom) queryParams.date_from = params.dateFrom;
    if (params.dateTo) queryParams.date_to = params.dateTo;
    if (params.doi) queryParams.doi = params.doi;
    if (params.everywhere) queryParams.search_everywhere = params.everywhere;

    const response = await api.get('/info-objects/search', { params: queryParams });
    return mapPaginated(response.data, mapSearchResultItem);
  },

  getSearchHistory: async (): Promise<SearchHistoryItem[]> => {
    const response = await api.get('/search-queries/my');
    
    return response.data.items.map((item: SearchQueryDTO) => ({
      id: String(item.id),
      timestamp: item.created_at,
      title: item.name,
      filters: {
        title: item.title || '',
        text: item.text || '',
        author: item.author || '',
        tags: item.tags_text ? item.tags_text.replace(/\n/g, ',') : '',
        dateFrom: item.publication_date_from || '',
        dateTo: item.publication_date_to || '',
        doi: item.doi || '',
        everywhere: item.search_everywhere === 'true' || item.search_everywhere === true
      }
    }));
  }
};