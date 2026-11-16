import { formatadorMoeda, formatarData, formatarQuantidade } from "./utilitarios.js";
import { produtos } from "./produtos.js";
import { apiUrl } from "./api.js";

const listaHistorico = document.querySelector("#lista-historico");
const selectTipoHistorico = document.querySelector("#select-tipo-historico");
const selectProdutoHistorico = document.querySelector("#select-produto-historico");
const overlayDetalhes = document.querySelector("#overlay-detalhes");
const btnFecharDetalhes = document.querySelector("#btn-fechar-detalhes");
const conteudoDetalhes = document.querySelector("#conteudo-detalhes");

export let movimentacoes = [];

//funções

export async function carregarMovimentacoes() {
    try {
        const resposta = await fetch(apiUrl("/movimentacoes"));
        const dados = await resposta.json();

        if (!resposta.ok) {
            console.error(dados.erro);
            alert(dados.erro);
            exibirErroHistorico();
            return false;
        }

        movimentacoes = dados.dados;

        renderizarselectTipoHistorico();
        filtrarHistorico();

        return true;

    } catch (erro) {
        console.error(erro);
        alert("Não foi possível carregar o histórico de movimentações.");
        exibirErroHistorico();
        return false;
    }
}
function exibirErroHistorico() {
    listaHistorico.innerHTML = "";

    const tr = document.createElement("tr");
    const td = document.createElement("td");
    const div = document.createElement("div");
    const icone = document.createElement("span");
    const mensagem = document.createElement("p");

    td.colSpan = 6;
    div.classList.add("mensagem-erro-tabela");
    icone.classList.add("icone-erro");

    icone.textContent = "⚠";
    mensagem.textContent = "Erro ao carregar o histórico de movimentações.";

    div.append(icone, mensagem);
    td.appendChild(div);
    tr.appendChild(td);
    listaHistorico.appendChild(tr);
}

function renderizarHistorico(lista = movimentacoes) {
    listaHistorico.innerHTML = "";

    const listaOrdenada = [...lista];

    listaOrdenada.sort((a, b) => {
        const diferencaData = new Date(b.dataMovimentacao) - new Date(a.dataMovimentacao);

        return diferencaData || b.id - a.id;
    });

    listaOrdenada.forEach(m => {
        const tr = document.createElement("tr");

        let resumo = "";
        let quantidadeExibida = "";

        if (m.tipo === "entrada") {
            resumo = "Entrada de Estoque";
            quantidadeExibida = formatarQuantidade(m.quantidade);

        } else if (m.tipo === "saida") {
            resumo = "Saída de Estoque";
            quantidadeExibida = formatarQuantidade(m.quantidade);

        } else if (m.tipo === "ajuste") {
            resumo = "Ajuste de Estoque";
            quantidadeExibida = formatarQuantidade(m.diferenca);

        } else if (m.tipo === "estoque inicial") {
            resumo = "Estoque Inicial";
            quantidadeExibida = formatarQuantidade(m.quantidade);

        } else if (m.tipo === "estorno") {
            resumo = `Estorno de ${m.tipoMovimentacaoOriginal}`;
            quantidadeExibida = "—";
        }

        const tdData = document.createElement("td");
        tdData.textContent = formatarData(m.dataMovimentacao);

        const tdProduto = document.createElement("td");
        tdProduto.textContent = m.produtoNome;

        const tdTipo = document.createElement("td");
        tdTipo.textContent = m.tipo;

        const tdResumo = document.createElement("td");
        tdResumo.textContent = resumo;

        const tdQuantidade = document.createElement("td");
        tdQuantidade.textContent = quantidadeExibida;

        const tdAcoes = document.createElement("td");
        const divAcoes = document.createElement("div");
        divAcoes.classList.add("acoes");

        const btnDetalhes = document.createElement("button");
        btnDetalhes.type = "button";
        btnDetalhes.dataset.acao = "detalhes";
        btnDetalhes.dataset.id = m.id;
        btnDetalhes.textContent = "Detalhes";

        divAcoes.appendChild(btnDetalhes);

        if ((m.tipo === "entrada" || m.tipo === "saida" || m.tipo === "ajuste") && m.estornada === false) {

            const btnEstornar = document.createElement("button");
            btnEstornar.type = "button";
            btnEstornar.dataset.acao = "estornar";
            btnEstornar.dataset.id = m.id;
            btnEstornar.textContent = "Estornar";

            divAcoes.appendChild(btnEstornar);
        }

        if (m.estornada === true) {
            const statusEstornada = document.createElement("span");
            statusEstornada.classList.add("status-estornada");
            statusEstornada.textContent = "Estornada";

            divAcoes.appendChild(statusEstornada);
        }

        tdAcoes.appendChild(divAcoes);

        tr.append(tdData, tdProduto, tdTipo, tdResumo, tdQuantidade, tdAcoes);

        listaHistorico.appendChild(tr);
    });
}

