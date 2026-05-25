export interface IOData {
  title: string;
  text: string;
  source?: string;
  url?: string;
  author?: string;
  doi?: string;
  publicationName?: string;
  dateFrom: string;
  dateTo: string;
  tags: string[];
  attachments: string[];
}

export interface FileUploadResponse {
  fileId: string;
  url: string;
  name: string;
}

export interface UIFile {
  id: string;
  name: string;
}