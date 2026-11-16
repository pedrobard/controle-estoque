
function tratarErrosJson(erro, req, res, next) {
    if (erro.type === "entity.parse.failed") {
        return res.status(400).json({erro: "Corpo da requisição contém um JSON inválido."});
    }

    next(erro);
}

export default tratarErrosJson;