import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, adminAPI } from '../services/api';
import StatsCard from '../components/StatsCard';
import ActivityChart from '../components/ActivityChart';
import '../styles/Dashboard.css';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, logins: 0, accessAttempts: 0 });
  const [activityData, setActivityData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch user profile
        const profileResponse = await authAPI.getProfile();
        setUser(profileResponse.data.data);

        // Fetch all users
        const usersResponse = await adminAPI.listUsers();
        const users = usersResponse.data.data || [];

        // Fetch access logs
        const logsResponse = await adminAPI.getAccessLogs();
        const logs = logsResponse.data.data.logs || [];

        // Calculate stats
        const activeCount = users.filter(u => u.status === 'active').length;
        const loginCount = logs.filter(l => l.access_type === 'login').length;
        const accessCount = logs.filter(l => l.access_type === 'access').length;

        setStats({
          totalUsers: users.length,
          activeUsers: activeCount,
          logins: loginCount,
          accessAttempts: accessCount,
        });

        // Activity data for chart (últimos 7 días)
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dayStr = date.toLocaleDateString('es-ES', { weekday: 'short' });
          const dayLogins = logs.filter(l => {
            const logDate = new Date(l.timestamp);
            return logDate.toDateString() === date.toDateString() && l.access_type === 'login';
          }).length;
          last7Days.push({ day: dayStr, logins: dayLogins });
        }
        setActivityData(last7Days);

        // Recent activity
        const recent = logs
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, 5)
          .map(log => {
            const logUser = users.find(u => u.id === log.user_id);
            return {
              id: log.id,
              userName: logUser?.full_name || 'Usuario desconocido',
              type: log.access_type === 'login' ? '🔓 Login' : '📍 Acceso',
              time: new Date(log.timestamp).toLocaleTimeString(),
              timestamp: log.timestamp,
            };
          });
        setRecentActivity(recent);
      } catch (err) {
        console.error('Error fetching data:', err);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
          <h2>Bienvenido, {user?.full_name}! 👋</h2>
          <p>Sistema de gestión de acceso a alberca comunitaria</p>
        </div>

        {/* Estadísticas */}
        <div className="stats-grid">
          <StatsCard 
            icon="👥"
            label="Total de Usuarios"
            value={stats.totalUsers}
            color="#667eea"
          />
          <StatsCard 
            icon="🟢"
            label="Usuarios Activos"
            value={stats.activeUsers}
            color="#4caf50"
          />
          <StatsCard 
            icon="🔓"
            label="Logins"
            value={stats.logins}
            color="#2196f3"
          />
          <StatsCard 
            icon="📍"
            label="Accesos a Piscina"
            value={stats.accessAttempts}
            color="#ff9800"
          />
        </div>

        {/* Gráfico de Actividad */}
        {activityData.length > 0 && <ActivityChart data={activityData} />}

        {/* Actividad Reciente */}
        <div className="recent-activity">
          <h3>⏱️ Actividad Reciente</h3>
          {recentActivity.length > 0 ? (
            <ul className="activity-list">
              {recentActivity.map(item => (
                <li key={item.id} className="activity-item">
                  <div className="activity-icon">{item.type.split(' ')[0]}</div>
                  <div className="activity-details">
                    <p className="activity-name">{item.userName}</p>
                    <p className="activity-time">{item.time}</p>
                  </div>
                  <span className="activity-badge">{item.type}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ color: '#999' }}>No hay actividad reciente</p>
          )}
        </div>

        {/* Admin Tools */}
        {user?.role === 'admin' && (
          <div className="admin-section">
            <h2>🔧 Herramientas de Administrador</h2>
            <div className="admin-buttons">
              <button className="admin-button" onClick={() => navigate('/admin/users')}>
                👥 Gestionar Usuarios
              </button>
              <button className="admin-button" onClick={() => navigate('/admin/logs')}>
                📊 Ver Logs Detallados
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
