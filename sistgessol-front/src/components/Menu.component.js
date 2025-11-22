import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import axios from 'axios';

export function Menu() {
    const [isOpen, setIsOpen] = useState(false);
    const roleIdStr = localStorage.getItem('roleId');
    const roleId = roleIdStr ? Number(roleIdStr) : null;
    const isAdmin = roleId === 1;
    const menuLinks = isAdmin
        ? [
            { to: '/dashboard', label: 'Dashboard' },
            { to: '/solicitudes', label: 'Solicitudes' },
            { to: '/perfil', label: 'Gestor usuarios' },
            { to: '/perfil', label: 'Perfil' },
          ]
        : [
            { to: '/solicitudes', label: 'Solicitudes' },
            { to: '/perfil', label: 'Perfil' },
          ];

    const handleLogout = async (e) => {
        e.preventDefault();
        setIsOpen(false);
        const rawToken = localStorage.getItem('token');
        const authHeader = rawToken
            ? (rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`)
            : null;
        try {
            if (authHeader) {
                await axios.post(
                    `${process.env.REACT_APP_API_URL}/auth/logout`,
                    {},
                    {
                        headers: {
                            Authorization: authHeader,
                            'Content-Type': 'application/json',
                        },
                    }
                );
            }
        } catch (_) {
        } finally {
            localStorage.removeItem('token');
            localStorage.removeItem('id');
            localStorage.removeItem('roleId');
            window.location.href = '/login';
        }
    }

    return (
        <nav className="navbar navbar-dark bg-dark fixed-top navbar-expand-lg">
            <div className="container-fluid">
                <Link className="navbar-brand" to="/dashboard">SistGesSol</Link>

                <button
                    className={`navbar-toggler ${isOpen ? '' : 'collapsed'}`}
                    type="button"
                    aria-controls="navbarNavDropdown"
                    aria-expanded={isOpen}
                    aria-label="Toggle navigation"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className={`collapse navbar-collapse ${isOpen ? 'show' : ''}`} id="navbarNavDropdown">
                    <ul className="navbar-nav ms-auto">
                        {menuLinks.map((item) => (
                            <li className="nav-item" key={item.to}>
                                <Link className="nav-link" to={item.to} onClick={() => setIsOpen(false)}>{item.label}</Link>
                            </li>
                        ))}
                        <li className="nav-item">
                            <a className="nav-link" href="#" onClick={handleLogout}>Cerrar sesión</a>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}