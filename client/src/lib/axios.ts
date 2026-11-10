import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  withCredentials: true, // Crucial for sending cookies (refresh token)
});

export type Portal = 'admin' | 'employee';

// Admin and employee portals live on the same origin, so they get separate
// localStorage keys and separate refresh endpoints/cookies — otherwise
// logging into one portal in any tab silently overwrites the other portal's
// session (same key/cookie name), and the next request from the other portal
// fails with a confusing 403 Forbidden instead of a clear auth error.
export const tokenKey = (portal: Portal) => `${portal}_accessToken`;

const portalForUrl = (url?: string): Portal | null => {
  if (!url) return null;
  if (url.startsWith('/admin')) return 'admin';
  if (url.startsWith('/employee') || url === '/auth/employee/reset-password') return 'employee';
  return null;
};

// Request Interceptor: Attach the Access Token belonging to the portal this
// request is for.
api.interceptors.request.use(
  (config) => {
    const portal = portalForUrl(config.url);
    if (portal && config.headers) {
      const token = localStorage.getItem(tokenKey(portal));
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401s and token refreshing
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const portal = portalForUrl(originalRequest?.url);

    // Skip retry if:
    // 1. Not a 401
    // 2. Already retried
    // 3. This IS a refresh call itself (avoid infinite loop)
    // 4. We can't tell which portal this request belongs to
    const isRefreshCall = originalRequest?.url?.includes('/refresh');
    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshCall && portal) {
      originalRequest._retry = true;

      try {
        const { data } = await axios.post(
          `${api.defaults.baseURL}/auth/${portal}/refresh`,
          {},
          { withCredentials: true }
        );
        localStorage.setItem(tokenKey(portal), data.accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — clear this portal's token but do NOT force
        // redirect here. AuthContext / Layout components handle navigation.
        localStorage.removeItem(tokenKey(portal));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
