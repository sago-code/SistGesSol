import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

interface AuthenticatedRequest extends Request {
    userId?: number;
}

export const createUser = async (req: Request, res: Response): Promise<Response> => {
    const { firstName, lastName, email, phone, password, roleId } = req.body;

    try {
        const user = await new UserService().createUser(firstName, lastName, email, phone, password, roleId);
        return res.status(201).json({ message: 'Usuario creado correctamente', user });
    } catch (error: any) {
        const message = error?.message || 'Error al crear usuario';
        const isSignal45000 = error?.sqlState === '45000' || error?.code === 'ER_SIGNAL_EXCEPTION';
        const isDuplicateKey = error?.code === 'ER_DUP_ENTRY';
        const isValidationMessage = /contraseña|ya registrado|no funciona|requerido|inválido|invalido/i.test(message);

        const status = (isSignal45000 || isDuplicateKey || isValidationMessage) ? 400 : 500;
        return res.status(status).json({ message });
    }
}

export const getUserById = async (req: Request, res: Response): Promise<Response> => {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id) || id <= 0) {
        return res.status(400).json({ message: 'ID de usuario inválido' });
    }

    try {
        const user = await new UserService().getUserById(id);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        return res.status(200).json(user);
    } catch (error: any) {
        const message = error?.message || 'Error al obtener usuario';
        return res.status(500).json({ message });
    }
}

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
    }
    try {
        res.set('Cache-Control', 'no-store');
        const user = await new UserService().getUserById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        return res.status(200).json({ user });
    } catch (error: any) {
        const message = error?.message || 'Error al obtener perfil';
        return res.status(500).json({ message });
    }
}

export const listUsers = async (req: Request, res: Response): Promise<Response> => {
    const roleId = parseInt(req.query.role as string);
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const limit = Math.max(1, Math.min(200, parseInt(req.query.limit as string) || 50));
    const offset = Math.max(0, parseInt(req.query.offset as string) || 0);
    if (!roleId || Number.isNaN(roleId)) {
        return res.status(400).json({ message: 'Parámetro role inválido' });
    }
    try {
        const rows = await new UserService().listUsersByRole(roleId, search, limit, offset);
        return res.status(200).json({ data: rows });
    } catch (error: any) {
        const message = error?.message || 'Error al listar usuarios';
        return res.status(500).json({ message });
    }
}

export const updateMe = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
    }
    const { firstName, lastName, phone } = req.body || {};
    try {
        res.set('Cache-Control', 'no-store');
        const user = await new UserService().updateUser(userId, { firstName, lastName, phone });
        return res.status(200).json({ user });
    } catch (error: any) {
        const message = error?.message || 'Error al actualizar perfil';
        const status = error?.code === 'ER_DUP_ENTRY' ? 400 : 500;
        return res.status(status).json({ message });
    }
}

export const updateMyPassword = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    const userId = req.userId;
    if (!userId) {
        return res.status(401).json({ message: 'No autenticado' });
    }
    const { currentPassword, newPassword } = req.body || {};
    try {
        res.set('Cache-Control', 'no-store');
        await new UserService().changePassword(userId, currentPassword, newPassword);
        return res.status(200).json({ message: 'Contraseña actualizada correctamente' });
    } catch (error: any) {
        const message = error?.message || 'Error al actualizar contraseña';
        const status = /incorrecta|requerida|debe/i.test(message) ? 400 : 500;
        return res.status(status).json({ message });
    }
}

export const updateUserByAdmin = async (req: Request, res: Response): Promise<Response> => {
    const id = Number(req.params.id);
    if (!id || Number.isNaN(id) || id <= 0) {
        return res.status(400).json({ message: 'ID de usuario inválido' });
    }
    const { firstName, lastName, phone, roleId } = req.body || {};
    try {
        const user = await new UserService().adminUpdateUser(id, { firstName, lastName, phone, roleId });
        return res.status(200).json({ user });
    } catch (error: any) {
        const message = error?.message || 'Error al actualizar usuario';
        const status = error?.code === 'ER_DUP_ENTRY' ? 400 : 500;
        return res.status(status).json({ message });
    }
}