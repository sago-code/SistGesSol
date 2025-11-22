import { Database } from './database/database';
import { Rol } from './entities/rol.entity';
import { SolicitudEstado } from './entities/solicitudEstado.entity';

export const preloadRoles = async () => {
    const roleRepository = Database.getRepository(Rol);

    const roles = ['Admin', 'User', 'Client'];

    for (const name of roles) {
        const roleExists = await roleRepository.findOneBy({ name });
        if (!roleExists) {
            const role = roleRepository.create({ name });
            await roleRepository.save(role);
        }
    }
};

export const SOLICITUD_ESTADOS = [
    { code: 'CREADA', name: 'Creada', order: 1, isFinal: false },
    { code: 'ASIGNADA', name: 'Asignada', order: 2, isFinal: false },
    { code: 'EN_PROCESO', name: 'En proceso', order: 3, isFinal: false },
    { code: 'RESUELTA', name: 'Resuelta', order: 4, isFinal: true },
    { code: 'CERRADA', name: 'Cerrada', order: 5, isFinal: true },
    { code: 'CANCELADA', name: 'Cancelada', order: 6, isFinal: true },
];

export const preloadSolicitudEstados = async () => {
    const estadoRepository = Database.getRepository(SolicitudEstado);

    for (const e of SOLICITUD_ESTADOS) {
        const exists = await estadoRepository.findOne({ where: { code: e.code } });
        if (!exists) {
            const estado = estadoRepository.create(e);
            await estadoRepository.save(estado);
        }
    }
};
