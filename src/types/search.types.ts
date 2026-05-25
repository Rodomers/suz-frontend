import type { IOData } from './io.types';

export interface SearchFilters {
  title: string,
  text: string;
  author: string;
  tags: string;
  dateFrom: string;
  dateTo: string;
  doi: string;
  everywhere: boolean;
}

export interface SearchParams extends SearchFilters {
  page: number;
  limit: number;
}

export interface SearchResultItem extends IOData {
  id: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SearchHistoryItem {
  id: string;
  timestamp: string;
  title: string | null;
  filters: SearchFilters;
}