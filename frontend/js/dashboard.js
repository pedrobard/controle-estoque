import { produtos } from "./produtos.js";
import { formatadorMoeda, formatarQuantidade, formatarData } from "./utilitarios.js";
import { movimentacoes, renderizarDetalhesMovimentacao } from "./historico.js";
import { categorias } from "./categorias.js";

const totalProdutos = document.querySelector("#total-produtos");
const totalUnidades = document.querySelector("#total-unidades");
const valorTotalEstoque = document.querySelector("#valor-total-estoque");
const valorPotencialEstoque = document.querySelector("#valor-potencial-estoque");
const lucroRealizadoMes = document.querySelector("#lucro-realizado-mes");
const listaEstoqueBaixo = document.querySelector("#lista-estoque-baixo");
const listaMovimentacoesRecentes = document.querySelector("#lista-movimentacoes-recentes");

//funções

function calcularLucroRealizadoNoMes() {
    const agora = new Date();
    const mesAtual = agora.getMonth();
    const anoAtual = agora.getFullYear();

    return movimentacoes
        .filter(m => {
            const dataMovimentacao = new Date(m.dataMovimentacao);

            return (m.tipo === "saida" &&
                m.estornada !== true &&
                dataMovimentacao.getMonth() === mesAtual &&
                dataMovimentacao.getFullYear() === anoAtual
            );
        })
        .reduce((total, m) => {
            return total + Number(m.lucroBrutoMovimentacao ?? 0);
        }, 0);
}

function calcularLucroTotal() {
    return movimentacoes
        .filter(m => {
            return m.tipo === "saida" && m.estornada !== true;
        })
        .reduce((total, m) => {
            return total + Number(m.lucroBrutoMovimentacao ?? 0);
        }, 0);
}

export function calcularResumo() {
    let produtosTotal = 0;
    let unidadesTotal = 0;
    let valorEstoque = 0;
    let valorPotencialVenda = 0;

    produtos.forEach(p => {
        valorEstoque += Number(p.custoMedio) * Number(p.quantidade);

        if (p.ativo === true) {
            produtosTotal++;
            unidadesTotal += Number(p.quantidade);
            valorPotencialVenda += Number(p.quantidade) * Number(p.precoVendaPadrao);
        }
    });

    totalProdutos.textContent = produtosTotal;
    totalUnidades.textContent = unidadesTotal;
    valorTotalEstoque.textContent = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(valorEstoque);
    valorPotencialEstoque.textContent = formatadorMoeda(valorPotencialVenda);
    lucroRealizadoMes.textContent = formatadorMoeda(calcularLucroRealizadoNoMes());

}

function prepararDadosGrafico() {
    const hoje = new Date();

    const anoAtual = hoje.getFullYear();
    const mesAtual = hoje.getMonth();

    const meses = [];

    for (let i = 5; i >= 0; i--) {
        const data = new Date(anoAtual, mesAtual - i, 1);

        const nomeMes = data.toLocaleDateString("pt-BR", { month: "short" });

        const ano = data.getFullYear();
        const mes = data.getMonth();

        const dadosMes = {
            ano: ano,
            mes: mes,
            nome: nomeMes,
            entradas: 0,
            saidas: 0
        };

        meses.push(dadosMes);
    }



    movimentacoes.forEach(m => {
        if (m.estornada === true) {
            return;
        }

        const dataMovimentacao = new Date(m.dataMovimentacao);

        const anoMovimentacao = dataMovimentacao.getFullYear();
        const mesMovimentacao = dataMovimentacao.getMonth();

        const dadosMes = meses.find(mes => {
            return mes.ano === anoMovimentacao && mes.mes === mesMovimentacao;
        });

        if (!dadosMes) {
            return;
        }

        if (m.tipo === "entrada" || m.tipo === "estoque inicial") {
            dadosMes.entradas += Number(m.quantidade);
        }

        if (m.tipo === "saida") {
            dadosMes.saidas += Number(m.quantidade);
        }
    });

    return meses.filter(mes => {
        return mes.entradas > 0 || mes.saidas > 0;
    });
}



