import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const token = apiClient.getToken();
      if (token) {
        const userData = await apiClient.get('/auth/me');
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to load current user:', err);
      apiClient.removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    apiClient.setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const signup = async (email, password, full_name, role) => {
    const res = await apiClient.post('/auth/signup', { email, password, full_name, role });
    apiClient.setToken(res.access_token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    apiClient.removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, fetchCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
