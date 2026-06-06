import React, { useState, useEffect } from 'react';
import api from '../services/api';
import AddResidence from './AddResidence';
import { useNavigate } from 'react-router-dom';
import "./Settings.css";

// Mini modal de confirmation/notification interne
const Modal = ({ title, message, onConfirm, onCancel, type = 'confirm' }) => (
  <div className="modal-overlay">
    <div className="modal-box">
      <p className="modal-title">{title}</p>
      <p className="modal-message">{message}</p>
      <div className="modal-actions">
        {type === 'confirm' && (
          <button className="modal-btn modal-btn-cancel" onClick={onCancel}>Annuler</button>
        )}
        <button
          className={`modal-btn ${type === 'confirm' ? 'modal-btn-confirm' : 'modal-btn-ok'}`}
          onClick={onConfirm}
        >
          {type === 'confirm' ? 'Confirmer' : 'OK'}
        </button>
      </div>
    </div>
  </div>
);

// Mini modal d'édition résidence
const EditModal = ({ res, onSave, onCancel }) => {
  const [name, setName] = useState(res.name);
  const [link, setLink] = useState(res.link);
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <p className="modal-title">Modifier la résidence</p>
        <div className="form-group" style={{ marginTop: 12 }}>
          <label>Nom</label>
          <input className="form-input" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Lien</label>
          <input className="form-input" value={link} onChange={e => setLink(e.target.value)} />
        </div>
        <div className="modal-actions">
          <button className="modal-btn modal-btn-cancel" onClick={onCancel}>Annuler</button>
          <button className="modal-btn modal-btn-confirm" onClick={() => onSave(name, link)}>Sauvegarder</button>
        </div>
      </div>
    </div>
  );
};

