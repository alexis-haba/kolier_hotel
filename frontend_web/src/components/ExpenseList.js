import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

const ExpenseList = ({ filters }) => {
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    includeInDailyTotal: true, // Incluse dans le total par défaut
  });
  const [editingExpense, setEditingExpense] = useState(null);
  const [editForm, setEditForm] = useState({ description: '', amount: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const quickDescriptions = ['Fournitures', 'Maintenance', 'Transport', 'Nettoyage'];
  const amountInputRef = useRef(null);

  // === FETCH EXPENSES ===
  const fetchExpenses = useCallback(async () => {
    try {
      const res = await api.get('/expenses', { params: { date: filters.date } });
      setExpenses(res.data);
    } catch (err) {
      console.error(err);
      setMessage("Erreur lors du chargement des dépenses");
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
      const numericAmount = Number(String(newExpense.amount).replace(/\s/g, ''));
      await api.post('/expenses', {
        expenses: [
          {
            description: newExpense.description,
            amount: numericAmount,
            includeInDailyTotal: newExpense.includeInDailyTotal, // envoyé au backend
          },
        ],
      });
      setMessage(`Dépense ajoutée – ${numericAmount.toLocaleString('fr-FR')} FG`);
      setNewExpense({ description: '', amount: '', includeInDailyTotal: true });
      amountInputRef.current?.focus();
      fetchExpenses();
    } catch (err) {
      console.error(err);
      setMessage("Erreur lors de l’ajout de la dépense");
    } finally {
      setLoading(false);
    }
  };

  // === DELETE EXPENSE ===
  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer cette dépense ?")) return;

    try {
      await api.delete(`/expenses/${id}`);
      setMessage("Dépense supprimée avec succès");
      fetchExpenses();
    } catch (err) {
      console.error(err);
      setMessage("Erreur lors de la suppression");
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
      setMessage("Dépense mise à jour avec succès");
      setEditingExpense(null);
      fetchExpenses();
    } catch (err) {
      console.error(err);
      setMessage("Erreur lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  // === CLOSE MODAL ===
  const closeModal = () => setEditingExpense(null);

  const handleAmountChange = (value) => {
    const digitsOnly = value.replace(/\D/g, '');
    const formatted = digitsOnly ? Number(digitsOnly).toLocaleString('fr-FR') : '';
    setNewExpense({ ...newExpense, amount: formatted });
  };

  return (
    <div id="expense-form">
      <h2 className="h4 mb-3">Gestion des Dépenses</h2>

      {message && <div className="alert alert-info py-2">{message}</div>}

      {/* === FORMULAIRE AJOUT DÉPENSE === */}
      <form onSubmit={handleAddExpense} className="border rounded p-3 mb-4 bg-light">
        <h5 className="mb-3">Ajouter une nouvelle dépense</h5>
        <div className="row g-2 align-items-end">
          <div className="col-12 col-md-5">
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
            <div className="d-flex flex-wrap gap-2 mt-2">
              {quickDescriptions.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => {
                    setNewExpense({ ...newExpense, description: item });
                    amountInputRef.current?.focus();
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label">Montant (FG)</label>
            <input
              type="text"
              inputMode="numeric"
              className="form-control"
              ref={amountInputRef}
              value={newExpense.amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="Ex: 50 000"
            />
            <small className="text-muted">Format automatique en FG</small>
          </div>


                    <div className="col-12 col-md-3">
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
        <div className="alert alert-light border text-center">
          <p className="mb-2">Aucune donnée pour cette période.</p>
          <p className="small text-muted mb-0">Essayez Hier / Semaine passée ou ajoutez une dépense rapidement.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead>
              <tr>
                <th>Description</th>
                <th>Montant</th>
                <th>Date</th>
                <th style={{ width: '170px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense._id}>
                  <td>{expense.description}</td>
                  <td>{expense.amount.toLocaleString('fr-FR')} FG</td>
                  <td>{new Date(expense.date).toLocaleString()}</td>
                  <td>
                    <div className="d-flex flex-wrap gap-2">
                      <button
                        className="btn btn-sm btn-warning"
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
