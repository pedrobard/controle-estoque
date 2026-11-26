export function verificarAutenticacao(req, res, next) {
    if (req.session?.autenticado !== true || !req.session?.idAdministrador) {
        return res.status(401).json({ erro: "Autenticação necessária." });
    }

    const cincoHoras = 5 * 60 * 60 * 1000;
    const autenticadoEm = req.session.autenticadoEm;

    if (!Number.isFinite(autenticadoEm) || Date.now() - autenticadoEm >= cincoHoras) {
        return req.session.destroy((erro) => {
            if (erro) {
                console.error("Erro ao destruir sessão expirada:", erro);
            }

            res.clearCookie("connect.sid");

            return res.status(401).json({ erro: "Sua sessão expirou. Faça login novamente."});
        });
    }

    next();
}