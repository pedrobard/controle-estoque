import argon2 from "argon2";
import crypto from "node:crypto";
import QRCode from "qrcode";

import { generateSecret, generateURI, verify } from "otplib";

import { createInterface } from "node:readline/promises";
import process from "node:process";

import db from "../db.js";
import * as administradoresRepository from "../repositories/administradores.repository.js";

let rl = createInterface({ input: process.stdin, output: process.stdout });

async function perguntar(mensagem) {
    return (await rl.question(mensagem)).trim();
}

async function perguntarSenha(mensagem) {
    if (!process.stdin.isTTY) {
        throw new Error("A senha deve ser informada por um terminal interativo.");
    }

    process.stdout.write(mensagem);
    rl.close();
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");

    return new Promise((resolve, reject) => {
        let senha = "";

        function finalizar(erro = null) {
            process.stdin.removeListener("data", receberEntrada);
            process.stdin.setRawMode(false);
            process.stdout.write("\n");

            rl = createInterface({ input: process.stdin, output: process.stdout });

            if (erro) {
                reject(erro);
                return;
            }

            resolve(senha);
        }

        function receberEntrada(entrada) {
            for (const tecla of entrada) {
                if (tecla === "\u0003") {
                    finalizar(new Error("Operação cancelada."));
                    return;
                }

                if (tecla === "\r" || tecla === "\n") {
                    finalizar();
                    return;
                }

                if (tecla === "\u007f" || tecla === "\b") {
                    senha = Array.from(senha).slice(0, -1).join("");
                    continue;
                }

                senha += tecla;
            }
        }

        process.stdin.on("data", receberEntrada);
    });
}


function validarNomeUsuario(nomeUsuario) {
    const nomeUsuarioFormatado = nomeUsuario.trim().toLowerCase();

    const formatoValido = /^[a-z0-9._-]{4,30}$/.test(nomeUsuarioFormatado);

    if (!formatoValido) {
        throw new Error("O usuário deve possuir entre 4 e 30 caracteres e conter apenas letras minúsculas, números, ponto, hífen ou sublinhado.");
    }

    return nomeUsuarioFormatado;
}

function validarSenha(senha) {
    if (senha.length < 12) {
        throw new Error("A senha deve possuir pelo menos 12 caracteres.");
    }

    return senha;
}

async function iniciarConfiguracao() {
    const jaExisteAdministrador = await administradoresRepository.existeAdministrador();

    if (jaExisteAdministrador) {
        throw new Error("Já existe um administrador cadastrado. A configuração inicial não pode ser executada novamente.");
    }

    if (!process.env.TOTP_ENCRYPTION_KEY) {
        throw new Error("A variável TOTP_ENCRYPTION_KEY não está configurada.");
    }

    const chaveBase64Valida = /^[A-Za-z0-9+/]{43}=$/.test(
        process.env.TOTP_ENCRYPTION_KEY
    );

    if (!chaveBase64Valida) {
        throw new Error("A TOTP_ENCRYPTION_KEY não possui um formato Base64 válido.");
    }

    const chaveCriptografia = Buffer.from(
        process.env.TOTP_ENCRYPTION_KEY,
        "base64"
    );

    if (chaveCriptografia.length !== 32) {
        throw new Error("A chave de criptografia TOTP deve possuir 32 bytes.");
    }

    console.log("\n=== CONFIGURAÇÃO INICIAL DO ADMINISTRADOR ===\n");

    const nomeUsuario = validarNomeUsuario(await perguntar("Nome de usuário: "));

    const senha = validarSenha(await perguntarSenha("Senha: "));
    const confirmacaoSenha = await perguntarSenha("Confirme a senha: ");

    if (senha !== confirmacaoSenha) {
        throw new Error("As senhas informadas não coincidem.");
    }


    const senhaHash = await argon2.hash(senha, { type: argon2.argon2id });

    const segredoTotp = generateSecret();

    const uriTotp = generateURI({
        issuer: "Gerenciador de Estoque",
        label: nomeUsuario,
        secret: segredoTotp
    });


    const qrCode = await QRCode.toString(uriTotp, {
        type: "terminal",
        small: true
    });

    console.log("\nEscaneie o QR Code com seu aplicativo autenticador:\n");
    console.log(qrCode);


    const codigoTotp = await perguntar("Digite o código exibido no aplicativo autenticador: ");

    const verificacaoTotp = await verify({
        secret: segredoTotp,
        token: codigoTotp
    });

    if (!verificacaoTotp.valid) {
        throw new Error("Código TOTP inválido. A configuração não foi concluída.");
    }



    const iv = crypto.randomBytes(12);

    const cifrador = crypto.createCipheriv(
        "aes-256-gcm",
        chaveCriptografia,
        iv
    );

    const segredoCifrado = Buffer.concat([
        cifrador.update(segredoTotp, "utf8"),
        cifrador.final()
    ]);

    const tag = cifrador.getAuthTag();

    const segredoTotpCifrado = [
        iv.toString("base64"),
        tag.toString("base64"),
        segredoCifrado.toString("base64")
    ].join(":");



    const idAdministrador = await administradoresRepository.criarAdministrador(nomeUsuario, senhaHash, segredoTotpCifrado);

    console.log("\nAdministrador cadastrado com sucesso!");
    console.log(`ID: ${idAdministrador}`);
    console.log(`Usuário: ${nomeUsuario}`);

}



try {
    await iniciarConfiguracao();
} catch (erro) {
    console.error("\nErro na configuração inicial:", erro.message);
    process.exitCode = 1;
} finally {
    rl.close();
    await db.end();
}