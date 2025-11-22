import express, { Application } from 'express';
import chalk from 'chalk';
import morgan from 'morgan'; // Importar la nueva ruta
import cors from 'cors';
import { Database } from './database/database';
import userRoutes from './routes/user.routes';
import authRoutes from './routes/auth.routes';
import solicitudesRoutes from './routes/solicitudes.routes';

export class App {

    private app: Application;

    constructor(private port?: number | string) {
        this.app = express();
        this.settings();
        this.middlewares();
        this.routes();
    }

    settings() {
        this.app.set('port', this.port || process.env.PORT || 4000);
    }

    middlewares() {
        this.app.use(morgan('dev'));
        this.app.use(express.json());
        this.app.use(cors({
            origin: 'http://localhost:3000',
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: true,
        }));
    }
    
    routes() {
        this.app.use('/users', userRoutes);
        this.app.use('/auth', authRoutes);
        this.app.use('/solicitudes', solicitudesRoutes);
    }

    async listen() {
        await Database.initialize();
        await this.app.listen(this.app.get('port'));
        const port = this.app.get('port');
        console.log(chalk.blue.bold(`
            **********************************************
            *****                                    *****
            ******Bienvenido a la API para soporte *******
            *****                                    *****
            ***********`) + chalk.green.bold(`Servidor en puerto: ${port}`) + chalk.blue.bold(`***********
            *****                                    *****
            **********************************************`
        ));
    }
}