import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { API_URL } from '@env';

const configApiUrl = Constants.expoConfig?.extra?.apiUrl;
const resolvedApiUrl = (API_URL || configApiUrl || '').trim();

if (!resolvedApiUrl) {
  console.warn('[API] API_URL manquante. Vérifiez .env.local/.env.production ou app.config.js');
}

const api = axios.create({
  baseURL: `${resolvedApiUrl}/api`,
});

// Intercepteurs comme avant
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      return { data: { msg: 'Unauthorized' }, status: 401 };
    }
    return Promise.reject(error);
  }
);

export default api;
