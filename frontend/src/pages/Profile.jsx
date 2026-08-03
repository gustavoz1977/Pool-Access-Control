import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, adminAPI } from '../services/api';
import ChangePasswordModal from '../components/ChangePasswordModal';
import '../styles/Profile.css';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', phone: '' });
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [logs, setLogs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await authAPI.getProfile();
      setUser(response.data.data);
      setFormData({
        full_name: response.data.data.full_name,
        phone: response.data.data.phone || '',
      });

      // Fetch user's access logs
      const logsResponse = await adminAPI.getUserAccessLogs(response.data.data.id);
      setLogs(logsResponse.data.data);
    } catch (err) {
      console.error('Error:', err);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleEditToggle = () => {
    setEditing(!editing);
    setMessage('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setSaveLoading(true);
      const response = await adminAPI.updateUser(user.id, {
        full_name: formData.full_name,
        phone: formData.phone,
      });
      setUser(response.data.data);
      setEditing(false);
      setMessage('✅ Perfil actualizado correctamente');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('❌ Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return <div className="profile-container"><p>Cargando...</p></div>;
  }

  return (
    <div className="profile-container">
      <header className="profile-header">
        <h1>👤 Mi Perfil</h1>
        <button onClick={() => navigate('/dashboard')} className="back-button">
          ← Volver al Dashboard
        </button>
      </header>

      <main className="profile-main">
        <div className="profile-grid">
          {/* Tarjeta de Información Personal */}
          <div className="profile-card">
            <div className="card-header">
              <h2>Información Personal</h2>
              {!editing && (
                <button onClick={handleEditToggle} className="btn-edit-small">
                  ✏️ Editar
                </button>
              )}
            </div>

            {message && <div className="message">{message}</div>}

            <div className="profile-info">
              <div className="info-group">
                <label>Email</label>
                <p className="info-value">{user?.email}</p>
              </div>

              <div className="info-group">
                <label>Nombre Completo</label>
                {editing ? (
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    className="edit-input"
                  />
                ) : (
                  <p className="info-value">{user?.full_name}</p>
                )}
              </div>

              <div className="info-group">
                <label>Teléfono</label>
                {editing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Tu teléfono"
                    className="edit-input"
                  />
                ) : (
                  <p className="info-value">{user?.phone || 'No registrado'}</p>
                )}
              </div>

              <div className="info-group">
                <label>Rol</label>
                <p className="info-value">
                  <span className={`badge role-${user?.role}`}>
                    {user?.role === 'admin' ? '🔐 Administrador' : '👤 Usuario'}
                  </span>
                </p>
              </div>

              <div className="info-group">
                <label>Estado</label>
                <p className="info-value">
                  <span className={`badge status-${user?.status}`}>
                    {user?.status === 'active' ? '🟢 Activo' : '🔴 Inactivo'}
                  </span>
                </p>
              </div>

              {editing && (
                <div className="edit-actions">
                  <button onClick={handleEditToggle} className="btn-cancel">
                    Cancelar
                  </button>
                  <button onClick={handleSave} disabled={saveLoading} className="btn-save">
                    {saveLoading ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tarjeta de Seguridad */}
          <div className="profile-card">
            <div className="card-header">
              <h2>🔐 Seguridad</h2>
            </div>

            <div className="security-info">
              <div className="security-item">
                <h3>Contraseña</h3>
                <p>Cambia tu contraseña regularmente para mantener tu cuenta segura</p>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="btn-security"
                >
                  Cambiar Contraseña
                </button>
              </div>

              <div className="security-item">
                <h3>Sesiones Activas</h3>
                <p>Actualmente tienes 1 sesión activa</p>
              </div>

              <div className="security-item">
                <h3>Datos de Cuenta</h3>
                <p>Cuenta creada: {new Date(user?.created_at).toLocaleDateString()}</p>
                <p>Último acceso: {new Date(user?.last_login_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Historial de Acceso */}
        <div className="access-history-card">
          <h2>📊 Historial de Acceso</h2>

          <div className="logs-table-container">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Tipo de Acceso</th>
                  <th>Fecha y Hora</th>
                  <th>Notas</th>
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id}>
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
                    <td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>
                      No hay registros de acceso
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
          onSuccess={() => {
            setShowPasswordModal(false);
            setMessage('✅ Contraseña actualizada correctamente');
            setTimeout(() => setMessage(''), 3000);
          }}
        />
      )}
    </div>
  );
}
