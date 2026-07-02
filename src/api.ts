import axios from 'axios';
import type { UserProfile as UserProfile } from './types/auth.types';
import type { SearchResultItem, PaginatedResponse } from './types/search.types';
import type { UserDTO, InfoObjectDTO, PaginatedResponseDTO } from './types/dto.types';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true,
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isLoginRequest = error.config?.url?.includes('/login');
        const isOnLoginPage = window.location.pathname.includes('/login');

        if (error.response?.status === 401 && !isLoginRequest && !isOnLoginPage) {
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const mapRole = (profile: UserProfile): string => {
    if (profile.is_super_admin) return "СА";
    if (profile.is_data_admin) return "АД";
    if (profile.is_user_admin) return "АП";
    return "П";
}

export const mapUser = (dto: UserDTO, rulesAccepted: boolean = false): UserProfile => ({
  id: dto.id,
  email: dto.email,
  name: dto.full_name,
  login: dto.login || dto.email || '',
  is_user_admin: dto.is_user_admin,
  is_data_admin: dto.is_data_admin,
  is_super_admin: dto.is_super_admin,
  rules_accepted: rulesAccepted,
});

export const mapSearchResultItem = (dto: InfoObjectDTO): SearchResultItem => ({
    id: String(dto.id),
    title: dto.title,
    text: dto.content,
    source: dto.source || undefined,
    url: dto.url || undefined,
    author: dto.author || undefined,
    doi: dto.doi || undefined,
    publicationName: dto.publication_title || undefined,
    dateFrom: dto.publication_date_from || '',
    dateTo: dto.publication_date_to || '',
    tags: dto.tags?.map((t) => t.name) || [],
    attachments: dto.files?.map((f) => String(f.id)) || [],
    createdAt: dto.created_at,
    deletionFlag: dto.deletion_flag,
});

export const mapPaginated = <T, U>(
    dto: PaginatedResponseDTO<T>,
    mapper: (item: T) => U
): PaginatedResponse<U> => ({
    data: dto.items.map(mapper),
    total: dto.total,
    page: dto.page,
    limit: dto.size,
    totalPages: dto.pages,
});