import React, { Fragment, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import ReactPaginate from 'react-paginate';
import { Link } from 'react-router-dom';
import { searchService } from '../services/search.service';
import CreateUpdateUserModal from '../components/CreateUpdateUserModal.component';
import ViewUserModal from '../components/ViewUserModal.component';
import '../styles/GestorUsuarios.css';

const ROLE_MAP = { 1: 'Administrador', 2: 'Soporte', 3: 'Cliente' };
const ROLE_FILTERS = [
  { id: 1, label: 'Administradores' },
  { id: 2, label: 'Soporte' },
  { id: 3, label: 'Clientes' },
];
const PAGE_SIZE = 10;

export function GestorUsuarios() {
  const [roleFilter, setRoleFilter] = useState(1);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [openTipo, setOpenTipo] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewUser, setViewUser] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / PAGE_SIZE)), [total]);

  useEffect(() => {
    const unsub = searchService.subscribe((newQ) => { setQ(newQ); setPage(1); });
    return unsub;
  }, []);

  const fetchUsers = async () => {
    setLoading(true); setError('');
    try {
      const offset = (page - 1) * PAGE_SIZE;
      const params = new URLSearchParams();
      params.append('role', String(roleFilter));
      if (q && q.trim()) params.append('search', q.trim());
      params.append('limit', String(PAGE_SIZE));
      params.append('offset', String(offset));
      const url = `${process.env.REACT_APP_API_URL}/users?${params.toString()}`;
      const res = await axios.get(url);
      const list = res.data?.data || [];
      setRows(list.map(u => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email || '',
        phone: u.phone || '',
        roleId: u.roleId,
        roleName: u.roleName || ROLE_MAP[u.roleId],
      })));
      setTotal(offset + list.length);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Error al listar usuarios';
      setError(msg); setRows([]); setTotal(0);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page, roleFilter, q]);
  const handlePageClick = (data) => setPage((data?.selected ?? 0) + 1);

  return (
    <Fragment>
      <div className="container mt-2 mb-3 breadcrumb-container">
        <nav aria-label="breadcrumb">
          <ol
            className="breadcrumb mb-0 text-white"
            style={{
              '--bs-breadcrumb-divider': "'>'",
              '--bs-breadcrumb-divider-color': '#ffffff',
            }}
          >
            <li className="breadcrumb-item">
              <Link to="/dashboard" className="link-light text-decoration-none">Dashboard</Link>
            </li>
            <li className="breadcrumb-item active text-white" aria-current="page">Gestor de Usuarios</li>
          </ol>
        </nav>
      </div>

      <header className="gu-header"><h1 className="gu-title">Gestor de Usuarios</h1></header>

      <div className="gu-toolbar d-flex align-items-center gap-2">
        <div className="input-group" style={{ maxWidth: '340px' }}>
          <span className="input-group-text bg-dark text-white border-secondary"><i className="bi bi-search"></i></span>
          <input type="text" className="form-control bg-dark text-white border-secondary" placeholder="Buscar por nombre/apellido..." value={q} onChange={(e)=>searchService.setQuery(e.target.value)} />
        </div>
        <div className="position-relative d-inline-block">
          <button className="btn btn-secondary" type="button" onClick={() => setOpenTipo(v=>!v)}>Tipo de Usuario</button>
          {openTipo && (
            <ul className="bg-dark text-white list-unstyled position-absolute mt-1 p-1 border border-secondary" style={{ maxHeight: '220px', overflowY: 'auto', minWidth: '220px', zIndex: 1040 }}>
              {ROLE_FILTERS.map(r => (
                <li key={r.id}><button className="dropdown-item text-white" onClick={() => { setRoleFilter(r.id); setPage(1); setOpenTipo(false); }}>{r.label}</button></li>
              ))}
            </ul>
          )}
        </div>
        <button type="button" className="btn btn-success ms-auto btn-crear-usuario" onClick={() => setCreateOpen(true)}>Crear Usuario</button>
      </div>

      <div className="gu-table-wrap">
        {error && <div className="alert alert-danger">{error}</div>}
        {loading ? <div className="text-white">Cargando...</div> : (
          <Fragment>
            <table className="table table-dark table-hover">
              <thead><tr><th>Nombre</th><th>Apellido</th><th>Rol</th><th>Teléfono</th><th>Correo</th><th>Opciones</th></tr></thead>
              <tbody>
                {rows.map(u => (
                  <tr key={u.id}>
                    <td>{u.firstName}</td><td>{u.lastName}</td><td>{u.roleName || '-'}</td><td>{u.phone || '-'}</td><td>{u.email || '-'}</td>
                    <td>
                      <div className="btn-group btn-group-sm" role="group">
                        <button className="btn btn-outline-info" onClick={()=>{ setViewUser(u); setViewOpen(true); }} title="Ver"><i className="bi bi-eye"></i></button>
                        <button className="btn btn-outline-primary" onClick={()=>{ setEditUser(u); setEditOpen(true); }} title="Editar"><i className="bi bi-pencil"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length===0 && (<tr><td colSpan="6" className="text-center">Sin usuarios</td></tr>)}
              </tbody>
            </table>
            <div className="d-flex align-items-center mt-3">
              <div className="me-2 text-white">Páginas ({totalPages}):</div>
              <ReactPaginate previousLabel="« Anterior" nextLabel="Siguiente »" breakLabel="..." pageCount={totalPages} forcePage={Math.min(Math.max(page-1,0), totalPages-1)} marginPagesDisplayed={1} pageRangeDisplayed={5} onPageChange={handlePageClick} containerClassName="pagination mb-0 gu-paginate" pageClassName="page-item" pageLinkClassName="page-link" previousClassName="page-item" previousLinkClassName="page-link" nextClassName="page-item" nextLinkClassName="page-link" breakClassName="page-item" breakLinkClassName="page-link" activeClassName="active" disabledClassName="disabled" />
            </div>
          </Fragment>
        )}
      </div>

      {createOpen && (
        <CreateUpdateUserModal isOpen={createOpen} mode="create" onClose={()=>setCreateOpen(false)} onSaved={async()=>{ setCreateOpen(false); await fetchUsers(); }} />
      )}
      {editOpen && (
        <CreateUpdateUserModal isOpen={editOpen} mode="edit" user={editUser} onClose={()=>{ setEditOpen(false); setEditUser(null); }} onSaved={async()=>{ setEditOpen(false); setEditUser(null); await fetchUsers(); }} />
      )}
      {viewOpen && (
        <ViewUserModal isOpen={viewOpen} user={viewUser} onClose={()=>{ setViewOpen(false); setViewUser(null); }} />
      )}
    </Fragment>
  );
}