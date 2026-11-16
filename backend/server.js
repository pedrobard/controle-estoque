import categoriasRoutes from "./routes/categorias.routes.js";
import produtosRoutes from "./routes/produtos.routes.js";
import movimentacoesRoutes from "./routes/movimentacoes.routes.js";
import ajustesEstoqueRoutes from "./routes/ajustes-estoque.routes.js";
import tratarErrosJson from "./middlewares/tratar-erros-json.js";

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// rotas
app.use("/categorias", categoriasRoutes);
app.use("/produtos", produtosRoutes);
app.use("/movimentacoes", movimentacoesRoutes);
app.use("/ajustes-estoque", ajustesEstoqueRoutes);




// tratamento de erros JSON
app.use(tratarErrosJson);

// iniciar servidor

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {console.log(`Servidor rodando`);});
