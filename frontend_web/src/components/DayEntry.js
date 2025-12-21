import React, { useState } from 'react';
import api from '../services/api';

const DayEntry = ({ onSaved }) => {
  const [amount, setAmount] = useState('');
  const [expenses, setExpenses] = useState([{ description: '', amount: '', includeInDailyTotal: true }]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount) return setMessage("⚠️ Entrez le montant total");

    try {
      setLoading(true);
      const payload = {
        phase: 'day',
        totalIncome: Number(amount),
        expenses: expenses
          .filter(e => e.description.trim() && e.amount)
          .map(e => ({
            description: e.description.trim(),
            amount: Number(e.amount),
            includeInDailyTotal: e.includeInDailyTotal
          })),
      };

      await api.post('/entries', payload);
      setMessage("✅ Saisie jour enregistrée");
      setAmount('');
      setExpenses([{ description: '', amount: '', includeInDailyTotal: true }]);
      if (onSaved) onSaved();
    } catch (err) {
      console.error(err.response?.data || err.message);
      setMessage("❌ Erreur lors de l'enregistrement");
    } finally {
      setLoading(false);
    }
  };

  const addExpense = () => setExpenses([...expenses, { description: '', amount: '', includeInDailyTotal: true }]);

  const updateExpense = (index, field, value) => {
    const newExpenses = [...expenses];
    newExpenses[index][field] = value;
    setExpenses(newExpenses);
  };

  return (
    <div className="p-4 border rounded bg-light">
      <h2 className="h4 mb-4">Saisie Jour (08h-18h)</h2>
      {message && <div className="alert alert-info py-2">{message}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Montant total encaissé"
          className="form-control mb-3"
          required
        />

        <h3>Dépenses</h3>
        {expenses.map((exp, index) => (
          <div key={index} className="row mb-2 align-items-center">
            <input
              type="text"
              value={exp.description}
              onChange={(e) => updateExpense(index, 'description', e.target.value)}
              placeholder="Motif"
              className="form-control col-md-5 me-2"
              required
            />
            <input
              type="number"
              value={exp.amount}
              onChange={(e) => updateExpense(index, 'amount', e.target.value)}
              placeholder="Montant"
              className="form-control col-md-3 me-2"
              required
              step="0.01"
            />
            <div className="form-check col-md-3">
              <input
                type="checkbox"
                checked={exp.includeInDailyTotal}
                onChange={(e) => updateExpense(index, 'includeInDailyTotal', e.target.checked)}
                className="form-check-input"
                id={`daily-${index}`}
              />
              <label className="form-check-label" htmlFor={`daily-${index}`}>Incluse dans total</label>
            </div>
          </div>
        ))}
        <button type="button" onClick={addExpense} className="btn btn-secondary mb-3">Ajouter une dépense</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>
    </div>
  );
};

export default DayEntry;
