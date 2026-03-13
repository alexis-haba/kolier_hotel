import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      // === Connexion ===
      const result = await login(username, password);
      
      if (!result.success) {
        setErrorMessage(result.error || 'Erreur de connexion');
        return;
      }

      // === Récupérer les résidences ===
      const token = localStorage.getItem('token');
      const resRes = await api.get('/residences', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const residences = resRes.data || [];

      // === Déterminer la résidence mère (la plus ancienne) ===
      residences.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const residenceMere = residences[0] || null;

      // === Sauvegarder la résidence mère ===
      if (residenceMere) {
        localStorage.setItem("currentResidence", JSON.stringify(residenceMere));
      } else {
        localStorage.removeItem("currentResidence");
      }

      // === Redirection ===
      if (!residenceMere) {
        navigate('/');
      } else {
        navigate('/residences');
      }

    } catch (err) {
      console.error('Erreur login:', err);
      if (!err.response) {
        setErrorMessage('Serveur inaccessible. Vérifiez la connexion et la configuration du backend.');
      } else if (err.response.status === 429) {
        setErrorMessage('Trop de tentatives. Réessayez après 15 minutes.');
      } else if (err.response.status === 401) {
        setErrorMessage('Identifiants invalides');
      } else {
        setErrorMessage(err.response?.data?.msg || 'Erreur de connexion');
      }
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-dark text-white">
      <div className="card p-4 shadow-lg" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="card-body">
          <h2 className="card-title text-center mb-4">Connexion Admin</h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="username" className="form-label">Nom d'utilisateur</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-control bg-light text-dark"
                placeholder="Entrez votre nom d'utilisateur"
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">Mot de passe</label>
              <div className="position-relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-control bg-light text-dark pe-5"
                  placeholder="Entrez votre mot de passe"
                  required
                />
                <span
                  onClick={togglePasswordVisibility}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: '15px',
                    transform: 'translateY(-50%)',
                    cursor: 'pointer',
                    color: '#6c757d'
                  }}
                >
                  <FontAwesomeIcon icon={showPassword ? 'eye-slash' : 'eye'} />
                </span>
              </div>
            </div>

            {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

            <button type="submit" className="btn btn-primary w-100 mt-3">
              Se connecter
            </button>
          </form>

          <p className="text-center mt-3 text-muted">
            The Vibes Admin - {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
