import * as categoriasService from "../services/categorias.service.js";


export async function listar(req, res) {
    try {
        const categorias = await categoriasService.listar();

        return res.status(200).json({mensagem: "Categorias encontradas com sucesso.", dados: categorias});

    } catch (erro) {
        console.error("Erro ao buscar categorias:", erro);

        return res.status(500).json({ erro: "Erro interno do servidor."});
    }
}

export async function cadastrar(req, res) {
    try {
        const { nome } = req.body;

        const categoria = await categoriasService.cadastrar(nome);

        return res.status(201).json({mensagem: "Categoria cadastrada com sucesso.", dados: categoria});

    } catch (erro) {
        console.error("Erro ao cadastrar categoria:", erro);

        return res.status(erro.status || 500).json({erro: erro.mensagem || "Erro interno do servidor."});
    }
}

export async function editar(req, res) {
    try {
        const id = Number(req.params.id);
        const { nome } = req.body;

        const categoria = await categoriasService.editar(id, nome);

        return res.status(200).json({ mensagem: "Categoria atualizada com sucesso.", dados: categoria});

    } catch (erro) {
        console.error("Erro ao editar categoria:", erro);

        return res.status(erro.status || 500).json({erro: erro.mensagem || "Erro interno do servidor."});
    }
}


export async function excluir(req, res) {
    try {
        const id = Number(req.params.id);

        const categoria = await categoriasService.excluir(id);

        return res.status(200).json({mensagem: "Categoria excluída com sucesso.",dados: categoria});

    } catch (erro) {
        console.error("Erro ao excluir categoria:", erro);

        return res.status(erro.status || 500).json({erro: erro.mensagem || "Erro interno do servidor."});
    }
}
