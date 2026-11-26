import express from "express";
import * as authController from "../controllers/auth.controller.js";
import { validarCorpoRequisicao } from "../middlewares/validar-corpo-requisicao.middleware.js";
import limitarTentativasLogin from "../middlewares/rate-limit-login.middleware.js";
import limitarTentativasTotp from "../middlewares/rate-limit-totp.middleware.js";
import { verificarAutenticacao } from "../middlewares/verificar-autenticacao.middleware.js";

const router = express.Router();

router.post("/login", limitarTentativasLogin, validarCorpoRequisicao, authController.login);

router.post("/totp", limitarTentativasTotp, validarCorpoRequisicao, authController.verificarTotp);

router.get("/verificar", verificarAutenticacao, authController.verificarSessao);

router.post("/logout", authController.logout);

export default router;
