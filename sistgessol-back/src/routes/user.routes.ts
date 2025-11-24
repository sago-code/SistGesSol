import { Router } from 'express';
import { createUser, getUserById, getMe, updateMe, updateMyPassword } from '../controllers/user.controller';
import { asyncHandler } from '../middlewares/asyncHandler';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

// Ruta para crear un usuario
router.post('/', asyncHandler(createUser));

// Listado por rol
router.get('/', asyncHandler(require('../controllers/user.controller').listUsers));
router.put('/:id', authenticateToken, asyncHandler(require('../controllers/user.controller').updateUserByAdmin));

// Primero las rutas específicas:
router.get('/me', authenticateToken, asyncHandler(getMe));
router.put('/me', authenticateToken, asyncHandler(updateMe));
router.put('/me/password', authenticateToken, asyncHandler(updateMyPassword));

// Luego la genérica por ID (una sola vez):
router.get('/:id', asyncHandler(getUserById));

export default router;