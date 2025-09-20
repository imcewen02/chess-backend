import dotenv from "dotenv";

dotenv.config();

interface Config {
    APP_HOST: string;
    APP_PORT: number;
    DB_HOST: string;
    DB_PORT: number;
    DB_NAME: string;
    DB_USER: string;
    DB_PASSWORD: string;
    FRONTEND_ORIGIN: string;
}

const config: Config = {
    APP_HOST: String(process.env.APP_HOST),
    APP_PORT: Number(process.env.APP_PORT),
    DB_HOST: String(process.env.DB_HOST),
    DB_PORT: Number(process.env.DB_PORT),
    DB_NAME: String(process.env.DB_NAME),
    DB_USER: String(process.env.DB_USER),
    DB_PASSWORD: String(process.env.DB_PASSWORD),
    FRONTEND_ORIGIN: String(process.env.FRONTEND_ORIGIN)
};

export default config;