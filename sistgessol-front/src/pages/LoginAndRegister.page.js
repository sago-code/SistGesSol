import React, { Fragment, useState } from "react";
import '../styles/LoginAndRegister.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export function LoginAndRegister() {
    const [active, setActive] = useState(false);
    const [user, setUser] = useState({
        email: '',
        password: ''
    });
    
    const [registerData, setRegisterData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: 0,
        password: '',
        roleId: 3
    });
    const [loginMessage, setLoginMessage] = useState('');
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const navigate = useNavigate();

    const login = async (e) => {
        e.preventDefault();
        setLoginMessage('');
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, user);
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('id', response.data.user.id);
            localStorage.setItem("roleId", response.data.user.roleId);
            navigate('/dashboard', { replace: true });
        } catch (error) {
            if (error.response?.status === 401) {
                setLoginMessage('Correo o contraseña incorrectos');
            } else {
                setLoginMessage('Error en el inicio de sesión');
            }
        }
    }

    const register = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/users`, registerData);
            alert('Usuario creado correctamente, iniciando sesión...');

            const loginRes = await axios.post(`${process.env.REACT_APP_API_URL}/auth/login`, {
                email: res.data.user.email,
                password: registerData.password
            });

            localStorage.setItem('token', loginRes.data.token);
            localStorage.setItem('id', loginRes.data.user.id);
            localStorage.setItem('roleId', loginRes.data.user.roleId);
            navigate('/dashboard', { replace: true });
        } catch (error) {
            const msg = error.response?.data?.message || 'Error al registrarse';
            alert(msg); // mantiene alert pero sin recargar
        }
    };

    const handleChangeLogin = (e) => {
        setUser({
            ...user,
            [e.target.name]: e.target.value
        });
    }

    const handleChangeRegister = (e) => {
        setRegisterData({
            ...registerData,
            [e.target.name]: e.target.value
        });
    }

    return (
        <Fragment>
            <div className={`container ${active ? 'active' : ''} auth-container`}>
                <div className="curved-shape"></div>
                <div className="curved-shape2"></div>

                {/* Formulario de Login */}
                <div className="form-box Login">
                    <h2 className="animation" style={{ '--D': 0, '--S': 21 }}>Inicio de Sesión</h2>
                    <form onSubmit={login} id='formLogin'>
                        <div className="input-box animation" style={{ '--D': 1, '--S': 22 }}>
                            <input name="email" onChange={handleChangeLogin} id="login_username" type="text" required />
                            <label htmlFor="login_username">Correo</label>
                            <box-icon type='solid' name='user' color="gray"></box-icon>
                        </div>

                        <div className="input-box animation" style={{ '--D': 2, '--S': 23 }}>
                            <input
                                name="password"
                                onChange={handleChangeLogin}
                                id="login_password"
                                type={showLoginPassword ? 'text' : 'password'}
                                required
                            />
                            <label htmlFor="login_password">Contraseña</label>
                            <box-icon name='lock-alt' type='solid' color="gray"></box-icon>
                            <i
                                className={`bi ${showLoginPassword ? 'bi-eye-fill' : 'bi-eye-slash-fill'} toggle-password ${showLoginPassword ? 'is-visible' : ''}`}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setShowLoginPassword(!showLoginPassword)}
                                role="button"
                                tabIndex={0}
                            ></i>
                        </div>

                        <div className="input-box animation" style={{ '--D': 3, '--S': 24 }}>
                            <button className="btn" type="submit">Iniciar Sesión</button>
                        </div>

                        <div className="regi-link animation" style={{ '--D': 4, '--S': 25 }}>
                            <p>¿No tienes una cuenta? <br />
                                <button type="button" className="link-btn SignUpLink" onClick={() => setActive(true)}>Registrate</button>
                            </p>
                        </div>
                        <div className="form-message" aria-live="polite">{loginMessage}</div>
                    </form>
                </div>
                {/* Mensaje de Bienvenida login */}
                <div className="info-content Login">
                    <h2 className="animation bienvenida-login" style={{ '--D': 0, '--S': 20 }}>¡BIENVENIDO DE NUEVO!</h2>
                    <p className="animation" style={{ '--D': 1, '--S': 21 }}>Nos alegra tenerte de nuevo con nosotros. Si necesitas algo, estamos aquí para ayudarte.</p>
                </div>
                {/* Formulario de Registro */}
                <div className="form-box Register">
                    <h2 className="animation" style={{ '--li': 17, '--S': 0 }}>Registro</h2>
                    <form onSubmit={register} id='formRegister'>
                        <div className="input-box animation" style={{ '--li': 18, '--S': 1 }}>
                            <input name="firstName" onChange={handleChangeRegister} id="register_username" type="text" required />
                            <label htmlFor="register_username">Nombres</label>
                            <box-icon type='solid' name='user' color="gray"></box-icon>
                        </div>

                        <div className="input-box animation" style={{ '--li': 18, '--S': 1 }}>
                            <input name="lastName" onChange={handleChangeRegister} id="register_username" type="text" required />
                            <label htmlFor="register_username">Apellidos</label>
                            <box-icon type='solid' name='user' color="gray"></box-icon>
                        </div>

                        <div className="input-box animation" style={{ '--li': 19, '--S': 2 }}>
                            <input name="email" onChange={handleChangeRegister} id="register_email" type="email" required />
                            <label htmlFor="register_email">Email</label>
                            <box-icon name='envelope' type='solid' color="gray"></box-icon>
                        </div>

                        <div className="input-box animation" style={{ '--li': 19, '--S': 2 }}>
                            <input name="phone" onChange={handleChangeRegister} id="register_phone" type="number" required />
                            <label htmlFor="register_phone">Teléfono</label>
                            <box-icon name='phone' type='solid' color="gray"></box-icon>
                        </div>

                        <div className="input-box animation" style={{ '--li': 19, '--S': 3 }}>
                            <input
                                name="password"
                                value={registerData.password}
                                onChange={handleChangeRegister}
                                id="register_password"
                                type={showRegisterPassword ? 'text' : 'password'}
                                required
                                minLength={8}
                            />
                            <label htmlFor="register_password">Contraseña</label>
                            <box-icon name='lock-alt' type='solid' color="gray"></box-icon>
                            <i
                                className={`bi ${showRegisterPassword ? 'bi-eye-fill' : 'bi-eye-slash-fill'} toggle-password ${showRegisterPassword ? 'is-visible' : ''}`}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                role="button"
                                tabIndex={0}
                            ></i>
                        </div>

                        <div className="input-box animation" style={{ '--li': 20, '--S': 4 }}>
                            <button className="btn" type="submit">Registrarse</button>
                        </div>

                        <div className="regi-link animation" style={{ '--li': 21, '--S': 5 }}>
                            <p>¿Ya tienes una cuenta? <br />
                                <button type="button" className="link-btn SignInLink" onClick={() => setActive(false)}>Iniciar Sesión</button>
                            </p>
                        </div>
                    </form>
                </div>
                {/* Mensaje de Bienvenida registro */}
                <div className="info-content Register">
                    <h2 className="animation" style={{ '--li': 17, '--S': 0 }}>¡BIENVENIDO!</h2>
                    <p className="animation" style={{ '--li': 18, '--S': 1 }}>Nos complace tenerte aquí. Si necesitas ayuda, no dudes en contactarnos.</p>
                </div>
            </div>
        </Fragment>
    );
}