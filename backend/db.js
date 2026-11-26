import dotenv from "dotenv";
import pg from "pg";
import { readFileSync } from "node:fs";

const ca = readFileSync(
    new URL("./certs/supabase-ca.crt", import.meta.url), "utf8"
);

dotenv.config();

const pool = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    ssl: {
        ca,
        rejectUnauthorized: true
    }
});

export default pool;