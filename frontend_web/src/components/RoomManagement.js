// frontend_web/src/components/RoomManagement.js (adapte classes à Bootstrap)
import React, { useState, useEffect } from 'react';
import api from '../services/api';

const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({ number: '', type: 'standard' });
  const [editingId, setEditingId] = useState(null);

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

  return (
    <div className="p-4">
      <h2 className="h4 mb-4">Gestion des Chambres</h2>
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr key={room._id}>
                <td>{room.number}</td>
                <td>
                  <div className="d-flex flex-wrap gap-2">
                    <button onClick={() => handleEdit(room)} className="btn btn-primary btn-sm">
                      Éditer
                    </button>
                    <button onClick={() => handleDelete(room._id)} className="btn btn-danger btn-sm">
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RoomManagement;