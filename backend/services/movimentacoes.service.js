
import * as movimentacoesRepository from "../repositories/movimentacoes.repository.js";
import db from "../db.js";
import { reverterTransacao } from "../utils/transacoes.js";

export async function listar() {
    const movimentacoes = await movimentacoesRepository.listar();

    return movimentacoes;
}

export async function cadastrar(dados) {
    const { idProduto, tipo, quantidade, valorUnitario } = dados;

    //validações idProduto e conversão
    if (idProduto === undefined || idProduto === null || (typeof idProduto === "string" && idProduto.trim() === "")) {

        const erro = new Error("ID do produto inválido.");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    if (typeof idProduto !== "number" && typeof idProduto !== "string") {

        const erro = new Error("ID do produto inválido.");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    const idProdutoNum = Number(idProduto);

    if (!Number.isInteger(idProdutoNum) || idProdutoNum <= 0) {

        const erro = new Error("ID do produto inválido.");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    //validações tipo e conversão
    if (typeof tipo !== "string" || tipo.trim() === "") {

        const erro = new Error("Tipo de movimentação inválido.");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    if (tipo !== "entrada" && tipo !== "saida") {

        const erro = new Error("Tipo de movimentação inválido.");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    //validações quantidade e conversão
    if (quantidade === undefined || quantidade === null || (typeof quantidade === "string" && quantidade.trim() === "")) {

        const erro = new Error("Quantidade inválida.");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    if (typeof quantidade !== "number" && typeof quantidade !== "string") {

        const erro = new Error("Quantidade inválida.");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    const quantidadeNum = Number(quantidade);

    if (!Number.isFinite(quantidadeNum) || !Number.isInteger(quantidadeNum) || quantidadeNum <= 0) {

        const erro = new Error("A quantidade deve ser um número inteiro maior que zero.");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    //validações valorUnitario e conversão
    if (valorUnitario === undefined || valorUnitario === null || (typeof valorUnitario === "string" && valorUnitario.trim() === "")) {

        const erro = new Error("Valor unitário inválido.");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    if (typeof valorUnitario !== "number" && typeof valorUnitario !== "string") {

        const erro = new Error("Valor unitário inválido.");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    const valorUnitarioNum = Number(Number(valorUnitario).toFixed(4));

    if (!Number.isFinite(valorUnitarioNum) || valorUnitarioNum <= 0) {
        const erro = new Error("O valor unitário deve ser maior que zero.");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }



    let client;
    let transacaoIniciada = false;
    let etapa = "conectar ao banco de dados";
    let descartarConexao = false;

    try {
        client = await db.connect();

        etapa = "iniciar transação";

        await client.query("BEGIN");

        transacaoIniciada = true;

        etapa = "buscar e bloquear produto";

        const produto = await movimentacoesRepository.buscarProdutoParaAtualizacao(
            idProdutoNum,
            client
        );

        if (!produto) {
            const erro = new Error("Produto não encontrado.");
            erro.status = 404;
            erro.mensagem = erro.message;
            throw erro;
        }

        if (!produto.ativo) {
            const erro = new Error("Não é possível movimentar um produto inativo.");
            erro.status = 409;
            erro.mensagem = erro.message;
            throw erro;
        }

        const quantidadeAnterior = Number(produto.quantidade);

        const custoMedioAtual = Number(produto.custo_medio);

        let movimentacao;

        if (tipo === "entrada") {
            const custoTotalMovimentacao = quantidadeNum * valorUnitarioNum;

            const novaQuantidade = quantidadeAnterior + quantidadeNum;

            const novoCustoMedio = Number((((quantidadeAnterior * custoMedioAtual) + custoTotalMovimentacao) / novaQuantidade).toFixed(4));

            etapa = "atualizar estoque do produto";

            await movimentacoesRepository.atualizarEstoque(idProdutoNum, novaQuantidade, novoCustoMedio, client);

            etapa = "cadastrar movimentação";

            movimentacao = await movimentacoesRepository.cadastrar({
                idProduto: idProdutoNum, tipo, quantidade: quantidadeNum, custoUnitario: valorUnitarioNum,
                precoUnitarioVenda: null, custoTotalMovimentacao, custoMedioAposMovimentacao: novoCustoMedio,
                valorTotalVenda: null, lucroBrutoMovimentacao: null, quantidadeAnterior, quantidadeFinal: novaQuantidade
            }, client);

            //saida
        } else {
            if (quantidadeNum > quantidadeAnterior) {
                const erro = new Error("Estoque insuficiente para realizar essa saída.");
                erro.status = 409;
                erro.mensagem = erro.message;
                throw erro;
            }

            const novaQuantidade = quantidadeAnterior - quantidadeNum;

            const custoTotalMovimentacao = quantidadeNum * custoMedioAtual;

            const valorTotalVenda = quantidadeNum * valorUnitarioNum;

            const lucroBrutoMovimentacao = valorTotalVenda - custoTotalMovimentacao;

            const novoCustoMedio = novaQuantidade === 0 ? 0 : custoMedioAtual;

            //atualizar estoque

            etapa = "atualizar estoque do produto";

            await movimentacoesRepository.atualizarEstoque(idProdutoNum, novaQuantidade, novoCustoMedio, client);

            //cadastrar a movimentação

            etapa = "cadastrar movimentação";

            movimentacao = await movimentacoesRepository.cadastrar({
                idProduto: idProdutoNum, tipo, quantidade: quantidadeNum, custoUnitario: custoMedioAtual,
                precoUnitarioVenda: valorUnitarioNum, custoTotalMovimentacao, custoMedioAposMovimentacao: novoCustoMedio,
                valorTotalVenda, lucroBrutoMovimentacao, quantidadeAnterior, quantidadeFinal: novaQuantidade
            }, client);
        }

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



export async function estornar(id, motivo) {

    // validação do ID da movimentação original
    if (id === undefined || id === null || (typeof id === "string" && id.trim() === "")) {
        const erro = new Error("ID da movimentação inválido.");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    if (typeof id !== "number" && typeof id !== "string") {
        const erro = new Error("ID da movimentação inválido.");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    const idMovimentacaoOriginal = Number(id);

    if (!Number.isInteger(idMovimentacaoOriginal) || idMovimentacaoOriginal <= 0) {
        const erro = new Error("ID da movimentação inválido.");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    // validação do motivo do estorno
    if (typeof motivo !== "string" || motivo.trim() === "") {
        const erro = new Error("O motivo do estorno é obrigatório.");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    motivo = motivo.trim();

    // iniciar transação para consultar a movimentação original
    // reconstruir o estoque e realizar o estorno

    let client;
    let transacaoIniciada = false;
    let etapa = "conectar ao banco de dados";
    let descartarConexao = false;

    try {
        client = await db.connect();

        etapa = "iniciar transação";

        await client.query("BEGIN");

        transacaoIniciada = true;

        // consultar o produto da movimentação
        etapa = "consultar produto da movimentação";

        const produtoMovimentacao = await movimentacoesRepository.buscarProdutoDaMovimentacao(idMovimentacaoOriginal, client);

        if (!produtoMovimentacao) {
            const erro = new Error("Movimentação não encontrada.");
            erro.status = 404;
            erro.mensagem = erro.message;
            throw erro;
        }

        const idProduto = produtoMovimentacao.id_produto;

        // pegar a quantidade atual do produto antes de atualizar o estoque
        // bloquear o produto antes de bloquear a movimentação original

        etapa = "bloquear produto";

        const produto = await movimentacoesRepository.buscarProdutoParaEstorno(idProduto, client);

        if (!produto) {
            const erro = new Error("Produto não encontrado.");
            erro.status = 404;
            erro.mensagem = erro.message;
            throw erro;
        }

        if (produto.excluido) {
            const erro = new Error("Não é possível estornar movimentações de um produto excluído.");
            erro.status = 409;
            erro.mensagem = erro.message;
            throw erro;
        }

        if (!produto.ativo) {
            const erro = new Error("Não é possível estornar movimentações de um produto inativo.");
            erro.status = 409;
            erro.mensagem = erro.message;
            throw erro;
        }

        // bloquear e consultar a movimentação original após bloquear o produto

        etapa = "consultar movimentação original";

        const movimentacaoOriginal = await movimentacoesRepository.buscarMovimentacaoParaEstorno(idMovimentacaoOriginal, client);

        if (!movimentacaoOriginal) {
            const erro = new Error("Movimentação não encontrada.");
            erro.status = 404;
            erro.mensagem = erro.message;
            throw erro;
        }

        // impedir o estorno de movimentações que não podem ser estornadas

        if (movimentacaoOriginal.tipo === "estoque inicial") {
            const erro = new Error("Não é possível estornar o estoque inicial.");
            erro.status = 409;
            erro.mensagem = erro.message;
            throw erro;
        }

        if (movimentacaoOriginal.tipo === "estorno") {
            const erro = new Error("Não é possível estornar uma movimentação de estorno.");
            erro.status = 409;
            erro.mensagem = erro.message;
            throw erro;
        }

        if (movimentacaoOriginal.estornada) {
            const erro = new Error("Esta movimentação já foi estornada.");
            erro.status = 409;
            erro.mensagem = erro.message;
            throw erro;
        }


        // consultar as movimentações ligadas ao produto e preparar para reconstrução do estoque

        etapa = "consultar histórico de movimentações";

        const movimentacoes = await movimentacoesRepository.listarMovimentacoesParaReconstrucao(idProduto, client);

        if (movimentacoes.length === 0) {
            const erro = new Error("Não existem movimentações para reconstruir o estoque.");
            erro.status = 500;
            erro.mensagem = erro.message;
            throw erro;
        }

        // reconstruir estoque

        let quantidadeReconstruida = 0;
        let custoMedioReconstruido = 0;

        // Ignorar a movimentação que está sendo estornada, os estornos e as movimentações já estornadas
        for (const movimentacao of movimentacoes) {
            if (Number(movimentacao.id_movimentacao) === idMovimentacaoOriginal || movimentacao.estornada === true || movimentacao.tipo === "estorno") {
                continue;
            }
            if (movimentacao.tipo === "estoque inicial") {
                quantidadeReconstruida = Number(movimentacao.quantidade);
                custoMedioReconstruido = Number(movimentacao.custo_unitario);
            }



            else if (movimentacao.tipo === "entrada") {
                const quantidadeEntrada = Number(movimentacao.quantidade);
                const custoUnitarioEntrada = Number(movimentacao.custo_unitario);

                const quantidadeFinal = quantidadeReconstruida + quantidadeEntrada;

                // impedir divisão por zero ou quantidade final inválida
                if (quantidadeFinal <= 0) {
                    const erro = new Error("Histórico de movimentações inconsistente.");
                    erro.status = 400;
                    erro.mensagem = erro.message;
                    throw erro;
                }

                custoMedioReconstruido = Number((((quantidadeReconstruida * custoMedioReconstruido) + (quantidadeEntrada * custoUnitarioEntrada)) / quantidadeFinal).toFixed(4));

                quantidadeReconstruida = quantidadeFinal;


            }

            else if (movimentacao.tipo === "saida") {
                const quantidadeSaida = Number(movimentacao.quantidade);

                if (quantidadeSaida > quantidadeReconstruida) {
                    const erro = new Error("Histórico de movimentações inconsistente: saída superior ao estoque disponível.");
                    erro.status = 500;
                    erro.mensagem = erro.message;
                    throw erro;
                }

                quantidadeReconstruida -= quantidadeSaida;

                if (quantidadeReconstruida === 0) {
                    custoMedioReconstruido = 0;
                }
            }


            else if (movimentacao.tipo === "ajuste") {
                const diferenca = Number(movimentacao.diferenca);

                const quantidadeAnteriorAjuste = quantidadeReconstruida;

                quantidadeReconstruida += diferenca;

                if (quantidadeReconstruida < 0) {
                    const erro = new Error("Histórico de movimentações inconsistente: o ajuste resultou em estoque negativo.");
                    erro.status = 500;
                    erro.mensagem = erro.message;
                    throw erro;
                }

                if (diferenca > 0) {

                    const custoUnitarioAjuste = Number(movimentacao.custo_unitario ?? custoMedioReconstruido);

                    if (!Number.isFinite(custoUnitarioAjuste) || custoUnitarioAjuste <= 0) {
                        const erro = new Error("Histórico de movimentações inconsistente: custo unitário inválido no ajuste.");
                        erro.status = 500;
                        erro.mensagem = erro.message;
                        throw erro;
                    }

                    custoMedioReconstruido = Number((((quantidadeAnteriorAjuste * custoMedioReconstruido) + (diferenca * custoUnitarioAjuste)) / quantidadeReconstruida).toFixed(4));
                }

                // Estoque zerado não possui custo médio
                if (quantidadeReconstruida === 0) {
                    custoMedioReconstruido = 0;
                }
            }
            else {
                const erro = new Error("Tipo de movimentação inválido no histórico.");
                erro.status = 500;
                erro.mensagem = erro.message;
                throw erro;
            }

            // validar os valores reconstruídos após cada movimentação
            if (!Number.isFinite(quantidadeReconstruida) || quantidadeReconstruida < 0 ||
                !Number.isFinite(custoMedioReconstruido) || custoMedioReconstruido < 0) {
                const erro = new Error("Histórico de movimentações inconsistente.");
                erro.status = 500;
                erro.mensagem = erro.message;
                throw erro;
            }

        }

        // calcular a diferença entre o estoque atual e o estoque reconstruído

        const quantidadeAtual = Number(produto.quantidade);
        const diferenca = quantidadeReconstruida - quantidadeAtual;

        // atualizar o produto com os novos dados do estoque reconstruído

        etapa = "atualizar estoque do produto";

        const produtoAtualizado = await movimentacoesRepository.atualizarEstoque(idProduto, quantidadeReconstruida,
            custoMedioReconstruido, client);

        if (!produtoAtualizado) {
            const erro = new Error("Não foi possível atualizar o estoque do produto.");
            erro.status = 500;
            erro.mensagem = erro.message;
            throw erro;
        }

        // atualizar a movimentação original alterando o campo estornada para true

        etapa = "marcar movimentação original como estornada";

        const movimentacaoEstornada = await movimentacoesRepository.marcarMovimentacaoComoEstornada(idMovimentacaoOriginal, client);

        if (!movimentacaoEstornada) {
            const erro = new Error("Esta movimentação já foi estornada.");
            erro.status = 409;
            erro.mensagem = erro.message;
            throw erro;
        }

        // inserir a movimentação de estorno no banco de dados

        etapa = "cadastrar movimentação de estorno";

        const estorno = await movimentacoesRepository.cadastrarEstorno({
            idProduto, quantidade: movimentacaoOriginal.quantidade,
            quantidadeAnterior: quantidadeAtual, quantidadeFinal: quantidadeReconstruida, diferenca, idMovimentacaoOriginal,
            tipoMovimentacaoOriginal: movimentacaoOriginal.tipo, motivo, custoMedioAposMovimentacao: custoMedioReconstruido
        },
            client);

        if (!estorno) {
            const erro = new Error("Não foi possível cadastrar a movimentação de estorno.");
            erro.status = 500;
            erro.mensagem = erro.message;
            throw erro;
        }

        // realizar o commit finalizando a transação

        etapa = "confirmar transação";

        await client.query("COMMIT");

        transacaoIniciada = false;

        return estorno;

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