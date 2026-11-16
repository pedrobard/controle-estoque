import * as movimentacoesService from "../services/movimentacoes.service.js";

export async function listar(req, res) {
    try {
        const movimentacoes = await movimentacoesService.listar();

        return res.status(200).json({ mensagem: "Movimentações encontradas com sucesso.", dados: movimentacoes });

    } catch (erro) {
        console.error(erro);

        return res.status(500).json({ erro: "Erro interno do servidor." });
    }
}

export async function cadastrar(req, res) {
    try {
        const { idProduto, tipo, quantidade, valorUnitario } = req.body;

        const resultado = await movimentacoesService.cadastrar({idProduto, tipo, quantidade, valorUnitario});

        return res.status(201).json({ mensagem: "Movimentação cadastrada com sucesso.", dados: resultado});

    } catch (erro) {
        console.error("Erro ao cadastrar movimentação:", erro);

        return res.status(erro.status || 500).json({ erro: erro.mensagem || "Erro interno do servidor."});
    }
}

export async function estornar(req, res) {
    try {
        const id = req.params.id;
        const { motivo } = req.body;

        const resultado = await movimentacoesService.estornar(id, motivo);

        return res.status(201).json({ mensagem: "Movimentação estornada com sucesso.", dados: resultado });

    } catch (erro) {
        console.error(erro);

        return res.status(erro.status || 500).json({ erro: erro.mensagem || "Erro interno do servidor." });
    }
}