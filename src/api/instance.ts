import axios, { 
  type InternalAxiosRequestConfig, 
  type AxiosResponse, 
  type AxiosError 
} from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem('token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    return response;
  },
  (error: AxiosError) => {
    const status = error.response?.status;

    if (status === 401) {
      console.warn('Сессия истекла. Очистка данных и переход на вход...');
      localStorage.removeItem('token');
      
      window.location.href = '/login';
    }

    if (status === 403) {
      console.error('Ошибка 403: Доступ к ресурсу запрещен.');
    }

    if (status && status >= 500) {
      console.error('Ошибка сервера: На стороне бэкенда что-то пошло не так.');
    }

    return Promise.reject(error);
  }
);

export default api;