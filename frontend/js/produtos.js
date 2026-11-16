import { formatadorMoeda, formatarQuantidade } from "./utilitarios.js";
import { categorias } from "./categorias.js";
import { apiUrl } from "./api.js";


const form = document.querySelector("#form-cadastrar-produto");
const inpNome = document.querySelector("#inp-nome");
const inpCategoria = document.querySelector("#inp-categoria");
const inpQuantidade = document.querySelector("#inp-quantidade");
const inpPreco = document.querySelector("#inp-preco");
const listaProdutos = document.querySelector("#lista-produtos");
const inpCustoInicial = document.querySelector("#inp-custo-inicial");
const inpEstoqueMinimo = document.querySelector("#inp-estoque-minimo");
const btnCadastrar = form.querySelector('button[type="submit"]');
const btnCancelar = document.querySelector("#btn-cancelar");
const inpBusca = document.querySelector("#inp-busca");
const selectCategoria = document.querySelector("#select-categoria");
const btnEstoqueBaixo = document.querySelector("#btn-estoque-baixo");
const btnTodosProdutos = document.querySelector("#btn-todos-produtos");




export let produtos = [];

let idEditando = null;
let filtroEstoqueBaixoAtivo = false;

//funções

export async function carregarProdutos() {
    try {
        const resposta = await fetch(apiUrl("/produtos"));

        const dados = await resposta.json();

        if (!resposta.ok) {
            console.error(dados.erro);
            alert(dados.erro);

            listaProdutos.innerHTML = `
                <tr>
                    <td colspan="10">
                        <div class="mensagem-erro-tabela">
                            <span class="icone-erro">⚠</span>
                            <p>Erro ao carregar a lista de produtos.</p>
                        </div>
                    </td>
                </tr>
            `;

            return false;
        }

        produtos = dados.dados;

        atualizarFiltroCategorias();
        aplicarFiltros();

        return true;


    } catch (erro) {
        console.error(erro);
        alert("nao foi possivel conectar ao banco");

        listaProdutos.innerHTML = `
            <tr>
                <td colspan="10">
                    <div class="mensagem-erro-tabela">
                        <span class="icone-erro">⚠</span>
                        <p>Erro ao carregar a lista de produtos.</p>
                    </div>
                </td>
            </tr>
        `;

        return false
    }
};

async function cadastrarProduto() {
    const quantidadeTexto = inpQuantidade.value.trim();
    const estoqueMinimoTexto = inpEstoqueMinimo.value.trim();

    const nome = inpNome.value.trim();
    const idCategoria = Number(inpCategoria.value);
    const quantidade = Number(inpQuantidade.value);
    const preco = Number(inpPreco.value);
    const custoInicial = Number(inpCustoInicial.value);
    const estoqueMinimo = Number(inpEstoqueMinimo.value);

    if (idEditando === null) {
        if (
            !nome ||
            !idCategoria ||
            !quantidadeTexto ||
            !Number.isInteger(quantidade) ||
            quantidade < 0 ||
            isNaN(custoInicial) ||
            custoInicial < 0 ||
            isNaN(preco) ||
            preco <= 0 ||
            !estoqueMinimoTexto ||
            !Number.isInteger(estoqueMinimo) ||
            estoqueMinimo < 0 ||
            (quantidade > 0 && custoInicial <= 0)
        ) {
            alert("Preencha os campos com valores válidos.");
            return;
        }
        try {
            const resposta = await fetch(apiUrl("/produtos"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nome,
                    idCategoria,
                    quantidade,
                    custoInicial,
                    preco,
                    estoqueMinimo
                })
            })
            const dados = await resposta.json();

            if (!resposta.ok) {
                alert(dados.erro);
                return;
            }
            alert(dados.mensagem);
            form.reset();

            const carregou = await carregarProdutos();

            if (carregou) {
                document.dispatchEvent(new CustomEvent("produtos-atualizados"));
            } else {
                alert("Produto cadastrado, mas não foi possível atualizar a lista.");
            }


    

        } catch (erro) {
            console.error(erro);
            alert("Não foi possível conectar ao servidor.");
        }


    } else {
        if (
            !nome ||
            !idCategoria ||
            isNaN(preco) ||
            preco <= 0 ||
            !estoqueMinimoTexto ||
            !Number.isInteger(estoqueMinimo) ||
            estoqueMinimo < 0
        ) {
            alert("Preencha os campos com valores válidos.");
            return;
        }

        const indice = encontrarIndiceProduto(idEditando);

        if (indice === -1) {
            alert("Produto não encontrado.");
            return;
        }

        try {
            const resposta = await fetch(apiUrl(`/produtos/${idEditando}`), {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ nome, idCategoria, preco, estoqueMinimo })
            });

            const dados = await resposta.json();
            if (!resposta.ok) {
                alert(dados.erro);
                return;
            }

            alert(dados.mensagem);

            idEditando = null;

            btnCadastrar.textContent = "Cadastrar produto";
            btnCancelar.style.display = "none";

            inpQuantidade.disabled = false;
            inpCustoInicial.disabled = false;



            form.reset();

            const carregou = await carregarProdutos();

            if (!carregou) {
                alert("Produto alterado, mas não foi possível atualizar a lista.");
                return;
            }

            document.dispatchEvent(new CustomEvent("produtos-atualizados"));

        } catch (erro) {
            console.error(erro);
            alert("Não foi possível conectar ao servidor.");
            return;
        }


    }


}

