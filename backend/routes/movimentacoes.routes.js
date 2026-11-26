import express from "express";
import * as movimentacoesController from "../controllers/movimentacoes.controller.js";
import { validarCorpoRequisicao } from "../middlewares/validar-corpo-requisicao.middleware.js";
import { verificarAutenticacao } from "../middlewares/verificar-autenticacao.middleware.js";

const router = express.Router();

router.use(verificarAutenticacao);

router.get("/", movimentacoesController.listar);

router.post("/", validarCorpoRequisicao, movimentacoesController.cadastrar);

router.post("/:id/estorno", validarCorpoRequisicao, movimentacoesController.estornar);

export default router;
