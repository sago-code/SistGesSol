import { Router } from 'express';
import { login, logout } from '../controllers/auth.controller';
import { asyncHandler } from '../middlewares/asyncHandler';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

//ruta para login
router.post('/login', asyncHandler(login));
router.post('/logout', authenticateToken, asyncHandler(logout));

export default router;