let graficoMovimentacoes = null;

export function atualizarGraficoMovimentacoes() {
    const canvas = document.querySelector("#grafico-movimentacoes");

    const contexto = canvas.getContext("2d");

    const dados = prepararDadosGrafico();

    if (graficoMovimentacoes) {
        graficoMovimentacoes.data.labels = dados.map(m => m.nome);

        graficoMovimentacoes.data.datasets[0].data =
            dados.map(m => m.entradas);

        graficoMovimentacoes.data.datasets[1].data =
            dados.map(m => m.saidas);

        graficoMovimentacoes.update();

        return;
    }

    graficoMovimentacoes = new Chart(contexto, {
        type: "bar",
        data: {
            labels: dados.map(m => m.nome),
            datasets: [
                {
                    label: "Entradas",
                    data: dados.map(m => m.entradas),
                    borderColor: "rgb(59, 130, 246)",
                    backgroundColor: "rgba(59, 130, 246, 0.7)",
                    borderRadius: 6,
                    barPercentage: 0.7,
                    categoryPercentage: 0.8

                },
                {
                    label: "Saídas",
                    data: dados.map(m => m.saidas),
                    borderColor: "rgb(239, 68, 68)",
                    backgroundColor: "rgba(239, 68, 68, 0.7)",
                    borderRadius: 6,
                    barPercentage: 0.7,
                    categoryPercentage: 0.8,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        usePointStyle: true
                    }
                }
            }
        }
    });

}

function prepararDadosGraficoRosca() {
    let dadosCategorias = [];

    categorias.forEach(c => {
        let valorTotal = 0;

        produtos.forEach(p => {
            if (Number(p.idCategoria) === Number(c.id)) {
                valorTotal += Number(p.quantidade) * Number(p.custoMedio);
            }
        });

        if (valorTotal > 0) {
            const infoCategoria = {
                nome: c.nome,
                valor: valorTotal
            };

            dadosCategorias.push(infoCategoria);
        }

    });

    return dadosCategorias;

}
function calcularTotalEstoqueCategorias(dados) {
    return dados.reduce((total, categoria) => {
        return total + categoria.valor;
    }, 0);
}

function calcularPercentualEstoque(valorCategoria, valorTotal) {
    return (valorCategoria / valorTotal) * 100;
}


let graficoEstoqueCategorias = null;

export function atualizarGraficoRosca() {
    const canvas = document.querySelector("#grafico-estoque-categorias");

    const contexto = canvas.getContext("2d");

    const dados = prepararDadosGraficoRosca();

    const intervalo = 360 / dados.length;

    const totalEstoque = calcularTotalEstoqueCategorias(dados);

    const cores = dados.map((categoria, i) => {
        return `hsl(${(210 + i * intervalo) % 360}, 70%, 55%)`;
    });

    if (graficoEstoqueCategorias) {
        graficoEstoqueCategorias.data.labels = dados.map(c => c.nome);

        graficoEstoqueCategorias.data.datasets[0].data =
            dados.map(c => c.valor);

        graficoEstoqueCategorias.data.datasets[0].backgroundColor = cores;

        graficoEstoqueCategorias.options.plugins.tooltip.callbacks.label = function (context) {
            const valorCategoria = context.raw;

            const percentual = calcularPercentualEstoque(valorCategoria, totalEstoque);

            return [formatadorMoeda(valorCategoria), `${percentual.toFixed(1)}%`];
        };

        graficoEstoqueCategorias.update();

        return;
    }

    graficoEstoqueCategorias = new Chart(contexto, {
        type: "doughnut",
        data: {
            labels: dados.map(c => c.nome),
            datasets: [{
                data: dados.map(c => c.valor),
                backgroundColor: cores,
                borderColor: "transparent",
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,

            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            const valorCategoria = context.raw;

                            const percentual = calcularPercentualEstoque(valorCategoria, totalEstoque);

                            return [formatadorMoeda(valorCategoria), `${percentual.toFixed(1)}%`]
                        }
                    }
                }
            }
        }
    });
}

