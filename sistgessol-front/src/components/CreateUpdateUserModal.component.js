import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function CreateUpdateUserModal({ isOpen, mode = 'create', user, onClose, onSaved }) {
  const isCreate = mode === 'create';
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [roleId, setRoleId] = useState(3);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setFirstName(user?.firstName || '');
    setLastName(user?.lastName || '');
    setEmail(user?.email || '');
    setPhone(user?.phone || '');
    setPassword('');
    setRoleId(user?.roleId || 3);
    setError('');
  }, [isOpen, user, isCreate]);

  const submit = async () => {
    setSaving(true); setError('');
    try {
      if (isCreate) {
        const body = { firstName, lastName, email, phone, password, roleId };
        await axios.post(`${process.env.REACT_APP_API_URL}/users`, body);
      } else {
        const body = { firstName, lastName, phone, roleId };
        await axios.put(`${process.env.REACT_APP_API_URL}/users/${user.id}`, body);
      }
      onSaved?.();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Error al guardar usuario';
      setError(msg);
    } finally { setSaving(false); }
  };

  if (!isOpen) return null;
  return (
    <>
      <div className="modal show d-block gu-modal" tabIndex="-1" role="dialog" aria-modal="true" style={{ zIndex: 1055 }}>
        <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
          <div className="modal-content bg-dark text-white border-secondary">
            <div className="modal-header border-secondary">
              <h5 className="modal-title">{isCreate ? 'Crear usuario' : 'Actualizar usuario'}</h5>
              <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              {error && <div className="alert alert-danger">{error}</div>}
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Nombre</label>
                  <input className="form-control bg-dark text-white border-secondary" value={firstName} onChange={e=>setFirstName(e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Apellido</label>
                  <input className="form-control bg-dark text-white border-secondary" value={lastName} onChange={e=>setLastName(e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Correo</label>
                  <input className="form-control bg-dark text-white border-secondary" value={email} onChange={e=>setEmail(e.target.value)} disabled={!isCreate} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Teléfono</label>
                  <input className="form-control bg-dark text-white border-secondary" value={phone} onChange={e=>setPhone(e.target.value)} />
                </div>
                {isCreate && (
                  <>
                    <div className="col-md-6">
                      <label className="form-label">Contraseña</label>
                      <input type="password" className="form-control bg-dark text-white border-secondary" value={password} onChange={e=>setPassword(e.target.value)} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Tipo de usuario</label>
                      <select className="form-select bg-dark text-white border-secondary" value={roleId} onChange={e=>setRoleId(Number(e.target.value))}>
                        <option value={1}>Administrador</option>
                        <option value={2}>Soporte</option>
                        <option value={3}>Cliente</option>
                      </select>
                    </div>
                  </>
                )}
                {!isCreate && (
                  <div className="col-md-6">
                    <label className="form-label">Tipo de usuario</label>
                    <select className="form-select bg-dark text-white border-secondary" value={roleId} onChange={e=>setRoleId(Number(e.target.value))}>
                      <option value={1}>Administrador</option>
                      <option value={2}>Soporte</option>
                      <option value={3}>Cliente</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer border-secondary d-flex gap-2">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
              <button type="button" className="btn btn-success" onClick={submit} disabled={saving}>{saving ? 'Guardando...' : (isCreate ? 'Crear' : 'Guardar cambios')}</button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show gu-modal-backdrop" style={{ zIndex: 1040, backgroundColor: 'rgba(0,0,0,0.6)' }}></div>
    </>
  );
}