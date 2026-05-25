// import type { IOData, FileUploadResponse } from '../types/io.types';

// export const ioApi = {
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   saveDraft: async (_data: Partial<IOData>) => {
//     return new Promise((resolve) => setTimeout(resolve, 500));
//   },
  
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   createIO: async (_data: IOData) => {
//     return new Promise((resolve) => 
//       setTimeout(() => resolve({ data: { id: `io-${Date.now()}` } }), 1000)
//     );
//   },

//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   updateIO: async (_id: string, _data: IOData) => {
//     return new Promise((resolve) => setTimeout(resolve, 800));
//   },

//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   getIO: async (_id: string): Promise<{ data: IOData }> => {
//     return new Promise((resolve) => 
//       setTimeout(() => resolve({
//         data: {
//           title: 'Существующий ИО (Mock)',
//           text: 'Текст предзагружен с сервера для редактирования.',
//           source: 'Внутренняя база',
//           url: '', 
//           author: 'Иванов И.И.', 
//           doi: '', 
//           publicationName: '',
//           dateFrom: '2025-01-01T00:00:00', 
//           dateTo: '2025-12-31T23:59:59', 
//           tags: ['тест_редактирования', 'mock_данные'], 
//           attachments: []
//         }
//       }), 600)
//     );
//   },
  
//   uploadFile: async (file: File): Promise<{ data: FileUploadResponse }> => {
//     const formData = new FormData();
//     formData.append('file', file);
    
//     return new Promise((resolve) => 
//       setTimeout(() => resolve({
//         data: { fileId: `file-${Date.now()}`, url: URL.createObjectURL(file), name: file.name }
//       }), 800)
//     );
//   }
// };

import { api } from '../api';
import type { IOData } from '../types/io.types';
import type { MediaFileDTO } from '../types/dto.types';

export const ioApi = {
  saveDraft: async (_data: Partial<IOData>) => {
    return Promise.resolve();
  },
  
  createIO: async (data: IOData) => {
    const response = await api.post('/info-objects', data);
    return { data: response.data };
  },

  updateIO: async (id: string, data: IOData) => {
    const response = await api.put(`/info-objects/${id}`, data);
    return { data: response.data };
  },

  getIO: async (id: string): Promise<{ data: IOData }> => {
    const response = await api.get(`/info-objects/${id}`);
    return { data: response.data };
  },
  
  uploadFiles: async (infoObjectId: string, files: File[]): Promise<{ data: unknown }> => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    const response = await api.post(`/files/info-objects/${infoObjectId}`, formData);
    return { data: response.data };
  },

  getFiles: async (infoObjectId: string): Promise<{ data: MediaFileDTO[] }> => {
    const response = await api.get(`/files/info-objects/${infoObjectId}`);
    return { data: response.data };
  }
};