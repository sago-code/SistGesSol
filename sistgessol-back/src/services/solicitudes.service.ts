import { Database } from '../database/database';
import { Solicitud } from '../entities/solicitudes.entity';

export class SolicitudesService {

    async createSolicitud(
        clientId: number, 
        tittle: string, 
        description: string,
        stateCode: string,
        autorId: number,
        comment: string,
    ) {
        const sql = 'CALL sp_crear_solicitud(?, ?, ?, ?, ?, ?)';
        const params = [
            clientId,
            tittle,
            description,
            stateCode ?? null,
            autorId ?? null,
            comment ?? null,
        ];

        try {
            const result: any = await Database.query(sql, params);
            let solicitudId: number | null = null;

            if (Array.isArray(result)) {
                if (Array.isArray(result[0]) && result[0][0] && typeof result[0][0].solicitudId !== 'undefined') {
                    solicitudId = Number(result[0][0].solicitudId);
                } else if (result[0] && typeof result[0].solicitudId !== 'undefined') {
                    solicitudId = Number(result[0].solicitudId);
                }
            } else if (result && typeof result.solicitudId !== 'undefined') {
                solicitudId = Number(result.solicitudId);
            }

            if (!solicitudId) {
                throw new Error('No se pudo obtener el ID de la solicitud creada');
            }

            return solicitudId;
        } catch (error: any) {
            const message = error?.message || 'Error al crear la solicitud';
            throw new Error(message);
        }
    }

    async assignSoporteSolicitud(
        solicitudId: number,
        soporteId: number,
        autorUserId: number,
        comentario?: string | null,
        estadoCode?: string | null, // opcional; por defecto 'ASIGNADA' en el SP
    ) {
        const sql = 'CALL sp_asignar_soporte_solicitud(?, ?, ?, ?, ?)';
        const params = [
            solicitudId,
            soporteId,
            autorUserId,
            comentario ?? null,
            estadoCode ?? null,
        ];

        try {
            const result: any = await Database.query(sql, params);

            let row: any = null;
            if (Array.isArray(result)) {
                if (Array.isArray(result[0]) && result[0][0]) {
                    row = result[0][0];
                } else if (result[0]) {
                    row = result[0];
                }
            } else if (result) {
                row = result;
            }

            if (!row || typeof row.solicitudId === 'undefined') {
                throw new Error('No se pudo obtener la respuesta de asignación');
            }

            return {
                solicitudId: Number(row.solicitudId),
                estadoId: Number(row.estadoId),
                estadoCode: String(row.estadoCode),
                soporteId: Number(row.soporteId),
                oldSoporteId: row.oldSoporteId !== null && typeof row.oldSoporteId !== 'undefined'
                    ? Number(row.oldSoporteId)
                    : null,
                clienteId: row.clienteId !== null && typeof row.clienteId !== 'undefined'
                    ? Number(row.clienteId)
                    : null,
            };
        } catch (error: any) {
            const message = error?.message || 'Error al asignar soporte a la solicitud';
            throw new Error(message);
        }
    }

    async changeEstadoSolicitud(
        solicitudId: number,
        estadoCode: 'EN_PROCESO' | 'RESUELTA' | 'CERRADA',
        autorUserId: number,
        comentario?: string | null,
        respuestaContenido?: string | null
    ) {
        const sql = 'CALL sp_cambiar_estado_solicitud(?, ?, ?, ?, ?)';
        const params = [
            solicitudId,
            estadoCode,
            autorUserId,
            comentario ?? null,
            respuestaContenido ?? null,
        ];

        try {
            const result: any = await Database.query(sql, params);

            let row: any = null;
            if (Array.isArray(result)) {
                if (Array.isArray(result[0]) && result[0][0]) {
                    row = result[0][0];
                } else if (result[0]) {
                    row = result[0];
                }
            } else if (result) {
                row = result;
            }

            if (!row || typeof row.solicitudId === 'undefined') {
                throw new Error('No se pudo obtener la respuesta del cambio de estado');
            }

            return {
                solicitudId: Number(row.solicitudId),
                estadoId: Number(row.estadoId),
                estadoCode: String(row.estadoCode),
                soporteId: row.soporteId !== null && typeof row.soporteId !== 'undefined'
                    ? Number(row.soporteId)
                    : null,
                respuestaId: row.respuestaId !== null && typeof row.respuestaId !== 'undefined'
                    ? Number(row.respuestaId)
                    : null,
            };
        } catch (error: any) {
            const message = error?.message || 'Error al cambiar el estado de la solicitud';
            throw new Error(message);
        }
    }

