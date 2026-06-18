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

  // Google OAuth Login View endpoint
  const googleLogin = async (accessToken, role = 'CUSTOMER') => {
    try {
      setLoading(true);
      // Send Google credential token to Django backend SocialLogin view
      const res = await api.post('/api/auth/google/', { access_token: accessToken });
      const { access_token, refresh_token, user: userData } = res.data;

      // Ensure user role is updated/set
      const updatedUser = { ...userData, role };
      
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setUser(updatedUser);
      return { success: true, user: updatedUser };
    } catch (err) {
      console.error("Google authentication failed:", err);
      return { success: false, error: "Google OAuth validation failed" };
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
