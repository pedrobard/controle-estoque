import * as produtosRepository from "../repositories/produtos.repository.js";
import db from "../db.js";
import { reverterTransacao } from "../utils/transacoes.js";


export async function listar() {
    const produtos = await produtosRepository.listar();

    return produtos;
}


export async function buscarPorId(id) {
    if (!Number.isInteger(id) || id <= 0) {

        const erro = new Error("O ID é inválido.");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    const produto = await produtosRepository.buscarPorId(id);

    if (!produto) {

        const erro = new Error("Produto não encontrado.");
        erro.status = 404;
        erro.mensagem = erro.message;
        throw erro;
    }

    return produto;
}



export async function cadastrar(dados) {
    const { nome, idCategoria, quantidade, custoInicial = 0, preco, estoqueMinimo } = dados;

    if (typeof nome !== "string" || nome.trim() === "") {

        const erro = new Error("Nome inválido.");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    if ((typeof idCategoria !== "number" && typeof idCategoria !== "string") ||
        !Number.isInteger(Number(idCategoria)) || Number(idCategoria) <= 0) {

        const erro = new Error("A categoria selecionada é inválida.");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    if ((typeof quantidade !== "number" && typeof quantidade !== "string") ||
        !Number.isInteger(Number(quantidade)) || Number(quantidade) < 0) {

        const erro = new Error("A quantidade deve ser um número inteiro maior ou igual a zero.");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    if ((typeof custoInicial !== "number" && typeof custoInicial !== "string") ||
        !Number.isFinite(Number(custoInicial)) || Number(custoInicial) < 0) {

        const erro = new Error("O custo inicial deve ser maior ou igual a zero.");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    if ((typeof preco !== "number" && typeof preco !== "string") ||
        !Number.isFinite(Number(preco)) || Number(preco) <= 0) {

        const erro = new Error("O preço de venda deve ser maior que zero.");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    if ((typeof estoqueMinimo !== "number" && typeof estoqueMinimo !== "string") ||
        !Number.isInteger(Number(estoqueMinimo)) || Number(estoqueMinimo) < 0) {

        const erro = new Error("O estoque mínimo deve ser um número inteiro maior ou igual a zero.");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    const idCategoriaNum = Number(idCategoria);

    const quantidadeNum = Number(quantidade);

    const custoInicialNum = Number(custoInicial);

    const precoNum = Number(preco);

    const estoqueMinimoNum = Number(estoqueMinimo);

    if (quantidadeNum > 0 && custoInicialNum <= 0) {

        const erro = new Error("O custo inicial deve ser maior que zero quando houver estoque inicial.");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    //cadastrar o produto e movimentação inicial
    const custoMedioInicial = quantidadeNum > 0 ? custoInicialNum : 0;

    let client;
    let transacaoIniciada = false;
    let etapa = "conectar ao banco de dados";
    let descartarConexao = false;

    try {
        client = await db.connect();

        // iniciar transação
        etapa = "iniciar transação";
        await client.query("BEGIN");
        transacaoIniciada = true;

        // verificar se a categoria existe e bloquear sua linha
        etapa = "consultar categoria";
        const categoriaExistente = await produtosRepository.buscarCategoriaPorId(idCategoriaNum, client);

        if (!categoriaExistente) {
            const erro = new Error("A categoria selecionada não existe.");
            erro.status = 404;
            erro.mensagem = erro.message;
            throw erro;
        }

        // cadastrar produto
        etapa = "cadastrar produto";
        const produto = await produtosRepository.cadastrar({
            idCategoria: idCategoriaNum,
            nome: nome.trim(),
            quantidade: quantidadeNum,
            custoMedio: custoMedioInicial,
            precoVendaPadrao: precoNum,
            estoqueMinimo: estoqueMinimoNum
        }, client);

        // cadastrar movimentação de estoque inicial, se houver quantidade
        if (quantidadeNum > 0) {
            etapa = "cadastrar estoque inicial";

            await produtosRepository.cadastrarEstoqueInicial({
                idProduto: produto.id_produto,
                quantidade: quantidadeNum,
                custoUnitario: custoInicialNum,
                custoTotal: quantidadeNum * custoInicialNum,
                custoMedio: custoMedioInicial
            }, client);
        }

        // confirmar transação
        etapa = "confirmar transação";
        await client.query("COMMIT");
        transacaoIniciada = false;

        return produto;

    } catch (erro) {
        console.error(erro);
        console.error(`Falha na etapa: ${etapa}`);

        if (transacaoIniciada) {
            const transacaoRevertida = await reverterTransacao(client);

            if (!transacaoRevertida) {
                descartarConexao = true;

                const erroRollback = new Error("Erro ao reverter a transação");
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
                client.release(new Error("Falha ao reverter a transação"));
            } else {
                client.release();
            }
        }
    }

}



export async function editar(id, dados) {
    const { nome, idCategoria, preco, estoqueMinimo } = dados;

    if (!Number.isInteger(id) || id <= 0) {

        const erro = new Error("O ID é inválido.");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    if (typeof nome !== "string" || nome.trim() === "") {

        const erro = new Error("Nome inválido.");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    if ((typeof idCategoria !== "number" && typeof idCategoria !== "string") ||
        !Number.isInteger(Number(idCategoria)) || Number(idCategoria) <= 0) {

        const erro = new Error("A categoria selecionada é inválida.");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    if ((typeof preco !== "number" && typeof preco !== "string") ||
        !Number.isFinite(Number(preco)) || Number(preco) <= 0) {

        const erro = new Error("O preço de venda deve ser maior que zero.");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    if ((typeof estoqueMinimo !== "number" && typeof estoqueMinimo !== "string") ||
        !Number.isInteger(Number(estoqueMinimo)) || Number(estoqueMinimo) < 0) {

        const erro = new Error("O estoque mínimo deve ser um número inteiro maior ou igual a zero.");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    const idCategoriaNum = Number(idCategoria);
    const precoNum = Number(preco);
    const estoqueMinimoNum = Number(estoqueMinimo);


    let client;
    let transacaoIniciada = false;
    let etapa = "conectar ao banco de dados";
    let descartarConexao = false;

    try {
        client = await db.connect();

        // iniciar transação
        etapa = "iniciar transação";
        await client.query("BEGIN");
        transacaoIniciada = true;

        // bloquear produto para edição
        etapa = "consultar produto";
        const produtoExistente = await produtosRepository.buscarParaAtualizacao(id, client);

        if (!produtoExistente) {
            const erro = new Error("Produto não encontrado.");
            erro.status = 404;
            erro.mensagem = erro.message;
            throw erro;
        }

        if (produtoExistente.excluido) {
            const erro = new Error("Não é possível editar um produto excluído.");
            erro.status = 409;
            erro.mensagem = erro.message;
            throw erro;
        }


        // verificar se a categoria existe
        etapa = "consultar categoria";
        const categoriaExistente = await produtosRepository.buscarCategoriaPorId(idCategoriaNum, client);

        if (!categoriaExistente) {
            const erro = new Error("Essa categoria não está cadastrada.");
            erro.status = 404;
            erro.mensagem = erro.message;
            throw erro;
        }

        // atualizar produto
        etapa = "atualizar produto";
        const produtoAtualizado = await produtosRepository.editar(id,
            {
                nome: nome.trim(),
                idCategoria: idCategoriaNum,
                preco: precoNum,
                estoqueMinimo: estoqueMinimoNum
            },
            client);

        if (!produtoAtualizado) {
            const erro = new Error("Não foi possível editar o produto.");
            erro.status = 500;
            erro.mensagem = erro.message;
            throw erro;
        }

        // confirmar transação
        etapa = "confirmar transação";
        await client.query("COMMIT");
        transacaoIniciada = false;

        return produtoAtualizado;


    } catch (erro) {
        console.error(erro);
        console.error(`Falha na etapa: ${etapa}`);

        if (transacaoIniciada) {
            const transacaoRevertida = await reverterTransacao(client);

            if (!transacaoRevertida) {
                descartarConexao = true;

                const erroRollback = new Error("Erro ao reverter a transação");
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
                client.release(new Error("Falha ao reverter a transação"));
            } else {
                client.release();
            }
        }
    }
}


export async function alterarStatus(id, statusSolicitado) {

    // validar ID
    if (!Number.isInteger(id) || id <= 0) {

        const erro = new Error("O ID é inválido.");
        erro.status = 400;
        erro.mensagem = erro.message;
        throw erro;
    }

    // validar status
    if (typeof statusSolicitado !== "boolean") {

        const erro = new Error("O status informado é inválido.");
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

        // iniciar transação
        etapa = "iniciar transação";
        await client.query("BEGIN");
        transacaoIniciada = true;

        // bloquear produto para alteração
        etapa = "consultar produto";
        const produtoExistente = await produtosRepository.buscarParaAtualizacao(id, client);

        if (!produtoExistente) {
            const erro = new Error("Produto não encontrado.");
            erro.status = 404;
            erro.mensagem = erro.message;
            throw erro;
        }

        if (produtoExistente.excluido) {
            const erro = new Error("Não é possível alterar o status de um produto excluído.");
            erro.status = 409;
            erro.mensagem = erro.message;
            throw erro;
        }

        // verificar se o produto já possui o status solicitado
        if (produtoExistente.ativo === statusSolicitado) {

            etapa = "desfazer transação";
            const transacaoRevertida = await reverterTransacao(client);

            if (!transacaoRevertida) {
                descartarConexao = true;

                const erroRollback = new Error("Erro ao reverter a transação.");
                erroRollback.status = 500;
                erroRollback.mensagem = erroRollback.message;

                throw erroRollback;
            }

            transacaoIniciada = false;

            return {
                alterado: false,
                produto: produtoExistente
            };
        }

        // atualizar status
        etapa = "atualizar status";
        const produtoAtualizado = await produtosRepository.alterarStatus(id, statusSolicitado, client);

        if (!produtoAtualizado) {
            const erro = new Error("Não foi possível alterar o status do produto.");
            erro.status = 500;
            erro.mensagem = erro.message;
            throw erro;
        }

        // confirmar transação
        etapa = "confirmar transação";
        await client.query("COMMIT");
        transacaoIniciada = false;

        return {
            alterado: true,
            produto: produtoAtualizado
        };

    } catch (erro) {
        console.error(erro);
        console.error(`Falha na etapa: ${etapa}`);

        if (transacaoIniciada) {
            const transacaoRevertida = await reverterTransacao(client);

            if (!transacaoRevertida) {
                descartarConexao = true;

                const erroRollback = new Error("Erro ao reverter a transação");
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
                client.release(new Error("Falha ao reverter a transação"));
            } else {
                client.release();
            }
        }
    }
}

export async function excluir(id) {

    // validar ID
    if (!Number.isInteger(id) || id <= 0) {

        const erro = new Error("O ID é inválido.");
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

        // iniciar transação
        etapa = "iniciar transação";
        await client.query("BEGIN");
        transacaoIniciada = true;

        // bloquear produto para exclusão
        etapa = "consultar produto";
        const produtoExistente = await produtosRepository.buscarParaExclusao(id, client);

        if (!produtoExistente) {
            const erro = new Error("Produto não encontrado.");
            erro.status = 404;
            erro.mensagem = erro.message;
            throw erro;
        }

        if (produtoExistente.excluido) {
            const erro = new Error("O produto já foi excluído.");
            erro.status = 409;
            erro.mensagem = erro.message;
            throw erro;
        }

        if (produtoExistente.quantidade > 0) {
            const erro = new Error("Não é possível excluir um produto que possui estoque.");
            erro.status = 409;
            erro.mensagem = erro.message;
            throw erro;
        }

        if (produtoExistente.ativo) {
            const erro = new Error("É necessário inativar o produto antes de excluí-lo.");
            erro.status = 409;
            erro.mensagem = erro.message;
            throw erro;
        }

        // excluir produto logicamente
        etapa = "excluir produto";
        const produtoExcluido = await produtosRepository.excluir(id, client);

        if (!produtoExcluido) {
            const erro = new Error("Não foi possível excluir o produto.");
            erro.status = 500;
            erro.mensagem = erro.message;
            throw erro;
        }

        // confirmar transação
        etapa = "confirmar transação";
        await client.query("COMMIT");
        transacaoIniciada = false;

        return produtoExcluido;

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
                client.release(new Error("Falha ao reverter a transação"));
            } else {
                client.release();
            }
        }
    }
}