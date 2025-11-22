import { Fragment, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Solicitudes.css';
import { CrearSolicitud } from '../components/CrearSolicitud.component';
import axios from 'axios';
import * as ReactPaginateModule from 'react-paginate';
import { searchService } from '../services/search.service';

export function Solicitudes() {
    const [isCrearOpen, setIsCrearOpen] = useState(false);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [soporteMap, setSoporteMap] = useState({});
    const [isDetalleOpen, setIsDetalleOpen] = useState(false);
    const [detalleItem, setDetalleItem] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [q, setQ] = useState('');

    const handleOpenCrear = () => setIsCrearOpen(true);
    const handleCloseCrear = () => setIsCrearOpen(false);

    const fetchSolicitudes = async () => {
        setLoading(true);
        setError('');
        try {
            const rawToken = localStorage.getItem('token');
            const authHeader = rawToken
                ? (rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`)
                : null;

            const config = authHeader ? { headers: { Authorization: authHeader } } : undefined;
            const queryString = q ? `&q=${encodeURIComponent(q)}` : '';

            const res = await axios.get(
                `${process.env.REACT_APP_API_URL}/solicitudes/mis?page=${page}&pageSize=${pageSize}${queryString}`,
                config
            );

            const data = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
            const totalCount = res.data?.pagination?.total ?? 0;

            setRows(data);
            setTotal(Number(totalCount) || 0);

            const map = await fetchSupportNames(data);
            setSoporteMap(map);
        } catch (e) {
            const msg =
                e?.response?.data?.message ||
                e?.response?.data?.error ||
                e?.message ||
                'Error al cargar solicitudes';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSolicitudes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, q]);

    // Suscripción al servicio compartido (tiempo real)
    useEffect(() => {
        const unsubscribe = searchService.subscribe((newQ) => {
            setQ(newQ);
            // resetear a primera página al cambiar búsqueda
            setPage(1);
        });
        return unsubscribe;
    }, []);

    const handleCreated = () => {
        setPage(1);
        fetchSolicitudes();
    };

    const truncate = (txt, len = 50) => {
        if (!txt) return '—';
        return txt.length > len ? `${txt.slice(0, len)}…` : txt;
    };

    const fetchSupportNames = async (solicitudes) => {
        const ids = Array.from(new Set(solicitudes.map(s => s.soporteId).filter(Boolean)));
        const map = {};
        await Promise.all(ids.map(async (soporteId) => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/users/${soporteId}`);
                const u = res.data?.user || res.data;
                map[soporteId] = u ? `${u.firstName} ${u.lastName}` : 'Sin soporte asignado';
            } catch {
                map[soporteId] = 'Sin soporte asignado';
            }
        }));
        return map;
    };

    const openDetalle = (item) => {
        setDetalleItem(item);
        setIsDetalleOpen(true);
    };

    const closeDetalle = () => {
        setIsDetalleOpen(false);
        setDetalleItem(null);
    };

    // NUEVO: cancelar y soft-delete
    const handleCancelarSolicitud = async (solicitudId) => {
        const ok = window.confirm('¿Deseas cancelar esta solicitud?');
        if (!ok) return;
        try {
            const rawToken = localStorage.getItem('token');
            const authHeader = rawToken ? (rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`) : null;
            const config = authHeader ? { headers: { Authorization: authHeader } } : undefined;

            await axios.post(`${process.env.REACT_APP_API_URL}/solicitudes/${solicitudId}/cancelar`, { comentario: null }, config);
            await fetchSolicitudes();
        } catch (e) {
            const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Error al cancelar';
            alert(msg);
        }
    };

    const handleSoftDeleteSolicitud = async (solicitudId) => {
        const ok = window.confirm('¿Deseas eliminar (soft delete) esta solicitud cancelada?');
        if (!ok) return;
        try {
            const rawToken = localStorage.getItem('token');
            const authHeader = rawToken ? (rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`) : null;
            const config = authHeader ? { headers: { Authorization: authHeader } } : undefined;

            await axios.post(`${process.env.REACT_APP_API_URL}/solicitudes/${solicitudId}/borrar`, {}, config);
            await fetchSolicitudes();
        } catch (e) {
            const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Error al eliminar';
            alert(msg);
        }
    };
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    // NUEVO: handler para ReactPaginate (0-based → 1-based)
    const handlePageClick = ({ selected }) => {
        setPage(selected + 1);
    };
    
    return (
        <Fragment>
            <CrearSolicitudComponent
                isOpen={isCrearOpen}
                onClose={handleCloseCrear}
                onCreated={handleCreated}
            />
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
                        <li className="breadcrumb-item active text-white" aria-current="page">Mis solicitudes</li>
                    </ol>
                </nav>
            </div>
            <header className="sol-header">
                <h1 className="sol-title">Mis Solicitudes</h1>
            </header>

            <div className="sol-button-wrap d-flex align-items-center gap-2">
                <button
                    type="button"
                    className="btn btn-success sol-button"
                    onClick={handleOpenCrear}
                >
                    Crear Solicitud
                </button>
                <div className="input-group" style={{ maxWidth: '340px' }}>
                    <span className="input-group-text bg-dark text-white border-secondary">
                        <i className="bi bi-search"></i>
                    </span>
                    <input
                        type="text"
                        className="form-control bg-dark text-white border-secondary"
                        placeholder="Buscar por título o descripción..."
                        value={q}
                        onChange={(e) => {
                            const val = e.target.value;
                            searchService.setQuery(val);
                        }}
                    />
                </div>
            </div>

            {isDetalleOpen && detalleItem && (
                <div
                    className="modal show d-block"
                    tabIndex="-1"
                    role="dialog"
                    aria-modal="true"
                    style={{ zIndex: 1055 }}
                >
                    <div className="modal-dialog modal-lg" role="document">
                        <div className="modal-content bg-dark text-white border-secondary">
                            <div className="modal-header border-secondary">
                                <h5 className="modal-title">Detalle de Solicitud #{detalleItem.solicitudId}</h5>
                                <button
                                    type="button"
                                    className="btn-close btn-close-white"
                                    aria-label="Close"
                                    onClick={closeDetalle}
                                ></button>
                            </div>
                            <div className="modal-body text-white">
                                <div className="mb-3">
                                    <strong>Título:</strong> <span>{detalleItem.tittle || '—'}</span>
                                </div>
                                <div className="mb-3">
                                    <strong>Descripción:</strong> <div>{detalleItem.description || '—'}</div>
                                </div>
                                <div className="mb-3">
                                    <strong>Estado:</strong> <span>{detalleItem.estadoCode || '—'}</span>
                                </div>
                                <div className="mb-3">
                                    <strong>Soporte:</strong>{' '}
                                    <span>
                                        {(detalleItem.estadoCode === 'CREADA' || !detalleItem.soporteId)
                                            ? 'Sin soporte asignado'
                                            : (soporteMap[detalleItem.soporteId] || 'Sin soporte asignado')}
                                    </span>
                                </div>
                                <div className="mb-3">
                                    <strong>Creación:</strong>{' '}
                                    <span>{detalleItem.createdAt ? new Date(detalleItem.createdAt).toLocaleString() : '—'}</span>
                                </div>
                                <div className="mb-3">
                                    <strong>Actualización:</strong>{' '}
                                    <span>{detalleItem.updatedAt ? new Date(detalleItem.updatedAt).toLocaleString() : '—'}</span>
                                </div>
                                <hr className="border-secondary" />
                                <div className="mb-3">
                                    <strong>Respuesta:</strong>
                                    <div className="mt-2">
                                        {detalleItem.respuestaContenido
                                            ? detalleItem.respuestaContenido
                                            : 'Sin respuesta'}
                                    </div>
                                    {detalleItem.respuestaId && (
                                        <div className="mt-1 text-muted" style={{ fontSize: '0.9rem' }}>
                                            ID Respuesta: {detalleItem.respuestaId}{' '}
                                            {detalleItem.respuestaCreatedAt && `· ${new Date(detalleItem.respuestaCreatedAt).toLocaleString()}`}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer border-secondary">
                                <button type="button" className="btn btn-success" onClick={closeDetalle}>Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Backdrop manual, por si no usas JS de Bootstrap */}
            {isDetalleOpen && <div className="modal-backdrop show" style={{ zIndex: 1040, backgroundColor: 'rgba(0,0,0,0.6)' }}></div>}

            {/* Tabla */}
            <div className="solicitudes-page">
                <div className="sol-table-wrap">
                    {error && <div className="alert alert-danger">{error}</div>}
                    {loading ? (
                        <div className="text-white">Cargando...</div>
                    ) : (
                        <Fragment>
                            <table className="table table-dark table-hover">
                                <thead>
                                    <tr>
                                        <th scope="col">ID</th>
                                        <th scope="col">Título</th>
                                        <th scope="col">Descripción</th>
                                        <th scope="col">Estado</th>
                                        <th scope="col">Soporte</th>
                                        <th scope="col">Creación</th>
                                        <th scope="col">Actualización</th>
                                        <th scope="col">Opciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map(r => (
                                        <tr key={r.solicitudId}>
                                            <th scope="row">{r.solicitudId}</th>
                                            <td>{r.tittle}</td>
                                            <td>{truncate(r.description)}</td>
                                            <td>{r.estadoCode}</td>
                                            <td>
                                                {(r.estadoCode === 'CREADA' || !r.soporteId)
                                                    ? 'Sin soporte asignado'
                                                    : (soporteMap[r.soporteId] || 'Sin soporte asignado')}
                                            </td>
                                            <td>{r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}</td>
                                            <td>{r.updatedAt ? new Date(r.updatedAt).toLocaleString() : '—'}</td>
                                            <td>
                                                <div className="btn-group btn-group-sm" role="group" aria-label="Opciones">
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-info"
                                                        onClick={() => openDetalle(r)}
                                                        title="Ver detalles"
                                                    >
                                                        <i className="bi bi-eye"></i>
                                                    </button>
                                                    {r.estadoCode === 'CANCELADA' ? (
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-danger"
                                                            onClick={() => handleSoftDeleteSolicitud(r.solicitudId)}
                                                            title="Eliminar (soft delete)"
                                                        >
                                                            <i className="bi bi-trash"></i>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="btn btn-outline-warning"
                                                            onClick={() => handleCancelarSolicitud(r.solicitudId)}
                                                            title="Cancelar solicitud"
                                                        >
                                                            <i className="bi bi-x-circle"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {rows.length === 0 && (
                                        <tr>
                                            <td colSpan="8" className="text-center">Sin solicitudes</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            {/* Paginación (ReactPaginate con estilo) */}
                            <div className="d-flex align-items-center mt-3">
                                <div className="me-2">Páginas ({totalPages}):</div>
                                <ReactPaginateComponent
                                    previousLabel="« Anterior"
                                    nextLabel="Siguiente »"
                                    breakLabel="..."
                                    pageCount={totalPages}
                                    forcePage={Math.min(Math.max(page - 1, 0), totalPages - 1)}
                                    marginPagesDisplayed={1}
                                    pageRangeDisplayed={5}
                                    onPageChange={handlePageClick}
                                    containerClassName="pagination mb-0 sol-paginate"
                                    pageClassName="page-item"
                                    pageLinkClassName="page-link"
                                    previousClassName="page-item"
                                    previousLinkClassName="page-link"
                                    nextClassName="page-item"
                                    nextLinkClassName="page-link"
                                    breakClassName="page-item"
                                    breakLinkClassName="page-link"
                                    activeClassName="active"
                                    disabledClassName="disabled"
                                />
                            </div>
                        </Fragment>
                    )}
                </div>
            </div>
        </Fragment>
    )
}

const CrearSolicitudComponent =
    CrearSolicitud && (typeof CrearSolicitud === 'function' || typeof CrearSolicitud === 'object')
        ? CrearSolicitud
        : () => null;

const ReactPaginateComponent = ReactPaginateModule.default || ReactPaginateModule;