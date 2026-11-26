import categoriasRoutes from "./routes/categorias.routes.js";
import produtosRoutes from "./routes/produtos.routes.js";
import movimentacoesRoutes from "./routes/movimentacoes.routes.js";
import ajustesEstoqueRoutes from "./routes/ajustes-estoque.routes.js";
import authRoutes from "./routes/auth.routes.js";
import tratarErrosJson from "./middlewares/tratar-erros-json.js";

import path from "node:path";
import { fileURLToPath } from "node:url";

import express from "express";
import dotenv from "dotenv";
dotenv.config();

import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pool from "./db.js";



const app = express();

app.set("trust proxy", 1);

const caminhoArquivo = fileURLToPath(import.meta.url);
const diretorioAtual = path.dirname(caminhoArquivo);

const caminhoFrontend = path.resolve(diretorioAtual, "../frontend");


// middlewares


app.use(express.json());


// configuração das sessões
if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET não foi definida no arquivo .env");
}

const PgSession = connectPgSimple(session);

app.use(session({
    store: new PgSession({
        pool: pool,
        tableName: "sessoes",
        createTableIfMissing: false
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 5 * 60 * 60 * 1000
    }
}));


// rotas
app.use("/auth", authRoutes);
app.use("/categorias", categoriasRoutes);
app.use("/produtos", produtosRoutes);
app.use("/movimentacoes", movimentacoesRoutes);
app.use("/ajustes-estoque", ajustesEstoqueRoutes);




// disponibilizar arquivos do frontend
app.use(express.static(caminhoFrontend));

// tratamento de erros JSON
app.use(tratarErrosJson);

// iniciar servidor

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => { console.log(`Servidor rodando`); });
