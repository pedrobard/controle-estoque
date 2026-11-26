import dotenv from "dotenv";
import pg from "pg";
import { readFileSync } from "node:fs";

dotenv.config();

const configuracaoSSL = process.env.NODE_ENV === "production" ?
     {
        ca: readFileSync(
            new URL("./certs/supabase-ca.crt", import.meta.url),
            "utf8"
        ),
        rejectUnauthorized: true
    }
    : false;

const pool = new pg.Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
    ssl: configuracaoSSL
});

export default pool;