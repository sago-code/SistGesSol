import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { preloadRoles, preloadSolicitudEstados } from '../init';

export const Database = new DataSource({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    database: 'sistgesol',
    entities: ['src/**/*.entity{.ts,.js}'],
    migrations: ['src/migrations/**/*{.ts,.js}'],
    synchronize: false,
    logging: false,
});

Database.initialize()
    .then(async () => {
        console.log('Base de datos conectada');
        await preloadRoles();
        await preloadSolicitudEstados();
    })
    .catch((error) => {
        console.error('Error al conectar a la base de datos:', error);
    });