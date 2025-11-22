import { Database } from '../database/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Token } from '../entities/token.entity';
import { IsNull } from 'typeorm';

export class AuthService {

    //metodo para login
    async login(email: string, password: string) {
        const queryRunner = Database.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {

            //llamada al procedimiento almacenado para login
            const result = await queryRunner.manager.query('CALL sp_login_user(?)', [email]);

            const firstSet = Array.isArray(result) ? result[0] : result;
            const userRow = Array.isArray(firstSet) ? firstSet[0] : firstSet;

            if (!userRow) {
                throw new Error('Usuario no encontrado.');
            }

            const storedPassword = userRow.passwordHash;

            const isPasswordValid = await bcrypt.compare(password, storedPassword);
            if (!isPasswordValid) {
                throw new Error('Contraseña incorrecta.');
            }
            
            //genera token jwt
            const token = jwt.sign(
                { userId: userRow.id, roleId: userRow.roleId },
                process.env.JWT_SECRET || 'development-secret',
                { expiresIn: '1h' }
            );

            //almacena token en base de datos
            const tokenEntity = queryRunner.manager.create(Token, { token, user: { id: userRow.id } });
            await queryRunner.manager.save(tokenEntity);

            await queryRunner.commitTransaction();


            //retorna token y usuario sin contraseña
            const safeUser = {
                id: userRow.id,
                firstName: userRow.firstName,
                lastName: userRow.lastName,
                email: userRow.email,
                phone: userRow.phone,
                roleId: userRow.roleId,
            };

            return { token, user: safeUser };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }


    //metodo para logout
    async logout(userId: number, token: string): Promise<void> {
        const tokenRepository = Database.getRepository(Token);

        const tokenEntity = await tokenRepository.findOne({
            where: { token, user: { id: userId }, deletedAt: IsNull() },
        });

        if (!tokenEntity) {
            throw new Error('Token invalido o ya revocado');
        }

        tokenEntity.deletedAt = new Date();
        await tokenRepository.save(tokenEntity);
    }
}