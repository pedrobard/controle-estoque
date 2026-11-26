import { apiFetch } from "./api.js";

const areaAuth = document.querySelector("#area-autenticacao")
const telaLogin = document.querySelector("#tela-login");
const telaTotp = document.querySelector("#tela-totp");
const layout = document.querySelector(".layout");

const formLogin = document.querySelector("#form-login");
const campoNomeUsuario = document.querySelector("#nome-usuario");
const campoSenha = document.querySelector("#senha");
const btnContinuar = document.querySelector("#btn-continuar");
const btnMostrarSenha = document.querySelector("#btn-mostrar-senha");

const etapa1 = document.querySelector('[data-etapa="1"]');
const etapa2 = document.querySelector('[data-etapa="2"]');

const formTotp = document.querySelector("#form-totp");
const campoCodigoTotp = document.querySelector("#codigo-totp");
const btnVerificarTotp = document.querySelector("#btn-verificar-totp");
const quadradinhosTotp = document.querySelectorAll(".totp-quadradinhos span");
const btnLogout = document.querySelector("#btn-logout");



function atualizarQuadradinhosTotp() {
    const codigo = campoCodigoTotp.value;

    quadradinhosTotp.forEach((quadradinho, indice) => {
        quadradinho.textContent = codigo[indice] || "";

        quadradinho.classList.toggle(
            "totp-atual",
            indice === codigo.length && codigo.length < 6
        );
    });
}


async function realizarLogin(event) {
    event.preventDefault();

    const nomeUsuario = campoNomeUsuario.value;
    const senha = campoSenha.value;

    btnContinuar.disabled = true;

    try {
        const resposta = await apiFetch("/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nomeUsuario, senha })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.erro)
            return;
        }

        if (dados.etapa !== "totp") {
            alert("Não foi possível iniciar a autenticação em duas etapas.");
            return;
        }


        telaLogin.hidden = true;
        telaTotp.hidden = false;

        campoCodigoTotp.focus();

        etapa1.classList.remove("auth-ativo");
        etapa1.classList.add("auth-concluido");

        etapa2.classList.remove("auth-pendente");
        etapa2.classList.add("auth-ativo");


    } catch (erro) {
        console.error("Erro ao realizar login:", erro);

        alert("Não foi possível conectar ao servidor.");
    } finally {
        btnContinuar.disabled = false;
    }
}



async function realizarVerificacaoTotp(event) {
    event.preventDefault();

    const codigo = campoCodigoTotp.value;

    btnVerificarTotp.disabled = true;

    try {
        const resposta = await apiFetch("/auth/totp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ codigo })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.erro);
            return;
        }

        areaAuth.hidden = true;
        layout.hidden = false;

        document.dispatchEvent(new CustomEvent("autenticacao-concluida"));

    } catch (erro) {
        console.error("Erro ao verificar TOTP:", erro);
        alert("Não foi possível conectar ao servidor.");
    } finally {
        btnVerificarTotp.disabled = false;
    }
}

function voltarParaLogin() {
    layout.hidden = true;
    areaAuth.hidden = false;

    telaLogin.hidden = false;
    telaTotp.hidden = true;

    formLogin.reset();
    formTotp.reset();

    etapa1.classList.remove("auth-concluido");
    etapa1.classList.add("auth-ativo");

    etapa2.classList.remove("auth-ativo");
    etapa2.classList.add("auth-pendente");
}

export async function verificarSessao() {
    try {
        const resposta = await apiFetch("/auth/verificar");

        if (resposta.status === 401) {
            return;
        }

        if (!resposta.ok) {
            throw new Error("Não foi possível verificar a sessão.");
        }

        const dados = await resposta.json();

        if (dados.autenticado) {
            areaAuth.hidden = true;
            layout.hidden = false;

            document.dispatchEvent(new CustomEvent("autenticacao-concluida"));
        }

    } catch (erro) {
        console.error("Erro ao verificar sessão:", erro);

        alert("Não foi possível verificar sua autenticação. Tente atualizar a página.");
    }
}

async function realizarLogout() {
    const btnLogout = document.querySelector("#btn-logout");

    const confirmar = confirm("Tem certeza de que deseja sair?");

    if (!confirmar) {
        return;
    }
    btnLogout.disabled = true;

    try {
        const resposta = await apiFetch("/auth/logout", {
            method: "POST"
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.erro || "Não foi possível encerrar a sessão.");
            return;
        }

        voltarParaLogin();

        localStorage.setItem("sessao-encerrada", Date.now().toString());

        document.dispatchEvent(new CustomEvent("logout-realizado"));

    } catch (erro) {
        console.error("Erro ao realizar logout:", erro);
        alert("Não foi possível conectar ao servidor.");
    } finally {
        btnLogout.disabled = false;
    }
}

function alternarVisibilidadeSenha() {
    const senhaVisivel = campoSenha.type === "text";

    campoSenha.type = senhaVisivel ? "password" : "text";
    btnMostrarSenha.textContent = senhaVisivel ? "Mostrar" : "Ocultar";
}




window.addEventListener("storage", (e) => {
    if (e.key === "sessao-encerrada") {
        voltarParaLogin();

        document.dispatchEvent(new CustomEvent("logout-realizado"));
    }
});
formLogin.addEventListener("submit", realizarLogin);
formTotp.addEventListener("submit", realizarVerificacaoTotp);
campoCodigoTotp.addEventListener("input", atualizarQuadradinhosTotp);
btnLogout.addEventListener("click", realizarLogout);
btnMostrarSenha.addEventListener("click", alternarVisibilidadeSenha);