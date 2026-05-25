export interface UserDTO {
    id: number;
    login: string;
    full_name: string | null;
    email: string | null;
    role: string;
    is_user_admin: boolean;
    is_data_admin: boolean;
    is_super_admin: boolean;
}

export interface TagDTO {
    id: number;
    name: string;
}

export interface MediaFileDTO {
    id: number;
    original_name: string;
    stored_name: string;
    file_path: string;
    content_type: string;
    size_bytes: number;
    checksum_sha256: string;
    created_at: string;
    uploaded_by: number;
}

export interface InfoObjectDTO {
    id: number;
    title: string;
    content: string;
    source: string | null;
    author: string | null;
    url: string | null;
    doi: string | null;
    publication_title: string | null;
    publication_date_from: string | null;
    publication_date_to: string | null;
    created_at: string;
    updated_at: string;
    deletion_flag: boolean;
    deletion_reason: string | null;
    deleted_by: number | null;
    deleted_at: string | null;
    replacement_info_object_id: number | null;
    created_by: number;
    tags?: TagDTO[];
    files?: MediaFileDTO[];
}

export interface PaginatedResponseDTO<T> {
    items: T[];
    total: number;
    page: number;
    size: number;
    pages: number;
}