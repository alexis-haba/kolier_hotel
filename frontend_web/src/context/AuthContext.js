import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setIsAuthenticated(false);
          setUser(null);
          setLoading(false);
          return;
        }

        try {
          // Décoder le token pour vérifier l'expiration
          const decoded = jwtDecode(token);
          
          // Vérifier si le token est expiré
          if (decoded.exp * 1000 < Date.now()) {
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            setUser(null);
            setLoading(false);
            return;
          }

          // Token valide, utiliser les données du token
          setIsAuthenticated(true);
          setUser(decoded);
          setLoading(false);
          
        } catch (decodeError) {
          // Token invalide
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setUser(null);
          setLoading(false);
        }
      } catch (err) {
        console.error('[Auth] Erreur lors de la vérification:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/auth/login', {
        username: username.trim(),
        password
      });

      if (response.status === 200 && response.data.token) {
        const token = response.data.token;
        const decoded = jwtDecode(token);
        
        localStorage.setItem('token', token);
        setIsAuthenticated(true);
        setUser(decoded);
        setLoading(false);
        
        return { success: true, user: decoded };
      }
      
      setError('Réponse serveur invalide');
      setLoading(false);
      return { success: false, error: 'Réponse serveur invalide' };
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Erreur de connexion';
      setError(errorMessage);
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('currentResidence');
      setIsAuthenticated(false);
      setUser(null);
      setError(null);
    } catch (err) {
      console.error('[Auth] Erreur logout:', err);
    }
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
}
