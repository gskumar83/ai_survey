import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api, { tokenKey, type Portal } from '../lib/axios';

export interface User {
  id: string;
  role: 'admin' | 'employee';
}

interface AuthContextType {
  // Admin and employee sessions are tracked independently — a browser can
  // legitimately be logged into both portals at once, and logging into one
  // must never affect the other (see lib/axios.ts for why).
  adminUser: User | null;
  employeeUser: User | null;
  isLoading: boolean;
  login: (token: string) => void;
  logout: (role: Portal) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [employeeUser, setEmployeeUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const hydrate = async (role: Portal, setUser: (u: User | null) => void) => {
      const token = localStorage.getItem(tokenKey(role));
      if (token) {
        try {
          setUser(jwtDecode<User>(token));
          return;
        } catch {
          // Token is malformed — clear it and fall through to a silent refresh
          localStorage.removeItem(tokenKey(role));
        }
      }
      // No local token — try a silent refresh via this portal's httpOnly cookie
      try {
        const { data } = await api.post(`/auth/${role}/refresh`);
        localStorage.setItem(tokenKey(role), data.accessToken);
        setUser(jwtDecode<User>(data.accessToken));
      } catch {
        // No valid session for this portal — that's fine, guest for this role
      }
    };

    Promise.all([
      hydrate('admin', setAdminUser),
      hydrate('employee', setEmployeeUser),
    ]).finally(() => setIsLoading(false));
  }, []);

  const login = (token: string) => {
    const decoded = jwtDecode<User>(token);
    localStorage.setItem(tokenKey(decoded.role), token);
    if (decoded.role === 'admin') setAdminUser(decoded);
    else setEmployeeUser(decoded);
  };

  const logout = async (role: Portal) => {
    try {
      await api.post(`/auth/${role}/logout`);
    } catch (error) {
      console.error('Logout error', error);
    } finally {
      localStorage.removeItem(tokenKey(role));
      if (role === 'admin') setAdminUser(null);
      else setEmployeeUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ adminUser, employeeUser, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
