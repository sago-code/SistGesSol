import './App.css';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LoginAndRegister } from './pages/LoginAndRegister.page';
import { Dashboard } from './pages/Dashboard.page';
import { Menu } from './components/Menu.component';
import { Solicitudes } from './pages/Solicitudes.page';
import { Perfil } from './pages/Perfil.page';
import { GestorUsuarios } from './pages/GestorUsuarios.page';

function RedirectLoggedIn({ children }) {
  const token = localStorage.getItem('token');
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function RequireAuth({ children }) {
  const token = localStorage.getItem('token');
  const location = useLocation();
  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

function ProtectedLayout({ children }) {
  return (
    <div className="containerAll">
      <Menu />
      {children}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <RedirectLoggedIn>
              <LoginAndRegister />
            </RedirectLoggedIn>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <ProtectedLayout>
                <Dashboard />
              </ProtectedLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/solicitudes"
          element={
            <RequireAuth>
              <ProtectedLayout>
                <Solicitudes />
              </ProtectedLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/perfil"
          element={
            <RequireAuth>
              <ProtectedLayout>
                <Perfil />
              </ProtectedLayout>
            </RequireAuth>
          }
        />
        <Route
          path="/gestor-usuarios"
          element={
            <RequireAuth>
              <ProtectedLayout>
                <GestorUsuarios />
              </ProtectedLayout>
            </RequireAuth>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
