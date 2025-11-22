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
    const [stats, setStats] = useState({
        respondidas: 0,
        enProceso: 0,
        sinRespuesta: 0,
        totalCliente: 0,
        totalGlobal: 0,
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

            const res = await axios.get(`${process.env.REACT_APP_API_URL}/solicitudes/estadisticas/mis`, config);
            const data = res.data?.data || res.data;
            setStats({
                respondidas: Number(data.respondidas || 0),
                enProceso: Number(data.enProceso || 0),
                sinRespuesta: Number(data.sinRespuesta || 0),
                totalCliente: Number(data.totalCliente || 0),
                totalGlobal: Number(data.totalGlobal || 0),
            });
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

    const pieData = {
        labels: ['Respondidas', 'En proceso', 'Sin respuesta'],
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
            title: { display: true, text: 'Estado de respuestas de soporte', color: '#ffffff' },
        },
    };

    const barData = {
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
            title: { display: true, text: 'Comparativa de solicitudes', color: '#ffffff' },
        },
        scales: {
            x: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255,255,255,0.1)' } },
            y: { ticks: { color: '#ffffff' }, grid: { color: 'rgba(255,255,255,0.1)' }, beginAtZero: true },
        },
    };

    return (
        <Fragment>
            <h1>Estadísticas sobre mis solicitudes</h1>
            <div className="container mt-3">
                {error && <div className="alert alert-danger">{error}</div>}
                {loading ? (
                    <div className="text-white">Cargando estadísticas...</div>
                ) : (
                    <div className="row">
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
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Fragment>
    )
}