import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/',
});

let currentHash = null;
let lastDispatchTime = 0;

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

let refreshPromise = null;

api.interceptors.response.use(
  (response) => {
    if (response.config.url && response.config.url.includes('auth/debug-permissions')) {
      return response;
    }
    const newHash = response.headers['x-user-permissions-hash'];
    if (newHash) {
      // Send diagnostic log to server terminal (only in dev mode)
      if (import.meta.env.DEV) {
        api.get(`auth/debug-permissions?msg=${encodeURIComponent(`[API] ${response.config.url} new=${newHash.substring(0, 8)} cur=${currentHash ? currentHash.substring(0, 8) : 'null'}`)}`).catch(() => {});
      }
      
      if (currentHash && currentHash !== newHash) {
        const now = Date.now();
        if (now - lastDispatchTime > 10000) {
          lastDispatchTime = now;
          if (import.meta.env.DEV) {
            api.get(`auth/debug-permissions?msg=${encodeURIComponent(`[WARN] MISMATCH Old=${currentHash.substring(0, 8)} New=${newHash.substring(0, 8)}`)}`).catch(() => {});
          }
          currentHash = newHash;
          window.dispatchEvent(new CustomEvent('auth-permissions-changed'));
        } else {
          if (import.meta.env.DEV) {
            api.get(`auth/debug-permissions?msg=${encodeURIComponent(`[THROTTLE] Old=${currentHash.substring(0, 8)} New=${newHash.substring(0, 8)}`)}`).catch(() => {});
          }
          currentHash = newHash;
        }
      } else {
        currentHash = newHash;
      }
    }
    return response;
  },
  (error) => {
    if (error.config?.url && error.config.url.includes('auth/debug-permissions')) {
      return Promise.reject(error);
    }
    const newHash = error.response?.headers?.['x-user-permissions-hash'];
    if (newHash) {
      if (import.meta.env.DEV) {
        api.get(`auth/debug-permissions?msg=${encodeURIComponent(`[API Error] new=${newHash.substring(0, 8)} cur=${currentHash ? currentHash.substring(0, 8) : 'null'}`)}`).catch(() => {});
      }
      if (currentHash && currentHash !== newHash) {
        const now = Date.now();
        if (now - lastDispatchTime > 10000) {
          lastDispatchTime = now;
          if (import.meta.env.DEV) {
            api.get(`auth/debug-permissions?msg=${encodeURIComponent(`[WARN Error] MISMATCH Old=${currentHash.substring(0, 8)} New=${newHash.substring(0, 8)}`)}`).catch(() => {});
          }
          currentHash = newHash;
          window.dispatchEvent(new CustomEvent('auth-permissions-changed'));
        } else {
          if (import.meta.env.DEV) {
            api.get(`auth/debug-permissions?msg=${encodeURIComponent(`[THROTTLE Error] Old=${currentHash.substring(0, 8)} New=${newHash.substring(0, 8)}`)}`).catch(() => {});
          }
          currentHash = newHash;
        }
      } else {
        currentHash = newHash;
      }
    }

    const originalRequest = error.config;
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !originalRequest.url.includes('auth/token/refresh')) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        originalRequest._retry = true;
        if (!refreshPromise) {
          const baseURL = api.defaults.baseURL || 'http://localhost:8000/api/';
          refreshPromise = axios.post(`${baseURL}auth/token/refresh`, {
            refresh: refreshToken
          }).then(res => {
            const { access, refresh } = res.data;
            localStorage.setItem('token', access);
            if (refresh) {
              localStorage.setItem('refresh_token', refresh);
            }
            refreshPromise = null;
            return access;
          }).catch(err => {
            refreshPromise = null;
            localStorage.removeItem('token');
            localStorage.removeItem('refresh_token');
            currentHash = null;
            if (!window.location.pathname.startsWith('/login') &&
                !window.location.pathname.startsWith('/register') &&
                window.location.pathname !== '/') {
              window.location.href = '/login';
            }
            return Promise.reject(err);
          });
        }
        return refreshPromise.then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }
    }

    if (error.response?.status === 401) {
      // Token expired or invalid — clear and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      currentHash = null;
      // Avoid redirect loop if already on auth pages
      if (!window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/register') &&
          window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