function renderizarselectTipoHistorico() {
    selectTipoHistorico.innerHTML = "";

    const tipoMovimentacao = [];

    const optTodos = document.createElement("option");

    optTodos.value = "todos";
    optTodos.textContent = "Todos";

    selectTipoHistorico.appendChild(optTodos);

    movimentacoes.forEach(m => {
        if (!tipoMovimentacao.includes(m.tipo)) {
            tipoMovimentacao.push(m.tipo);

            const opt = document.createElement("option");

            opt.value = m.tipo;
            opt.textContent = m.tipo;

            selectTipoHistorico.appendChild(opt);
        }
    });

    selectProdutoHistorico.innerHTML = "";

    const produtoIdMovimentacao = [];

    const optTodosProduto = document.createElement("option");

    optTodosProduto.value = "todos";
    optTodosProduto.textContent = "Todos";

    selectProdutoHistorico.appendChild(optTodosProduto);

    movimentacoes.forEach(m => {
        if (!produtoIdMovimentacao.includes(m.produtoId)) {
            const optProduto = document.createElement("option");

            optProduto.value = m.produtoId;
            optProduto.textContent = m.produtoNome;

            produtoIdMovimentacao.push(m.produtoId);

            selectProdutoHistorico.appendChild(optProduto);
        }
    });
}

function filtrarHistorico() {
    if (selectTipoHistorico.value === "todos" && selectProdutoHistorico.value === "todos") {
        renderizarHistorico(movimentacoes);

    } else if (selectTipoHistorico.value === "todos" && selectProdutoHistorico.value !== "todos") {
        const idProduto = Number(selectProdutoHistorico.value);

        const movimentacaoProdutosFiltrados = movimentacoes.filter(m =>
            m.produtoId === idProduto);

        renderizarHistorico(movimentacaoProdutosFiltrados);
    } else if (selectTipoHistorico.value !== "todos" && selectProdutoHistorico.value === "todos") {
        const movimentacaoTipoFiltrados = movimentacoes.filter(
            m => m.tipo === selectTipoHistorico.value
        );

        renderizarHistorico(movimentacaoTipoFiltrados);
    } else {
        const idProduto = Number(selectProdutoHistorico.value);

        const movimentacaoTipoEProdutoFiltrados = movimentacoes.filter(
            m => m.tipo === selectTipoHistorico.value && m.produtoId === idProduto
        );

        renderizarHistorico(movimentacaoTipoEProdutoFiltrados);
    }
}

