# Backend — SistGesSol (Node.js/Express + MySQL)

API REST para el Sistema de Gestión de Solicitudes. Implementa autenticación JWT, endpoints de usuarios y solicitudes, estadísticas y control de sesión mediante invalidación de tokens.

## Stack
- Node.js + Express
- TypeScript
- TypeORM + MySQL (`mysql2`)
- JWT (`jsonwebtoken`)
- Hash de contraseñas (`bcryptjs`)
- Configuración (`dotenv`)
- Logging (`morgan`)
- CORS (`cors`)

## Estructura relevante
- `src/index.ts`: arranque, lectura de `.env` y comprobación de `JWT_SECRET`.
- `src/app.ts`: configuración de Express, middlewares y rutas.
- `src/database/database.ts`: DataSource de TypeORM (MySQL, BD `sistgesol`).
- `src/init.ts`: carga inicial de roles y estados de solicitud.
- `src/entities/*.ts`: entidades `User`, `Rol`, `UserRol`, `Token`, `Solicitud`, `SolicitudEstado`, `SolicitudHistorialEstado`, `SolicitudRespuesta`.
- `src/migrations/*.ts`: migraciones de esquema.
- `src/middlewares/auth.middleware.ts`: verificación de `Authorization: Bearer <jwt>`.
- `src/controllers/*.ts`: controladores (auth, users, solicitudes).
- `src/routes/*.ts`: rutas de la API.

## Variables de entorno
- Obligatoria: `JWT_SECRET`
- Opcional: `PORT` (por defecto `4000` en `App`)

Ejemplo `.env`:
```bash
JWT_SECRET=define-un-secreto-seguro
PORT=4000
```

Nota BD: la conexión está definida en `src/database/database.ts` con:
- host `localhost`, puerto `3306`
- usuario `root`
- base de datos `sistgesol`
- sin password por defecto (ajusta según tu entorno)

Si requieres usuario/contraseña distintos, edita:
```bash
c:\Users\orjue\OneDrive\Documentos\Santiago\Mis_Cosas\SistGesSol\sistgessol-back\src\database\database.ts
```

## Instalación
```bash
cd c:\Users\orjue\OneDrive\Documentos\Santiago\Mis_Cosas\SistGesSol\sistgessol-back
```

```bash
npm install
```

## Migraciones y datos iniciales
Compilar TS si vas a usar `npm start`:
```bash
npm run build
```

Ejecutar migraciones:
```bash
npm run migration:run
```

Cargar roles y estados de solicitud (se ejecuta al inicializar el DataSource mediante `init.ts`).

## Ejecución
Modo desarrollo (TypeScript con `ts-node` + `nodemon`):
```bash
npm run dev
```

Modo producción (JS compilado):
```bash
npm start
```

La API escucha por defecto en `http://localhost:4000`.

## CORS
Permitido `http://localhost:3000` (frontend). Ajusta en `src/app.ts` si cambias el origen.

## Autenticación y control de sesión
- Login genera JWT firmado con `JWT_SECRET`.
- Middleware `authenticateToken` valida el token y añade `req.userId`.
- Logout invalida el token actual (marca registro en entidad `Token` y evita reutilización).

## Endpoints

Autenticación (`/auth`)
- `POST /auth/login`
  - Body: `{ email, password }`
  - Respuesta `200`: `{ token, user }`
- `POST /auth/logout` (requiere `Authorization` y `id` en query)
  - Query: `?id=<userId>`
  - Respuesta `200`: `{ message: 'Cierre de sesion realizado correctamente' }`

Usuarios (`/users`)
- `POST /users`
  - Body: `{ firstName, lastName, email, phone, password, roleId }`
  - Respuesta `201`: `{ message, user }`
- `GET /users/me` (Auth)
  - Respuesta `200`: `{ user }`
- `PUT /users/me` (Auth)
  - Body: `{ firstName, lastName, phone }`
  - Respuesta `200`: `{ user }`
- `GET /users/:id`
  - Respuesta `200`: `user` (o `{ message: 'Usuario no encontrado' }`)

Solicitudes (`/solicitudes`)
- `GET /solicitudes/mis` (Auth)
  - Query: `page`, `pageSize`, `q` (búsqueda por título/descripcion)
  - Respuesta `200`: `{ data, pagination: { total, page, pageSize } }`
