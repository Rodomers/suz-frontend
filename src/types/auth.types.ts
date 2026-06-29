export interface UserProfile {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  is_user_admin: boolean;
  is_data_admin: boolean;
  is_super_admin: boolean;
  access_start?: string | null;
  access_end?: string | null;
  organization?: string | null;
  position?: string | null;
  phone?: string | null;
  comment?: string | null;
}

export type User = UserProfile;

export interface UserAgreement {
    id: number;
    user_id: number;
    full_name: string;
    job_title: string;
    organization: string;
    accepted_rules: boolean;
    accepted_personal_data: boolean;
    accepted_at: string;
    accepted_ip: string;
}

export interface CaptchaCheckResponse {
    ok: boolean;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    user: UserProfile;
}