import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on application load
  useEffect(() => {
    const initializeAuth = async () => {
      const access = localStorage.getItem('access_token');
      const savedUser = localStorage.getItem('user');

      if (access && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          
          // Verify session by calling backend details endpoint
          const res = await api.get('/api/auth/user/');
          if (res.status === 200) {
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
          }
        } catch (error) {
          console.warn("Session restore failed, falling back to local credentials", error);
        }
      }
      setLoading(false);
    };
    
    initializeAuth();
  }, []);

  // Developer Mock Login (supports JWT generation and roles without OAuth setup)
  const devLogin = async (email, role) => {
    try {
      setLoading(true);
      const res = await api.post('/api/auth/developer/', { email, role });
      const { access, refresh, user: userData } = res.data;
      
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      console.error("Login failed:", err);
      return { success: false, error: err.response?.data?.error || "Login failed" };
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth Login — verifies Google id_token on the backend
  const googleLogin = async (credential, role = 'CUSTOMER') => {
    try {
      setLoading(true);
      // Send Google credential (id_token JWT) + desired role to backend
      const res = await api.post('/api/auth/google/', {
        credential,   // Google GSI id_token
        role,         // CUSTOMER or BUSINESS
      });

      const { access_token, refresh_token, user: userData } = res.data;

      // Ensure user role is set (backend may return default role)
      const updatedUser = { ...userData, role: userData.role || role };

      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (err) {
      console.error('Google authentication failed:', err);
      const errData = err.response?.data;
      // Provide helpful error based on backend response code
      if (errData?.code === 'GOOGLE_NOT_CONFIGURED') {
        return {
          success: false,
          error: 'Google Sign-In is not configured on this server yet. Use the mock login below, or ask the admin to set GOOGLE_CLIENT_ID.',
          code: 'GOOGLE_NOT_CONFIGURED'
        };
      }
      return {
        success: false,
        error: errData?.error || 'Google authentication failed. Please try again.',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Optional: Call backend logout endpoint
      await api.post('/api/auth/logout/');
    } catch (e) {
      // Ignore errors if tokens are already expired/invalid
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  const value = {
    user,
    setUser,
    loading,
    isAuthenticated: !!user,
    devLogin,
    googleLogin,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
