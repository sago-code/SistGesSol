import { Fragment, useEffect, useState } from 'react';
import '../styles/Dashboard.css';
import axios from 'axios';
import { Pie, Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

export function Dashboard() {
    const roleId = Number(localStorage.getItem('roleId') || 0);
    const [stats, setStats] = useState({
        respondidas: 0,
        enProceso: 0,
        sinRespuesta: 0,
        totalCliente: 0,
        totalGlobal: 0,
        resueltas: 0,
        asignadas: 0,
        cerradas: 0,
        eficienciaRespuesta: 0,
        totalRespondidasSoporte: 0,
        totalSolicitudesSistema: 0,
        totalRespondidasPeers: 0,
        asignadasMi: 0,
        asignadasOtros: 0,
        creada: 0,
        asignada: 0,
        resuelta: 0,
        cancelada: 0,
        respondidasLunes: 0,
        respondidasMartes: 0,
        respondidasMiercoles: 0,
        respondidasJueves: 0,
        respondidasViernes: 0,
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const fetchStats = async () => {
        setLoading(true);
        setError('');
        try {
            const rawToken = localStorage.getItem('token');
            const authHeader = rawToken
                ? (rawToken.startsWith('Bearer ') ? rawToken : `Bearer ${rawToken}`)
                : null;
            const config = authHeader ? { headers: { Authorization: authHeader } } : undefined;

            const endpoint = roleId === 1
                ? `${process.env.REACT_APP_API_URL}/solicitudes/estadisticas/admin`
                : roleId === 2
                    ? `${process.env.REACT_APP_API_URL}/solicitudes/estadisticas/soporte`
                    : `${process.env.REACT_APP_API_URL}/solicitudes/estadisticas/mis`;
            const res = await axios.get(endpoint, config);
            const data = res.data?.data || res.data;
            setStats(prev => ({ ...prev, ...Object.keys(prev).reduce((acc, k) => ({ ...acc, [k]: Number(data[k] ?? prev[k] ?? 0) }), {}) }));
        } catch (e) {
            const msg = e?.response?.data?.message || e?.response?.data?.error || e?.message || 'Error al cargar estadísticas';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const totalSoporteEstado = (stats.resueltas + stats.asignadas + stats.enProceso + stats.cerradas) || 0;
    const totalClienteEstado = (stats.respondidas + stats.enProceso + stats.sinRespuesta) || 0;
    const pct = (v, t) => t > 0 ? `${((v / t) * 100).toFixed(1)}%` : '0%';

    const pieData = roleId === 2 ? {
        labels: [
            `Resueltas (${pct(stats.resueltas, totalSoporteEstado)})`,
            `Asignadas (${pct(stats.asignadas, totalSoporteEstado)})`,
            `En proceso (${pct(stats.enProceso, totalSoporteEstado)})`,
            `Cerradas (${pct(stats.cerradas, totalSoporteEstado)})`,
        ],
        datasets: [{
            data: [stats.resueltas, stats.asignadas, stats.enProceso, stats.cerradas],
            backgroundColor: ['#28a745', '#17a2b8', '#ffc107', '#6c757d'],
            borderColor: ['#1f7a35', '#117a8b', '#d39e00', '#5a6268'],
            borderWidth: 1,
        }],
    } : {
        labels: [
            `Respondidas (${pct(stats.respondidas, totalClienteEstado)})`,
            `En proceso (${pct(stats.enProceso, totalClienteEstado)})`,
            `Sin respuesta (${pct(stats.sinRespuesta, totalClienteEstado)})`,
        ],
        datasets: [{
            data: [stats.respondidas, stats.enProceso, stats.sinRespuesta],
            backgroundColor: ['#28a745', '#ffc107', '#6c757d'],
            borderColor: ['#1f7a35', '#d39e00', '#5a6268'],
            borderWidth: 1,
        }],
    };

    const pieOptions = {
        plugins: {
            legend: { labels: { color: '#ffffff' } },
            title: { display: true, text: roleId === 2 ? 'Estado de mis solicitudes de soporte' : 'Estado de respuestas de soporte', color: '#ffffff' },
            tooltip: {
                callbacks: {
                    label: (ctx) => {
                        const val = ctx.parsed;
                        const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                        const p = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
                        return `${ctx.label}: ${val} (${p}%)`;
                    },
                },
            },
        },
    };

    const barData = roleId === 2 ? {
        labels: ['Respondidas por mí', 'Total sistema', 'Respondidas por compañeros'],
        datasets: [{
            label: 'Cantidad',
            data: [stats.totalRespondidasSoporte, stats.totalSolicitudesSistema, stats.totalRespondidasPeers],
            backgroundColor: ['#28a745', '#17a2b8', '#6f42c1'],
        }],
    } : {
        labels: ['Mis solicitudes', 'Total del sistema'],
        datasets: [{
            label: 'Cantidad',
            data: [stats.totalCliente, stats.totalGlobal],
            backgroundColor: ['#17a2b8', '#28a745'],
        }],
    };

    const barOptions = {
        plugins: {
            legend: { labels: { color: '#ffffff' } },
            title: { display: true, text: roleId === 2 ? 'Respondidas vs sistema' : 'Comparativa de solicitudes', color: '#ffffff' },
            tooltip: {
                callbacks: {
                    label: (ctx) => {
                        const val = ctx.parsed.y ?? ctx.parsed;
                        const total = roleId === 2 ? stats.totalSolicitudesSistema : ctx.dataset.data.reduce((a, b) => a + b, 0);
                        const p = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
                        return `${ctx.dataset.label}: ${val} (${p}%)`;
                    },
                },
            },
        },
        scales: {
            x: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255,255,255,0.1)' } },
            y: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255,255,255,0.1)' }, beginAtZero: true },
        },
    };

    return (
        <Fragment>
            <h1 className="mt-6 mb-4">{roleId === 2 ? 'Estadísticas de mis soportes' : roleId === 1 ? 'Dashboard de Admin' : 'Estadísticas sobre mis solicitudes'}</h1>
            <div className="container mt-3">
                {error && <div className="alert alert-danger">{error}</div>}
                {loading ? (
                    <div className="text-white">Cargando estadísticas...</div>
                ) : (
                    <div className="row">
                        {roleId === 1 ? (
                            <Fragment>
                                <div className="col-md-6 mb-4">
                                    <div className="card bg-dark text-white border-secondary">
                                        <div className="card-body">
                                            <Pie
                                                data={{
                                                    labels: ['CREADA', 'ASIGNADA', 'EN_PROCESO', 'RESUELTA', 'CERRADA', 'CANCELADA'],
                                                    datasets: [{
                                                        data: [stats.creada, stats.asignada, stats.enProceso, stats.resuelta, stats.cerrada, stats.cancelada],
                                                        backgroundColor: ['#6c757d', '#17a2b8', '#ffc107', '#28a745', '#6610f2', '#dc3545'],
                                                        borderColor: ['#5a6268', '#117a8b', '#d39e00', '#1f7a35', '#520dc2', '#c82333'],
                                                        borderWidth: 1,
                                                    }],
                                                }}
                                                options={{
                                                    plugins: {
                                                        legend: { labels: { color: '#ffffff' } },
                                                        title: { display: true, text: 'Estados globales de solicitudes', color: '#ffffff' },
                                                    },
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6 mb-4">
                                    <div className="card bg-dark text-white border-secondary">
                                        <div className="card-body">
                                            <Bar
                                                data={{
                                                    labels: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'],
                                                    datasets: [{
                                                        label: 'Respondidas semana',
                                                        data: [stats.respondidasLunes, stats.respondidasMartes, stats.respondidasMiercoles, stats.respondidasJueves, stats.respondidasViernes],
                                                        backgroundColor: '#17a2b8',
                                                    }],
                                                }}
                                                options={barOptions}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6 mb-4">
                                    <div className="card bg-dark text-white border-secondary">
                                        <div className="card-body">
                                            <Bar
                                                data={{
                                                    labels: ['Canceladas', 'Resueltas', 'Cerradas'],
                                                    datasets: [{
                                                        label: 'Cantidad',
                                                        data: [stats.cancelada, stats.resuelta, stats.cerrada],
                                                        backgroundColor: ['#dc3545', '#28a745', '#6610f2'],
                                                    }],
                                                }}
                                                options={barOptions}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </Fragment>
                        ) : (
                            <Fragment>
                                <div className="col-md-6 mb-4">
                                    <div className="card bg-dark text-white border-secondary">
                                        <div className="card-body">
                                            <Pie data={pieData} options={pieOptions} />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6 mb-4">
                                    <div className="card bg-dark text-white border-secondary">
                                        <div className="card-body">
                                            <Bar data={barData} options={barOptions} />
                                            {roleId === 2 && (
                                                <div className="mt-2 text-muted">Eficiencia de respuesta: {pct(stats.totalRespondidasSoporte, stats.asignadas)}</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {roleId === 2 && (
                                    <div className="col-md-6 mb-4">
                                        <div className="card bg-dark text-white border-secondary">
                                            <div className="card-body">
                                                <Pie
                                                    data={{
                                                        labels: [
                                                            `Asignadas a mí (${pct(stats.asignadasMi, stats.asignadasMi + stats.asignadasOtros)})`,
                                                            `Asignadas a otros (${pct(stats.asignadasOtros, stats.asignadasMi + stats.asignadasOtros)})`,
                                                        ],
                                                        datasets: [{
                                                            data: [stats.asignadasMi, stats.asignadasOtros],
                                                            backgroundColor: ['#17a2b8', '#6f42c1'],
                                                        }],
                                                    }}
                                                    options={{
                                                        plugins: {
                                                            legend: { labels: { color: '#ffffff' } },
                                                            title: { display: true, text: 'Distribución de asignaciones', color: '#ffffff' },
                                                            tooltip: {
                                                                callbacks: {
                                                                    label: (ctx) => {
                                                                        const val = ctx.parsed;
                                                                        const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                                                                        const p = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
                                                                        return `${ctx.label}: ${val} (${p}%)`;
                                                                    },
                                                                },
                                                            },
                                                        },
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Fragment>
                        )}
                    </div>
                )}
            </div>
        </Fragment>
    )
}