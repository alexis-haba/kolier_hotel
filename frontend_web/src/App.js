import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import RoomManagement from './components/RoomManagement';
import UserManagement from './components/UserManagement';
import Settings from './components/Settings';
import AuditLog from './components/AuditLog';
import DayEntry from './components/DayEntry';
import NightEntry from './components/NightEntry';
import ResidencesList from './components/ResidencesList';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  // Utilisation de <Navigate /> pour une redirection fiable
  const { Navigate } = require('react-router-dom');

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Chargement...</span>
      </div>
    </div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

const Navbar = ({ isMenuOpen, setIsMenuOpen, user, logout }) => {
  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light px-2 px-md-3">
      <div className="container-fluid">
        <a className="navbar-brand d-flex align-items-center gap-2" href="/">
          <img src="/logo.png" alt="Logo The Vibes" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <span>The Vibes Admin</span>
        </a>
        <button
          className="navbar-toggler"
          type="button"
          aria-label="Basculer le menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`navbar-collapse ${isMenuOpen ? 'show' : 'collapse'}`}>
          <ul className="navbar-nav me-auto">
            {user?.role === 'admin' && (
              <>
                <li className="nav-item"><a className="nav-link" href="/" onClick={() => setIsMenuOpen(false)}>Dashboard</a></li>
                <li className="nav-item"><a className="nav-link" href="/rooms" onClick={() => setIsMenuOpen(false)}>Chambres</a></li>
                <li className="nav-item"><a className="nav-link" href="/users" onClick={() => setIsMenuOpen(false)}>Utilisateurs</a></li>
                <li className="nav-item"><a className="nav-link" href="/settings" onClick={() => setIsMenuOpen(false)}>Paramètres</a></li>
                <li className="nav-item"><a className="nav-link" href="/audit" onClick={() => setIsMenuOpen(false)}>Historique</a></li>
              </>
            )}
            {user?.role === 'employee' && (
              <>
                <li className="nav-item"><a className="nav-link" href="/day-entry" onClick={() => setIsMenuOpen(false)}>Entrée Jour</a></li>
                <li className="nav-item"><a className="nav-link" href="/night-entry" onClick={() => setIsMenuOpen(false)}>Entrée Nuit</a></li>
              </>
            )}
          </ul>
          <button onClick={handleLogout} className="btn btn-outline-danger mt-2 mt-lg-0">Déconnexion</button>
        </div>
      </div>
    </nav>
  );
};

function AppContent() {
  const { isAuthenticated, user, loading, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {isAuthenticated && user && (
        <Navbar isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} user={user} logout={logout} />
      )}

      <Routes>
        {/* LOGIN */}
        <Route path="/login" element={<Login />} />

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
        <Route path="*" element={<Login />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );}

export default App;