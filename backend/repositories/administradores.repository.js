import db from "../db.js";

export async function buscarPorNomeUsuario(nomeUsuario) {
    const resultado = await db.query(`SELECT id_administrador, nome_usuario, senha_hash, totp_configurado
     FROM administradores WHERE nome_usuario = $1`, [nomeUsuario]);

    return resultado.rows[0] || null;
}

export async function existeAdministrador() {
    const resultado = await db.query(` SELECT EXISTS ( SELECT 1 FROM administradores) AS existe
    `);

    return resultado.rows[0].existe;
}

export async function criarAdministrador(nomeUsuario, senhaHash, segredoTotpCifrado) {
    const resultado = await db.query(` INSERT INTO administradores 
    ( nome_usuario, senha_hash, segredo_totp_cifrado, totp_configurado)
        VALUES ($1, $2, $3, true) RETURNING id_administrador`,
        [nomeUsuario, senhaHash, segredoTotpCifrado]);

    return resultado.rows[0].id_administrador;
}

export async function buscarSegredoTotpPorId(idAdministrador) {
    const resultado = await db.query(`SELECT segredo_totp_cifrado, totp_configurado FROM administradores WHERE id_administrador = $1`,
        [idAdministrador]);

    return resultado.rows[0] || null;
}