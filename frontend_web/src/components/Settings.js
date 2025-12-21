import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AddResidence from './AddResidence';
import { useNavigate } from 'react-router-dom';
import "./Settings.css";

const Settings = () => {
  const [tariff, setTariff] = useState({ hourRate: 10, nightRate: 50, tva: 0 });
  const [options, setOptions] = useState({ tvaEnabled: false });
  const [residences, setResidences] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTariff();
    fetchResidences();
  }, []);

  const fetchTariff = async () => {
    try {
      const res = await api.get('/tariffs');
      if (res.data) setTariff(res.data);
    } catch (err) {
      console.error('Erreur récupération tarifs:', err);
    }
  };

  const fetchResidences = async () => {
    try {
      const res = await api.get('/residences');
      setResidences(res.data);
    } catch (err) {
      console.error('Erreur récupération résidences:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/tariffs', tariff);
      alert('Paramètres mis à jour');
    } catch (err) {
      console.error('Erreur mise à jour tarifs:', err);
      alert('Erreur lors de la mise à jour');
    }
  };

  const toggleOption = (key) => setOptions({ ...options, [key]: !options[key] });

  const handleResidenceAdded = (newRes) => setResidences(prev => [...prev, newRes]);

  const handleEditResidence = async (res) => {
    const newName = prompt("Nouveau nom :", res.name);
    const newLink = prompt("Nouveau lien :", res.link);
    if (!newName || !newLink) return;

    try {
      const token = localStorage.getItem("token");
      const resUpdate = await api.put(`/residences/${res._id}`, { name: newName, link: newLink }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResidences(prev => prev.map(r => r._id === res._id ? resUpdate.data.residence : r));
      alert("Résidence modifiée !");
    } catch (err) {
      console.error(err);
      alert("Erreur modification résidence");
    }
  };

  const handleDeleteResidence = async (res) => {
    if (!window.confirm(`Voulez-vous supprimer la résidence "${res.name}" ?`)) return;

    try {
      const token = localStorage.getItem("token");
      await api.delete(`/residences/${res._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResidences(prev => prev.filter(r => r._id !== res._id));
      alert("Résidence supprimée !");
    } catch (err) {
      console.error(err);
      alert("Erreur suppression résidence");
    }
  };

  return (
    <div className="settings-page">
      <h2 className="settings-title">Paramètres Généraux</h2>

      {/* Section Tarifs */}
      <div className="settings-card">
        <form onSubmit={handleSubmit} className="tariff-form">
          <div className="form-group">
            <label>Tarif horaire :</label>
            <input
              type="number"
              value={tariff.hourRate || 0}
              onChange={(e) => setTariff({ ...tariff, hourRate: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Tarif nuitée :</label>
            <input
              type="number"
              value={tariff.nightRate || 0}
              onChange={(e) => setTariff({ ...tariff, nightRate: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>TVA (%) :</label>
            <input
              type="number"
              value={tariff.tva || 0}
              onChange={(e) => setTariff({ ...tariff, tva: e.target.value })}
              className="form-input"
            />
          </div>

          <div className="form-check">
            <input
              type="checkbox"
              checked={options.tvaEnabled}
              onChange={() => toggleOption('tvaEnabled')}
              className="form-check-input"
              id="tvaEnabled"
            />
            <label htmlFor="tvaEnabled" className="form-check-label">Activer TVA</label>
          </div>

          <button type="submit" className="btn-save">Sauvegarder</button>
        </form>
      </div>

      {/* Section Résidences */}
      <div className="settings-card">
        <h3 className="section-title">Résidences</h3>

        {/* Bouton pour voir toutes les résidences */}
        <button
          className="btn-view-residences"
          onClick={() => navigate('/residences')}
        >
          👀 Voir toutes les résidences
        </button>

        {residences.length > 0 ? (
          <ul className="residence-list">
            {residences.map((res) => (
              <li key={res._id} className="residence-item">
                <span>{res.name}</span>
                <div className="residence-actions">
                  <button className="btn-edit" onClick={() => handleEditResidence(res)}>✏️ Modifier</button>
                  <button className="btn-delete" onClick={() => handleDeleteResidence(res)}>🗑️ Supprimer</button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>Aucune résidence disponible.</p>
        )}

        <AddResidence onAdded={handleResidenceAdded} />
      </div>
    </div>
  );
};

export default Settings;