const Settings = () => {
  const [tariff, setTariff] = useState({ hourRate: 10, nightRate: 50, tva: 0 });
  const [options, setOptions] = useState({ tvaEnabled: false });
  const [residences, setResidences] = useState([]);
  const [modules, setModules] = useState({ restaurantEnabled: false, nightclubEnabled: false });
  const [savingModules, setSavingModules] = useState(false);
  const [modal, setModal] = useState(null); // { type, title, message, onConfirm, onCancel }
  const [editModal, setEditModal] = useState(null); // résidence à éditer
  const navigate = useNavigate();

  useEffect(() => {
    fetchTariff();
    fetchResidences();
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const res = await api.get('/settings');
      setModules({
        restaurantEnabled: res.data.restaurantEnabled ?? false,
        nightclubEnabled:  res.data.nightclubEnabled  ?? false,
      });
    } catch {}
  };

  const toggleModule = async (key) => {
    const newValue = !modules[key];
    setModules(prev => ({ ...prev, [key]: newValue }));
    setSavingModules(true);
    try {
      await api.patch('/settings', { [key]: newValue });
    } catch {
      setModules(prev => ({ ...prev, [key]: !newValue }));
      showNotice('Erreur', 'Impossible de mettre à jour le module.');
    } finally {
      setSavingModules(false);
    }
  };

  const fetchTariff = async () => {
    try {
      const res = await api.get('/tariffs');
      if (res.data) setTariff(res.data);
    } catch {}
  };

  const fetchResidences = async () => {
    try {
      const res = await api.get('/residences');
      setResidences(res.data);
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/tariffs', tariff);
      showNotice('Succès', 'Paramètres mis à jour.');
    } catch {
      showNotice('Erreur', 'Erreur lors de la mise à jour.');
    }
  };

  const toggleOption = (key) => setOptions({ ...options, [key]: !options[key] });
  const handleResidenceAdded = (newRes) => setResidences(prev => [...prev, newRes]);

  const showNotice = (title, message) =>
    setModal({ type: 'notice', title, message, onConfirm: () => setModal(null) });

  const handleEditResidence = (res) => setEditModal(res);

  const saveEditResidence = async (newName, newLink) => {
    if (!newName || !newLink) return;
    try {
      const resUpdate = await api.put(`/residences/${editModal._id}`, { name: newName, link: newLink });
      setResidences(prev => prev.map(r => r._id === editModal._id ? resUpdate.data.residence : r));
      setEditModal(null);
      showNotice('Succès', 'Résidence modifiée.');
    } catch {
      showNotice('Erreur', 'Erreur lors de la modification.');
    }
  };

  const handleDeleteResidence = (res) => {
    setModal({
      type: 'confirm',
      title: 'Supprimer',
      message: `Voulez-vous supprimer la résidence "${res.name}" ?`,
      onCancel: () => setModal(null),
      onConfirm: async () => {
        setModal(null);
        try {
          await api.delete(`/residences/${res._id}`);
          setResidences(prev => prev.filter(r => r._id !== res._id));
          showNotice('Succès', 'Résidence supprimée.');
        } catch {
          showNotice('Erreur', 'Erreur lors de la suppression.');
        }
      },
    });
  };

  return (
    <div className="settings-page">
      {modal && (
        <Modal
          title={modal.title}
          message={modal.message}
          type={modal.type}
          onConfirm={modal.onConfirm}
          onCancel={modal.onCancel}
        />
      )}
      {editModal && (
        <EditModal
          res={editModal}
          onSave={saveEditResidence}
          onCancel={() => setEditModal(null)}
        />
      )}

      <h2 className="settings-title">Paramètres Généraux</h2>

      {/* Section Tarifs */}
      <div className="settings-card">
        <form onSubmit={handleSubmit} className="tariff-form">
          <div className="form-group">
            <label>Tarif horaire :</label>
            <input type="number" value={tariff.hourRate || 0} onChange={(e) => setTariff({ ...tariff, hourRate: e.target.value })} className="form-input" />
          </div>
          <div className="form-group">
            <label>Tarif nuitée :</label>
            <input type="number" value={tariff.nightRate || 0} onChange={(e) => setTariff({ ...tariff, nightRate: e.target.value })} className="form-input" />
          </div>
          <div className="form-group">
            <label>TVA (%) :</label>
            <input type="number" value={tariff.tva || 0} onChange={(e) => setTariff({ ...tariff, tva: e.target.value })} className="form-input" />
          </div>
          <div className="form-check">
            <input type="checkbox" checked={options.tvaEnabled} onChange={() => toggleOption('tvaEnabled')} className="form-check-input" id="tvaEnabled" />
            <label htmlFor="tvaEnabled" className="form-check-label">Activer TVA</label>
          </div>
          <button type="submit" className="btn-save">Sauvegarder</button>
        </form>
      </div>

      {/* Section Modules */}
      <div className="settings-card">
        <h3 className="section-title">Modules optionnels</h3>
        {savingModules && <p style={{ color: '#6B7280', fontSize: 13, marginBottom: 8 }}>Enregistrement...</p>}

        <div className="module-toggle-row">
          <div className="module-toggle-info">
            <span className="module-icon">🍽️</span>
            <div>
              <strong>Restaurant</strong>
              <p className="module-desc">Activer la saisie des entrées et dépenses restaurant sur l'app mobile</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" checked={modules.restaurantEnabled} onChange={() => toggleModule('restaurantEnabled')} disabled={savingModules} />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="module-toggle-row">
          <div className="module-toggle-info">
            <span className="module-icon">🎵</span>
            <div>
              <strong>Boîte de nuit</strong>
              <p className="module-desc">Activer la saisie des entrées et dépenses boîte de nuit sur l'app mobile</p>
            </div>
          </div>
          <label className="toggle-switch">
            <input type="checkbox" checked={modules.nightclubEnabled} onChange={() => toggleModule('nightclubEnabled')} disabled={savingModules} />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      {/* Section Résidences */}
      <div className="settings-card">
        <h3 className="section-title">Résidences</h3>
        <button className="btn-view-residences" onClick={() => navigate('/residences')}>
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