async function removerProduto(id) {
    const indice = encontrarIndiceProduto(id);

    if (indice === -1) {
        alert("Produto não encontrado");
        return;
    }

    const produto = produtos[indice];

    if (produto.ativo) {
        alert("Produto está ativo");
        return;
    }

    const confirmar = confirm("Tem certeza que quer excluir esse produto?");

    if (!confirmar) {
        return;
    }

    try {
        const resposta = await fetch(apiUrl(`/produtos/${id}`), {
            method: "DELETE"
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.erro);
            return;
        }

        alert(dados.mensagem);

        const carregou = await carregarProdutos();

        if (!carregou) {
            alert("Produto excluído, mas não foi possível atualizar a lista.");
            return;
        }

        document.dispatchEvent(new CustomEvent("produtos-atualizados"));


    } catch (erro) {
        console.error(erro);
        alert("Não foi possível se comunicar com o servidor.");
    }

}

async function alterarStatusProduto(id) {

    try {
        const indice = encontrarIndiceProduto(id);

        if (indice === -1) {
            alert("Produto nao encontrado");
            return;
        }

        const produto = produtos[indice];

        const novoStatus = !produto.ativo;

        if (produto.ativo) {
            if (!confirm("Tem certeza que quer inativar esse produto?")) {
                return;
            }
        }

        const resposta = await fetch(apiUrl(`/produtos/${id}/status`), {
            method: "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                ativo: novoStatus
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.erro);
            return;
        }

        alert(dados.mensagem);

        const carregou = await carregarProdutos();

        if (!carregou) {
            alert("Status do produto alterado, mas não foi possível atualizar a lista.");
            return;
        }

        document.dispatchEvent(new CustomEvent("produtos-atualizados"));


    } catch (erro) {
        console.error(erro);
        alert("Não foi possível se comunicar com o servidor.");
    }

}

function editarProduto(id) {
    const indice = encontrarIndiceProduto(id);

    if (indice === -1) {
        alert("Produto não encontrado.");
        return;
    }

    const produto = produtos[indice];

    inpQuantidade.disabled = true;
    inpCustoInicial.disabled = true;

    inpNome.value = produto.nome;
    inpCategoria.value = produto.idCategoria;
    inpPreco.value = produto.precoVendaPadrao;
    inpEstoqueMinimo.value = produto.estoqueMinimo;

    idEditando = id;

    btnCadastrar.textContent = "Salvar alterações";
    btnCancelar.style.display = "flex";
}


function cancelarEdicao() {
    form.reset();

    idEditando = null;

    btnCancelar.style.display = "none";

    inpQuantidade.disabled = false;
    inpCustoInicial.disabled = false;

    btnCadastrar.textContent = "Cadastrar produto";
}


function atualizarFiltroCategorias() {
    const categoriaAnterior = selectCategoria.value;

    selectCategoria.innerHTML = '<option value="todas">Todas</option>';

    categorias.forEach(categoria => {
        const opt = document.createElement("option");

        opt.value = categoria.id;
        opt.textContent = categoria.nome;

        selectCategoria.appendChild(opt);
    });

    const existeCategoria = [...selectCategoria.options].some(opcao => opcao.value === categoriaAnterior);

    selectCategoria.value = existeCategoria ? categoriaAnterior : "todas";
}


function aplicarFiltros() {
    const categoriaSelecionada = selectCategoria.value;
    const textoBusca = inpBusca.value.trim().toLowerCase();

    const produtosFiltrados = produtos.filter(produto => {
        const correspondeCategoria = categoriaSelecionada === "todas" || produto.idCategoria === Number(categoriaSelecionada);

        const correspondeBusca = produto.nome.toLowerCase().includes(textoBusca);

        const correspondeEstoqueBaixo = !filtroEstoqueBaixoAtivo || (produto.ativo === true &&
            Number(produto.quantidade) <= Number(produto.estoqueMinimo));

        return correspondeCategoria && correspondeBusca && correspondeEstoqueBaixo;
    });

    renderizarProduto(produtosFiltrados);
}

