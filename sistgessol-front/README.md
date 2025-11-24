# Frontend — SistGesSol

Interfaz web construida con React para el Sistema de Gestión de Solicitudes. Permite autenticación, creación y seguimiento de solicitudes, gestión de perfil y visualización de estadísticas del cliente.

## Stack y librerías
- React + React Router (rutas): `react`, `react-router-dom`
- HTTP: `axios`
- UI: `bootstrap`, `bootstrap-icons`
- Gráficos: `chart.js`, `react-chartjs-2`
- Paginación: `react-paginate`
- Testing (incluido por CRA): `@testing-library/*`, `jest`

## Estructura relevante
- `src/App.js`: Router y layout base.
- `src/components/Menu.component.js`: Navbar con navegación y cierre de sesión.
- `src/components/CrearSolicitud.component.js`: Modal para crear solicitudes.
- `src/pages/LoginAndRegister.page.js`: Login y registro.
- `src/pages/Solicitudes.page.js`: Listado paginado, búsqueda, detalle, cancelar/borrar.
- `src/pages/Perfil.page.js`: Perfil del usuario, edición de datos y cierre de sesión.
- `src/pages/Dashboard.page.js`: Gráficos de estadísticas del cliente.
- `src/services/search.service.js`: Servicio simple para difundir texto de búsqueda entre componentes.
- `src/styles/*.css`: Estilos (incluye ajustes para breadcrumb en mobile y layout oscuro).

## Autenticación
- Login: guarda el JWT en `localStorage` como `token`.  
- Formato de envío: header `Authorization: Bearer <token>`.
- Logout: `POST /auth/logout` y luego limpieza de `localStorage` y redirección a `/login`.

## Variables de entorno
- Archivo: `.env`
- `REACT_APP_API_URL`: URL base de la API (por defecto `http://localhost:4000`).

Ejemplo:
```bash
REACT_APP_API_URL = http://localhost:4000
```

## Instalación
```bash
cd c:\Users\orjue\OneDrive\Documentos\Santiago\Mis_Cosas\SistGesSol\sistgessol-front
```

```bash
npm install
```

## Ejecución
```bash
npm start
```

Abre `http://localhost:3000`.

## Funcionalidades por pantallas
- Login/Registro:
  - `POST /auth/login` y `POST /users` para alta de usuario.
- Solicitudes:
  - Lista paginada con búsqueda (cliente).
  - Ver detalle modal.
  - Cancelar solicitud: `POST /solicitudes/:id/cancelar`.
  - Soft delete de canceladas: `POST /solicitudes/:id/borrar`.
  - Crear solicitud: `POST /solicitudes`.
- Perfil:
  - Ver datos y editar nombres/teléfono: `GET/PUT /users/me`.
  - Cerrar sesión: `POST /auth/logout`.
- Dashboard:
  - Estadísticas del cliente: `GET /solicitudes/estadisticas/mis`.

## Navegación y breadcrumb
- Se muestra breadcrumb superior consistente (ej. “Dashboard > Perfil” o “Dashboard > Mis solicitudes”).
- Ajustado para ser visible en mobile, minimizando padding/margins del contenedor superior.

## Consideraciones de UX
- Tema oscuro consistente.
- Botones con iconos de Bootstrap (ej. lápiz para editar).
- Paginación accesible y búsqueda inmediata.

## Errores comunes y soluciones
- “401 No autenticado”: revisa el `token` en `localStorage` y que el header `Authorization` se envíe correctamente.
- API inaccesible: confirma que el backend corre en `http://localhost:4000` y el CORS permite `http://localhost:3000`.
- Búsqueda no actualiza: el servicio `search.service` difunde el texto y reinicia página a 1.

## Enlaces
- Backend README: `../sistgessol-back/README.md`

## Cliente (UI)
- Mis solicitudes: listado paginado con búsqueda y detalle modal.
- Acciones: crear solicitud, cancelar solicitud (no disponible en estados finales), eliminar (soft delete) solo en canceladas.
- Dashboard cliente: pie (respondidas, en proceso, sin respuesta) y barras comparativas (mis solicitudes vs total del sistema).

## Soporte (UI)
- Listado con filtros: `TODAS`, `CREADAS`, `ASIGNADAS_MIAS`, `EN_PROCESO_MIAS`, `RESPONDIDAS_MIAS`.
- Acciones: asignarse, poner en proceso, responder (modal), cerrar (cuando hay respuesta).
- Dashboard de soporte: pie (resueltas/asignadas/en proceso/cerradas), barras comparativas y pie de asignaciones.

## Admin (UI)
- Listado global con filtros de `estado`, `soporte`, `cliente`, `fecha` (dropdowns con scroll y calendario).
- Asignar soporte: modal con selección de soporte; en estados `RESUELTA` y `CERRADA` se inhabilita asignar.
- Dashboard admin: gráficos de estados globales (pie), respondidas por días (barras L-V), y canceladas vs resueltas vs cerradas (barras).
- Gestor de Usuarios: buscador a la izquierda, filtro “Tipo de Usuario” al lado y botón compacto “Crear Usuario” a la derecha; modales de crear/actualizar y ver usuario en tema oscuro.