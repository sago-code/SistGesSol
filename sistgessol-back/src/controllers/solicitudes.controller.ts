import { Request, Response } from 'express';
import { solicitudesService } from '../services/solicitudes.service';

export const createSolicitud = async (req: Request, res: Response) => {
    const { tittle, description, stateCode, comment } = req.body;
    const userId = (req as any).userId;
    try {
        const solicitudId = await solicitudesService.createSolicitud(
            userId,
            tittle,
            description,
            stateCode,
            userId,
            comment,
        );
        res.status(201).json({ solicitudId, message: 'Solicitud creada exitosamente' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export const assignSoporteSolicitud = async (req: Request, res: Response) => {
    const solicitudId = Number(req.params.id);
    const userId = (req as any).userId;
    const { soporteId, estadoCode, comentario } = req.body;

    if (!solicitudId || Number.isNaN(solicitudId)) {
        return res.status(400).json({ error: 'Parámetro id de solicitud inválido' });
    }
    if (!soporteId || Number.isNaN(Number(soporteId))) {
        return res.status(400).json({ error: 'Debe proporcionar soporteId válido' });
    }

    try {
        const result = await solicitudesService.assignSoporteSolicitud(
            solicitudId,
            Number(soporteId),
            userId,
            comentario ?? null,
            estadoCode ?? null
        );
        res.status(200).json({ ...result, message: 'Solicitud asignada exitosamente' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const changeEstadoSolicitud = async (req: Request, res: Response) => {
    const solicitudId = Number(req.params.id);
    const userId = (req as any).userId;
    const { estadoCode, comentario, respuestaContenido } = req.body;

    if (!solicitudId || Number.isNaN(solicitudId)) {
        return res.status(400).json({ error: 'Parámetro id de solicitud inválido' });
    }
    if (!estadoCode || typeof estadoCode !== 'string') {
        return res.status(400).json({ error: 'Debe proporcionar estadoCode' });
    }

    const allowed = ['EN_PROCESO', 'RESUELTA', 'CERRADA'] as const;
    type EstadoUnion = typeof allowed[number];
    const isEstadoUnion = (v: string): v is EstadoUnion => allowed.includes(v as EstadoUnion);

    if (!isEstadoUnion(estadoCode)) {
        return res.status(400).json({ error: 'estadoCode debe ser EN_PROCESO, RESUELTA o CERRADA' });
    }

    try {
        const result = await solicitudesService.changeEstadoSolicitud(
            solicitudId,
            estadoCode as EstadoUnion,
            userId,
            comentario ?? null,
            respuestaContenido ?? null
        );
        res.status(200).json({ ...result, message: 'Estado actualizado exitosamente' });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
}

export const getSolicitudesByUsuario = async (req: Request, res: Response) => {
    const userId = (req as any).userId;

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(req.query.pageSize as string) || 10));
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;

    try {
        const { rows, total } = await solicitudesService.getSolicitudesByUsuario(userId, page, pageSize, q);
        return res.status(200).json({
            data: rows,
            pagination: { total, page, pageSize },
        });
    } catch (error: any) {
        const message = error?.message || 'Error al listar solicitudes del usuario';
        return res.status(400).json({ error: message });
    }
};

// NUEVO: cancelar solicitud por cliente
export const cancelSolicitud = async (req: Request, res: Response) => {
    const solicitudId = Number(req.params.id);
    const userId = (req as any).userId;
    const { comentario } = req.body || {};

    if (!solicitudId || Number.isNaN(solicitudId)) {
        return res.status(400).json({ error: 'Parámetro id de solicitud inválido' });
    }

    try {
        const result = await solicitudesService.cancelSolicitud(solicitudId, userId, comentario ?? null);
        return res.status(200).json({ ...result, message: 'Solicitud cancelada exitosamente' });
    } catch (error: any) {
        const message = error?.message || 'Error al cancelar la solicitud';
        return res.status(400).json({ error: message });
    }
};

export const softDeleteSolicitud = async (req: Request, res: Response) => {
    const solicitudId = Number(req.params.id);
    const userId = (req as any).userId;

    if (!solicitudId || Number.isNaN(solicitudId)) {
        return res.status(400).json({ error: 'Parámetro id de solicitud inválido' });
    }

    try {
        const result = await solicitudesService.softDeleteSolicitud(solicitudId, userId);
        return res.status(200).json({ ...result, message: 'Solicitud eliminada (soft delete)' });
    } catch (error: any) {
        const message = error?.message || 'Error al eliminar la solicitud';
        return res.status(400).json({ error: message });
    }
};

export const getEstadisticasCliente = async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    try {
        const stats = await solicitudesService.getEstadisticasCliente(userId);
        return res.status(200).json({ data: stats });
    } catch (error: any) {
        const message = error?.message || 'Error al obtener estadísticas';
        return res.status(400).json({ error: message });
    }
};

export const getEstadisticasSoporte = async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    try {
        const stats = await solicitudesService.getEstadisticasSoporte(userId);
        return res.status(200).json({ data: stats });
    } catch (error: any) {
        const message = error?.message || 'Error al obtener estadísticas de soporte';
        return res.status(400).json({ error: message });
    }
};

export const getSolicitudesSoporte = async (req: Request, res: Response) => {
    const userId = (req as any).userId;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const pageSize = Math.max(1, Math.min(100, parseInt(req.query.pageSize as string) || 10));
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const filter = typeof req.query.filter === 'string' ? req.query.filter : undefined;
    try {
        const { rows, total } = await solicitudesService.getSolicitudesSoporte(userId, page, pageSize, q, filter);
        return res.status(200).json({ data: rows, pagination: { total, page, pageSize } });
    } catch (error: any) {
        const message = error?.message || 'Error al listar solicitudes (soporte)';
        return res.status(400).json({ error: message });
    }
};
