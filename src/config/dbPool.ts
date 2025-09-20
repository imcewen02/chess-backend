// db.ts
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const DB_POOL = new Pool({
	host: process.env.DB_HOST,
	port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
	database: process.env.DB_NAME,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
});

export default DB_POOL;
