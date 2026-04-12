// frontend_web/src/components/RoomManagement.js (adapte classes à Bootstrap)
import React, { useState, useEffect } from 'react';
import api from '../services/api';
import RoomHistoryModal from './RoomHistoryModal';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
ChartJS.register(ArcElement, Tooltip, Legend);

const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({ number: '', type: 'standard' });
  const [editingId, setEditingId] = useState(null);
  const [filterState, setFilterState] = useState('');
  const [sortState, setSortState] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [historyRoomId, setHistoryRoomId] = useState(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await api.get('/rooms');
      setRooms(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/rooms/${editingId}`, form);
      } else {
        await api.post('/rooms', form);
      }
      fetchRooms();
      setForm({ number: '', type: 'standard' });
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (room) => {
    setForm({ number: room.number, type: room.type });
    setEditingId(room._id);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/rooms/${id}`);
      fetchRooms();
    } catch (err) {
      console.error(err);
    }
  };

  // Filtrage, tri et recherche
  const [searchNumber, setSearchNumber] = useState('');
  let filteredRooms = rooms;
  if (filterState) {
    filteredRooms = filteredRooms.filter(r => r.state === filterState);
  }
  if (searchNumber) {
    filteredRooms = filteredRooms.filter(r => r.number.toLowerCase().includes(searchNumber.toLowerCase()));
  }
  if (sortState) {
    filteredRooms = [...filteredRooms].sort((a, b) => {
      if (sortState === 'asc') return a.state.localeCompare(b.state);
      if (sortState === 'desc') return b.state.localeCompare(a.state);
      return 0;
    });
  }

  // Statistiques pour graphique
  const stateCounts = rooms.reduce((acc, r) => {
    acc[r.state] = (acc[r.state] || 0) + 1;
    return acc;
  }, {});
  const pieData = {
    labels: ['Libre', 'Occupée', 'Nettoyage'],
    datasets: [
      {
        data: [stateCounts['free'] || 0, stateCounts['occupied'] || 0, stateCounts['cleaning'] || 0],
        backgroundColor: ['#198754', '#dc3545', '#ffc107'],
        borderColor: ['#fff', '#fff', '#fff'],
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="p-4">
      <h2 className="h4 mb-4">Gestion des Chambres</h2>



      {/* Filtres et recherche */}
      <div className="mb-3 d-flex flex-wrap gap-2 align-items-center">
        <label className="form-label mb-0">Filtrer par état :</label>
        <select className="form-select form-select-sm w-auto" value={filterState} onChange={e => setFilterState(e.target.value)}>
          <option value="">Tous</option>
          <option value="free">Libre</option>
          <option value="occupied">Occupée</option>
          <option value="cleaning">Nettoyage</option>
        </select>
        <label className="form-label mb-0 ms-3">Trier par état :</label>
        <select className="form-select form-select-sm w-auto" value={sortState} onChange={e => setSortState(e.target.value)}>
          <option value="">Aucun</option>
          <option value="asc">A → Z</option>
          <option value="desc">Z → A</option>
        </select>
        <label className="form-label mb-0 ms-3">Rechercher numéro :</label>
        <input type="text" className="form-control form-control-sm w-auto" placeholder="Ex: 101" value={searchNumber} onChange={e => setSearchNumber(e.target.value)} />
      </div>

      <form onSubmit={handleSubmit} className="mb-4">
        <div className="row g-2 align-items-end">
          <div className="col-12 col-md-8">
            <input
              value={form.number}
              onChange={(e) => setForm({ ...form, number: e.target.value })}
              placeholder="Numéro de chambre"
              className="form-control"
            />
          </div>

          <div className="col-12 col-md-4">
            <button type="submit" className="btn btn-primary w-100">
              {editingId ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </div>
        </div>
      </form>

      <div className="table-responsive">
        <table className="table table-bordered align-middle">
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRooms.map((room) => (
              <tr key={room._id}>
                <td>{room.number}</td>
                <td>
                  <span className={
                    room.state === 'occupied' ? 'badge bg-danger' :
                    room.state === 'free' ? 'badge bg-success' :
                    room.state === 'cleaning' ? 'badge bg-warning text-dark' :
                    'badge bg-secondary'
                  }>
                    {room.state === 'occupied' ? 'Occupée' :
                     room.state === 'free' ? 'Libre' :
                     room.state === 'cleaning' ? 'Nettoyage' :
                     'Inconnu'}
                  </span>
                </td>
                <td>
                  <div className="d-flex flex-wrap gap-2">
                    <button onClick={() => handleEdit(room)} className="btn btn-primary btn-sm">
                      Éditer
                    </button>
                    <button onClick={() => handleDelete(room._id)} className="btn btn-danger btn-sm">
                      Supprimer
                    </button>
                    <button onClick={() => { setShowHistory(true); setHistoryRoomId(room._id); }} className="btn btn-outline-secondary btn-sm">
                      Historique
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showHistory && historyRoomId && (
        <RoomHistoryModal roomId={historyRoomId} show={showHistory} onClose={() => setShowHistory(false)} />
      )}

      {/* Résumé graphique en bas */}
      <div className="mt-5 mb-4" style={{maxWidth: 320, marginLeft: 'auto', marginRight: 'auto'}}>
        <Pie data={pieData} options={{ plugins: { legend: { position: 'bottom' } } }} />
        <div className="text-center mt-2 small">
          <span className="badge bg-success me-1">Libre: {stateCounts['free'] || 0}</span>
          <span className="badge bg-danger me-1">Occupée: {stateCounts['occupied'] || 0}</span>
          <span className="badge bg-warning text-dark">Nettoyage: {stateCounts['cleaning'] || 0}</span>
        </div>
      </div>
    </div>
  );
};

export default RoomManagement;