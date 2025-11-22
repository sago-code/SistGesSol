import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';


interface AuthenticatedRequest extends Request {
    userId?: number;
}

const authService = new AuthService();


//controlador para login
export const login = async (req: Request, res: Response): Promise<Response> => {
    const { email, password } = req.body;

    try {
        const { token, user } = await authService.login(email, password);
        return res.status(200).json({ token, user });
    } catch (error) {
        return res.status(401).json({ message: 'Correo o contraseña invalidos' });
    }
};

export const logout = async (req: AuthenticatedRequest, res: Response): Promise<Response> => {
    const userId = parseInt(req.query.id as string);
    const token = req.headers.authorization?.split(' ')[1];

    if (!userId) {
        return res.status(400).json({ message: 'ID de Usuario es requerido' });
    }

    if (userId == 0) {
        return res.status(400).json({ message: 'ID de Usuario invalido' });
    } 

    if (req.userId !== userId) {
        return res.status(403).json({ message: 'Este usuario no tiene sesion activa' });
    }

    if (!token) {
        return res.status(400).json({ message: 'El token es requerido' });
    }

    try {
        await authService.logout(userId, token);
        return res.status(200).json({ message: 'Cierre de sesion realizado correctamente' });
    } catch (error) {
        return res.status(401).json({ message: 'Token invalido' });
    }
};
