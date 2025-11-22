import { Fragment, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/perfil.css';

export function Perfil() {
    const [data, setData] = useState({ id: null, firstName: '', lastName: '', email: '', phone: '', roleId: null });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [edit, setEdit] = useState(false);
    const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });
    const roleLabel = data.roleId === 1 ? 'Admin' : data.roleId === 2 ? 'Soporte' : 'Cliente';
    const initials = `${(data.firstName || '').charAt(0)}${(data.lastName || '').charAt(0)}`.toUpperCase();
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        const fetchMe = async () => {
            setLoading(true);
            setError('');
            try {
                const rawToken = localStorage.getItem('token');
                const authHeader = rawToken ? (rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`) : null;
                const config = authHeader ? { headers: { Authorization: authHeader } } : undefined;
                const res = await axios.get(`${process.env.REACT_APP_API_URL}/users/me`, config);
                const u = res.data?.user || res.data;
                setData({
                    id: u?.id ?? null,
                    firstName: u?.firstName ?? '',
                    lastName: u?.lastName ?? '',
                    email: u?.email ?? '',
                    phone: u?.phone ?? '',
                    roleId: u?.roleId ?? null,
                });
                setForm({
                    firstName: u?.firstName ?? '',
                    lastName: u?.lastName ?? '',
                    phone: String(u?.phone ?? ''),
                });
            } catch (e) {
                const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Error al cargar perfil';
                setError(msg);
            } finally {
                setLoading(false);
            }
        };
        fetchMe();
    }, []);

    const handleLogout = async () => {
        const rawToken = localStorage.getItem('token');
        const authHeader = rawToken ? (rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`) : null;
        try {
            if (authHeader && data.id) {
                await axios.post(`${process.env.REACT_APP_API_URL}/auth/logout`, {}, { headers: { Authorization: authHeader }, params: { id: data.id } });
            }
        } catch (_) {
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('id');
            localStorage.removeItem('roleId');
            window.location.href = '/login';
        }
    };

    const saveProfile = async () => {
        setLoading(true);
        setError('');
        try {
            const rawToken = localStorage.getItem('token');
            const authHeader = rawToken ? (rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`) : null;
            const config = authHeader ? { headers: { Authorization: authHeader } } : undefined;
            const res = await axios.put(`${process.env.REACT_APP_API_URL}/users/me`, {
                firstName: form.firstName,
                lastName: form.lastName,
                phone: form.phone,
            }, config);
            const u = res.data?.user || res.data;
            setData({
                id: u?.id ?? data.id,
                firstName: u?.firstName ?? form.firstName,
                lastName: u?.lastName ?? form.lastName,
                email: u?.email ?? data.email,
                phone: u?.phone ?? form.phone,
                roleId: data.roleId,
            });
            setEdit(false);
        } catch (e) {
            const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Error al actualizar perfil';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
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
                        <li className="breadcrumb-item active text-white" aria-current="page">Perfil</li>
                    </ol>
                </nav>
            </div>
            <div className="container py-3 perfil-container">
                {/* Card de perfil */}
                <div className="card bg-dark text-white perfil-card">
                    {error && <div className="alert alert-danger">{error}</div>}
                    <div className="row g-4">
                        <div className="col-lg-4">
                            <div className="card bg-dark text-white border-secondary h-100">
                                <div className="card-body d-flex flex-column align-items-center">
                                    <div
                                        className="rounded-circle bg-secondary d-flex align-items-center justify-content-center"
                                        style={{ width: 96, height: 96, fontSize: 32, fontWeight: 700 }}
                                    >
                                        {initials || 'U'}
                                    </div>
                                    <h4 className="mt-3 mb-1">{`${data.firstName} ${data.lastName}`.trim() || 'Usuario'}</h4>
                                    <span className="badge bg-info">{roleLabel}</span>
                                    <div className="w-100 mt-3">
                                        <div className="d-flex justify-content-between">
                                            <span>Email</span>
                                            <span className="text-white-50">{data.email || '—'}</span>
                                        </div>
                                        <div className="d-flex justify-content-between mt-2">
                                            <span>Teléfono</span>
                                            <span className="text-white-50">{String(data.phone || '').trim() || '—'}</span>
                                        </div>
                                        {/* Botón Cerrar sesión con texto blanco (sin estilos rojos) */}
                                        <div className="mt-3">
                                            <button
                                                className="btn btn-success w-100 text-white logout-btn"
                                                onClick={handleLogout}
                                                disabled={loading}
                                            >
                                                Cerrar sesión
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-lg-8">
                            <div className="card bg-dark text-white border-secondary h-100">
                                <div className="card-header border-secondary d-flex justify-content-between align-items-center">
                                    <span>Datos de la cuenta</span>
                                    {!edit ? (
                                        <button
                                            type="button"
                                            className="btn btn-success d-inline-flex align-items-center edit-btn"
                                            onClick={() => setEdit(true)}
                                            aria-label="Editar"
                                        >
                                            <i className="bi bi-pencil"></i>
                                        </button>
                                    ) : (
                                        <div className="d-flex gap-2">
                                            <button type="button" className="btn btn-success btn-sm" onClick={saveProfile} disabled={loading}>Guardar</button>
                                            <button
                                                type="button"
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => {
                                                    setEdit(false);
                                                    setForm({ firstName: data.firstName, lastName: data.lastName, phone: String(data.phone || '') });
                                                }}
                                                disabled={loading}
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="card-body">
                                    {loading ? (
                                        <div className="text-white">Cargando...</div>
                                    ) : (
                                        <form className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label">Nombres</label>
                                                <input
                                                    type="text"
                                                    className="form-control bg-dark text-white border-secondary"
                                                    value={form.firstName}
                                                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                                                    disabled={!edit}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Apellidos</label>
                                                <input
                                                    type="text"
                                                    className="form-control bg-dark text-white border-secondary"
                                                    value={form.lastName}
                                                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                                                    disabled={!edit}
                                                />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Email</label>
                                                <input type="email" className="form-control bg-dark text-white border-secondary" value={data.email} disabled />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label">Teléfono</label>
                                                <input
                                                    type="text"
                                                    className="form-control bg-dark text-white border-secondary"
                                                    value={form.phone}
                                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                                    disabled={!edit}
                                                />
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}