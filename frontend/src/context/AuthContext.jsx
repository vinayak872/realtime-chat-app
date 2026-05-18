import React, { createContext, useState, useCallback, useEffect } from 'react';
import { authService } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(false);

  // Load user profile when token is available
  useEffect(() => {
    const loadProfile = async () => {
      if (token && !user) {
        try {
          setLoading(true);
          const response = await authService.getProfile();
          setUser(response.data.user);
        } catch (error) {
          console.error('Failed to load user profile:', error);
          // Clear token if profile fetch fails
          setToken(null);
          localStorage.removeItem('token');
        } finally {
          setLoading(false);
        }
      }
    };
    loadProfile();
  }, [token, user]);

  const login = useCallback((userData, token) => {
    setUser(userData);
    setToken(token);
    localStorage.setItem('token', token);
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      // Call logout API endpoint
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state and storage
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setLoading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

