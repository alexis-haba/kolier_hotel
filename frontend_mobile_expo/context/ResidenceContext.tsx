import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import api from '../services/api';
import { useAuth } from './AuthContext';

interface Modules {
  restaurantEnabled: boolean;
  nightclubEnabled: boolean;
}

interface ResidenceContextType {
  modules: Modules;
  refreshModules: () => Promise<void>;
  updateModules: (patch: Partial<Modules>) => Promise<void>;
}

const ResidenceContext = createContext<ResidenceContextType>({
  modules: { restaurantEnabled: false, nightclubEnabled: false },
  refreshModules: async () => {},
  updateModules: async () => {},
});

export function ResidenceProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [modules, setModules] = useState<Modules>({
    restaurantEnabled: false,
    nightclubEnabled: false,
  });

  const refreshModules = async () => {
    try {
      const { data } = await api.get('/settings');
      setModules({
        restaurantEnabled: data.restaurantEnabled ?? false,
        nightclubEnabled:  data.nightclubEnabled  ?? false,
      });
    } catch {
      // silencieux
    }
  };

  const updateModules = async (patch: Partial<Modules>) => {
    const { data } = await api.patch('/settings', patch);
    setModules({
      restaurantEnabled: data.restaurantEnabled,
      nightclubEnabled:  data.nightclubEnabled,
    });
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setModules({ restaurantEnabled: false, nightclubEnabled: false });
      return;
    }

    refreshModules();

    // Rafraîchit quand l'app revient au premier plan
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') refreshModules();
    });

    // Polling toutes les 30s
    const interval = setInterval(refreshModules, 30_000);

    return () => {
      sub.remove();
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  return (
    <ResidenceContext.Provider value={{ modules, refreshModules, updateModules }}>
      {children}
    </ResidenceContext.Provider>
  );
}

export const useResidence = () => useContext(ResidenceContext);
