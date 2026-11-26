import { rateLimit } from "express-rate-limit";

const limitarTentativasTotp = rateLimit({
    windowMs: 5 * 60 * 1000,
    limit: 5,

    standardHeaders: true,
    legacyHeaders: false,

    skipSuccessfulRequests: true,

    handler: (req, res) => {
        return res.status(429).json({ erro: "Muitas tentativas de verificação. Tente novamente mais tarde." });
    }
});

export default limitarTentativasTotp;
