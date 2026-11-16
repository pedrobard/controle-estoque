import express from "express";
import * as categoriasController from "../controllers/categorias.controller.js";
import { validarCorpoRequisicao } from "../middlewares/validar-corpo-requisicao.middleware.js";

const router = express.Router();

router.get("/", categoriasController.listar);

router.post("/", validarCorpoRequisicao, categoriasController.cadastrar);

router.patch("/:id", validarCorpoRequisicao, categoriasController.editar);

router.delete("/:id", categoriasController.excluir);

export default router;
