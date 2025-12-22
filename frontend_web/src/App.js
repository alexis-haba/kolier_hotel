import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import RoomManagement from './components/RoomManagement';
import UserManagement from './components/UserManagement';
import Settings from './components/Settings';
import AuditLog from './components/AuditLog';
import DayEntry from './components/DayEntry';
import NightEntry from './components/NightEntry';
import ResidencesList from './components/ResidencesList';
import api from './services/api';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          setIsAuthenticated(true);
          setUserRole(res.data.role);

          if (!allowedRoles.includes(res.data.role)) {
            navigate('/unauthorized');
          }
        })
        .catch((err) => {
          console.error('Erreur /auth/me:', err);

          const payload = JSON.parse(atob(token.split('.')[1]));
          if (payload && payload.role && allowedRoles.includes(payload.role)) {
            setIsAuthenticated(true);
            setUserRole(payload.role);
          } else {
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            navigate('/login');
          }
        });
    } else {
      setIsAuthenticated(false);
      navigate('/login');
    }
  }, [allowedRoles, navigate]);

  if (!isAuthenticated) return <div>Chargement...</div>;
  if (!allowedRoles.includes(userRole)) return <div>Accès non autorisé</div>;
  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentResidence');
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  return (
    <Router>
      {isAuthenticated && (
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
          <div className="container-fluid">
            <a className="navbar-brand" href="/">The Vibes Admin</a>
            <div className="collapse navbar-collapse">
              <ul className="navbar-nav me-auto">
                <li className="nav-item"><a className="nav-link" href="/">Dashboard</a></li>
                <li className="nav-item"><a className="nav-link" href="/rooms">Chambres</a></li>
                <li className="nav-item"><a className="nav-link" href="/users">Utilisateurs</a></li>
                <li className="nav-item"><a className="nav-link" href="/settings">Paramètres</a></li>
                <li className="nav-item"><a className="nav-link" href="/audit">Historique</a></li>
              </ul>
              <button onClick={handleLogout} className="btn btn-outline-danger">Déconnexion</button>
            </div>
          </div>
        </nav>
      )}

      <Routes>
        {/* LOGIN avec redirection automatique */}
        <Route
          path="/login"
          element={<Login setIsAuthenticated={setIsAuthenticated} />}
        />

        {/* Dashboard */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Résidences */}
        <Route
          path="/residences"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <ResidencesList />
            </ProtectedRoute>
          }
        />

        {/* Pages employé */}
        <Route
          path="/day-entry"
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <DayEntry />
            </ProtectedRoute>
          }
        />
        <Route
          path="/night-entry"
          element={
            <ProtectedRoute allowedRoles={['employee']}>
              <NightEntry />
            </ProtectedRoute>
          }
        />

        {/* Pages admin */}
        <Route
          path="/rooms"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <RoomManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AuditLog />
            </ProtectedRoute>
          }
        />

        <Route path="/unauthorized" element={<div className="p-4">Accès non autorisé</div>} />
      </Routes>
    </Router>
  );
}

export default App;
