import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import apiClient from '../api/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Proactively verify token status or fetch latest user details
      apiClient.get('/auth/me')
        .then(res => {
          if (res.data.success) {
            const freshUser = res.data.data;
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          }
        })
        .catch(() => {
          // Token expired or invalid
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      if (response.data.success) {
        const { user: loggedUser, token: authToken } = response.data.data;
        setUser(loggedUser);
        setToken(authToken);
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(loggedUser));
        return { success: true };
      }
      return { success: false, error: response.data.message || 'Login failed' };
    } catch (err: any) {
      return { 
          success: false, 
          error: err.response?.data?.message || err.message || 'An error occurred during login' 
      };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/register', { name, email, password });
      if (response.data.success) {
        const { user: registeredUser, token: authToken } = response.data.data;
        setUser(registeredUser);
        setToken(authToken);
        localStorage.setItem('token', authToken);
        localStorage.setItem('user', JSON.stringify(registeredUser));
        return { success: true };
      }
      return { success: false, error: response.data.message || 'Registration failed' };
    } catch (err: any) {
      return { 
        success: false, 
        error: err.response?.data?.message || err.message || 'An error occurred during registration' 
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
