import React from 'react';

export default function ViewUserModal({ isOpen, user, onClose }) {
  if (!isOpen || !user) return null;
  return (
    <>
      <div className="modal show d-block gu-modal" tabIndex="-1" role="dialog" aria-modal="true" style={{ zIndex: 1055 }}>
        <div className="modal-dialog modal-md modal-dialog-centered" role="document">
          <div className="modal-content bg-dark text-white border-secondary">
            <div className="modal-header border-secondary">
              <h5 className="modal-title">Usuario</h5>
              <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <div className="mb-2"><strong>Nombre:</strong> {user.firstName}</div>
              <div className="mb-2"><strong>Apellido:</strong> {user.lastName}</div>
              <div className="mb-2"><strong>Rol:</strong> {user.roleName ?? '—'}</div>
              <div className="mb-2"><strong>Teléfono:</strong> {user.phone ?? '—'}</div>
              <div className="mb-2"><strong>Correo:</strong> {user.email ?? '—'}</div>
            </div>
            <div className="modal-footer border-secondary">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cerrar</button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show gu-modal-backdrop" style={{ zIndex: 1040, backgroundColor: 'rgba(0,0,0,0.6)' }}></div>
    </>
  );
}