    async getSolicitudesByUsuario(userId: number, page = 1, pageSize = 10, q?: string) {
        const sql = 'CALL sp_listar_solicitudes_por_usuario(?, ?, ?, ?)';
        const offset = (page - 1) * pageSize;
        const params = [userId, pageSize, offset, q ?? null];

        try {
            const result: any = await Database.query(sql, params);

            let rows: any[] = [];
            if (Array.isArray(result)) {
                rows = Array.isArray(result[0]) ? result[0] : (result[0] ? [result[0]] : []);
            } else if (result) {
                rows = [result];
            }

            let total = 0;
            if (Array.isArray(result) && Array.isArray(result[1]) && result[1][0]) {
                total = Number(result[1][0].total) || 0;
            } else if (result?.[1]?.total) {
                total = Number(result[1].total) || 0;
            }

            return { rows, total };
        } catch (error: any) {
            const message = error?.message || 'Error al listar solicitudes del usuario';
            throw new Error(message);
        }
    }

    async cancelSolicitud(
        solicitudId: number,
        clienteId: number,
        comentario?: string | null
    ) {
        const sql = 'CALL sp_cancelar_solicitud(?, ?, ?)';
        const params = [solicitudId, clienteId, comentario ?? null];

        const result: any = await Database.query(sql, params);

        let out: any = null;
        if (Array.isArray(result)) {
            out = Array.isArray(result[0]) ? result[0][0] : result[0];
        } else {
            out = result;
        }

        if (!out || typeof out.solicitudId === 'undefined') {
            throw new Error('No se pudo confirmar la cancelación');
        }

        return {
            solicitudId: Number(out.solicitudId),
            estadoId: Number(out.estadoId),
            estadoCode: String(out.estadoCode),
            soporteId: out.soporteId !== null && typeof out.soporteId !== 'undefined'
                ? Number(out.soporteId)
                : null,
        };
    }

    async softDeleteSolicitud(solicitudId: number, clienteId: number) {
        const sql = 'CALL sp_soft_delete_solicitud(?, ?)';
        const params = [solicitudId, clienteId];

        const result: any = await Database.query(sql, params);
        let out: any = null;
        if (Array.isArray(result)) {
            out = Array.isArray(result[0]) ? result[0][0] : result[0];
        } else {
            out = result;
        }
        if (!out || typeof out.solicitudId === 'undefined') {
            throw new Error('No se pudo confirmar el borrado');
        }
        return {
            solicitudId: Number(out.solicitudId),
            deletedAt: out.deletedAt || null,
        };
    }

    async getEstadisticasCliente(userId: number) {
        const sql = 'CALL sp_estadisticas_solicitudes_por_cliente(?)';
        const params = [userId];

        const result: any = await Database.query(sql, params);
        let row: any = null;
        if (Array.isArray(result)) {
            row = Array.isArray(result[0]) ? result[0][0] : result[0];
        } else {
            row = result;
        }

        if (!row) {
            throw new Error('No se pudieron obtener las estadísticas');
        }

        return {
            respondidas: Number(row.respondidas || 0),
            enProceso: Number(row.enProceso || 0),
            sinRespuesta: Number(row.sinRespuesta || 0),
            totalCliente: Number(row.totalCliente || 0),
            totalGlobal: Number(row.totalGlobal || 0),
        };
    }

