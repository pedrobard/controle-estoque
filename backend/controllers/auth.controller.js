import * as authService from "../services/auth.service.js";

export async function login(req, res) {
    try {
        const { nomeUsuario, senha } = req.body;

        const resposta = await authService.login(nomeUsuario, senha);

        // Regenera o ID da sessão para iniciar uma autenticação temporária
        await new Promise((resolve, reject) => {
            req.session.regenerate((erro) => {
                if (erro) {
                    return reject(erro);
                }

                resolve();
            });
        });

        //Cookie fica ativo por 5min
        req.session.cookie.maxAge = 5 * 60 * 1000;

        //Identifica a sessão como uma autenticação pendente
        req.session.idAdministradorPendente = resposta.idAdministrador;
        req.session.etapaAutenticacao = "totp";

        //Garante que a sessão foi salva antes de responder
        await new Promise((resolve, reject) => {
            req.session.save((erro) => {
                if (erro) {
                    return reject(erro);
                }

                resolve();
            });
        });



        return res.status(200).json({ mensagem: "Credenciais verificadas com sucesso.", etapa: "totp" });
    } catch (erro) {
        console.error("Erro ao realizar login:", erro);

        return res.status(erro.status || 500).json({ erro: erro.mensagem || "Erro interno do servidor." });
    }
}


export async function verificarTotp(req, res) {
    try {

        // Verifica se existe uma sessão temporária
        if (!req.session.idAdministradorPendente || req.session.etapaAutenticacao !== "totp") {
            return res.status(401).json({ erro: "Sessão de autenticação inválida ou expirada." });
        }

        const { codigo } = req.body;
        const idAdministrador = req.session.idAdministradorPendente;

        const resposta = await authService.verificarTotp(idAdministrador, codigo);

        // Regenera o ID da sessão após a autenticação completa
        await new Promise((resolve, reject) => {
            req.session.regenerate((erro) => {
                if (erro) {
                    return reject(erro);
                }

                resolve();
            });
        });

        // Cookie fica ativo por 5 horas
        req.session.cookie.maxAge = 5 * 60 * 60 * 1000;

        // Identifica a sessão como autenticada
        req.session.idAdministrador = idAdministrador;
        req.session.autenticado = true;
        req.session.autenticadoEm = Date.now();

        // Garante que a sessão autenticada foi salva antes de responder
        await new Promise((resolve, reject) => {
            req.session.save((erro) => {
                if (erro) {
                    return reject(erro);
                }

                resolve();
            });
        });

        return res.status(200).json({ mensagem: "Autenticação concluída com sucesso." });

    } catch (erro) {
        console.error("Erro ao verificar TOTP:", erro);

        return res.status(erro.status || 500).json({ erro: erro.mensagem || "Erro interno do servidor." });
    }
}

export function verificarSessao(req, res) {
    if (!req.session.autenticado || !req.session.idAdministrador) {
        return res.status(401).json({ autenticado: false, erro: "Sessão não autenticada."});
    }

    return res.status(200).json({ autenticado: true});
}


export function logout(req, res) {
    req.session.destroy((erro) => {
        if (erro) {
            console.error("Erro ao encerrar sessão:", erro);

            return res.status(500).json({ erro: "Não foi possível encerrar a sessão." });
        }

        res.clearCookie("connect.sid");

        return res.status(200).json({ mensagem: "Logout realizado com sucesso." });
    });
}