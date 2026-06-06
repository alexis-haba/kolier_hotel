import axios from 'axios';

// URL API: .env prioritaire, sinon auto-détection LAN (utile quand le site est ouvert depuis un téléphone)
const browserHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const fallbackApiUrl = browserHost && browserHost !== 'localhost'
  ? `http://${browserHost}:5000`
  : 'http://localhost:5000';
const apiUrl = process.env.REACT_APP_API_URL || fallbackApiUrl;

const api = axios.create({
  baseURL: `${apiUrl}/api`,
});

// ================== REQUEST ==================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ================== RESPONSE ==================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;

    if (status === 403 && code === "SUBSCRIPTION_ENDED") {
      localStorage.clear();
      window.location.href = "/subscription-ended";
      return Promise.reject(error);
    }

    if (status === 401) {
      localStorage.removeItem('token');
      window.location.href = "/login";
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default api;