    async getEstadisticasSoporte(userId: number) {
        const sql = 'CALL sp_estadisticas_solicitudes_por_soporte(?)';
        const params = [userId];
        const result: any = await Database.query(sql, params);
        let row: any = null;
        if (Array.isArray(result)) {
            row = Array.isArray(result[0]) ? result[0][0] : result[0];
        } else {
            row = result;
        }
        if (!row) {
            throw new Error('No se pudieron obtener las estadísticas de soporte');
        }
        return {
            resueltas: Number(row.resueltas || 0),
            asignadas: Number(row.asignadas || 0),
            enProceso: Number(row.enProceso || 0),
            cerradas: Number(row.cerradas || 0),
            eficienciaRespuesta: Number(row.eficienciaRespuesta || 0),
            totalRespondidasSoporte: Number(row.totalRespondidasSoporte || 0),
            totalSolicitudesSistema: Number(row.totalSolicitudesSistema || 0),
            totalRespondidasPeers: Number(row.totalRespondidasPeers || 0),
            asignadasMi: Number(row.asignadasMi || 0),
            asignadasOtros: Number(row.asignadasOtros || 0),
        };
    }

    async getEstadisticasAdmin() {
        const sql = 'CALL sp_estadisticas_solicitudes_admin()';
        const result: any = await Database.query(sql, []);
        let row: any = null;
        if (Array.isArray(result)) {
            row = Array.isArray(result[0]) ? result[0][0] : result[0];
        } else {
            row = result;
        }
        if (!row) {
            throw new Error('No se pudieron obtener las estadísticas de admin');
        }
        return {
            creada: Number(row.creada || 0),
            asignada: Number(row.asignada || 0),
            enProceso: Number(row.enProceso || 0),
            resuelta: Number(row.resuelta || 0),
            cerrada: Number(row.cerrada || 0),
            cancelada: Number(row.cancelada || 0),
            respondidasLunes: Number(row.respondidasLunes || 0),
            respondidasMartes: Number(row.respondidasMartes || 0),
            respondidasMiercoles: Number(row.respondidasMiercoles || 0),
            respondidasJueves: Number(row.respondidasJueves || 0),
            respondidasViernes: Number(row.respondidasViernes || 0),
        };
    }

    async getSolicitudesSoporte(userId: number, page = 1, pageSize = 10, q?: string, filter?: string) {
        const sql = 'CALL sp_listar_solicitudes_soporte(?, ?, ?, ?, ?)';
        const offset = (page - 1) * pageSize;
        const params = [userId, pageSize, offset, q ?? null, filter ?? null];
        const result: any = await Database.query(sql, params);
        let rows: any[] = [];
        if (Array.isArray(result)) {
            rows = Array.isArray(result[0]) ? result[0] : (result[0] ? [result[0]] : []);
        } else if (result) {
            rows = [result];
        }
        let total = 0;
        if (Array.isArray(result) && Array.isArray(result[1]) && result[1][0]) {
            total = Number(result[1][0].total) || 0;
        } else if (result?.[1]?.total) {
            total = Number(result[1].total) || 0;
        }
        return { rows, total };
    }

    async getSolicitudesAdmin(page = 1, pageSize = 10, q?: string, estado?: string, soporte?: string, cliente?: string, fecha?: string) {
        const sql = 'CALL sp_listar_solicitudes_admin(?, ?, ?, ?, ?, ?, ?)';
        const offset = (page - 1) * pageSize;
        const norm = (v?: string) => (typeof v === 'string' && v.trim().length ? v.trim() : null);
        const params = [pageSize, offset, norm(q), norm(estado), norm(soporte), norm(cliente), norm(fecha)];
        const result: any = await Database.query(sql, params);
        let rows: any[] = [];
        if (Array.isArray(result)) {
            rows = Array.isArray(result[0]) ? result[0] : (result[0] ? [result[0]] : []);
        } else if (result) {
            rows = [result];
        }
        let total = 0;
        if (Array.isArray(result) && Array.isArray(result[1]) && result[1][0]) {
            total = Number(result[1][0].total) || 0;
        } else if (result?.[1]?.total) {
            total = Number(result[1].total) || 0;
        }
        return { rows, total };
    }
}
export const solicitudesService = new SolicitudesService();
