import { Router } from 'express';
import { createSolicitud } from '../controllers/solicitudes.controller';
import { asyncHandler } from '../middlewares/asyncHandler';
import { authenticateToken } from '../middlewares/auth.middleware';
import { assignSoporteSolicitud, changeEstadoSolicitud, getSolicitudesByUsuario, cancelSolicitud, softDeleteSolicitud, getEstadisticasCliente, getSolicitudesSoporte, getEstadisticasSoporte, getEstadisticasAdmin, getSolicitudesAdmin } from '../controllers/solicitudes.controller';

const router = Router();

router.get('/mis', authenticateToken, asyncHandler(getSolicitudesByUsuario));
router.get('/soporte', authenticateToken, asyncHandler(getSolicitudesSoporte));
router.get('/admin', authenticateToken, asyncHandler(getSolicitudesAdmin));
router.get('/estadisticas/mis', authenticateToken, asyncHandler(getEstadisticasCliente));
router.get('/estadisticas/soporte', authenticateToken, asyncHandler(getEstadisticasSoporte));
router.get('/estadisticas/admin', authenticateToken, asyncHandler(getEstadisticasAdmin));
router.post('/', authenticateToken, asyncHandler(createSolicitud));
router.post('/:id/asignar', authenticateToken, asyncHandler(assignSoporteSolicitud));
router.post('/:id/estado', authenticateToken, asyncHandler(changeEstadoSolicitud));
router.post('/:id/cancelar', authenticateToken, asyncHandler(cancelSolicitud));
router.post('/:id/borrar', authenticateToken, asyncHandler(softDeleteSolicitud));

export default router;