import { Router } from 'express';
import { createSolicitud } from '../controllers/solicitudes.controller';
import { asyncHandler } from '../middlewares/asyncHandler';
import { authenticateToken } from '../middlewares/auth.middleware';
import { assignSoporteSolicitud, changeEstadoSolicitud, getSolicitudesByUsuario, cancelSolicitud, softDeleteSolicitud, getEstadisticasCliente, getSolicitudesSoporte, getEstadisticasSoporte } from '../controllers/solicitudes.controller';

const router = Router();

router.get('/mis', authenticateToken, asyncHandler(getSolicitudesByUsuario));
router.get('/soporte', authenticateToken, asyncHandler(getSolicitudesSoporte));
router.get('/estadisticas/mis', authenticateToken, asyncHandler(getEstadisticasCliente));
router.get('/estadisticas/soporte', authenticateToken, asyncHandler(getEstadisticasSoporte));
router.post('/', authenticateToken, asyncHandler(createSolicitud));
router.post('/:id/asignar', authenticateToken, asyncHandler(assignSoporteSolicitud));
router.post('/:id/estado', authenticateToken, asyncHandler(changeEstadoSolicitud));
router.post('/:id/cancelar', authenticateToken, asyncHandler(cancelSolicitud));
router.post('/:id/borrar', authenticateToken, asyncHandler(softDeleteSolicitud));

export default router;