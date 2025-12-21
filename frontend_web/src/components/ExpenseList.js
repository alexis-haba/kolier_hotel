import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const ExpenseList = ({ filters }) => {
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    includeInDailyTotal: true, // ✅ Incluse dans le total par défaut
  });
  const [editingExpense, setEditingExpense] = useState(null);
  const [editForm, setEditForm] = useState({ description: '', amount: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // === FETCH EXPENSES ===
  const fetchExpenses = useCallback(async () => {
    try {
      const res = await api.get('/expenses', { params: { date: filters.date } });
      setExpenses(res.data);
    } catch (err) {
      console.error(err);
      setMessage("❌ Erreur lors du chargement des dépenses");
    }
  }, [filters.date]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // === ADD EXPENSE ===
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!newExpense.description || !newExpense.amount) {
      setMessage("⚠️ Veuillez remplir tous les champs");
      return;
    }

    try {
      setLoading(true);
      await api.post('/expenses', {
        expenses: [
          {
            description: newExpense.description,
            amount: parseFloat(newExpense.amount),
            includeInDailyTotal: newExpense.includeInDailyTotal, // ✅ envoyé au backend
          },
        ],
      });
      setMessage("✅ Dépense ajoutée avec succès");
      setNewExpense({ description: '', amount: '', includeInDailyTotal: true });
      fetchExpenses();
    } catch (err) {
      console.error(err);
      setMessage("❌ Erreur lors de l’ajout de la dépense");
    } finally {
      setLoading(false);
    }
  };

  // === DELETE EXPENSE ===
  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette dépense ?")) return;

    try {
      await api.delete(`/expenses/${id}`);
      setMessage("✅ Dépense supprimée avec succès");
      fetchExpenses();
    } catch (err) {
      console.error(err);
      setMessage("❌ Erreur lors de la suppression");
    }
  };

  // === OPEN EDIT MODAL ===
  const openEditModal = (expense) => {
    setEditingExpense(expense);
    setEditForm({
      description: expense.description,
      amount: expense.amount,
    });
  };

  // === SAVE EDITED EXPENSE ===
  const handleEditSave = async () => {
    try {
      setLoading(true);
      await api.put(`/expenses/${editingExpense._id}`, {
        description: editForm.description,
        amount: parseFloat(editForm.amount),
      });
      setMessage("✅ Dépense mise à jour avec succès");
      setEditingExpense(null);
      fetchExpenses();
    } catch (err) {
      console.error(err);
      setMessage("❌ Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  // === CLOSE MODAL ===
  const closeModal = () => setEditingExpense(null);

  return (
    <div>
      <h2 className="h4 mb-3">Gestion des Dépenses</h2>

      {message && <div className="alert alert-info py-2">{message}</div>}

      {/* === FORMULAIRE AJOUT DÉPENSE === */}
      <form onSubmit={handleAddExpense} className="border rounded p-3 mb-4 bg-light">
        <h5 className="mb-3">Ajouter une nouvelle dépense</h5>
        <div className="row g-2 align-items-end">
          <div className="col-md-5">
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-control"
              value={newExpense.description}
              onChange={(e) =>
                setNewExpense({ ...newExpense, description: e.target.value })
              }
              placeholder="Ex: Achat de fournitures"
            />
          </div>

          <div className="col-md-3">
            <label className="form-label">Montant (FG)</label>
            <input
              type="number"
              className="form-control"
              value={newExpense.amount}
              onChange={(e) =>
                setNewExpense({ ...newExpense, amount: e.target.value })
              }
              placeholder="Ex: 50000"
            />
          </div>

          

          <div className="col-md-1">
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? "..." : "Ajouter"}
            </button>
          </div>
        </div>
      </form>

      {/* === TABLEAU DES DÉPENSES === */}
      {expenses.length === 0 ? (
        <p className="text-center text-muted">Aucune donnée pour cette période.</p>
      ) : (
        <table className="table table-bordered align-middle">
          <thead>
            <tr>
              <th>Description</th>
              <th>Montant</th>
              <th>Date</th>
              <th style={{ width: '150px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense._id}>
                <td>{expense.description}</td>
                <td>{expense.amount.toLocaleString('fr-FR')} FG</td>
                <td>{new Date(expense.date).toLocaleString()}</td>
                <td>
                  <button
                    className="btn btn-sm btn-warning me-2"
                    onClick={() => openEditModal(expense)}
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(expense._id)}
                  >
                    🗑️ Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* === MODAL ÉDITION === */}
      {editingExpense && (
        <div
          className="modal show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex="-1"
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Modifier une dépense</h5>
                <button type="button" className="btn-close" onClick={closeModal}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Montant</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editForm.amount}
                    onChange={(e) =>
                      setEditForm({ ...editForm, amount: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeModal}>
                  Annuler
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleEditSave}
                  disabled={loading}
                >
                  {loading ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpenseList;
