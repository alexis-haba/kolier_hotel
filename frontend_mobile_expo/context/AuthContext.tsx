import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {jwtDecode} from 'jwt-decode'; // <-- correction ici
import api from '../services/api';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';


interface DecodedToken {
  exp: number;
  username?: string;
  role?: string;
  [key: string]: any; 
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: DecodedToken | null;
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

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        try {
          const decoded: DecodedToken = jwtDecode(token); // <-- utilise directement
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
    };
    checkAuth();
  }, []);

const login = async (username: string, password: string): Promise<boolean> => {
  try {
    console.log("[Auth] Tentative de login :", { username });

    // ✅ 1. Vérifie la connexion Internet avant la requête
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      Alert.alert('Connexion requise', 'Aucune connexion Internet. Vérifiez votre réseau.');
      console.warn("[Auth] Pas de connexion Internet.");
      return false;
    }

    // ✅ 2. Envoie la requête au serveur
    const response = await api.post('/auth/login', { username, password });
    console.log("[Auth] Réponse serveur :", response.status, response.data);

    // ✅ 3. Si tout est OK
    if (response.status === 200 && response.data.token) {
      const token = response.data.token;
      await AsyncStorage.setItem('token', token);

      const decoded: DecodedToken = jwtDecode(token);
      setIsAuthenticated(true);
      setUser(decoded);

      console.log("[Auth] Login réussi :", decoded);
      return true;
    }

    Alert.alert('Erreur', 'Identifiants invalides.');
    console.warn("[Auth] Identifiants invalides :", response.data);
    return false;

  } catch (err: any) {
    console.error("[Auth] Erreur login :", {
      message: err.message,
      responseData: err.response?.data,
      responseStatus: err.response?.status,
    });

    // ✅ 4. Gestion intelligente des erreurs
    if (err.message === 'Network Error') {
      Alert.alert('Serveur injoignable', 'Impossible de contacter le serveur. Réessayez plus tard.');
    } else if (err.response?.status === 401) {
      Alert.alert('Connexion échouée', 'Identifiants invalides.');
    } else {
      Alert.alert('Erreur', 'Un problème est survenu. Réessayez plus tard.');
    }

    return false;
  }
};


  const logout = async (): Promise<void> => {
    await AsyncStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    console.log("[Auth] Logout effectué.");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
