import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaCheckCircle, FaTimesCircle, FaEye, FaEyeSlash } from 'react-icons/fa';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', role: 'employee' });
  const [editingId, setEditingId] = useState(null);
  const [passwordValid, setPasswordValid] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || 'Erreur récupération utilisateurs');
    }
  };

  const validatePassword = (password) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    return regex.test(password);
  };

  const handlePasswordChange = (value) => {
    setForm({ ...form, password: value });
    if (value === '') setPasswordValid(null);
    else setPasswordValid(validatePassword(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password && !validatePassword(form.password)) {
      alert(
        'Mot de passe invalide : au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.'
      );
      return;
    }

    try {
      if (editingId) {
        const updates = { ...form };
        if (!updates.password) delete updates.password;

        await api.put(`/users/${editingId}`, updates, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Utilisateur modifié avec succès !');
      } else {
        await api.post('/users', form, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Utilisateur ajouté avec succès !');
      }

      fetchUsers();
      setForm({ username: '', password: '', role: 'employee' });
      setEditingId(null);
      setPasswordValid(null);
      setShowPassword(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || 'Erreur lors de l’opération');
    }
  };

  const handleEdit = (user) => {
    setForm({ username: user.username, password: '', role: user.role });
    setEditingId(user._id);
    setPasswordValid(null);
    setShowPassword(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) return;

    try {
      await api.delete(`/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
      alert('Utilisateur supprimé avec succès !');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || 'Erreur suppression utilisateur');
    }
  };

  const handleResetPassword = async (id) => {
    const newPassword = prompt('Nouveau mot de passe:');
    if (!newPassword) return;

    if (!validatePassword(newPassword)) {
      alert('Mot de passe invalide : au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.');
      return;
    }

    try {
      await api.put(`/users/${id}`, { password: newPassword }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Mot de passe réinitialisé avec succès !');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.msg || 'Erreur réinitialisation mot de passe');
    }
  };

  return (
    <div className="p-4">
      <h2 className="h4 mb-4">Gestion des Utilisateurs</h2>

      <form onSubmit={handleSubmit} className="mb-4 d-flex flex-wrap align-items-center gap-2">
        <input
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          placeholder="Nom d'utilisateur"
          className="form-control d-inline-block w-auto"
          required
        />

        <div style={{ position: 'relative', display: 'inline-block' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            value={form.password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            placeholder="Mot de passe"
            className="form-control d-inline-block w-auto"
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            style={{ position: 'absolute', right: 28, top: 8, cursor: 'pointer', color: '#555' }}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
          {passwordValid !== null && (
            <span style={{ position: 'absolute', right: 4, top: 8 }}>
              {passwordValid ? <FaCheckCircle color="green" /> : <FaTimesCircle color="red" />}
            </span>
          )}
        </div>

        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="form-select d-inline-block w-auto"
        >
          <option value="employee">Employé</option>
          <option value="admin">Admin</option>
        </select>

        <button type="submit" className="btn btn-primary">
          {editingId ? 'Mettre à jour' : 'Ajouter'}
        </button>
      </form>

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Nom d'utilisateur</th>
            <th>Rôle</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length > 0 ? users.map((user) => (
            <tr key={user._id}>
              <td>{user.username}</td>
              <td>{user.role}</td>
              <td>
                <button onClick={() => handleEdit(user)} className="btn btn-primary me-2">Éditer</button>
                <button onClick={() => handleDelete(user._id)} className="btn btn-danger me-2">Supprimer</button>
                <button onClick={() => handleResetPassword(user._id)} className="btn btn-warning">Réinitialiser MDP</button>
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="3" style={{ textAlign: 'center' }}>Aucun utilisateur disponible.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagement;
