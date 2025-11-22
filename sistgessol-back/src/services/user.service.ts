import { Database } from '../database/database';
import bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { error } from 'console';

export type CreateUserResponse = {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    roleId: number;
};

export class UserService {

    //Service para crear un usuario
    async createUser(
        firstName: string, 
        lastName: string, 
        email: string, 
        phone: number,
        password: string,
        roleId: number,
    ): Promise<CreateUserResponse> {
        const queryRunner = Database.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const hasMinLength = typeof password === 'string' && password.length >= 8;
            if (!hasMinLength) {
                throw new Error('La contraseña debe tener al menos 8 caracteres.');
            }
            const hasUppercase = /[A-Z]/.test(password);
            const hasSpecial = /[^A-Za-z0-9]/.test(password);
            if (!hasUppercase || !hasSpecial) {
                throw new Error('La contraseña debe contener al menos una mayúscula y un carácter especial.');
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const spResult = await queryRunner.manager.query(
                'Call sp_create_user(?, ?, ?, ?, ?, ?)',
                [
                    firstName, 
                    lastName, 
                    email, 
                    phone,
                    hashedPassword, 
                    roleId
                ]
            );

            const firstSet = Array.isArray(spResult) ? spResult[0] : spResult;
            const firstRow = Array.isArray(firstSet) ? firstSet[0] : firstSet;
            const userId = firstRow?.userId ?? firstRow?.id;

            if (!userId) {
                throw new Error('No se pudo obtener el ID del usuario desde el procedimiento.');
            }

            const createdUser = await queryRunner.manager.findOne(User, {
                where: { id: userId },
            });

            if (!createdUser) {
                throw new Error('No se encontró el usuario recién creado.');
            }
            

            //se arma el json de respuesta
            const userResponse: CreateUserResponse = {
                id: createdUser.id,
                firstName: createdUser.firstName,
                lastName: createdUser.lastName,
                email: createdUser.email,
                phone: createdUser.phone,
                createdAt: createdUser.createdAt,
                updatedAt: createdUser.updatedAt,
                deletedAt: createdUser.deletedAt,
                roleId: roleId,
            };

            await queryRunner.commitTransaction();
            return userResponse;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async getUserById(id: number): Promise<{
        id: number;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        roleId: number;
        roleName?: string;
    } | null> {
        const queryRunner = Database.createQueryRunner();
        await queryRunner.connect();
        try {
            const spResult = await queryRunner.manager.query('CALL sp_get_user_by_id(?)', [id]);
            const firstSet = Array.isArray(spResult) ? spResult[0] : spResult;
            const row = Array.isArray(firstSet) ? firstSet[0] : firstSet;

            const createdUser = await queryRunner.manager.findOne(User, { where: { id } });
            if (!row && !createdUser) return null;

            const phone = String((row && row.phone !== undefined ? row.phone : createdUser?.phone) ?? '');

            return {
                id: (row?.id ?? row?.userId ?? createdUser?.id)!,
                firstName: row?.firstName ?? createdUser?.firstName ?? '',
                lastName: row?.lastName ?? createdUser?.lastName ?? '',
                email: row?.email ?? createdUser?.email ?? '',
                phone,
                roleId: row?.roleId ?? 0,
                roleName: row?.roleName ?? row?.role ?? undefined,
            };
        } finally {
            await queryRunner.release();
        }
    }

    async updateUser(id: number, payload: { firstName?: string; lastName?: string; phone?: string | number; }): Promise<{
        id: number;
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    }> {
        const repo = Database.getRepository(User);
        const user = await repo.findOne({ where: { id } });
        if (!user) {
            throw new Error('Usuario no encontrado');
        }

        if (typeof payload.firstName === 'string') {
            user.firstName = payload.firstName.trim();
        }
        if (typeof payload.lastName === 'string') {
            user.lastName = payload.lastName.trim();
        }
        if (typeof payload.phone !== 'undefined') {
            user.phone = String(payload.phone).trim();
        }

        try {
            const saved = await repo.save(user);
            return {
                id: saved.id,
                firstName: saved.firstName,
                lastName: saved.lastName,
                email: saved.email,
                phone: saved.phone,
            };
        } catch (e: any) {
            if (e?.code === 'ER_DUP_ENTRY') {
                throw Object.assign(new Error('Teléfono ya registrado'), { code: 'ER_DUP_ENTRY' });
            }
            throw e;
        }
    }
}