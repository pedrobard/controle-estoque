import * as categoriasRepository from "../repositories/categorias.repository.js";
import db from "../db.js";
import { reverterTransacao } from "../utils/transacoes.js";




export async function listar() {
    const categorias = await categoriasRepository.listar();

    return categorias;
}

export async function cadastrar(nome) {
    if (typeof nome !== "string" || nome.trim() === "") {
        const erro = new Error("Nome inválido.");
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

        // verificar categoria duplicada
        etapa = "consultar categoria duplicada";
        const categoriaExistente = await categoriasRepository.buscarPorNome(nome.trim(), client);

        if (categoriaExistente) {
            const erro = new Error("Essa categoria já foi cadastrada.");
            erro.status = 409;
            erro.mensagem = erro.message;
            throw erro;
        }

        // cadastrar categoria
        etapa = "cadastrar categoria";
        const categoria = await categoriasRepository.cadastrar(nome.trim(), client);

        // confirmar transação
        etapa = "confirmar transação";
        await client.query("COMMIT");
        transacaoIniciada = false;

        return categoria;

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



        // tratar nome duplicado pelo índice único do banco
        if (erro.code === "23505") {
            const erroDuplicidade = new Error("Essa categoria já foi cadastrada.");
            erroDuplicidade.status = 409;
            erroDuplicidade.mensagem = erroDuplicidade.message;

            throw erroDuplicidade;
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


export async function editar(id, nome) {


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


    let client;
    let transacaoIniciada = false;
    let etapa = "conectar ao banco de dados";
    let descartarConexao = false;

    try {
        client = await db.connect();

        etapa = "iniciar transação";

        await client.query("BEGIN");

        transacaoIniciada = true;

        //categoria que esta tentando editar existe?
        etapa = "consultar categoria";
        const categoriaExistente = await categoriasRepository.buscarPorId(id, client);

        if (!categoriaExistente) {
            const erro = new Error("Categoria não encontrada.");
            erro.status = 404;
            erro.mensagem = erro.message;

            throw erro;
        }

        //verificar duplicidade
        etapa = "consultar categoria duplicada";
        const categoriaComMesmoNome = await categoriasRepository.buscarPorNome(nome.trim(), client);

        if (categoriaComMesmoNome && categoriaComMesmoNome.id !== id) {
            const erro = new Error("Essa categoria já foi cadastrada.");
            erro.status = 409;
            erro.mensagem = erro.message;

            throw erro;
        }

        //atualizar o nome da categoria
        etapa = "atualizar categoria";
        const categoriaAtualizada = await categoriasRepository.editar(id, nome.trim(), client);

        etapa = "confirmar transação";
        await client.query("COMMIT");

        transacaoIniciada = false;

        return categoriaAtualizada;

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



        // tratar nome duplicado pelo índice único do banco
        if (erro.code === "23505") {
            const erroDuplicidade = new Error("Essa categoria já foi cadastrada.");
            erroDuplicidade.status = 409;
            erroDuplicidade.mensagem = erroDuplicidade.message;

            throw erroDuplicidade;
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

        etapa = "iniciar transação";
        await client.query("BEGIN");
        transacaoIniciada = true;

        // consultar categoria e bloquear sua linha
        etapa = "consultar categoria";
        const categoriaExistente = await categoriasRepository.buscarPorId(id, client);

        if (!categoriaExistente) {
            const erro = new Error("Categoria não encontrada.");
            erro.status = 404;
            erro.mensagem = erro.message;
            throw erro;
        }

        // consultar produtos vinculados
        etapa = "consultar produtos vinculados";
        const produtoVinculado = await categoriasRepository.buscarProdutoVinculado(id, client);

        if (produtoVinculado) {
            const erro = new Error("A categoria possui produtos vinculados.");
            erro.status = 409;
            erro.mensagem = erro.message;
            throw erro;
        }

        // excluir categoria
        etapa = "excluir categoria";
        const categoriaExcluida = await categoriasRepository.excluir(id, client);

        if (!categoriaExcluida) {
            const erro = new Error("Categoria não encontrada.");
            erro.status = 404;
            erro.mensagem = erro.message;
            throw erro;
        }

        // confirmar transação
        etapa = "confirmar transação";
        await client.query("COMMIT");
        transacaoIniciada = false;

        return categoriaExcluida;

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

        // tratar violação de chave estrangeira
        if (erro.code === "23503") {
            const erroVinculo = new Error("A categoria possui produtos vinculados.");
            erroVinculo.status = 409;
            erroVinculo.mensagem = erroVinculo.message;

            throw erroVinculo;
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
