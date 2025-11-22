import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Database } from '../database/database';
import { Token } from '../entities/token.entity';
import { IsNull } from 'typeorm';

interface AuthenticatedRequest extends Request {
    userId?: number;
    roleId?: number;
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        res.status(401).json({ message: 'El token hace falta o es invalido' });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development-secret') as jwt.JwtPayload;
        const tokenRepository = Database.getRepository(Token);
        const tokenEntity = await tokenRepository.findOne({ where: { token, deletedAt: IsNull() } });
        
        if (!tokenEntity) {
            res.status(403).json({ message: 'Token invalido o expirado' });
            return;
        }

        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(403).json({ message: 'Token invalido' });
        return;
    }
}
