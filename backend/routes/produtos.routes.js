import express from "express";
import * as produtosController from "../controllers/produtos.controller.js";
import { validarCorpoRequisicao } from "../middlewares/validar-corpo-requisicao.middleware.js";

const router = express.Router();

router.get("/", produtosController.listar);

router.get("/:id", produtosController.buscarPorId);

router.post("/", validarCorpoRequisicao, produtosController.cadastrar);

router.patch("/:id/status", validarCorpoRequisicao, produtosController.alterarStatus);

router.patch("/:id", validarCorpoRequisicao, produtosController.editar);

router.delete("/:id", produtosController.excluir);

export default router;
