import { carregarProdutos, atualizarInterfaceCategorias } from "./produtos.js";
import { carregarCategorias } from "./categorias.js";
import { carregarMovimentacoes } from "./historico.js";
import { atualizarSelectProdutos } from "./movimentacoes.js";
import { calcularResumo, atualizarGraficoMovimentacoes, renderizarEstoqueBaixo, atualizarGraficoRosca, renderizarMovimentacoesRecentes } from "./dashboard.js";
import { verificarSessao } from "./auth.js";


//evento para atualizar as interfaces da categoria. evento no categorias.js. evitar dependencia ciclica
document.addEventListener("categorias-atualizadas", () => {
    //função para interfaces dentro de formularios e lista visual de produtos.
    atualizarInterfaceCategorias();
});

//evento  estorno de movimentação concluido no historico.js. evitar dependencia ciclica
document.addEventListener("movimentacao-estorno-estoque-atualizada", async () => {
    const produtosCarregados = await carregarProdutos();
    const movimentacoesCarregadas = await carregarMovimentacoes();

    if (produtosCarregados) {
        atualizarSelectProdutos();
        renderizarEstoqueBaixo();
        atualizarGraficoRosca();
    }

    if (produtosCarregados && movimentacoesCarregadas) {
        calcularResumo();

    }

    if (movimentacoesCarregadas) {
        atualizarGraficoMovimentacoes();
        renderizarMovimentacoesRecentes();
    }
});

//evento registrar movimentação concluido no movimentacoes.js. evitar dependencia ciclica
document.addEventListener("movimentacao-estoque-atualizada", async () => {
    const produtosCarregados = await carregarProdutos();
    const movimentacoesCarregadas = await carregarMovimentacoes();

    if (produtosCarregados) {
        atualizarSelectProdutos();
        renderizarEstoqueBaixo();
        atualizarGraficoRosca();
    }

    if (produtosCarregados && movimentacoesCarregadas) {
        calcularResumo();

    }

    if (movimentacoesCarregadas) {
        atualizarGraficoMovimentacoes();
        renderizarMovimentacoesRecentes();
    }
});

//evento cadastrar produto concluido no produtos.js. evitar dependencia ciclica
document.addEventListener("produtos-atualizados", async () => {
    atualizarSelectProdutos();
    renderizarEstoqueBaixo();
    atualizarGraficoRosca();

    const movimentacoesCarregadas = await carregarMovimentacoes();

    if (movimentacoesCarregadas) {
        calcularResumo();
        atualizarGraficoMovimentacoes();
        renderizarMovimentacoesRecentes();
    }
});

// Iniciar o sistema somente após a autenticação ser concluída.
document.addEventListener("autenticacao-concluida", iniciarApp);

// Verificar se já existe uma sessão autenticada no backend.
verificarSessao();



function navegarPagina() {
    const secoes = document.querySelectorAll(".section");

    const linksNavegacao = document.querySelectorAll(".nav-item");

    const paginaSolicitada = window.location.hash;

    const secaoSelecionada = Array.from(secoes).find(secao => `#${secao.id}` === paginaSolicitada) ||
        Array.from(secoes).find(secao => secao.id === "page-dashboard");

    if (!secaoSelecionada) {
        return;
    }

    const paginaAtual = `#${secaoSelecionada.id}`;

    secoes.forEach(secao => {
        secao.style.display = secao === secaoSelecionada ? "block" : "none";
    });

    linksNavegacao.forEach(link => { link.classList.remove("active"); });

    const linkSelecionado = Array.from(linksNavegacao).find(link => link.getAttribute("href") === paginaAtual);

    if (linkSelecionado) {
        linkSelecionado.classList.add("active");
    }

}

window.addEventListener("hashchange", navegarPagina);

navegarPagina();

function alternarTema() {
    const temaAtual = document.documentElement.dataset.tema;

    const novoTema = temaAtual === "escuro" ? "claro" : "escuro";

    document.documentElement.dataset.tema = novoTema;

    iconeTema.classList.toggle("fa-moon", novoTema === "claro");
    iconeTema.classList.toggle("fa-sun", novoTema === "escuro");
}

const btnTema = document.querySelector("#btn-tema");

const iconeTema = document.querySelector("#icone-tema");

btnTema.addEventListener("click", alternarTema);


async function iniciarApp() {
    const categoriasCarregadas = await carregarCategorias();

    if (!categoriasCarregadas) {
        return;
    }

    atualizarInterfaceCategorias();

    const produtosCarregados = await carregarProdutos();
    const movimentacoesCarregadas = await carregarMovimentacoes();

    if (produtosCarregados) {
        atualizarSelectProdutos();
        renderizarEstoqueBaixo()
        atualizarGraficoRosca();
    }
    if (movimentacoesCarregadas) {
        atualizarGraficoMovimentacoes();
        renderizarMovimentacoesRecentes();
    }

    if (produtosCarregados && movimentacoesCarregadas) {
        calcularResumo();
    }


}