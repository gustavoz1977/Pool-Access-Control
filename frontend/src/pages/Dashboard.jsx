import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await authAPI.getProfile();
        setUser(response.data.data);
      } catch (err) {
        console.error('Error fetching profile:', err);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    authAPI.logout();
    navigate('/login');
  };

  if (loading) {
    return <div className="dashboard-container"><p>Cargando...</p></div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🏊 Pool Access Control</h1>
          <div className="header-buttons">
            <button onClick={() => navigate('/profile')} className="profile-button">
              👤 Mi Perfil
            </button>
            <button onClick={handleLogout} className="logout-button">
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="welcome-card">
          <h2>Bienvenido, {user?.full_name}!</h2>
          <p>Sistema de gestión de acceso a alberca comunitaria</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>📧 Email</h3>
            <p>{user?.email}</p>
          </div>

          <div className="dashboard-card">
            <h3>👤 Rol</h3>
            <p>
              {user?.role === 'admin' ? '🔐 Administrador' : '👥 Usuario'}
            </p>
          </div>

          <div className="dashboard-card">
            <h3>📱 Teléfono</h3>
            <p>{user?.phone || 'No registrado'}</p>
          </div>

          <div className="dashboard-card">
            <h3>✅ Estado</h3>
            <p className={`status ${user?.status}`}>
              {user?.status === 'active' ? '🟢 Activo' : '🔴 Inactivo'}
            </p>
          </div>
        </div>

        {user?.role === 'admin' && (
          <div className="admin-section">
            <h2>Herramientas de Administrador</h2>
            <div className="admin-buttons">
              <button className="admin-button" onClick={() => navigate('/admin/users')}>
                👥 Gestionar Usuarios
              </button>
              <button className="admin-button" onClick={() => navigate('/admin/logs')}>
                📊 Ver Logs de Acceso
              </button>
            </div>
          </div>
        )}

        <div className="user-info">
          <h3>Información de tu cuenta</h3>
          <p>
            <strong>Creada:</strong> {new Date(user?.created_at).toLocaleDateString()}
          </p>
          <p>
            <strong>Último acceso:</strong>{' '}
            {new Date(user?.last_login_at).toLocaleString()}
          </p>
        </div>
      </main>
    </div>
  );
}
