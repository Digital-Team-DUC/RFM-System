const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('rfm_token');
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${cleanEndpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If not already on login, clear storage and redirect
    if (!window.location.pathname.includes('/login')) {
      localStorage.removeItem('rfm_token');
      localStorage.removeItem('rfm_user');
      window.location.href = '/login';
    }
    throw new ApiError('Unauthorized session expired', 401);
  }

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = { message: response.statusText };
    }
    throw new ApiError(errorData.message || 'Request failed', response.status, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  get: <T = any>(url: string, params?: Record<string, any>) => {
    let fullUrl = url;
    if (params) {
      const search = new URLSearchParams();
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          search.append(key, String(val));
        }
      });
      const queryString = search.toString();
      if (queryString) fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString;
    }
    return request<T>(fullUrl, { method: 'GET' });
  },

  post: <T = any>(url: string, data?: any) =>
    request<T>(url, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  patch: <T = any>(url: string, data?: any) =>
    request<T>(url, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: <T = any>(url: string) =>
    request<T>(url, {
      method: 'DELETE',
    }),
};
