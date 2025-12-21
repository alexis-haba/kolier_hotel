import axios from 'axios';

// On lit la variable d'environnement définie dans .env ou Render
const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${apiUrl}/api`,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Requête envoyée avec URL:', config.url, 'Token:', token);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    console.log(
      'Réponse reçue pour URL:',
      response.config.url,
      'Status:',
      response.status,
      'Data:',
      response.data
    );
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.log(
        'Erreur 401 détectée pour URL:',
        error.config.url,
        'Détails:',
        error.response.data
      );
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else {
      console.error(
        'Erreur non 401:',
        error.message,
        'Config:',
        error.config,
        'Response:',
        error.response
      );
    }
    return Promise.reject(error);
  }
);

export default api;