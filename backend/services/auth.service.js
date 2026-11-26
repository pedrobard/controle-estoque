import argon2 from "argon2";
import crypto from "node:crypto";
import { verify } from "otplib";
import * as administradoresRepository from "../repositories/administradores.repository.js"


export async function login(nomeUsuario, senha) {

    const nomeUsuarioFormatado = nomeUsuario.trim().toLowerCase();

    const administrador = await administradoresRepository.buscarPorNomeUsuario(nomeUsuarioFormatado);

    if (!administrador) {
        const erro = new Error("Usuário ou senha inválidos.");
        erro.status = 401;
        erro.mensagem = erro.message;
        throw erro;
    }

    //validar senha
    const senhaValida = await argon2.verify(administrador.senha_hash, senha);

    if (!senhaValida) {
        const erro = new Error("Usuário ou senha inválidos.");
        erro.status = 401;
        erro.mensagem = erro.message;
        throw erro;
    }

    if (!administrador.totp_configurado) {
        const erro = new Error("A autenticação de dois fatores ainda não foi configurada.");
        erro.status = 403;
        erro.mensagem = erro.message;
        throw erro;
    }

    return {
        idAdministrador: administrador.id_administrador,
        etapa: "totp"
    };

}


export async function verificarTotp(idAdministrador, codigo) {
    const chaveCriptografia = Buffer.from(process.env.TOTP_ENCRYPTION_KEY, "base64");

    if (chaveCriptografia.length !== 32) {
        throw new Error("Chave de criptografia inválida.");
    }

    const administrador = await administradoresRepository.buscarSegredoTotpPorId(idAdministrador);

    if (!administrador || !administrador.segredo_totp_cifrado) {
        const erro = new Error("Não foi possível validar o código TOTP.");
        erro.status = 401;
        erro.mensagem = erro.message;
        throw erro;
    }

    const [ivBase64, tagBase64, segredoBase64] = administrador.segredo_totp_cifrado.split(":");

    const iv = Buffer.from(ivBase64, "base64");
    const tag = Buffer.from(tagBase64, "base64");
    const segredoCifrado = Buffer.from(segredoBase64, "base64");

    const decifrador = crypto.createDecipheriv(
        "aes-256-gcm",
        chaveCriptografia,
        iv
    );
    decifrador.setAuthTag(tag);


    const resultado = Buffer.concat([
        decifrador.update(segredoCifrado),
        decifrador.final()
    ]);

    const segredoTotp = resultado.toString("utf8");

    const verificacaoTotp = await verify({
        secret: segredoTotp,
        token: codigo
    });

    if (!verificacaoTotp.valid) {
        const erro = new Error("Código TOTP inválido ou expirado.");
        erro.status = 401;
        erro.mensagem = erro.message;
        throw erro;
    }

    return { valido: true };
}