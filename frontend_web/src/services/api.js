import axios from 'axios';

// On lit la variable d'environnement définie dans .env ou Render
const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: `${apiUrl}/api`,
});

// ================== REQUEST ==================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(
        '➡️ Requête envoyée:',
        config.method?.toUpperCase(),
        config.url
      );
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ================== RESPONSE ==================
api.interceptors.response.use(
  (response) => {
    console.log(
      '✅ Réponse:',
      response.config.url,
      'Status:',
      response.status
    );
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const code = error.response?.data?.code;

    // 🔴 CAS 1 : ABONNEMENT TERMINÉ (table users renommée)
    if (status === 403 && code === "SUBSCRIPTION_ENDED") {
      console.warn("🚫 Abonnement terminé – redirection forcée");

      localStorage.clear();
      window.location.href = "/subscription-ended";
      return Promise.reject(error);
    }

    // 🔐 CAS 2 : TOKEN INVALIDE / EXPIRÉ
    if (status === 401) {
      console.warn("🔑 Session expirée – retour login");

      localStorage.removeItem('token');
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // ❌ AUTRES ERREURS
    console.error(
      '❌ Erreur API:',
      error.message,
      'URL:',
      error.config?.url,
      'Status:',
      status,
      'Data:',
      error.response?.data
    );

    return Promise.reject(error);
  }
);

export default api;
