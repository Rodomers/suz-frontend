import { api } from '../api';
import type { AdminUser, AdminTag, IOPreview, UserResponse } from '../types/admin.types';

interface BackendIO {
  id: number | string;
  title?: string;
  name?: string;
  created_at?: string;
  createdAt?: string;
}

export const adminApi = {
  getUsers: async (): Promise<AdminUser[]> => {
    const response = await api.get<UserResponse[]>('/users');
    return response.data.map((user) => ({
      id: user.id.toString(),
      name: user.full_name,
      role: user.is_super_admin ? 'СА' : user.is_data_admin ? 'АД' : user.is_user_admin ? 'АП' : 'П',
      login: user.login,
      email: user.email,
      flag: true,
      access_expires_at: ''
    }));
  },

  updateUser: async (id: string, data: Partial<AdminUser>): Promise<void> => {
    await api.put(`/users/${id}`, data);
  },

  deleteUsers: async (ids: string[]): Promise<void> => {
    await Promise.all(ids.map(id => api.delete(`/users/${id}`)));
  },

  getTags: async (): Promise<AdminTag[]> => {
    const response = await api.get<{ items: string[] }>('/tags');
    return response.data.items.map((tag) => ({
      id: tag,
      name: tag,
      linkedObjectsCount: 0
    }));
  },

  createTag: async (name: string): Promise<AdminTag> => {
    const response = await api.post<{ name: string } | string>('/tags', { name });
    const tagName = typeof response.data === 'string' ? response.data : (response.data as any).name || name;
    return {
      id: tagName,
      name: tagName,
      linkedObjectsCount: 0
    };
  },

  updateTag: async (oldName: string, newName: string): Promise<void> => {
    await api.post('/tags/replace', {
      old_tag: oldName,
      new_tag: newName,
      scope: 'mine' 
    });
  },

  deleteTag: async (name: string): Promise<void> => {
    await api.post('/tags/delete', {
      tag: name,
      scope: 'mine'
    });
  },

  getIOPreviews: async (): Promise<IOPreview[]> => {
    const response = await api.get<{ items: BackendIO[] }>('/info-objects');
    return response.data.items.map((io) => ({
      id: io.id.toString(),
      title: io.title || io.name || 'Без названия',
      createdAt: io.created_at || io.createdAt || ''
    }));
  },

  massDeleteIO: async (ids: string[]): Promise<void> => {
    await Promise.all(
      ids.map(id => api.delete(`/info-objects/${id}/hard-delete`))
    );
  }
};