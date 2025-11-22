import { App } from "./app";
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const app = new App(4000);
    await app.listen();
}

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET no está definida. Configura el .env antes de iniciar.');
}

main();