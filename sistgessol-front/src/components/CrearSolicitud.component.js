import React, { useState } from 'react';
import axios from 'axios';

export function CrearSolicitud({ isOpen, onClose, onCreated }) {
    const [form, setForm] = useState({
        tittle: '',
        description: '',
        comment: '',
        stateCode: 'CREADA',
    });
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrorMsg('');
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `${process.env.REACT_APP_API_URL}/solicitudes`,
                {
                    tittle: form.tittle,
                    description: form.description,
                    stateCode: 'CREADA',
                    comment: form.comment || null,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: token ? `Bearer ${token}` : '',
                    },
                }
            );
            if (typeof onCreated === 'function') {
                onCreated(res.data?.solicitudId);
            }
            setForm({ tittle: '', description: '', comment: '', stateCode: 'CREADA' });
            onClose();
        } catch (error) {
            const msg = error?.response?.data?.error || error?.message || 'Error al crear solicitud';
            setErrorMsg(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div
                className="modal fade show d-block"
                tabIndex="-1"
                aria-modal="true"
                role="dialog"
                data-bs-backdrop="static"
                data-bs-keyboard="false"
            >
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content bg-dark text-white">
                        <div className="modal-header border-secondary">
                            <h5 className="modal-title">Crear Solicitud</h5>
                            <button
                                type="button"
                                className="btn-close btn-close-white"
                                aria-label="Close"
                                onClick={onClose}
                            ></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {errorMsg && (
                                    <div className="alert alert-danger py-2">{errorMsg}</div>
                                )}
                                <div className="mb-3">
                                    <label htmlFor="sol_tittle" className="form-label">Título</label>
                                    <input
                                        id="sol_tittle"
                                        name="tittle"
                                        type="text"
                                        className="form-control"
                                        value={form.tittle}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="sol_description" className="form-label">Descripción</label>
                                    <textarea
                                        id="sol_description"
                                        name="description"
                                        className="form-control"
                                        rows="4"
                                        value={form.description}
                                        onChange={handleChange}
                                        required
                                    ></textarea>
                                </div>
                                <div className="mb-3">
                                    <label htmlFor="sol_comment" className="form-label">Comentario (opcional)</label>
                                    <input
                                        id="sol_comment"
                                        name="comment"
                                        type="text"
                                        className="form-control"
                                        value={form.comment}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer border-secondary">
                                <button
                                    type="submit"
                                    className="btn btn-success"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Creando...' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {/* Backdrop manual para modo estático */}
            <div className="modal-backdrop fade show"></div>
        </>
    );
}