- `GET /solicitudes/estadisticas/mis` (Auth)
  - Respuesta `200`: `{ data: { respondidas, enProceso, sinRespuesta, totalCliente, totalGlobal } }`
- `POST /solicitudes` (Auth)
  - Body: `{ tittle, description, stateCode, comment }`
  - Respuesta `201`: `{ solicitudId, message }`
- `POST /solicitudes/:id/asignar` (Auth)
  - Body: `{ soporteId, estadoCode?, comentario? }`
  - Respuesta `200`: `{ ...result, message }`
- `POST /solicitudes/:id/estado` (Auth)
  - Body: `{ estadoCode: 'EN_PROCESO'|'RESUELTA'|'CERRADA', comentario?, respuestaContenido? }`
  - Respuesta `200`: `{ ...result, message }`
- `POST /solicitudes/:id/cancelar` (Auth)
  - Body: `{ comentario? }`
  - Respuesta `200`: `{ ...result, message }`
- `POST /solicitudes/:id/borrar` (Auth)
  - Respuesta `200`: `{ ...result, message }`

## Ejemplos de uso (PowerShell/Windows)
Login:
```bash
curl -X POST http://localhost:4000/auth/login -H "Content-Type: application/json" -d "{\"email\":\"user@example.com\",\"password\":\"123456\"}"
```

Obtener perfil:
```bash
curl -X GET http://localhost:4000/users/me -H "Authorization: Bearer <TOKEN>"
```

Crear solicitud:
```bash
curl -X POST http://localhost:4000/solicitudes -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d "{\"tittle\":\"Error en app\",\"description\":\"No carga\",\"stateCode\":\"CREADA\",\"comment\":\"Urgente\"}"
```

Cancelar solicitud:
```bash
curl -X POST http://localhost:4000/solicitudes/123/cancelar -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d "{}"
```

Logout:
```bash
curl -X POST "http://localhost:4000/auth/logout?id=123" -H "Authorization: Bearer <TOKEN>"
```

## Seguridad y buenas prácticas
- JWT firmado con `JWT_SECRET`. No usar secretos triviales.
- Passwords con `bcryptjs`.
- Invalidación de tokens en logout para evitar reutilización.
- Validaciones en controladores con respuestas claras y códigos HTTP apropiados.

## Migraciones y entidades
- Migraciones definen tablas para usuarios, roles, tokens, solicitudes, estados de solicitud e historial de estados.
- `init.ts` precarga roles y estados para consistencia del sistema.

## Notas de despliegue
- Ajusta CORS y `REACT_APP_API_URL` según dominio.
- Configura usuario/contraseña/host de MySQL en `database.ts` o cambia a variables de entorno si prefieres.

## Enlaces
- Frontend README: `../sistgessol-front/README.md`

## Soporte (API)
- `GET /solicitudes/soporte?page=&pageSize=&q=&filter=`
  - `filter`: `TODAS|CREADAS|ASIGNADAS_MIAS|EN_PROCESO_MIAS|RESPONDIDAS_MIAS`
- `POST /solicitudes/:id/asignar`
  - Body: `{ soporteId, estadoCode?, comentario? }`
- `POST /solicitudes/:id/estado`
  - Body: `{ estadoCode: 'EN_PROCESO'|'RESUELTA'|'CERRADA', comentario?, respuestaContenido? }`
- `GET /solicitudes/estadisticas/soporte`
  - Respuesta: `{ resueltas, asignadas, enProceso, cerradas, eficienciaRespuesta, totalRespondidasSoporte, totalSolicitudesSistema, totalRespondidasPeers, asignadasMi, asignadasOtros }`

## Admin (API)
- `GET /solicitudes/admin?page=&pageSize=&q=&estado=&soporte=&cliente=&fecha=`
  - Filtra por estado, nombre completo de soporte/cliente y fecha (YYYY-MM-DD)
- `POST /solicitudes/:id/asignar` (asignación por admin)
- `GET /solicitudes/estadisticas/admin`
  - Respuesta: `{ creada, asignada, enProceso, resuelta, cerrada, cancelada, respondidasLunes, respondidasMartes, respondidasMiercoles, respondidasJueves, respondidasViernes }`

### Notas de flujo y estados
- Estados finales: `RESUELTA`, `CERRADA`, `CANCELADA`.
- `CERRADA` requiere respuesta previa (`respuestaId`).
- En estados finales se inhabilitan acciones de asignación/cierre según corresponda.