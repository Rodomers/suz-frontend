export interface UserResponse {
  id: number;
  full_name: string;
  login: string;
  email: string;
  is_super_admin: boolean;
  is_data_admin: boolean;
  is_user_admin: boolean;
  access_start: string | null;
  access_end: string | null;
}

export interface DeletionRequest {
  id: number;
  info_object_id: number;
  requested_by: number;
  reason: string;
  replacement_info_object_id: number | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  reviewed_by: number | null;
  reviewed_at: string | null;
}

export interface AdminUser {
  id: string;
  flag: boolean;
  login: string;
  email: string;
  name: string;
  role: 'СА' | 'АД' | 'АП' | 'П';
  access_expires_at: string;
}

export interface AdminTag {
  id: string;
  name: string;
  linkedObjectsCount: number;
}

export interface IOPreview {
  id: string;
  title: string;
  createdAt: string;
}