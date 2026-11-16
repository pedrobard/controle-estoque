export function validarCorpoRequisicao(req, res, next) {
    const corpo = req.body;

    if (corpo === undefined || corpo === null || typeof corpo !== "object" || Array.isArray(corpo)) {
        return res.status(400).json({ erro: "Corpo da requisição inválido."});
    }

    next();
}