export function renderizarDetalhesMovimentacao(id) {
    const movimentacao = movimentacoes.find(m => m.id === id);

    if (!movimentacao) {
        alert("Movimentação não encontrada.");
        return;
    }

    overlayDetalhes.style.display = "flex";
    conteudoDetalhes.innerHTML = "";

    if (movimentacao.tipo === "estoque inicial") {
        const tabela = document.createElement("table");
        tabela.classList.add("tabela-detalhes");

        const campos = [
            ["Produto", movimentacao.produtoNome],
            ["Quantidade", formatarQuantidade(movimentacao.quantidade)],
            ["Custo unitário", formatadorMoeda(movimentacao.custoUnitario)],
            ["Custo total", formatadorMoeda(movimentacao.custoTotalMovimentacao)],
            ["Custo médio", formatadorMoeda(movimentacao.custoMedioAposMovimentacao)],
            ["Data", formatarData(movimentacao.dataMovimentacao)]
        ];

        const thead = document.createElement("thead");
        const trCabecalho = document.createElement("tr");
        const thCampo = document.createElement("th");
        const thInformacao = document.createElement("th");

        thCampo.textContent = "Campo";
        thInformacao.textContent = "Informação";

        trCabecalho.append(thCampo, thInformacao);
        thead.appendChild(trCabecalho);

        const tbody = document.createElement("tbody");

        campos.forEach(([campo, valor]) => {
            const tr = document.createElement("tr");
            const tdCampo = document.createElement("td");
            const tdValor = document.createElement("td");

            tdCampo.textContent = campo;
            tdValor.textContent = valor;

            tr.append(tdCampo, tdValor);
            tbody.appendChild(tr);
        });

        tabela.append(thead, tbody);
        conteudoDetalhes.appendChild(tabela);
    }

    if (movimentacao.tipo === "entrada") {
        const tabela = document.createElement("table");
        tabela.classList.add("tabela-detalhes");

        const campos = [
            ["Produto", movimentacao.produtoNome],
            ["Quantidade", formatarQuantidade(movimentacao.quantidade)],
            ["Custo unitário", formatadorMoeda(movimentacao.custoUnitario)],
            ["Custo total", formatadorMoeda(movimentacao.custoTotalMovimentacao)],
            ["Custo médio após movimentação", formatadorMoeda(movimentacao.custoMedioAposMovimentacao)],
            ["Quantidade anterior", formatarQuantidade(movimentacao.quantidadeAnterior)],
            ["Quantidade final", formatarQuantidade(movimentacao.quantidadeFinal)],
            ["Data", formatarData(movimentacao.dataMovimentacao)]
        ];

        const thead = document.createElement("thead");
        const trCabecalho = document.createElement("tr");
        const thCampo = document.createElement("th");
        const thInformacao = document.createElement("th");

        thCampo.textContent = "Campo";
        thInformacao.textContent = "Informação";

        trCabecalho.append(thCampo, thInformacao);
        thead.appendChild(trCabecalho);

        const tbody = document.createElement("tbody");

        campos.forEach(([campo, valor]) => {
            const tr = document.createElement("tr");
            const tdCampo = document.createElement("td");
            const tdValor = document.createElement("td");

            tdCampo.textContent = campo;
            tdValor.textContent = valor;

            tr.append(tdCampo, tdValor);
            tbody.appendChild(tr);
        });

        tabela.append(thead, tbody);
        conteudoDetalhes.appendChild(tabela);
    }

    if (movimentacao.tipo === "saida") {
        const tabela = document.createElement("table");
        tabela.classList.add("tabela-detalhes");

        const campos = [
            ["Produto", movimentacao.produtoNome],
            ["Quantidade", formatarQuantidade(movimentacao.quantidade)],
            ["Valor unitário de venda", formatadorMoeda(movimentacao.precoUnitarioVenda)],
            ["Valor total da venda", formatadorMoeda(movimentacao.valorTotalVenda)],
            ["Custo total", formatadorMoeda(movimentacao.custoTotalMovimentacao)],
            ["Custo médio", formatadorMoeda(movimentacao.custoMedioAposMovimentacao)],
            ["Lucro bruto", formatadorMoeda(movimentacao.lucroBrutoMovimentacao)],
            ["Data", formatarData(movimentacao.dataMovimentacao)]
        ];

        const thead = document.createElement("thead");
        const trCabecalho = document.createElement("tr");
        const thCampo = document.createElement("th");
        const thInformacao = document.createElement("th");

        thCampo.textContent = "Campo";
        thInformacao.textContent = "Informação";

        trCabecalho.append(thCampo, thInformacao);
        thead.appendChild(trCabecalho);

        const tbody = document.createElement("tbody");

        campos.forEach(([campo, valor]) => {
            const tr = document.createElement("tr");
            const tdCampo = document.createElement("td");
            const tdValor = document.createElement("td");

            tdCampo.textContent = campo;
            tdValor.textContent = valor;

            tr.append(tdCampo, tdValor);
            tbody.appendChild(tr);
        });

        tabela.append(thead, tbody);
        conteudoDetalhes.appendChild(tabela);
    }

    if (movimentacao.tipo === "ajuste") {
        const tabela = document.createElement("table");
        tabela.classList.add("tabela-detalhes");

        const campos = [
            ["Produto", movimentacao.produtoNome],
            ["Estoque anterior", formatarQuantidade(movimentacao.quantidadeAnterior)],
            ["Estoque final", formatarQuantidade(movimentacao.quantidadeFinal)],
            ["Diferença", formatarQuantidade(movimentacao.diferenca)],
            ["Motivo", movimentacao.motivo],
            ["Data", formatarData(movimentacao.dataMovimentacao)]
        ];

        const thead = document.createElement("thead");
        const trCabecalho = document.createElement("tr");
        const thCampo = document.createElement("th");
        const thInformacao = document.createElement("th");

        thCampo.textContent = "Campo";
        thInformacao.textContent = "Informação";

        trCabecalho.append(thCampo, thInformacao);
        thead.appendChild(trCabecalho);

        const tbody = document.createElement("tbody");

        campos.forEach(([campo, valor]) => {
            const tr = document.createElement("tr");
            const tdCampo = document.createElement("td");
            const tdValor = document.createElement("td");

            tdCampo.textContent = campo;
            tdValor.textContent = valor;

            tr.append(tdCampo, tdValor);
            tbody.appendChild(tr);
        });

        tabela.append(thead, tbody);
        conteudoDetalhes.appendChild(tabela);
    }

    if (movimentacao.tipo === "estorno") {
        const movimentacaoOriginal = movimentacoes.find(
            m => m.id === Number(movimentacao.idMovimentacaoOriginal)
        );

        const tabela = document.createElement("table");
        tabela.classList.add("tabela-detalhes");

        const thead = document.createElement("thead");
        const trCabecalho = document.createElement("tr");
        const thCampo = document.createElement("th");
        const thInformacao = document.createElement("th");

        thCampo.textContent = "Campo";
        thInformacao.textContent = "Informação";

        trCabecalho.append(thCampo, thInformacao);
        thead.appendChild(trCabecalho);

        const tbody = document.createElement("tbody");

        const campos = [
            ["Produto", movimentacao.produtoNome],
            ["Tipo", "Estorno"],
            ["Estoque anterior", formatarQuantidade(movimentacao.quantidadeAnterior)],
            ["Estoque final", formatarQuantidade(movimentacao.quantidadeFinal)],
            ["Diferença", formatarQuantidade(movimentacao.diferenca)],
            ["Motivo", movimentacao.motivo],
            ["Data", formatarData(movimentacao.dataMovimentacao)]
        ];

        campos.forEach(([campo, valor]) => {
            const tr = document.createElement("tr");
            const tdCampo = document.createElement("td");
            const tdValor = document.createElement("td");

            tdCampo.textContent = campo;
            tdValor.textContent = valor;

            tr.append(tdCampo, tdValor);
            tbody.appendChild(tr);
        });

        const trOriginal = document.createElement("tr");
        const tdOriginalCampo = document.createElement("td");
        const tdOriginalValor = document.createElement("td");

        tdOriginalCampo.textContent = "Movimentação original";

        if (movimentacaoOriginal) {
            tdOriginalValor.append(document.createTextNode(`${movimentacaoOriginal.tipo} #${movimentacaoOriginal.id} `));

            const btnDetalhesOriginal = document.createElement("button");
            btnDetalhesOriginal.type = "button";
            btnDetalhesOriginal.dataset.acao = "detalhes-original";
            btnDetalhesOriginal.dataset.id = movimentacaoOriginal.id;
            btnDetalhesOriginal.textContent = "Ver detalhes";

            tdOriginalValor.appendChild(btnDetalhesOriginal);

        } else {
            tdOriginalValor.textContent = "Movimentação não encontrada";
        }

        trOriginal.append(tdOriginalCampo, tdOriginalValor);
        tbody.appendChild(trOriginal);

        tabela.append(thead, tbody);
        conteudoDetalhes.appendChild(tabela);
    }
}

