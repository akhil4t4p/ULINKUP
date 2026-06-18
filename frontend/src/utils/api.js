import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach access token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized and auto-refresh JWT
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        try {
          // Call refresh endpoint directly using a clean axios call to prevent loops
          const res = await axios.post(`${API_URL}/api/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          
          if (res.status === 200) {
            const newAccess = res.data.access;
            localStorage.setItem('access_token', newAccess);
            
            // Update auth headers in original request and retry
            originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // If refresh token is expired, sign out user
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login?session_expired=true';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
