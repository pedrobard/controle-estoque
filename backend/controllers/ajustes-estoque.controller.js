import * as ajustesEstoqueService from "../services/ajustes-estoque.service.js";

export async function ajustar(req, res) {
    try {
        const resultado = await ajustesEstoqueService.ajustar(req.body);

        return res.status(201).json({ mensagem: "Estoque ajustado com sucesso.", dados: resultado});

    } catch (erro) {
        console.error(erro);

        return res.status(erro.status || 500).json({ erro: erro.mensagem || "Erro interno do servidor."});
    }
}