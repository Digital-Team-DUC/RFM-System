import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export interface User {
  id: string;
  email: string;
  fullName: string;
  khmerName?: string;
  phone?: string;
  organization: {
    id: string;
    name: string;
    code: string;
    currency: string;
  };
  roles: string[];
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('rfm_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('rfm_token'));
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  useEffect(() => {
    async function checkAuth() {
      const savedToken = localStorage.getItem('rfm_token');
      if (savedToken) {
        try {
          const profile = await api.get('/auth/profile');
          setUser(profile);
          localStorage.setItem('rfm_user', JSON.stringify(profile));
        } catch (err) {
          localStorage.removeItem('rfm_token');
          localStorage.removeItem('rfm_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const data = await api.post('/auth/login', { email, password: pass });
    localStorage.setItem('rfm_token', data.accessToken);
    localStorage.setItem('rfm_user', JSON.stringify(data.user));
    setToken(data.accessToken);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('rfm_token');
    localStorage.removeItem('rfm_user');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.roles?.includes('SUPER_ADMIN')) return true;
    return user.permissions?.includes(permission) ?? false;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        selectedProjectId,
        setSelectedProjectId,
        login,
        logout,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
