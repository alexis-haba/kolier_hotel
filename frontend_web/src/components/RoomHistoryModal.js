import React, { useState } from 'react';
import api from '../services/api';

const RoomHistoryModal = ({ roomId, show, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (show && roomId) {
      setLoading(true);
      setError('');
      api.get(`/room-history/${roomId}`)
        .then(res => setHistory(res.data))
        .catch((err) => {
          if (err.response && err.response.status === 200 && Array.isArray(err.response.data) && err.response.data.length === 0) {
            setHistory([]);
            setError('');
          } else {
            setError('Erreur lors du chargement de l\'historique');
          }
        })
        .finally(() => setLoading(false));
    }
  }, [show, roomId]);

  if (!show) return null;

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,0.3)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Historique des changements d'état</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {loading && <div>Chargement...</div>}
            {error && <div className="alert alert-danger">{error}</div>}
            {!loading && !error && history.length === 0 && (
              <div className="alert alert-info">Aucun changement d'état trouvé.</div>
            )}
            {!loading && !error && history.length > 0 && (
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Ancien état</th>
                    <th>Nouveau état</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h._id}>
                      <td>{new Date(h.changedAt).toLocaleString()}</td>
                      <td>{h.oldState === 'occupied' ? 'Occupée' : h.oldState === 'free' ? 'Libre' : h.oldState === 'cleaning' ? 'Nettoyage' : h.oldState}</td>
                      <td>{h.newState === 'occupied' ? 'Occupée' : h.newState === 'free' ? 'Libre' : h.newState === 'cleaning' ? 'Nettoyage' : h.newState}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomHistoryModal;
