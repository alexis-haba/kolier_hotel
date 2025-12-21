import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const AddResidence = () => {
  const [name, setName] = useState('');
  const [link, setLink] = useState('');
  const [residences, setResidences] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Charger les résidences existantes
  useEffect(() => {
    const fetchResidences = async () => {
      try {
        const res = await api.get('/residences');
        setResidences(res.data || []);
      } catch (err) {
        console.error("Erreur récupération résidences:", err);
      }
    };
    fetchResidences();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !link) return alert("Veuillez remplir tous les champs");

    const duplicate = residences.find(
      r => r.name === name || r.link === link
    );
    if (duplicate) {
      alert("Erreur : une résidence avec le même nom ou le même lien existe déjà.");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/residences', { name, link });

      alert("Résidence ajoutée !");
      navigate('/residences');
    } catch (err) {
      console.error("Erreur ajout résidence:", err);
      alert("Impossible d'ajouter la résidence.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2>Ajouter une résidence</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Nom de la résidence</label>
          <input 
            type="text"
            className="form-control"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Lien de la résidence</label>
          <input 
            type="text"
            className="form-control"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Ajout en cours...' : 'Ajouter'}
        </button>
      </form>
    </div>
  );
};

export default AddResidence;
