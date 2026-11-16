import db from "../db.js";




export async function listar() {
    const resultado = await db.query(`SELECT id_produto AS id, id_categoria AS "idCategoria", nome, quantidade,
     custo_medio AS "custoMedio", preco_venda_padrao AS "precoVendaPadrao",  estoque_minimo AS "estoqueMinimo", ativo,
      criado_em AS "criadoEm" FROM produtos WHERE excluido = FALSE`);

    return resultado.rows;
}


export async function buscarPorId(id) {
    const resultado = await db.query(`SELECT id_produto AS id, id_categoria AS "idCategoria", nome, quantidade,
     custo_medio AS "custoMedio", preco_venda_padrao AS "precoVendaPadrao", estoque_minimo AS "estoqueMinimo",
     ativo, criado_em AS "criadoEm" FROM produtos WHERE id_produto = $1 AND excluido = FALSE`, [id]);

    return resultado.rows[0];
}



export async function buscarParaAtualizacao(id, client) {
    const resultado = await client.query("SELECT ativo, excluido FROM produtos WHERE id_produto = $1 FOR UPDATE", [id]);

    return resultado.rows[0];
}



export async function editar(id, dados, client) {
    const resultado = await client.query(`UPDATE produtos SET  nome = $1, id_categoria = $2, preco_venda_padrao = $3,
    estoque_minimo = $4 WHERE id_produto = $5 AND excluido = FALSE RETURNING *`,
        [dados.nome, dados.idCategoria, dados.preco, dados.estoqueMinimo, id]);

    return resultado.rows[0];
}


export async function cadastrar(dados, client) {
    const resultado = await client.query(`INSERT INTO produtos  (id_categoria,  nome, quantidade, custo_medio, preco_venda_padrao,
            estoque_minimo)  VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [dados.idCategoria, dados.nome, dados.quantidade, dados.custoMedio, dados.precoVendaPadrao, dados.estoqueMinimo]);

    return resultado.rows[0];
}


export async function buscarCategoriaPorId(idCategoria, client) {
    const resultado = await client.query(`SELECT id_categoria FROM categorias WHERE id_categoria = $1 FOR KEY SHARE`, [idCategoria]);

    return resultado.rows[0];
}



export async function cadastrarEstoqueInicial(dados, client) {
    await client.query(
        `INSERT INTO movimentacoes (id_produto, tipo, quantidade, custo_unitario, custo_total_movimentacao,
         custo_medio_apos_movimentacao, quantidade_anterior, quantidade_final) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [dados.idProduto, "estoque inicial", dados.quantidade, dados.custoUnitario, dados.custoTotal, dados.custoMedio, 0, dados.quantidade]);
}

export async function alterarStatus(id, statusSolicitado, client) {
    const resultado = await client.query(`UPDATE produtos SET ativo = $1 WHERE id_produto = $2 AND excluido = FALSE RETURNING *`,
        [statusSolicitado, id]);

    return resultado.rows[0];
}

export async function buscarParaExclusao(id, client) {
    const resultado = await client.query(`SELECT quantidade, ativo, excluido FROM produtos WHERE id_produto = $1 FOR UPDATE`,
        [id]);

    return resultado.rows[0];
}

export async function excluir(id, client) {
    const resultado = await client.query(`UPDATE produtos SET excluido = TRUE WHERE id_produto = $1 AND ativo = FALSE
         AND excluido = FALSE RETURNING *`,[id]);

    return resultado.rows[0];
}