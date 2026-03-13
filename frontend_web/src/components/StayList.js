import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { Modal, Button, Form } from 'react-bootstrap';

const StayList = ({ filters, setFilters }) => {
  const [stays, setStays] = useState([]);
  const [selectedStay, setSelectedStay] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ amount: '', paymentMethod: '' });

  // === Récupération des séjours ===
  const fetchStays = useCallback(async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const selectedDate = filters.date || today;

      const params = {
        phase: filters.phase || undefined,
        date: selectedDate,
        roomId: filters.roomId || undefined,
      };

      const stayRes = await api.get('/stays', { params });
      const staysData = stayRes.data || [];

      const entryRes = await api.get('/entries', { params: { date: selectedDate } });
      const entriesData = entryRes.data.entries || [];

      const formattedStays = staysData.map(s => ({
        _id: s._id,
        phase: s.phase,
        amount: s.amount,
        expenses: s.expenses || [],
        balance: (s.amount || 0) - (s.expenses?.reduce((x, e) => x + (e.amount || 0), 0)),
        startTime: s.startTime,
        endTime: s.endTime,
        roomId: s.roomId,
        paymentMethod: s.paymentMethod || "—",
        createdBy: s.createdBy?.username || "Inconnu",
      }));

      const formattedEntries = entriesData.map(e => ({
        _id: e._id,
        phase: "entry",
        amount: e.totalIncome,
        expenses: e.expenses || [],
        balance: (e.totalIncome || 0) - (e.totalExpenses || 0),
        startTime: e.date,
        endTime: e.date,
        roomId: null,
        paymentMethod: "Caisse",
      }));

      const allStays = [...formattedStays, ...formattedEntries].sort(
        (a, b) => new Date(b.startTime) - new Date(a.startTime)
      );

      setStays(allStays);
    } catch (err) {
      console.error('Erreur /entries:', err.response?.data || err.message);
      setStays([]);
    }
  }, [filters]);

  useEffect(() => {
    fetchStays();
  }, [fetchStays]);

  const handleShowModal = (stay) => {
    setSelectedStay(stay);
    setShowModal(true);
    setIsEditing(false);
    setEditData({ amount: stay.amount, paymentMethod: stay.paymentMethod });
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedStay(null);
    setIsEditing(false);
  };

  // === SUPPRIMER ===
  const handleDelete = async () => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce séjour ?")) return;
    try {
      await api.delete(`/stays/${selectedStay._id}`);
      alert("Séjour supprimé avec succès !");
      handleCloseModal();
      fetchStays();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression.");
    }
  };

  // === SAUVEGARDER MODIFICATION ===
  const handleSaveEdit = async () => {
    try {
      await api.put(`/stays/${selectedStay._id}`, editData);
      alert("Séjour mis à jour !");
      handleCloseModal();
      fetchStays();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour.");
    }
  };

  return (
    <div className="mb-4">
      <h2 className="h4 mb-2">Liste des Séjours & Journées</h2>

      {/* 🔍 Filtres */}
      <div className="row g-2 mb-3">
        <div className="col-12 col-md-3">
          <select
            value={filters.phase || ''}
            onChange={(e) => setFilters({ ...filters, phase: e.target.value || undefined })}
            className="form-select"
          >
            <option value="">Tous</option>
            <option value="day">Journée</option>
            <option value="hour">Heure</option>
            <option value="night">Nuitée</option>
          </select>
        </div>

        <div className="col-12 col-md-3">
          <input
            type="date"
            className="form-control"
            value={filters.date || ''}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          />
        </div>

        <div className="col-12 col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Filtrer par ID chambre"
            value={filters.roomId || ''}
            onChange={(e) => setFilters({ ...filters, roomId: e.target.value })}
          />
        </div>
      </div>

      {/* 🧾 Tableau des séjours */}
      {stays.length === 0 ? (
        <div className="alert alert-light border text-center">
          <p className="mb-2">Aucune donnée pour cette période.</p>
          <p className="small text-muted mb-3">Essayez Hier / Semaine passée ou sélectionnez une chambre.</p>
          <div className="d-flex flex-wrap justify-content-center gap-2">
            <button
              className="btn btn-sm btn-outline-warning"
              onClick={() => {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                setFilters({ ...filters, date: yesterday.toISOString().split('T')[0] });
              }}
            >
              Voir Hier
            </button>
            <button
              className="btn btn-sm btn-outline-info"
              onClick={() => {
                const lastWeek = new Date();
                lastWeek.setDate(lastWeek.getDate() - 7);
                setFilters({ ...filters, date: lastWeek.toISOString().split('T')[0] });
              }}
            >
              Semaine passée
            </button>
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => window.location.hash = '#expense-form'}
            >
              Créer une dépense
            </button>
          </div>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead>
              <tr>
                <th>Chambre</th>
                <th>Type</th>
                <th>Montant</th>
                <th>Solde</th>
                <th>Début</th>
                <th>Fin</th>
                <th>Paiement</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stays.map((stay) => (
                <tr key={stay._id}>
                  <td>{stay.roomId?.number || (stay.phase === 'day' ? '—' : 'N/A')}</td>
                  <td>{stay.phase === 'night' ? 'Nuitée' : stay.phase === 'hour' ? 'Heure' : 'Entrée Caisse'}</td>
                  <td>{Number(stay.amount || 0).toLocaleString('fr-FR')} FG</td>
                  <td>{Number(stay.balance || 0).toLocaleString('fr-FR')} FG</td>
                  <td>{new Date(stay.startTime).toLocaleString()}</td>
                  <td>{stay.endTime ? new Date(stay.endTime).toLocaleString() : 'En cours'}</td>
                  <td>{stay.paymentMethod || '—'}</td>
                  <td>
                    <Button size="sm" variant="info" onClick={() => handleShowModal(stay)}>Voir</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 🔍 MODALE DÉTAIL */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>{isEditing ? "Modifier le Séjour" : "Détails du Séjour"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedStay && !isEditing && (
            <div>
              <p><strong>Chambre:</strong> {selectedStay.roomId?.number || '—'}</p>
              <p><strong>Type:</strong> {selectedStay.phase}</p>
              <p><strong>Montant:</strong> {Number(selectedStay.amount || 0).toLocaleString('fr-FR')} FG</p>
              <p><strong>Paiement:</strong> {selectedStay.paymentMethod || '—'}</p>
              <p><strong>Début:</strong> {new Date(selectedStay.startTime).toLocaleString()}</p>
              <p><strong>Fin:</strong> {selectedStay.endTime ? new Date(selectedStay.endTime).toLocaleString() : 'En cours'}</p>
              <p><strong>Enregistré par:</strong> {selectedStay.createdBy}</p>
            </div>
          )}

          {isEditing && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Montant (FG)</Form.Label>
                <Form.Control
                  type="number"
                  value={editData.amount}
                  onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Méthode de paiement</Form.Label>
                <Form.Control
                  type="text"
                  value={editData.paymentMethod}
                  onChange={(e) => setEditData({ ...editData, paymentMethod: e.target.value })}
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>

        <Modal.Footer>
          {!isEditing ? (
            <>
              <Button variant="warning" onClick={() => setIsEditing(true)}>Modifier</Button>
              <Button variant="danger" onClick={handleDelete}>Supprimer</Button>
              <Button variant="secondary" onClick={handleCloseModal}>Fermer</Button>
            </>
          ) : (
            <>
              <Button variant="success" onClick={handleSaveEdit}>Enregistrer</Button>
              <Button variant="secondary" onClick={() => setIsEditing(false)}>Annuler</Button>
            </>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default StayList;
