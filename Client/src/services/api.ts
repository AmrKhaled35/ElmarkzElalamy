import axios from 'axios';

const API_BASE_URL = 'https://elmarkzelalamy.pythonanywhere.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/api/auth/jwt/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/api/auth/jwt/create/', { email, password }),

  getCurrentUser: () =>
    api.get('/api/auth/users/me/'),
};

export const teachersAPI = {
  getAll: (page?: number, search?: string) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (search) params.append('search', search);
    return api.get(`/api/teachers/?${params.toString()}`);
  },
};

export const usersAPI = {
  getAll: (page?: number, search?: string) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (search) params.append('search', search);
    return api.get(`/api/auth/users/?${params.toString()}`);
  },

  create: (data: { full_name: string; email: string; role: string; password: string }) =>
    api.post('/api/auth/users/', data),

  update: (id: number, data: { full_name?: string; role?: string }) =>
    api.patch(`/api/auth/users/${id}/`, data),

  delete: (id: number, password: string) =>
    api.delete(`/api/auth/users/${id}/`, {
      data: {
        current_password: password
      }
    }),

  getById: (id: number) =>
    api.get(`/api/auth/users/${id}/`),
};

export const coursesAPI = {
  getAll: (page?: number, search?: string) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (search) params.append('search', search);
    return api.get(`/api/courses/?${params.toString()}`);
  },

  create: (data: { name: string; description: string }) =>
    api.post('/api/courses/', data),

  getById: (id: number) =>
    api.get(`/api/courses/${id}/`),

  update: (id: number, data: { name?: string; description?: string }) =>
    api.patch(`/api/courses/${id}/`, data),

  delete: (id: number) =>
    api.delete(`/api/courses/${id}/`),
};

export const levelsAPI = {
  getAll: (courseId: number, page?: number, search?: string) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (search) params.append('search', search);
    return api.get(`/api/level/list/${courseId}/?${params.toString()}`);
  },

  create: (data: { name: string; description: string; course: number; user: number }) =>
    api.post('/api/level/create/', data),

  getById: (id: number) =>
    api.get(`/api/level/${id}/`),

  update: (id: number, data: { name?: string; description?: string; course?: number; user?: number }) =>
    api.patch(`/api/level/${id}/`, data),

  delete: (id: number) =>
    api.delete(`/api/level/${id}/`),
};

export const studentsAPI = {
  getByLevel: (levelId: number, page?: number, search?: string) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (search) params.append('search', search);
    return api.get(`/api/student/level/${levelId}/?${params.toString()}`);
  },

  create: (levelId: number, data: { full_name: string; activity: number; oral: number; written: number }) =>
    api.post(`/api/student/level/${levelId}/`, data),

  getById: (id: number) =>
    api.get(`/api/student/${id}/`),

  update: (id: number, data: { full_name?: string; activity?: number; oral?: number; written?: number }) =>
    api.patch(`/api/student/${id}/`, data),

  delete: (id: number) =>
    api.delete(`/api/student/${id}/`),
  getPDF: (levelId: number) =>
    api.get(`/api/student/level/${levelId}/pdf`)
};

export default api;
