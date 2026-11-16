import db from "../db.js";

export async function listar() {
    const resultado = await db.query("SELECT id_categoria AS id, nome FROM categorias");

    return resultado.rows;

}

export async function buscarPorNome(nome, client = db) {
    const resultado = await client.query("SELECT id_categoria AS id, nome FROM categorias WHERE LOWER(nome) = LOWER($1)", [nome]);

    return resultado.rows[0] || null;
}

export async function buscarPorId(id, client = db) {
    const resultado = await client.query("SELECT id_categoria AS id, nome FROM categorias WHERE id_categoria = $1 FOR UPDATE", [id]);

    return resultado.rows[0] || null;
}

export async function cadastrar(nome, client = db) {
    const resultado = await client.query("INSERT INTO categorias (nome) VALUES ($1) RETURNING id_categoria AS id, nome", [nome]);

    return resultado.rows[0];

}

export async function editar(id, nome, client = db) {
    const resultado = await client.query("UPDATE categorias SET nome = $1 WHERE id_categoria = $2 RETURNING id_categoria AS id, nome", [nome, id]);

    return resultado.rows[0];
}

export async function buscarProdutoVinculado(idCategoria, client = db) {
    const resultado = await client.query("SELECT id_produto FROM produtos WHERE id_categoria = $1 LIMIT 1", [idCategoria]);

    return resultado.rows[0] || null;
}

export async function excluir(id, client = db) {
    const resultado = await client.query( "DELETE FROM categorias WHERE id_categoria = $1 RETURNING id_categoria AS id", [id]);

    return resultado.rows[0] || null;
}