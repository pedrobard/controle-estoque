
import * as movimentacoesRepository from "../repositories/movimentacoes.repository.js";
import db from "../db.js";
import { reverterTransacao } from "../utils/transacoes.js";



export async function ajustar(dados) {
    const { idProduto, quantidadeFisica, motivo, custoUnitario } = dados;

    //validações idProduto e conversão
    if (idProduto === undefined || idProduto === null || (typeof idProduto === "string" && idProduto.trim() === "")) {

        const erro = new Error("Id do produto inválido");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    if (typeof idProduto !== "number" && typeof idProduto !== "string") {

        const erro = new Error("Id do produto inválido");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    const idProdutoNum = Number(idProduto);

    if (!Number.isInteger(idProdutoNum) || idProdutoNum <= 0) {

        const erro = new Error("Id do produto inválido");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    //validações quantidadeFisica e conversão
    if (quantidadeFisica === undefined || quantidadeFisica === null || (typeof quantidadeFisica === "string" && quantidadeFisica.trim() === "")) {

        const erro = new Error("Quantidade encontrada inválida");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    if (typeof quantidadeFisica !== "number" && typeof quantidadeFisica !== "string") {

        const erro = new Error("Quantidade encontrada inválida");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    const quantidadeFisicaNum = Number(quantidadeFisica);

    if (!Number.isFinite(quantidadeFisicaNum) || !Number.isInteger(quantidadeFisicaNum) || quantidadeFisicaNum < 0) {

        const erro = new Error("Quantidade encontrada inválida");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    //validações motivo
    if (typeof motivo !== "string" || motivo.trim() === "") {

        const erro = new Error("Motivo inválido");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    const motivoFinal = motivo.trim();

    //iniciar transação para consultar o produto e realizar o ajuste de estoque

    let client;

    let transacaoIniciada = false;

    let etapa = "conectar ao banco de dados";

    let descartarConexao = false;

    try {

        client = await db.connect();

        etapa = "iniciar transação";

        await client.query("BEGIN");

        transacaoIniciada = true;

        //consultar e bloquear produto para realizar o ajuste

        etapa = "buscar e bloquear produto";

        const produto = await movimentacoesRepository.buscarProdutoParaAjuste(idProdutoNum, client);

        if (!produto) {

            const erro = new Error("Produto nao encontrado");
            erro.status = 404;
            erro.mensagem = erro.message;
            throw erro;
        }

        //impedir ajustes em produtos excluídos

        if (produto.excluido) {

            const erro = new Error("O produto foi excluido");
            erro.status = 409;
            erro.mensagem = erro.message;
            throw erro;
        }

        //impedir ajustes em produtos inativos

        if (!produto.ativo) {

            const erro = new Error("O produto não está ativo");
            erro.status = 409;
            erro.mensagem = erro.message;
            throw erro;
        }

        const quantidadeAtual = Number(produto.quantidade);

        const diferenca = quantidadeFisicaNum - quantidadeAtual;

        //impedir ajuste quando não existe diferença no estoque

        if (diferenca === 0) {

            const erro = new Error("A quantidade física é igual a quantidade registrada");
            erro.status = 409;
            erro.mensagem = erro.message;
            throw erro;
        }

        const custoMedioAtual = Number(produto.custo_medio);

        let custoMedioFinal = custoMedioAtual;

        let custoUnitarioAjuste = null;

        if (diferenca > 0 && custoMedioAtual === 0) {

            if (custoUnitario === undefined || custoUnitario === null ||
                 (typeof custoUnitario !== "number" && typeof custoUnitario !== "string") ||
                  (typeof custoUnitario === "string" && custoUnitario.trim() === "")) {

                const erro = new Error("Informe um custo unitário válido para as unidades adicionadas.");
                erro.status = 400;
                erro.mensagem = erro.message;
                throw erro;
            }

            const custoUnitarioNum = Number(custoUnitario);

            if (!Number.isFinite(custoUnitarioNum) || custoUnitarioNum <= 0) {
                const erro = new Error("Informe um custo unitário válido para as unidades adicionadas.");
                erro.status = 400;
                erro.mensagem = erro.message;
                throw erro;
            }

            custoUnitarioAjuste = Number(custoUnitarioNum.toFixed(4));

            if (custoUnitarioAjuste <= 0) {
                const erro = new Error("Informe um custo unitário válido para as unidades adicionadas.");
                erro.status = 400;
                erro.mensagem = erro.message;
                throw erro;
            }

            custoMedioFinal = Number(((quantidadeAtual * custoMedioAtual + diferenca * custoUnitarioAjuste) / quantidadeFisicaNum).toFixed(4));
        }

        if (quantidadeFisicaNum === 0) {
            custoMedioFinal = 0;
        }

        //atualizar estoque

        etapa = "atualizar estoque do produto";

        const produtoAtualizado = await movimentacoesRepository.atualizarEstoque(idProdutoNum, quantidadeFisicaNum, custoMedioFinal,
            client);

        if (!produtoAtualizado) {

            const erro = new Error("Produto nao encontrado");
            erro.status = 404;
            erro.mensagem = erro.message;
            throw erro;
        }

        //cadastrar a movimentação de ajuste

        etapa = "cadastrar movimentação";

        const movimentacao = await movimentacoesRepository.cadastrarAjuste({
            idProduto: idProdutoNum, quantidade: Math.abs(diferenca),
            quantidadeAnterior: quantidadeAtual, quantidadeFinal: quantidadeFisicaNum, diferenca, motivo: motivoFinal,
            custoMedioAposMovimentacao: custoMedioFinal, custoUnitario: custoUnitarioAjuste,
            custoTotalMovimentacao: custoUnitarioAjuste === null ? null : diferenca * custoUnitarioAjuste
        }, client);

        if (!movimentacao) {

            const erro = new Error("Não foi possível registrar a movimentação de ajuste");
            erro.status = 500;
            erro.mensagem = erro.message;
            throw erro;
        }

        //realizar o commit finalizando a transação

        etapa = "confirmar transação";

        await client.query("COMMIT");

        transacaoIniciada = false;

        return movimentacao;

    } catch (erro) {
        console.error(erro);
        console.error(`Falha na etapa: ${etapa}`);

        if (transacaoIniciada) {

            const transacaoRevertida = await reverterTransacao(client);

            if (!transacaoRevertida) {

                descartarConexao = true;

                const erroRollback = new Error("Erro ao reverter a transação.");
                erroRollback.status = 500;
                erroRollback.mensagem = erroRollback.message;

                throw erroRollback;
            }

            transacaoIniciada = false;
        }

        throw erro;

    } finally {

        if (client) {

            if (descartarConexao) {

                client.release(new Error("Falha ao reverter a transação."));

            } else {

                client.release();
            }
        }
    }
}
