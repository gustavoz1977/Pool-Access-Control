import { useState } from 'react';
import { authAPI } from '../services/api';
import '../styles/ChangePasswordModal.css';

export default function ChangePasswordModal({ onClose, onSuccess }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Todos los campos son requeridos');
      return;
    }

    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      setLoading(true);
      await authAPI.changePassword(currentPassword, newPassword, confirmPassword);
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="password-modal-overlay" onClick={onClose}>
      <div className="password-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="password-modal-header">
          <h2>🔐 Cambiar Contraseña</h2>
          <button onClick={onClose} className="close-button">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="password-form">
          <div className="form-group">
            <label>Contraseña Actual</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Tu contraseña actual"
              required
            />
          </div>

          <div className="form-group">
            <label>Nueva Contraseña</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
            />
          </div>

          <div className="form-group">
            <label>Confirmar Nueva Contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la nueva contraseña"
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="password-modal-footer">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-save">
              {loading ? 'Guardando...' : 'Cambiar Contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
