import express from "express";
import * as ajustesEstoqueController from "../controllers/ajustes-estoque.controller.js";
import { validarCorpoRequisicao } from "../middlewares/validar-corpo-requisicao.middleware.js";

const router = express.Router();

router.post("/", validarCorpoRequisicao, ajustesEstoqueController.ajustar);

export default router;