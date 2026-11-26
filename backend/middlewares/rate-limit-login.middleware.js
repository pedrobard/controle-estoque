import { rateLimit } from "express-rate-limit";

const limitarTentativasLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,

    standardHeaders: true,
    legacyHeaders: false,

    skipSuccessfulRequests: true,

    handler: (req, res) => {
        return res.status(429).json({ erro: "Muitas tentativas de login. Tente novamente mais tarde."});
    }
});

export default limitarTentativasLogin;
