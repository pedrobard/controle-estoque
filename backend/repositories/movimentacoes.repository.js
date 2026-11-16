import db from "../db.js";

export async function listar() {
    const resultado = await db.query(`
        SELECT
            m.id_movimentacao AS id,
            m.id_produto AS "produtoId",
            p.nome AS "produtoNome",
            m.tipo,
            m.quantidade,
            m.custo_unitario AS "custoUnitario",
            m.preco_unitario_venda AS "precoUnitarioVenda",
            m.custo_total_movimentacao AS "custoTotalMovimentacao",
            m.custo_medio_apos_movimentacao AS "custoMedioAposMovimentacao",
            m.valor_total_venda AS "valorTotalVenda",
            m.lucro_bruto_movimentacao AS "lucroBrutoMovimentacao",
            m.quantidade_anterior AS "quantidadeAnterior",
            m.quantidade_final AS "quantidadeFinal",
            m.diferenca,
            m.motivo,
            m.data_movimentacao AS "dataMovimentacao",
            m.id_movimentacao_original AS "idMovimentacaoOriginal",
            m.tipo_movimentacao_original AS "tipoMovimentacaoOriginal",
            m.estornada
        FROM movimentacoes m
        INNER JOIN produtos p
            ON p.id_produto = m.id_produto
        ORDER BY
            m.data_movimentacao DESC,
            m.id_movimentacao DESC`
    );

    return resultado.rows;
}

export async function buscarProdutoParaAtualizacao(idProduto, client) {
    const resultado = await client.query(`SELECT * FROM produtos WHERE id_produto = $1 AND excluido = FALSE FOR UPDATE `,
        [idProduto]);

    return resultado.rows[0];
}

export async function atualizarEstoque(idProduto, quantidade, custoMedio, client) {
    const resultado = await client.query(` UPDATE produtos SET quantidade = $1, custo_medio = $2 WHERE id_produto = $3 RETURNING *`,
        [quantidade, custoMedio, idProduto]);

    return resultado.rows[0];
}

export async function cadastrar(dados, client) {
    const resultado = await client.query(`
        INSERT INTO movimentacoes
            (id_produto,
            tipo,
            quantidade,
            custo_unitario,
            preco_unitario_venda,
            custo_total_movimentacao,
            custo_medio_apos_movimentacao,
            valor_total_venda,
            lucro_bruto_movimentacao,
            quantidade_anterior,
            quantidade_final)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [dados.idProduto,
        dados.tipo,
        dados.quantidade,
        dados.custoUnitario,
        dados.precoUnitarioVenda,
        dados.custoTotalMovimentacao,
        dados.custoMedioAposMovimentacao,
        dados.valorTotalVenda,
        dados.lucroBrutoMovimentacao,
        dados.quantidadeAnterior,
        dados.quantidadeFinal]);

    return resultado.rows[0];
}

// consultar o produto vinculado à movimentação original
export async function buscarProdutoDaMovimentacao(idMovimentacao, client) {
    const resultado = await client.query(`SELECT id_produto FROM movimentacoes WHERE id_movimentacao = $1`, [idMovimentacao]);

    return resultado.rows[0];
}

// consultar e bloquear o produto antes de bloquear a movimentação original
export async function buscarProdutoParaEstorno(idProduto, client) {
    const resultado = await client.query(` SELECT quantidade, ativo, excluido FROM produtos WHERE id_produto = $1 FOR UPDATE`, [idProduto]);

    return resultado.rows[0];
}

// consultar e bloquear a movimentação original após bloquear o produto
export async function buscarMovimentacaoParaEstorno(idMovimentacao, client) {
    const resultado = await client.query(`SELECT * FROM movimentacoes WHERE id_movimentacao = $1  FOR UPDATE`, [idMovimentacao]);

    return resultado.rows[0];
}

// consultar as movimentações do produto para reconstruir o estoque
export async function listarMovimentacoesParaReconstrucao(idProduto, client) {
    const resultado = await client.query(` SELECT * FROM movimentacoes WHERE id_produto = $1 ORDER BY data_movimentacao ASC, id_movimentacao ASC`,
        [idProduto]);

    return resultado.rows;
}


// atualizar a movimentação original alterando o campo estornada para true
export async function marcarMovimentacaoComoEstornada(idMovimentacao, client) {
    const resultado = await client.query(` UPDATE movimentacoes SET estornada = TRUE WHERE id_movimentacao = $1 AND estornada = FALSE
        RETURNING *`, [idMovimentacao]);

    return resultado.rows[0];
}

// inserir a movimentação de estorno no banco de dados
export async function cadastrarEstorno(dados, client) {
    const resultado = await client.query(`
        INSERT INTO movimentacoes 
        (id_produto,
            tipo,
            quantidade,
            quantidade_anterior,
            quantidade_final,
            diferenca,
            id_movimentacao_original,
            tipo_movimentacao_original,
            motivo,
            custo_medio_apos_movimentacao)
        VALUES ($1, 'estorno', $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [dados.idProduto,
        dados.quantidade,
        dados.quantidadeAnterior,
        dados.quantidadeFinal,
        dados.diferenca,
        dados.idMovimentacaoOriginal,
        dados.tipoMovimentacaoOriginal,
        dados.motivo,
        dados.custoMedioAposMovimentacao]);

    return resultado.rows[0];
}

// consultar e bloquear o produto para realizar o ajuste de estoque
export async function buscarProdutoParaAjuste(idProduto, client) {
    const resultado = await client.query(`SELECT quantidade, custo_medio, ativo, excluido FROM produtos WHERE id_produto = $1 FOR UPDATE`,
        [idProduto]);

    return resultado.rows[0];
}

// inserir a movimentação de ajuste no banco de dados
export async function cadastrarAjuste(dados, client) {
    const resultado = await client.query(`
        INSERT INTO movimentacoes
            (id_produto,
            tipo,
            quantidade,
            quantidade_anterior,
            quantidade_final,
            diferenca,
            motivo,
            custo_unitario,
            custo_total_movimentacao,
            custo_medio_apos_movimentacao)
        VALUES ($1, 'ajuste', $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [dados.idProduto,
        dados.quantidade,
        dados.quantidadeAnterior,
        dados.quantidadeFinal,
        dados.diferenca,
        dados.motivo,
        dados.custoUnitario,
        dados.custoTotalMovimentacao,
        dados.custoMedioAposMovimentacao]);

    return resultado.rows[0];
}