import React, { useState } from 'react';
import axios from 'axios';

export function ChangePasswordModal({ isOpen, onClose, onChanged }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validNew = (pwd) => {
    const min = typeof pwd === 'string' && pwd.length >= 8;
    const upper = /[A-Z]/.test(pwd);
    const special = /[^A-Za-z0-9]/.test(pwd);
    return min && upper && special;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!currentPassword || !newPassword) {
      setError('Debes completar todos los campos');
      return;
    }
    if (newPassword !== confirm) {
      setError('La confirmación no coincide');
      return;
    }
    if (!validNew(newPassword)) {
      setError('La contraseña debe tener al menos 8 caracteres, una mayúscula y un carácter especial');
      return;
    }
    setLoading(true);
    try {
      const rawToken = localStorage.getItem('token');
      const authHeader = rawToken
        ? (rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`)
        : null;
      const config = authHeader ? { headers: { Authorization: authHeader } } : undefined;
      await axios.put(`${process.env.REACT_APP_API_URL}/users/me/password`, {
        currentPassword,
        newPassword,
      }, config);
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
      onChanged && onChanged();
      onClose && onClose();
      alert('Contraseña actualizada correctamente');
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Error al actualizar contraseña';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal show d-block" tabIndex="-1" role="dialog" aria-modal="true" style={{ zIndex: 1055 }}>
        <div className="modal-dialog modal-dialog-centered change-pass-dialog" role="document">
          <div className="modal-content bg-dark text-white border-secondary">
            <div className="modal-header border-secondary">
              <h5 className="modal-title">Cambiar contraseña</h5>
              <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={submit}>
                <div className="mb-3">
                  <label className="form-label">Contraseña actual</label>
                  <div className="input-group">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      className="form-control bg-dark text-white border-secondary"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowCurrent(!showCurrent)}
                    >
                      <i className={`bi ${showCurrent ? 'bi-eye-fill' : 'bi-eye-slash-fill'}`}></i>
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Nueva contraseña</label>
                  <div className="input-group">
                    <input
                      type={showNew ? 'text' : 'password'}
                      className="form-control bg-dark text-white border-secondary"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowNew(!showNew)}
                    >
                      <i className={`bi ${showNew ? 'bi-eye-fill' : 'bi-eye-slash-fill'}`}></i>
                    </button>
                  </div>
                  <div className="form-text text-white-50">
                    Debe incluir al menos 8 caracteres, una mayúscula y un carácter especial.
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Confirmar nueva contraseña</label>
                  <div className="input-group">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      className="form-control bg-dark text-white border-secondary"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowConfirm(!showConfirm)}
                    >
                      <i className={`bi ${showConfirm ? 'bi-eye-fill' : 'bi-eye-slash-fill'}`}></i>
                    </button>
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 cp-actions flex-column flex-sm-row">
                  <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
                  <button type="submit" className="btn btn-success" disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show" style={{ zIndex: 1040, backgroundColor: 'rgba(0,0,0,0.6)' }}></div>
    </>
  );
}