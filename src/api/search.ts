import { api, mapPaginated, mapSearchResultItem } from '../api';
import type { SearchParams, SearchResultItem, PaginatedResponse, SearchFilters } from '../types/search.types';
import type { InfoObjectDTO } from '../types/dto.types';

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
    
    return mapPaginated(response.data, (item: unknown) => {
      const dtoItem = item as InfoObjectDTO;
      const mappedResult = mapSearchResultItem(dtoItem) as unknown as Record<string, unknown>;
      
      if (Array.isArray(dtoItem.tags)) {
        mappedResult.tags = dtoItem.tags.map((t: unknown) => {
          if (typeof t === 'object' && t !== null) {
            const obj = t as Record<string, unknown>;
            return String(obj.name || obj.value || obj.title || JSON.stringify(t));
          }
          return String(t);
        });
      } else {
        mappedResult.tags = [];
      }
      
      return mappedResult as unknown as SearchResultItem;
    });
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