import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, authAPI } from '../services/api';
import UserModal from '../components/UserModal';
import '../styles/AdminUsers.css';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.listUsers();
      setUsers(response.data.data);
      setError('');
    } catch (err) {
      setError('Error al cargar usuarios: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId, userName) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar a ${userName}?`)) {
      try {
        await adminAPI.deleteUser(userId);
        setUsers(users.filter(u => u.id !== userId));
        alert('Usuario eliminado');
      } catch (err) {
        alert('Error: ' + err.response?.data?.message || err.message);
      }
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await adminAPI.changeUserStatus(userId, newStatus);
      setUsers(users.map(u =>
        u.id === userId ? { ...u, status: newStatus } : u
      ));
    } catch (err) {
      alert('Error: ' + err.response?.data?.message || err.message);
    }
  };

  const handleViewLogs = (userId) => {
    navigate(`/admin/logs/${userId}`);
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="admin-container"><p>Cargando usuarios...</p></div>;

  return (
    <div className="admin-container">
      <header className="admin-header">
        <h1>👥 Gestionar Usuarios</h1>
        <button onClick={() => navigate('/dashboard')} className="back-button">
          ← Volver al Dashboard
        </button>
      </header>

      <main className="admin-main">
        {error && <div className="error-banner">{error}</div>}

        <div className="admin-toolbar">
          <input
            type="text"
            placeholder="Buscar por email o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button
            onClick={() => {
              setEditingUser(null);
              setShowModal(true);
            }}
            className="btn-primary"
          >
            ➕ Nuevo Usuario
          </button>
        </div>

        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td className="email">{user.email}</td>
                  <td>{user.full_name}</td>
                  <td>
                    <span className={`badge role-${user.role}`}>
                      {user.role === 'admin' ? '🔐 Admin' : '👤 User'}
                    </span>
                  </td>
                  <td>{user.phone || '-'}</td>
                  <td>
                    <select
                      value={user.status}
                      onChange={(e) => handleStatusChange(user.id, e.target.value)}
                      className={`status-select status-${user.status}`}
                    >
                      <option value="active">🟢 Activo</option>
                      <option value="suspended">🟡 Suspendido</option>
                      <option value="inactive">🔴 Inactivo</option>
                    </select>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="actions">
                    <button
                      onClick={() => handleViewLogs(user.id)}
                      className="btn-small btn-info"
                      title="Ver logs"
                    >
                      📊
                    </button>
                    <button
                      onClick={() => {
                        setEditingUser(user);
                        setShowModal(true);
                      }}
                      className="btn-small btn-edit"
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(user.id, user.full_name)}
                      className="btn-small btn-delete"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="users-summary">
          <p>Total: <strong>{filteredUsers.length}</strong> usuarios | 
          Admins: <strong>{filteredUsers.filter(u => u.role === 'admin').length}</strong> | 
          Activos: <strong>{filteredUsers.filter(u => u.status === 'active').length}</strong></p>
        </div>
      </main>

      {showModal && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowModal(false);
            setEditingUser(null);
          }}
          onSave={(newUser) => {
            if (editingUser) {
              setUsers(users.map(u => u.id === newUser.id ? newUser : u));
            } else {
              setUsers([...users, newUser]);
            }
            setShowModal(false);
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
}