function obterProdutosEstoqueBaixo() {
    return produtos.filter(p => {
        return p.ativo === true && Number(p.quantidade) <= Number(p.estoqueMinimo);
    });
}

export function renderizarEstoqueBaixo() {
    const produtosBaixo = obterProdutosEstoqueBaixo();

    listaEstoqueBaixo.textContent = "";

    if (produtosBaixo.length === 0) {
        const mensagem = document.createElement("p");

        mensagem.textContent = "Nenhum produto com estoque baixo.";

        listaEstoqueBaixo.appendChild(mensagem);

        return;
    }

    produtosBaixo.forEach(p => {
        const item = document.createElement("div");
        const nome = document.createElement("h4");
        const conteudo = document.createElement("div");
        const informacoes = document.createElement("div");
        const imagem = document.createElement("div");
        const quantidade = document.createElement("p");
        const estoqueMinimo = document.createElement("p");



        item.classList.add("low-stock-item");
        conteudo.classList.add("low-stock-content");
        informacoes.classList.add("low-stock-info");
        imagem.classList.add("low-stock-image");

        nome.textContent = p.nome;
        quantidade.textContent = `Atual: ${formatarQuantidade(p.quantidade)}`;
        estoqueMinimo.textContent = `Mínimo: ${formatarQuantidade(p.estoqueMinimo)}`;

        informacoes.append(quantidade, estoqueMinimo);
        conteudo.append(nome, informacoes);
        item.append(imagem, conteudo);

        listaEstoqueBaixo.appendChild(item);
    });
}

export function renderizarMovimentacoesRecentes() {
    listaMovimentacoesRecentes.textContent = "";

    const movimentacoesRecentes = [...movimentacoes]
        .sort((a, b) => {
            const diferencaData = new Date(b.dataMovimentacao) - new Date(a.dataMovimentacao);

            return diferencaData || b.id - a.id;
        })
        .slice(0, 5);

    movimentacoesRecentes.forEach(m => {
        const linha = document.createElement("tr");

        const produto = document.createElement("td");
        const tipo = document.createElement("td");
        const quantidade = document.createElement("td");
        const data = document.createElement("td");
        const acao = document.createElement("td");

        produto.textContent = m.produtoNome;

        const etiquetaTipo = document.createElement("span");

        etiquetaTipo.classList.add("movement-type", `movement-type-${m.tipo.replaceAll(" ", "-")}`);

        etiquetaTipo.textContent = m.tipo;

        tipo.appendChild(etiquetaTipo);

        if (m.tipo === "ajuste" || m.tipo === "estorno") {
            quantidade.textContent = formatarQuantidade(m.diferenca);
        } else {
            quantidade.textContent = formatarQuantidade(m.quantidade);
        }

        data.textContent = formatarData(m.dataMovimentacao);

        const botaoDetalhes = document.createElement("button");
        botaoDetalhes.type = "button";
        botaoDetalhes.textContent = "Detalhes";
        botaoDetalhes.dataset.acao = "detalhes";
        botaoDetalhes.dataset.id = m.id;

        acao.appendChild(botaoDetalhes);

        linha.append(produto, tipo, quantidade, data, acao);

        listaMovimentacoesRecentes.appendChild(linha);
    });
}

//evento
listaMovimentacoesRecentes.addEventListener("click", evento => {
    const botao = evento.target.closest('button[data-acao="detalhes"]');

    if (!botao) return;

    const id = Number(botao.dataset.id);

    renderizarDetalhesMovimentacao(id);
});