function renderizarProduto(lista = produtos) {
    listaProdutos.innerHTML = "";

    const listaOrdenada = [...lista];

    listaOrdenada.sort((a, b) => {
        if (a.ativo === true && b.ativo === false) {
            return -1;
        }

        if (a.ativo === false && b.ativo === true) {
            return 1;
        }

        return 0;
    });

    listaOrdenada.forEach(produto => {
        const tr = document.createElement("tr");

        const categoria = categorias.find(
            c => c.id === Number(produto.idCategoria)
        );

        // Nome do produto
        const tdNome = document.createElement("td");
        tdNome.textContent = produto.nome;
        tr.appendChild(tdNome);

        // Categoria
        const tdCategoria = document.createElement("td");
        tdCategoria.textContent = categoria ? categoria.nome : "Categoria não encontrada";
        tr.appendChild(tdCategoria);

        // Quantidade
        const tdQuantidade = document.createElement("td");
        tdQuantidade.textContent = formatarQuantidade(produto.quantidade);
        tr.appendChild(tdQuantidade);

        // Custo médio
        const tdCustoMedio = document.createElement("td");
        tdCustoMedio.textContent = formatadorMoeda(produto.custoMedio);
        tr.appendChild(tdCustoMedio);

        // Valor total do estoque
        const tdValorEstoque = document.createElement("td");
        tdValorEstoque.textContent = formatadorMoeda(produto.quantidade * produto.custoMedio);
        tr.appendChild(tdValorEstoque);

        // Preço de venda padrão
        const tdPrecoVenda = document.createElement("td");
        tdPrecoVenda.textContent = formatadorMoeda(produto.precoVendaPadrao);
        tr.appendChild(tdPrecoVenda);

        // Estoque mínimo
        const tdEstoqueMinimo = document.createElement("td");
        tdEstoqueMinimo.textContent = formatarQuantidade(produto.estoqueMinimo);
        tr.appendChild(tdEstoqueMinimo);

        // Situação do estoque
        const tdSituacaoEstoque = document.createElement("td");
        tdSituacaoEstoque.textContent = produto.ativo === true && Number(produto.quantidade) <= Number(produto.estoqueMinimo) ? "Estoque baixo" : "Normal";
        tr.appendChild(tdSituacaoEstoque);



        // Status do produto
        const tdStatus = document.createElement("td");
        tdStatus.textContent = produto.ativo ? "Ativo" : "Inativo";
        tr.appendChild(tdStatus);

        // Ações
        const tdAcoes = document.createElement("td");
        tdAcoes.classList.add("acoes");

        const btnEditar = document.createElement("button");
        btnEditar.type = "button";
        btnEditar.dataset.acao = "editar";
        btnEditar.dataset.id = produto.id;
        btnEditar.textContent = "Editar";

        const btnStatus = document.createElement("button");
        btnStatus.type = "button";
        btnStatus.dataset.acao = "status";
        btnStatus.dataset.id = produto.id;
        btnStatus.textContent = produto.ativo ? "Inativar" : "Ativar";

        const btnRemover = document.createElement("button");
        btnRemover.type = "button";
        btnRemover.dataset.acao = "remover";
        btnRemover.dataset.id = produto.id;
        btnRemover.textContent = "Excluir";

        tdAcoes.appendChild(btnEditar);
        tdAcoes.appendChild(btnStatus);
        tdAcoes.appendChild(btnRemover);

        tr.appendChild(tdAcoes);

        listaProdutos.appendChild(tr);
    });
}

//atualiza o select da categoria dentro do formulario de produtos
export function atualizarSelectCategoria() {
    inpCategoria.innerHTML = "";

    categorias.forEach(c => {
        const opt = document.createElement("option");

        opt.value = c.id;
        opt.textContent = c.nome;

        inpCategoria.appendChild(opt);
    });
}

export function atualizarInterfaceCategorias() {
    atualizarSelectCategoria();
    atualizarFiltroCategorias();
    aplicarFiltros();
}


function encontrarIndiceProduto(id) {
    return produtos.findIndex(p => p.id === id);
}


//eventos

btnEstoqueBaixo.addEventListener("click", function () {
    filtroEstoqueBaixoAtivo = !filtroEstoqueBaixoAtivo;

    btnEstoqueBaixo.classList.toggle("ativo", filtroEstoqueBaixoAtivo);

    aplicarFiltros();
});

btnTodosProdutos.addEventListener("click", function () {
    filtroEstoqueBaixoAtivo = false;

    btnEstoqueBaixo.classList.toggle("ativo", filtroEstoqueBaixoAtivo);

    selectCategoria.value = "todas";
    inpBusca.value = "";

    aplicarFiltros();
});

selectCategoria.addEventListener("change", function () {
    aplicarFiltros();
});

inpBusca.addEventListener("input", function () {
    aplicarFiltros();
});

btnCancelar.addEventListener("click", function () {
    cancelarEdicao();
});

form.addEventListener("submit", function (e) {
    e.preventDefault();
    cadastrarProduto();
});

listaProdutos.addEventListener("click", (e) => {
    const botao = e.target.closest("button[data-acao]");

    if (!botao) {
        return;
    }

    const acao = botao.dataset.acao;
    const id = Number(botao.dataset.id);

    if (acao === "editar") {
        editarProduto(id);
    } else if (acao === "status") {
        alterarStatusProduto(id);
    } else if (acao === "remover") {
        removerProduto(id);
    }
});