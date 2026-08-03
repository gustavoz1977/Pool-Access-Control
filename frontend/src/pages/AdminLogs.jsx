import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import '../styles/AdminLogs.css';

export default function AdminLogs() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [userId]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      if (userId) {
        // Logs de un usuario específico
        const response = await adminAPI.getUserAccessLogs(parseInt(userId));
        setLogs(response.data.data);
        setUserName(`Usuario ${userId}`);
      } else {
        // Todos los logs
        const response = await adminAPI.getAccessLogs();
        setLogs(response.data.data.logs);
        setUserName('Sistema');
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="logs-container"><p>Cargando...</p></div>;

  return (
    <div className="logs-container">
      <header className="logs-header">
        <h1>📊 Logs de Acceso {userId ? `- ${userName}` : ''}</h1>
        <button onClick={() => navigate(userId ? '/admin/users' : '/dashboard')} className="back-button">
          ← Volver
        </button>
      </header>

      <main className="logs-main">
        <div className="logs-summary">
          <p>Total de registros: <strong>{logs.length}</strong></p>
        </div>

        <div className="logs-table-container">
          <table className="logs-table">
            <thead>
              <tr>
                <th>Usuario ID</th>
                <th>Tipo de Acceso</th>
                <th>Fecha y Hora</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td>#{log.user_id}</td>
                    <td>
                      <span className="access-type">
                        {log.access_type === 'login' && '🔓 Login'}
                        {log.access_type === 'registration' && '✍️ Registro'}
                        {log.access_type === 'logout' && '🔒 Logout'}
                        {log.access_type === 'access' && '📍 Acceso'}
                      </span>
                    </td>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>{log.notes || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                    No hay registros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
