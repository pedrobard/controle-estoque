
import * as produtosService from "../services/produtos.service.js";


export async function listar(req, res) {
    try {
        const produtos = await produtosService.listar();

        return res.status(200).json({ mensagem: "Produtos encontrados com sucesso.", dados: produtos });

    } catch (erro) {
        console.error("Erro ao buscar produtos:", erro);

        return res.status(500).json({ erro: "Erro interno do servidor." });
    }
}


export async function buscarPorId(req, res) {
    try {
        const id = Number(req.params.id);

        const produto = await produtosService.buscarPorId(id);

        return res.status(200).json({
            mensagem: "Produto encontrado com sucesso.", dados: produto
        });

    } catch (erro) {
        console.error("Erro ao buscar produto:", erro);

        return res.status(erro.status || 500).json({ erro: erro.mensagem || "Erro interno do servidor." });
    }
}


export async function cadastrar(req, res) {
    try {
        const { nome, idCategoria, quantidade, custoInicial, preco, estoqueMinimo } = req.body;

        const produto = await produtosService.cadastrar({ nome, idCategoria, quantidade, custoInicial, preco, estoqueMinimo });

        return res.status(201).json({ mensagem: "Produto cadastrado com sucesso.", dados: produto });

    } catch (erro) {
        console.error("Erro ao cadastrar produto:", erro);

        return res.status(erro.status || 500).json({ erro: erro.mensagem || "Erro interno do servidor." });
    }
}


export async function editar(req, res) {
    try {
        const id = Number(req.params.id);

        const { nome, idCategoria, preco, estoqueMinimo } = req.body;

        const produto = await produtosService.editar(id, { nome, idCategoria, preco, estoqueMinimo });

        return res.status(200).json({ mensagem: "Produto atualizado com sucesso.", dados: produto });

    } catch (erro) {
        console.error("Erro ao editar produto:", erro);

        return res.status(erro.status || 500).json({ erro: erro.mensagem || "Erro interno do servidor." });
    }
}


export async function alterarStatus(req, res) {
    try {
        const id = Number(req.params.id);
        const { ativo } = req.body;

        const resultado = await produtosService.alterarStatus(id, ativo);

        if (!resultado.alterado) {
            return res.status(200).json({mensagem: "O produto já possui esse status.", dados: resultado.produto});
        }

        return res.status(200).json({mensagem: "Status do produto atualizado com sucesso.", dados: resultado.produto});

    } catch (erro) {
        console.error("Erro ao alterar status do produto:", erro);

        return res.status(erro.status || 500).json({erro: erro.mensagem || "Erro interno do servidor."});
    }
}


export async function excluir(req, res) {
    try {
        const id = Number(req.params.id);

        const produto = await produtosService.excluir(id);

        return res.status(200).json({ mensagem: "Produto excluído com sucesso.", dados: produto });

    } catch (erro) {
        console.error("Erro ao excluir produto:", erro);

        return res.status(erro.status || 500).json({ erro: erro.mensagem || "Erro interno do servidor." });
    }
}
