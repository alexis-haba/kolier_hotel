// context/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {jwtDecode} from 'jwt-decode';
import api from '../services/api'; // Assure-toi que api utilise Axios

// Type du token décodé
interface DecodedToken {
  exp: number;
  username?: string;
  role?: string;
  [key: string]: any;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: DecodedToken | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<DecodedToken | null>(null);
  const [loading, setLoading] = useState(true);

  // -----------------------------
  // Vérifier le token au lancement
  // -----------------------------
  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode<DecodedToken>(token);
          if (decoded.exp * 1000 > Date.now()) {
            setIsAuthenticated(true);
            setUser(decoded);
          } else {
            await AsyncStorage.removeItem('token');
            setIsAuthenticated(false);
            setUser(null);
          }
        } catch {
          await AsyncStorage.removeItem('token');
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // -----------------------------
  // Login
  // -----------------------------
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post('/auth/login', { username, password });
      
      if (response.status === 200 && response.data.token) {
        const { token } = response.data;
        await AsyncStorage.setItem('token', token);
        const decoded = jwtDecode<DecodedToken>(token);
        setIsAuthenticated(true);
        setUser(decoded);
        return true;
      }

      // Identifiants invalides
      return false;
    } catch (error: any) {
      // L’erreur est capturée ici → plus de redbox 401 sur iPhone
      return false;
    }
  };

  // -----------------------------
  // Logout
  // -----------------------------
  const logout = async (): Promise<void> => {
    await AsyncStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook pour utiliser le contexte
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};