//o estorno está relacionado a uma movimentaçao presente no historico, iniciada pelo historico
async function estornarMovimentacao(id) {
    const movimentacao = movimentacoes.find(m => m.id === Number(id));

    if (!movimentacao) {
        alert("Movimentação não encontrada.");
        return;
    }


    if (movimentacao.tipo === "estoque inicial" || movimentacao.tipo === "estorno" || movimentacao.estornada === true) {
        alert("Esta movimentação não pode ser estornada.");
        return;
    }

    const produtoInativo = produtos.find( p => p.id === movimentacao.produtoId && p.ativo === false);

    if (produtoInativo) {
        alert("Não é possível estornar movimentações de produtos inativos.");
        return;
    }

    const motivo = prompt("Informe o motivo do estorno.");

    if (motivo === null || motivo.trim() === "") {
        alert("Informe o motivo do estorno.");
        return;
    }

    if (!confirm("Confirma o estorno desta movimentação?")) {
        return
    }

    try {
        const resposta = await fetch(apiUrl(`/movimentacoes/${id}/estorno`), {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ motivo: motivo.trim() })
        })

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.erro);
            return;
        }

        alert(dados.mensagem);

        document.dispatchEvent(new CustomEvent("movimentacao-estorno-estoque-atualizada"));


    } catch (erro) {
        console.error(erro);
        alert("Não foi possível conectar ao servidor.");
    }

}

//eventos

selectProdutoHistorico.addEventListener("change", function () {
    filtrarHistorico();
});

selectTipoHistorico.addEventListener("change", function () {
    filtrarHistorico();
});

btnFecharDetalhes.addEventListener("click", function () {
    overlayDetalhes.style.display = "none";
});

listaHistorico.addEventListener("click", (e) => {
    const botao = e.target.closest("button[data-acao]");

    if (!botao) {
        return;
    }

    const acao = botao.dataset.acao;
    const id = Number(botao.dataset.id);

    if (acao === "detalhes") {
        renderizarDetalhesMovimentacao(id)
    }

    else if (acao === "estornar") {
        estornarMovimentacao(id);
    }
})

conteudoDetalhes.addEventListener("click", (e) => {
    const botao = e.target.closest("button[data-acao]");

    if (!botao) {
        return;
    }

    const acao = botao.dataset.acao;
    const id = Number(botao.dataset.id);

    if (acao === "detalhes-original") {
        renderizarDetalhesMovimentacao(id);
    }
});