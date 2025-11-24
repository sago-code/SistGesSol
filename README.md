# SistGesSol — Sistema de Gestión de Solicitudes

SistGesSol es una aplicación web que permite a usuarios crear y gestionar solicitudes, y a soporte/administración dar seguimiento, responder y cerrar casos. El proyecto está dividido en dos partes:
- Frontend (React): interfaz web para autenticación, creación y seguimiento de solicitudes.
- Backend (Node.js/Express + MySQL): API REST con autenticación JWT, servicios y persistencia.

## Características
- Autenticación con JWT (login y cierre de sesión).
- Gestión de perfil del usuario (ver y actualizar datos).
- Creación de solicitudes; listado paginado y búsqueda.
- Acciones del cliente: ver detalle, cancelar solicitud y eliminación lógica de canceladas.
- Dashboard con estadísticas del cliente (respondidas, en proceso, sin respuesta y comparativa con total del sistema).
- Gestión de usuarios (admin) con filtros, búsqueda y creación/actualización.

## Tecnologías
- Frontend: React, React Router, Axios, Bootstrap/Bootstrap Icons, Chart.js, React Chart.js 2, React Paginate.
- Backend: Node.js, Express, TypeScript, TypeORM, MySQL, JWT, bcrypt, dotenv, morgan, cors.

## Documentación detallada
- Frontend: [sistgessol-front/README.md](sistgessol-front/README.md)
- Backend: [sistgessol-back/README.md](sistgessol-back/README.md)

También puedes abrir directamente:
- Frontend: `c:\Users\orjue\OneDrive\Documentos\Santiago\Mis_Cosas\SistGesSol\sistgessol-front\README.md`
- Backend: `c:\Users\orjue\OneDrive\Documentos\Santiago\Mis_Cosas\SistGesSol\sistgessol-back\README.md`

## Cómo ejecutar (resumen)
1) Backend API (puerto 4000 por defecto)
   - Instala dependencias
   - Crea BD MySQL `sistgesol` (usuario `root`) o importala de `sistgesol-back/src/database/sistgesol.sql`
   - Define `JWT_SECRET` en `.env`
   - Corre migraciones y arranca en modo dev

2) Frontend (puerto 3000)
   - Instala dependencias
   - Configura `REACT_APP_API_URL` en `.env` (por defecto `http://localhost:4000`)
   - Arranca la app

Sigue las instrucciones detalladas en los README de cada parte.