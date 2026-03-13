import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Filters = ({ filters, setFilters }) => {
  const [rooms, setRooms] = useState([]);

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

  // Date par défaut = aujourd'hui (format YYYY-MM-DD)
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="mb-3 w-100 p-2 rounded" style={{ backgroundColor: '#ffffff' }}>
      <div className="row g-2">
        <div className="col-12 col-md-4">
          <label className="form-label mb-1 fw-semibold filter-label">Date:</label>
          <input
            type="date"
            value={filters.date || today}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            className="form-control"
            style={{ minHeight: 44 }}
          />
        </div>

        <div className="col-12 col-md-8">
          <label className="form-label mb-1 fw-semibold filter-label">Chambre:</label>
          <input
            value={filters.roomId}
            onChange={(e) => setFilters({ ...filters, roomId: e.target.value })}
            placeholder="Rechercher une chambre..."
            className="form-control"
            list="roomList"
            style={{ minHeight: 44 }}
          />
        </div>
      </div>

      <datalist id="roomList">
        {rooms.map((room) => (
          <option key={room._id} value={room._id}>
            Chambre {room.number}
          </option>
        ))}
      </datalist>
    </div>
  );
};

export default Filters;
