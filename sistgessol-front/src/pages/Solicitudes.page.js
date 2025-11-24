import { Fragment, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Solicitudes.css';
import { CrearSolicitud } from '../components/CrearSolicitud.component';
import axios from 'axios';
import ReactPaginate from 'react-paginate';
import { searchService } from '../services/search.service';

export function Solicitudes() {
    const [isCrearOpen, setIsCrearOpen] = useState(false);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [soporteMap, setSoporteMap] = useState({});
    const [clienteMap, setClienteMap] = useState({});
    const [isDetalleOpen, setIsDetalleOpen] = useState(false);
    const [detalleItem, setDetalleItem] = useState(null);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const [q, setQ] = useState('');
    const roleId = Number(localStorage.getItem('roleId') || 0);
    const userId = Number(localStorage.getItem('id') || 0);
    const [filter, setFilter] = useState('TODAS');
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [assignId, setAssignId] = useState(null);
    const [isProcessOpen, setIsProcessOpen] = useState(false);
    const [processId, setProcessId] = useState(null);
    const [isAskRespondOpen, setIsAskRespondOpen] = useState(false);
    const [isRespondOpen, setIsRespondOpen] = useState(false);
    const [respondId, setRespondId] = useState(null);
    const [respondText, setRespondText] = useState('');
    const [respondComment, setRespondComment] = useState('');

    const [adminEstado, setAdminEstado] = useState('');
    const [adminSoporte, setAdminSoporte] = useState('');
    const [adminCliente, setAdminCliente] = useState('');
    const [adminFecha, setAdminFecha] = useState('');
    const [openEstado, setOpenEstado] = useState(false);
    const [openSoporte, setOpenSoporte] = useState(false);
    const [openCliente, setOpenCliente] = useState(false);
    const [openFecha, setOpenFecha] = useState(false);
    const [supports, setSupports] = useState([]);
    const [clients, setClients] = useState([]);
    const [isAdminAssignOpen, setIsAdminAssignOpen] = useState(false);
    const [adminAssignId, setAdminAssignId] = useState(null);
    const [adminAssignSupportId, setAdminAssignSupportId] = useState(null);

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

            const config = authHeader ? { headers: { Authorization: authHeader } } : {};
            const query = q ? `&q=${encodeURIComponent(q)}` : '';
            const filterParam = roleId === 2 && filter ? `&filter=${encodeURIComponent(filter)}` : '';
            const adminParams = roleId === 1 ? `&estado=${encodeURIComponent(adminEstado || '')}&soporte=${encodeURIComponent(adminSoporte || '')}&cliente=${encodeURIComponent(adminCliente || '')}&fecha=${encodeURIComponent(adminFecha || '')}` : '';
            
            const url = roleId === 2
                ? `${process.env.REACT_APP_API_URL}/solicitudes/soporte?page=${page}&pageSize=${pageSize}${query}${filterParam}`
                : roleId === 1
                    ? `${process.env.REACT_APP_API_URL}/solicitudes/admin?page=${page}&pageSize=${pageSize}${query}${adminParams}`
                    : `${process.env.REACT_APP_API_URL}/solicitudes/mis?page=${page}&pageSize=${pageSize}${query}`;

            const res = await axios.get(url, config);

            const data = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
            const totalCount = res.data?.pagination?.total ?? 0;

            setRows(data);
            setTotal(Number(totalCount) || 0);

            const map = await fetchSupportNames(data);
            setSoporteMap(map);
            const cMap = await fetchClientNames(data);
            setClienteMap(cMap);
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
    }, [page, q, filter, adminEstado, adminSoporte, adminCliente, adminFecha]);

    // Suscripción al servicio compartido (tiempo real)
    useEffect(() => {
        const unsubscribe = searchService.subscribe((newQ) => {
            setQ(newQ);
            setPage(1);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (roleId === 1) {
            const fetchLists = async () => {
                try {
                    const rawToken = localStorage.getItem('token');
                    const authHeader = rawToken
                        ? (rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`)
                        : null;
                    const config = authHeader ? { headers: { Authorization: authHeader } } : {};
                    
                    const resSupports = await axios.get(`${process.env.REACT_APP_API_URL}/users?role=2&limit=200`, config);
                    const resClients = await axios.get(`${process.env.REACT_APP_API_URL}/users?role=3&limit=200`, config);
                    setSupports(resSupports.data?.data || []);
                    setClients(resClients.data?.data || []);
                } catch (error) {
                    console.error('Error fetching lists:', error);
                }
            };
            fetchLists();
        }
    }, [roleId]);

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
        
        const rawToken = localStorage.getItem('token');
        const authHeader = rawToken
            ? (rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`)
            : null;
        const config = authHeader ? { headers: { Authorization: authHeader } } : {};
        
        await Promise.all(ids.map(async (soporteId) => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/users/${soporteId}`, config);
                const u = res.data?.user || res.data;
                map[soporteId] = u ? `${u.firstName} ${u.lastName}` : 'Sin soporte asignado';
            } catch {
                map[soporteId] = 'Sin soporte asignado';
            }
        }));
        return map;
    };

    const fetchClientNames = async (solicitudes) => {
        const ids = Array.from(new Set(solicitudes.map(s => s.clienteId).filter(Boolean)));
        const map = {};
        
        const rawToken = localStorage.getItem('token');
        const authHeader = rawToken
            ? (rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`)
            : null;
        const config = authHeader ? { headers: { Authorization: authHeader } } : {};
        
        await Promise.all(ids.map(async (clienteId) => {
            try {
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/users/${clienteId}`, config);
                const u = res.data?.user || res.data;
                map[clienteId] = u ? `${u.firstName} ${u.lastName}` : '—';
            } catch {
                map[clienteId] = '—';
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

    const openAssign = (id) => {
        setAssignId(id);
        setIsAssignOpen(true);
    };
    
    const closeAssign = () => {
        setIsAssignOpen(false);
        setAssignId(null);
    };
    
    const confirmAssign = async () => {
        if (!assignId) return;
        try {
            const rawToken = localStorage.getItem('token');
            const authHeader = rawToken ? (rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`) : null;
            const config = authHeader ? { headers: { Authorization: authHeader } } : {};
            await axios.post(`${process.env.REACT_APP_API_URL}/solicitudes/${assignId}/asignar`, { soporteId: userId }, config);
            closeAssign();
            await fetchSolicitudes();
        } catch (e) {
            const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Error al asignar';
            alert(msg);
        }
    };

    const openProcess = (id) => { 
        setProcessId(id); 
        setIsProcessOpen(true); 
    };
    
    const closeProcess = () => { 
        setIsProcessOpen(false); 
        setProcessId(null); 
    };
    
    const confirmProcess = async () => {
        if (!processId) return;
        try {
            const rawToken = localStorage.getItem('token');
            const authHeader = rawToken ? (rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`) : null;
            const config = authHeader ? { headers: { Authorization: authHeader } } : {};
            await axios.post(`${process.env.REACT_APP_API_URL}/solicitudes/${processId}/estado`, { estadoCode: 'EN_PROCESO', comentario: null, respuestaContenido: null }, config);
            closeProcess();
            setRespondId(processId);
            setIsAskRespondOpen(true);
            await fetchSolicitudes();
        } catch (e) {
            const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Error al cambiar a EN PROCESO';
            alert(msg);
        }
    };

    const openRespond = (id) => { 
        setRespondId(id); 
        setIsRespondOpen(true); 
    };
    
    const closeRespond = () => { 
        setIsRespondOpen(false); 
        setRespondId(null); 
        setRespondText(''); 
        setRespondComment(''); 
    };
    
    const submitRespond = async () => {
        if (!respondId || !respondText.trim()) { 
            alert('Ingresa una respuesta'); 
            return; 
        }
        try {
            const rawToken = localStorage.getItem('token');
            const authHeader = rawToken ? (rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`) : null;
            const config = authHeader ? { headers: { Authorization: authHeader } } : {};
            await axios.post(`${process.env.REACT_APP_API_URL}/solicitudes/${respondId}/estado`, { estadoCode: 'RESUELTA', comentario: respondComment || null, respuestaContenido: respondText }, config);
            closeRespond();
            setIsAskRespondOpen(false);
            await fetchSolicitudes();
        } catch (e) {
            const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Error al responder';
            alert(msg);
        }
    };

    // Cancelar y soft-delete
    const handleCancelarSolicitud = async (solicitudId) => {
        const ok = window.confirm('¿Deseas cancelar esta solicitud?');
        if (!ok) return;
        try {
            const rawToken = localStorage.getItem('token');
            const authHeader = rawToken ? (rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`) : null;
            const config = authHeader ? { headers: { Authorization: authHeader } } : {};

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
            const config = authHeader ? { headers: { Authorization: authHeader } } : {};

            await axios.post(`${process.env.REACT_APP_API_URL}/solicitudes/${solicitudId}/borrar`, {}, config);
            await fetchSolicitudes();
        } catch (e) {
            const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Error al eliminar';
            alert(msg);
        }
    };

    const handleCerrarSolicitud = async (solicitudId) => {
        try {
            const rawToken = localStorage.getItem('token');
            const authHeader = rawToken ? (rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`) : null;
            const config = authHeader ? { headers: { Authorization: authHeader } } : {};
            await axios.post(`${process.env.REACT_APP_API_URL}/solicitudes/${solicitudId}/estado`, { estadoCode: 'CERRADA', comentario: 'Cierre de solicitud', respuestaContenido: null }, config);
            await fetchSolicitudes();
        } catch (e) {
            const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Error al cerrar';
            alert(msg);
        }
    };

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    // Handler para ReactPaginate (0-based → 1-based)
    const handlePageClick = ({ selected }) => {
        setPage(selected + 1);
    };

    // Función para formatear nombres de filtros
    const formatFilterName = (filter) => {
        const filterMap = {
            'TODAS': 'Todas',
            'CREADAS': 'Creadas',
            'ASIGNADAS_MIAS': 'Asignadas Mías',
            'EN_PROCESO_MIAS': 'En Proceso Mías',
            'RESPONDIDAS_MIAS': 'Respondidas Mías'
        };
        return filterMap[filter] || filter;
    };

    return (
        <Fragment>
            <CrearSolicitud
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
                        <li className="breadcrumb-item active text-white" aria-current="page">{roleId === 1 ? 'Listado de solicitudes' : roleId === 2 ? 'Solicitudes de soporte' : 'Mis solicitudes'}</li>
                    </ol>
                </nav>
            </div>
            
            <header className="sol-header">
                <h1 className="sol-title">{roleId === 1 ? 'Listado de Solicitudes' : roleId === 2 ? 'Solicitudes de Soporte' : 'Mis Solicitudes'}</h1>
            </header>

            <div className="sol-button-wrap d-flex align-items-center gap-2 flex-wrap">
                {roleId === 3 && (
                    <button
                        type="button"
                        className="btn btn-success sol-button"
                        onClick={handleOpenCrear}
                    >
                        Crear Solicitud
                    </button>
                )}
                
                {roleId === 2 && (
                    <div className="btn-group" role="group" aria-label="Filtros soporte">
                        {['TODAS','CREADAS','ASIGNADAS_MIAS','EN_PROCESO_MIAS','RESPONDIDAS_MIAS'].map(f => (
                            <button
                                key={f}
                                type="button"
                                className={`btn btn-${filter===f?'success':'secondary'}`}
                                onClick={() => { setFilter(f); setPage(1); }}
                            >
                                {formatFilterName(f)}
                            </button>
                        ))}
                    </div>
                )}
                
                {roleId === 1 && (
                    <Fragment>
                        <div className="position-relative d-inline-block">
                            <button className="btn btn-secondary" type="button" onClick={() => { setOpenEstado(v=>!v); setOpenSoporte(false); setOpenCliente(false); setOpenFecha(false); }}>Estado</button>
                            {openEstado && (
                                <ul className="bg-dark text-white list-unstyled position-absolute mt-1 p-1 border border-secondary" style={{ maxHeight: '220px', overflowY: 'auto', minWidth: '180px', zIndex: 1040 }}>
                                    {['','CREADA','ASIGNADA','EN_PROCESO','RESUELTA','CERRADA','CANCELADA'].map(e => (
                                        <li key={e}>
                                            <button 
                                                className="dropdown-item text-white" 
                                                onClick={() => { setAdminEstado(e); setPage(1); setOpenEstado(false); }}
                                            >
                                                {e || 'Todos'}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        
                        <div className="position-relative d-inline-block">
                            <button className="btn btn-secondary" type="button" onClick={() => { setOpenSoporte(v=>!v); setOpenEstado(false); setOpenCliente(false); setOpenFecha(false); }}>Soporte</button>
                            {openSoporte && (
                                <ul className="bg-dark text-white list-unstyled position-absolute mt-1 p-1 border border-secondary" style={{ maxHeight: '220px', overflowY: 'auto', minWidth: '220px', zIndex: 1040 }}>
                                    <li>
                                        <button 
                                            className="dropdown-item text-white" 
                                            onClick={() => { setAdminSoporte(''); setPage(1); setOpenSoporte(false); }}
                                        >
                                            Todos
                                        </button>
                                    </li>
                                    {supports.map(u => (
                                        <li key={u.id}>
                                            <button 
                                                className="dropdown-item text-white" 
                                                onClick={() => { setAdminSoporte(`${u.firstName} ${u.lastName}`); setPage(1); setOpenSoporte(false); }}
                                            >
                                                {u.firstName} {u.lastName}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        
                        <div className="position-relative d-inline-block">
                            <button className="btn btn-secondary" type="button" onClick={() => { setOpenCliente(v=>!v); setOpenEstado(false); setOpenSoporte(false); setOpenFecha(false); }}>Cliente</button>
                            {openCliente && (
                                <ul className="bg-dark text-white list-unstyled position-absolute mt-1 p-1 border border-secondary" style={{ maxHeight: '220px', overflowY: 'auto', minWidth: '220px', zIndex: 1040 }}>
                                    <li>
                                        <button 
                                            className="dropdown-item text-white" 
                                            onClick={() => { setAdminCliente(''); setPage(1); setOpenCliente(false); }}
                                        >
                                            Todos
                                        </button>
                                    </li>
                                    {clients.map(u => (
                                        <li key={u.id}>
                                            <button 
                                                className="dropdown-item text-white" 
                                                onClick={() => { setAdminCliente(`${u.firstName} ${u.lastName}`); setPage(1); setOpenCliente(false); }}
                                            >
                                                {u.firstName} {u.lastName}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        
                        <div className="position-relative d-inline-block">
                            <button className="btn btn-secondary" type="button" onClick={() => { setOpenFecha(v=>!v); setOpenEstado(false); setOpenSoporte(false); setOpenCliente(false); }}>Fecha</button>
                            {openFecha && (
                                <div className="position-absolute mt-1 p-2 bg-dark text-white border border-secondary" style={{ zIndex: 1040 }}>
                                    <input 
                                        type="date" 
                                        className="form-control bg-dark text-white border-secondary" 
                                        value={adminFecha} 
                                        onChange={(e) => { setAdminFecha(e.target.value); setPage(1); }} 
                                    />
                                </div>
                            )}
                        </div>
                    </Fragment>
                )}
                
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

            {/* Modal de Detalle */}
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
                                    <strong>Cliente:</strong> <span>{detalleItem.clienteId ? (clienteMap[detalleItem.clienteId] || '—') : '—'}</span>
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
                                <div className="mb-3">
                                    <strong>Comentario:</strong>
                                    <div className="mt-2">{detalleItem.ultimoComentario || '—'}</div>
                                </div>
                            </div>
                            <div className="modal-footer border-secondary d-flex gap-2">
                                {roleId === 2 && detalleItem && detalleItem.estadoCode === 'CREADA' && !detalleItem.soporteId && (
                                    <button 
                                        type="button" 
                                        className="btn btn-secondary" 
                                        onClick={() => openAssign(detalleItem.solicitudId)}
                                    >
                                        Asignarme
                                    </button>
                                )}
                                <button type="button" className="btn btn-success" onClick={closeDetalle}>Cerrar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Backdrop para modal de detalle */}
            {isDetalleOpen && <div className="modal-backdrop show" style={{ zIndex: 1040, backgroundColor: 'rgba(0,0,0,0.6)' }}></div>}

            {/* Modal de Asignación */}
            {isAssignOpen && (
                <div className="modal show d-block" tabIndex="-1" role="dialog" aria-modal="true" style={{ zIndex: 1055 }}>
                    <div className="modal-dialog modal-sm modal-dialog-centered" role="document">
                        <div className="modal-content bg-dark text-white border-secondary">
                            <div className="modal-header border-secondary">
                                <h5 className="modal-title">Asignación</h5>
                                <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={closeAssign}></button>
                            </div>
                            <div className="modal-body">
                                ¿Quieres asignarte esta solicitud?
                            </div>
                            <div className="modal-footer border-secondary d-flex gap-2">
                                <button type="button" className="btn btn-secondary" onClick={closeAssign}>Cancelar</button>
                                <button type="button" className="btn btn-success" onClick={confirmAssign}>Asignarme</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {isAssignOpen && <div className="modal-backdrop show" style={{ zIndex: 1040, backgroundColor: 'rgba(0,0,0,0.6)' }}></div>}

            {/* Modal de Asignación Admin */}
            {roleId === 1 && isAdminAssignOpen && (
                <div className="modal show d-block" tabIndex="-1" role="dialog" aria-modal="true" style={{ zIndex: 1055 }}>
                    <div className="modal-dialog modal-md modal-dialog-centered" role="document">
                        <div className="modal-content bg-dark text-white border-secondary">
                            <div className="modal-header border-secondary">
                                <h5 className="modal-title">Asignar soporte</h5>
                                <button 
                                    type="button" 
                                    className="btn-close btn-close-white" 
                                    aria-label="Close" 
                                    onClick={() => { 
                                        setIsAdminAssignOpen(false); 
                                        setAdminAssignId(null); 
                                        setAdminAssignSupportId(null); 
                                    }}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <label className="form-label">Selecciona soporte</label>
                                <select 
                                    className="form-select bg-dark text-white border-secondary" 
                                    value={adminAssignSupportId ?? ''} 
                                    onChange={(e) => setAdminAssignSupportId(Number(e.target.value))}
                                >
                                    <option value="">— Seleccionar —</option>
                                    {supports.map(u => (
                                        <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="modal-footer border-secondary d-flex gap-2">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary" 
                                    onClick={() => { 
                                        setIsAdminAssignOpen(false); 
                                        setAdminAssignId(null); 
                                        setAdminAssignSupportId(null); 
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="button" 
                                    className="btn btn-success" 
                                    onClick={async () => {
                                        if (!adminAssignId || !adminAssignSupportId) { 
                                            alert('Selecciona un soporte'); 
                                            return; 
                                        }
                                        try {
                                            const rawToken = localStorage.getItem('token');
                                            const authHeader = rawToken ? (rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`) : null;
                                            const config = authHeader ? { headers: { Authorization: authHeader } } : {};
                                            await axios.post(
                                                `${process.env.REACT_APP_API_URL}/solicitudes/${adminAssignId}/asignar`, 
                                                { soporteId: adminAssignSupportId }, 
                                                config
                                            );
                                            setIsAdminAssignOpen(false);
                                            setAdminAssignId(null);
                                            setAdminAssignSupportId(null);
                                            await fetchSolicitudes();
                                        } catch (e) {
                                            const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Error al asignar';
                                            alert(msg);
                                        }
                                    }}
                                >
                                    Asignar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {roleId === 1 && isAdminAssignOpen && <div className="modal-backdrop show" style={{ zIndex: 1040, backgroundColor: 'rgba(0,0,0,0.6)' }}></div>}

            {/* Modal de Proceso */}
            {isProcessOpen && (
                <div className="modal show d-block" tabIndex="-1" role="dialog" aria-modal="true" style={{ zIndex: 1055 }}>
                    <div className="modal-dialog modal-sm modal-dialog-centered" role="document">
                        <div className="modal-content bg-dark text-white border-secondary">
                            <div className="modal-header border-secondary">
                                <h5 className="modal-title">Colocar en proceso</h5>
                                <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={closeProcess}></button>
                            </div>
                            <div className="modal-body">
                                ¿Deseas colocar esta solicitud en proceso?
                            </div>
                            <div className="modal-footer border-secondary d-flex gap-2">
                                <button type="button" className="btn btn-secondary" onClick={closeProcess}>Cancelar</button>
                                <button type="button" className="btn btn-primary" onClick={confirmProcess}>Colocar en proceso</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {isProcessOpen && <div className="modal-backdrop show" style={{ zIndex: 1040, backgroundColor: 'rgba(0,0,0,0.6)' }}></div>}

            {/* Modal de Pregunta Responder */}
            {isAskRespondOpen && (
                <div className="modal show d-block" tabIndex="-1" role="dialog" aria-modal="true" style={{ zIndex: 1055 }}>
                    <div className="modal-dialog modal-sm modal-dialog-centered" role="document">
                        <div className="modal-content bg-dark text-white border-secondary">
                            <div className="modal-header border-secondary">
                                <h5 className="modal-title">Responder ahora</h5>
                                <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={() => setIsAskRespondOpen(false)}></button>
                            </div>
                            <div className="modal-body">
                                ¿Quieres darle respuesta ahora?
                            </div>
                            <div className="modal-footer border-secondary d-flex gap-2">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsAskRespondOpen(false)}>No</button>
                                <button 
                                    type="button" 
                                    className="btn btn-success" 
                                    onClick={() => { 
                                        setIsAskRespondOpen(false); 
                                        openRespond(respondId); 
                                    }}
                                >
                                    Sí
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {isAskRespondOpen && <div className="modal-backdrop show" style={{ zIndex: 1040, backgroundColor: 'rgba(0,0,0,0.6)' }}></div>}

            {/* Modal de Responder */}
            {isRespondOpen && (
                <div className="modal show d-block" tabIndex="-1" role="dialog" aria-modal="true" style={{ zIndex: 1055 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                        <div className="modal-content bg-dark text-white border-secondary">
                            <div className="modal-header border-secondary">
                                <h5 className="modal-title">Responder solicitud</h5>
                                <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={closeRespond}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Respuesta</label>
                                    <textarea 
                                        className="form-control bg-dark text-white border-secondary" 
                                        rows="4" 
                                        value={respondText} 
                                        onChange={(e) => setRespondText(e.target.value)} 
                                        required
                                    ></textarea>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Comentario (opcional)</label>
                                    <input 
                                        type="text" 
                                        className="form-control bg-dark text-white border-secondary" 
                                        value={respondComment} 
                                        onChange={(e) => setRespondComment(e.target.value)} 
                                    />
                                </div>
                            </div>
                            <div className="modal-footer border-secondary d-flex gap-2">
                                <button type="button" className="btn btn-secondary" onClick={closeRespond}>Cancelar</button>
                                <button type="button" className="btn btn-success" onClick={submitRespond}>Enviar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {isRespondOpen && <div className="modal-backdrop show" style={{ zIndex: 1040, backgroundColor: 'rgba(0,0,0,0.6)' }}></div>}

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
                                                    
                                                    {roleId === 2 ? (
                                                        <>
                                                            {!r.soporteId && (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-outline-success"
                                                                    onClick={() => openAssign(r.solicitudId)}
                                                                    title="Asignarme"
                                                                >
                                                                    <i className="bi bi-person-plus"></i>
                                                                </button>
                                                            )}
                                                            {r.soporteId === userId && r.estadoCode !== 'EN_PROCESO' && r.estadoCode !== 'RESUELTA' && r.estadoCode !== 'CERRADA' && (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-outline-primary"
                                                                    onClick={() => openProcess(r.solicitudId)}
                                                                    title="Colocar en proceso"
                                                                >
                                                                    <i className="bi bi-play"></i>
                                                                </button>
                                                            )}
                                                            {r.soporteId === userId && r.estadoCode === 'EN_PROCESO' && (
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-outline-success"
                                                                    onClick={() => openRespond(r.solicitudId)}
                                                                    title="Responder"
                                                                >
                                                                    <i className="bi bi-reply"></i>
                                                                </button>
                                                            )}
                                                        </>
                                                    ) : (
                                                        (r.estadoCode === 'RESUELTA' && !!r.respuestaId) ? (
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-success"
                                                                onClick={() => handleCerrarSolicitud(r.solicitudId)}
                                                                title="Cerrar solicitud"
                                                            >
                                                                <i className="bi bi-check2-circle"></i>
                                                            </button>
                                                        ) : r.estadoCode === 'CANCELADA' ? (
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-danger"
                                                                onClick={() => handleSoftDeleteSolicitud(r.solicitudId)}
                                                                title="Eliminar (soft delete)"
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </button>
                                                        ) : r.estadoCode === 'CERRADA' ? (
                                                            <span className="btn btn-outline-secondary disabled" title="Solicitud cerrada">
                                                                <i className="bi bi-lock"></i>
                                                            </span>
                                                        ) : r.estadoCode === 'RESUELTA' ? (
                                                            <span className="btn btn-outline-secondary disabled" title="Solicitud resuelta">
                                                                <i className="bi bi-check2"></i>
                                                            </span>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-warning"
                                                                onClick={() => handleCancelarSolicitud(r.solicitudId)}
                                                                title="Cancelar solicitud"
                                                            >
                                                                <i className="bi bi-x-circle"></i>
                                                            </button>
                                                        )
                                                    )}
                                                    
                                                    {roleId === 1 && (
                                                        (r.estadoCode === 'RESUELTA' || r.estadoCode === 'CERRADA') ? (
                                                            <span
                                                                className="btn btn-outline-secondary disabled"
                                                                title="No asignable en estado final"
                                                            >
                                                                <i className="bi bi-person-plus"></i>
                                                            </span>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-success"
                                                                onClick={() => { 
                                                                    setAdminAssignId(r.solicitudId); 
                                                                    setIsAdminAssignOpen(true); 
                                                                }}
                                                                title="Asignar soporte"
                                                            >
                                                                <i className="bi bi-person-plus"></i>
                                                            </button>
                                                        )
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

                            {/* Paginación */}
                            <div className="d-flex align-items-center mt-3">
                                <div className="me-2 text-white">Páginas ({totalPages}):</div>
                                <ReactPaginate
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
    );
}