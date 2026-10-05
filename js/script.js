const form = document.querySelector("#form-cadastrar-produto");
const inpNome = document.querySelector("#inp-nome");
const inpCategoria = document.querySelector("#inp-categoria");
const inpQuantidade = document.querySelector("#inp-quantidade");
const inpPreco = document.querySelector("#inp-preco");
const listaProdutos = document.querySelector("#lista-produtos");
const inpCustoInicial = document.querySelector("#inp-custo-inicial");
const inpEstoqueMinimo = document.querySelector("#inp-estoque-minimo");

const formMovimentacao = document.querySelector("#form-movimentacao");
const inpSelectProduto = document.querySelector("#select-produto");
const inpQuantidadeMovimentacao = document.querySelector("#inp-quantidade-movimentacao");
const inpCustoMovimentacao = document.querySelector("#inp-custo-movimentacao");
const inpTipoMovimentacao = document.querySelector("#select-tipo-movimentacao");

const btnCadastrar = form.querySelector('button[type="submit"]');
const btnCancelar = document.querySelector("#btn-cancelar");

const inpBusca = document.querySelector("#inp-busca");
const selectCategoria = document.querySelector("#select-categoria");
const btnEstoqueBaixo = document.querySelector("#btn-estoque-baixo");
const btnTodosProdutos = document.querySelector("#btn-todos-produtos");

const totalProdutos = document.querySelector("#total-produtos");
const totalUnidades = document.querySelector("#total-unidades");
const valorTotalEstoque = document.querySelector("#valor-total-estoque");
const valorPotencialEstoque = document.querySelector("#valor-potencial-estoque");

const btnMovimentacao = formMovimentacao.querySelector('button[type="submit"]');

const listaHistorico = document.querySelector("#lista-historico");
const selectHistorico = document.querySelector("#select-historico");
const selectProdutoHistorico = document.querySelector("#select-produto-historico");

const overlayDetalhes = document.querySelector("#overlay-detalhes");
const btnFecharDetalhes = document.querySelector("#btn-fechar-detalhes");
const conteudoDetalhes = document.querySelector("#conteudo-detalhes");

const formCadastrarCategoria = document.querySelector("#form-cadastrar-categoria");
const inpNomeCategoria = document.querySelector("#inp-nome-categoria");
const btnCadastrarCategoria = document.querySelector("#btn-cadastrar-categoria");
const listaCategorias = document.querySelector("#lista-categorias");

const formAjusteEstoque = document.querySelector("#form-ajuste-estoque");
const selectProdutoAjuste = document.querySelector("#select-produto-ajuste");
const inpEstoqueAtual = document.querySelector("#inp-estoque-atual");
const inpQuantidadeAjuste = document.querySelector("#inp-quantidade-ajuste");
const inpMotivoAjuste = document.querySelector("#inp-motivo-ajuste");

let produtos = JSON.parse(localStorage.getItem("lista_produtos")) || [];
let movimentacoes = JSON.parse(localStorage.getItem("lista_movimentacoes")) || [];
let categorias = JSON.parse(localStorage.getItem("lista_categorias")) || [];

let maiorId = 0;
let maiorIdMovimentacao = 0;
let maiorIdCategoria = 0;

let idEditando = null;
let idCategoriaEditando = null;

categorias.forEach(c => {
    if (c.id > maiorIdCategoria) {
        maiorIdCategoria = c.id;
    }
});

let proximoIdCategoria = JSON.parse(localStorage.getItem("proximo_id_categoria"));


if (!proximoIdCategoria || proximoIdCategoria <= maiorIdCategoria) {
    proximoIdCategoria = maiorIdCategoria + 1;
}

movimentacoes.forEach(m => {
    if (m.id > maiorIdMovimentacao) {
        maiorIdMovimentacao = m.id;
    }
});

let proximoIdMovimentacao = maiorIdMovimentacao + 1;

produtos.forEach(p => {
    if (p.id > maiorId) {
        maiorId = p.id;
    }
});

let proximoId = JSON.parse(localStorage.getItem("proximo_id_produto"));

if (!proximoId || proximoId <= maiorId) {
    proximoId = maiorId + 1;
}

// Funções auxiliares

function formatadorMoeda(valor) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(valor);
}

function formatarData(data) {
    return new Date(data).toLocaleString("pt-BR");
}

function encontrarIndiceProduto(id) {
    return produtos.findIndex(p => p.id === id);
}

function salvarStorage(chave, dados) {
    localStorage.setItem(chave, JSON.stringify(dados));
}

// Estorno

function estornarMovimentacao(id) {
    const movimentacao = movimentacoes.find(m => m.id === id);

    if (!movimentacao) {
        alert("Movimentação não encontrada.");
        return;
    }

    if (movimentacao.tipo === "estoque inicial") {
        alert("Estoque inicial não pode ser estornado.");
        return;
    }

    if (movimentacao.estornada === true) {
        alert("Movimentação já foi estornada.");
        return;
    }
    if (movimentacao.tipo === 'estorno') {
        alert("Não é possível estornar uma movimentação de estorno.")
        return;
    }

    const produto = produtos.find(p => p.id === movimentacao.produtoId);

    if (!produto) {
        alert("O produto foi excluído e esta movimentação não pode mais ser estornada.");
        return;
    }

    const motivo = prompt("Informe o motivo do estorno.");

    if (motivo === null || motivo.trim() === "") {
        alert("Informe o motivo do estorno.");
        return;
    }

    const movimentacoesProduto = movimentacoes.filter(
        m => m.produtoId === produto.id
    );

    movimentacoesProduto.sort((a, b) => {
        const diferencaData = new Date(a.data) - new Date(b.data);

        if (diferencaData !== 0) {
            return diferencaData;
        }

        return a.id - b.id;
    });

    // Reconstrução estoque

    let quantidadeReconstruido = 0;
    let custoTotalReconstruido = 0;
    let custoMedioReconstruido = 0;
    let reconstruçãoValida = true;

    movimentacoesProduto.forEach(m => {
        if (m.id === id || m.estornada === true) {
            return;
        }

        if (m.tipo === "estoque inicial") {
            quantidadeReconstruido += m.quantidade;

            custoTotalReconstruido += m.quantidade * m.valorUnitario;

            custoMedioReconstruido =
                quantidadeReconstruido > 0
                    ? custoTotalReconstruido / quantidadeReconstruido : 0;
        }

        if (m.tipo === "entrada") {
            quantidadeReconstruido += m.quantidade;

            custoTotalReconstruido += m.quantidade * m.valorUnitario;

            custoMedioReconstruido =
                quantidadeReconstruido > 0
                    ? custoTotalReconstruido / quantidadeReconstruido : 0;
        }

        if (m.tipo === "saida") {
            if (m.quantidade > quantidadeReconstruido) {
                reconstruçãoValida = false;
                return;
            }

            custoMedioReconstruido = quantidadeReconstruido > 0 ? custoTotalReconstruido / quantidadeReconstruido : 0;

            const custoUnidadesSairam = m.quantidade * custoMedioReconstruido;

            quantidadeReconstruido -= m.quantidade;
            custoTotalReconstruido -= custoUnidadesSairam;

            if (quantidadeReconstruido === 0) {
                custoTotalReconstruido = 0;
                custoMedioReconstruido = 0;
            } else {
                custoMedioReconstruido =
                    custoTotalReconstruido / quantidadeReconstruido;
            }
        }

        if (m.tipo === "ajuste") {
            quantidadeReconstruido += m.diferenca;

            if (quantidadeReconstruido < 0) {
                reconstruçãoValida = false;
                return;
            }

            custoTotalReconstruido +=
                m.diferenca * custoMedioReconstruido;

            if (quantidadeReconstruido === 0) {
                custoTotalReconstruido = 0;
                custoMedioReconstruido = 0;
            }
        }
    });

    if (!reconstruçãoValida) {
        alert("Não é possível estornar esta movimentação porque o estoque ficaria negativo.");
        return;
    }

    produto.quantidade = quantidadeReconstruido;
    produto.custoMedio = custoMedioReconstruido;

    const novaMovimentacao = {
        id: proximoIdMovimentacao,
        produtoId: produto.id,
        produtoNome: produto.nome,
        tipo: "estorno",
        movimentacaoOriginalId: movimentacao.id,
        tipoMovimentacaoOriginal: movimentacao.tipo,
        motivo,
        data: new Date().toISOString()
    };

    movimentacao.estornada = true;

    movimentacoes.push(novaMovimentacao);

    proximoIdMovimentacao++;

    salvarStorage("lista_movimentacoes", movimentacoes);
    salvarStorage("lista_produtos", produtos);

    renderizarProduto();
    calcularResumo();
    renderizarHistorico();
    atualizarSelectProdutos();
    renderizarSelectHistorico();

    alert("Movimentação estornada com sucesso.");
}

// Ajustes

function atualizarEstoqueAtual() {
    const id = Number(selectProdutoAjuste.value);
    const produto = produtos.find(p => p.id === id);

    if (produto !== undefined) {
        inpEstoqueAtual.value = produto.quantidade;
    } else {
        inpEstoqueAtual.value = 0;
    }
}

// Categorias

function cadastrarCategoria() {
    if (idCategoriaEditando === null) {
        const nomeCategoria = inpNomeCategoria.value.trim();

        if (!nomeCategoria) {
            alert("Preencha os campos corretamente.");
            return;
        }

        const nomeCategoriaExiste = categorias.some(c => {
            return c.nome.toLowerCase() === nomeCategoria.toLowerCase();
        });

        if (nomeCategoriaExiste) {
            alert("Essa categoria já foi cadastrada.");
            return;
        }

        const novaCategoria = {
            id: proximoIdCategoria,
            nome: nomeCategoria
        };

        proximoIdCategoria++;
        categorias.push(novaCategoria);
        salvarStorage("proximo_id_categoria", proximoIdCategoria);

        atualizarSelectCategoria();
        renderizarCategorias();
        salvarStorage("lista_categorias", categorias);

        formCadastrarCategoria.reset();
    } else {
        const nomeCategoria = inpNomeCategoria.value.trim();

        if (!nomeCategoria) {
            alert("Preencha o campo corretamente.");
            return;
        }

        const nomeCategoriaExiste = categorias.some(c => {
            return (
                c.nome.toLowerCase() === nomeCategoria.toLowerCase() && c.id !== idCategoriaEditando
            );
        });

        if (nomeCategoriaExiste) {
            alert("Nome duplicado.");
            return;
        }

        const indice = categorias.findIndex(
            c => c.id === idCategoriaEditando
        );

        const categoria = categorias[indice];

        categoria.nome = nomeCategoria;
        idCategoriaEditando = null;

        btnCadastrarCategoria.textContent = "Cadastrar Categoria";

        atualizarSelectCategoria();
        renderizarCategorias();
        salvarStorage("lista_categorias", categorias);

        formCadastrarCategoria.reset();
    }
}

function atualizarSelectCategoria() {
    inpCategoria.innerHTML = "";

    categorias.forEach(c => {
        const opt = document.createElement("option");

        opt.value = c.id;
        opt.textContent = c.nome;

        inpCategoria.appendChild(opt);
    });
}

function renderizarCategorias() {
    listaCategorias.innerHTML = "";

    categorias.forEach(c => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${c.nome}</td>
            <td>
                <button onclick="editarCategoria(${c.id})">
                    Editar
                </button>

                 <button onclick="removerCategoria(${c.id})">
                    Excluir
                </button>
            </td>
            
        `;

        listaCategorias.appendChild(tr);
    });
}

function editarCategoria(id) {
    const indice = categorias.findIndex(c => c.id === id);

    if (indice !== -1) {
        const categoria = categorias[indice];

        inpNomeCategoria.value = categoria.nome;
        idCategoriaEditando = id;
        btnCadastrarCategoria.textContent = "Salvar alteração";
    }
}

function removerCategoria(id) {
    const indice = categorias.findIndex(c => c.id === id);

    if (indice !== -1) {
        const categoriaEmUso = produtos.some(p => p.idCategoria === id
        );

        if (!categoriaEmUso) {
            if (confirm("Tem certeza que quer excluir essa categoria?")) {
                categorias.splice(indice, 1);

                salvarStorage("lista_categorias", categorias);

                renderizarCategorias();
                atualizarFiltroCategorias();
                atualizarSelectCategoria();
            }
        } else {
            alert("Não é possível remover essa categoria, categoria em uso.");
        }
    }
}

// Produtos

function cadastrarProduto() {
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
            isNaN(quantidade) ||
            quantidade < 0 ||
            isNaN(custoInicial) ||
            custoInicial < 0 ||
            isNaN(preco) ||
            preco <= 0 ||
            isNaN(estoqueMinimo) ||
            estoqueMinimo < 0 ||
            (quantidade > 0 && custoInicial <= 0)
        ) {
            alert("Preencha os campos com valores válidos.");
            return;
        }

        const novoProduto = {
            id: proximoId,
            nome,
            idCategoria,
            quantidade,
            custoMedio: quantidade > 0 ? custoInicial : 0,
            precoVendaPadrao: preco,
            estoqueMinimo,
            ativo: true,
            criadoEm: new Date().toISOString()
        };

        proximoId++;
        produtos.push(novoProduto);
        salvarStorage("proximo_id_produto", proximoId);

        if (quantidade > 0) {
            const novaMovimentacao = {
                id: proximoIdMovimentacao,
                produtoId: novoProduto.id,
                produtoNome: novoProduto.nome,
                tipo: "estoque inicial",
                quantidade,
                valorUnitario: custoInicial,
                custoTotal: quantidade * custoInicial,
                custoMedio: custoInicial,
                data: new Date().toISOString()
            };

            proximoIdMovimentacao++;
            movimentacoes.push(novaMovimentacao);
        }
    } else {
        if (
            !nome ||
            !idCategoria ||
            isNaN(preco) ||
            preco <= 0 ||
            isNaN(estoqueMinimo) ||
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

        const produto = produtos[indice];

        produto.nome = nome;
        produto.idCategoria = idCategoria;
        produto.precoVendaPadrao = preco;
        produto.estoqueMinimo = estoqueMinimo;

        idEditando = null;

        btnCadastrar.textContent = "Cadastrar produto";
        btnCancelar.style.display = "none";

        inpQuantidade.disabled = false;
        inpCustoInicial.disabled = false;
    }

    calcularResumo();
    atualizarFiltroCategorias();

    form.reset();

    renderizarProduto();
    atualizarSelectProdutos();

    salvarStorage("lista_produtos", produtos);
    salvarStorage("lista_movimentacoes", movimentacoes);
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

        tr.innerHTML = `
            <td>${produto.nome}</td>
            <td>${categoria ? categoria.nome : "Categoria não encontrada"}</td>
            <td>${produto.quantidade}</td>
            <td>${formatadorMoeda(produto.custoMedio)}</td>
            <td>${formatadorMoeda(produto.quantidade * produto.custoMedio)}</td>
            <td>${formatadorMoeda(produto.precoVendaPadrao)}</td>
            <td>${produto.estoqueMinimo}</td>
            <td>
                ${produto.ativo === true && produto.quantidade <= produto.estoqueMinimo ? "Estoque baixo" : "Normal"}
            </td>
            <td>${produto.ativo ? "Ativo" : "Inativo"}</td>
            <td class="acoes">
                <button onclick="editarProduto(${produto.id})">
                    Editar
                </button>
                <button onclick="alterarStatusProduto(${produto.id})">
                    ${produto.ativo ? "Inativar" : "Ativar"}
                </button>
                <button onclick="removerProduto(${produto.id})">
                    Excluir
                </button>
            </td>`;

        listaProdutos.appendChild(tr);
    });
}

function removerProduto(id) {
    const indice = encontrarIndiceProduto(id);

    if (indice !== -1) {
        const produto = produtos[indice];

        if (produto.ativo) {
            alert("Produto está ativo, não é possível realizar a exclusão!");
            return;
        }

        const confirmar = confirm(
            "Tem certeza que deseja excluir este produto?"
        );

        if (confirmar) {
            produtos.splice(indice, 1);

            renderizarProduto();
            atualizarSelectProdutos();
            calcularResumo();

            salvarStorage("lista_produtos", produtos);

            atualizarFiltroCategorias();
        }
    } else {
        alert("Produto não encontrado.");
    }
}

function alterarStatusProduto(id) {
    const indice = encontrarIndiceProduto(id);

    if (indice !== -1) {
        const produto = produtos[indice];

        if (produto.ativo === true) {
            produto.ativo = false;
        } else {
            produto.ativo = true;
        }

        calcularResumo();

        salvarStorage("lista_produtos", produtos);

        renderizarProduto();
        atualizarSelectProdutos();
    }
}

function editarProduto(id) {
    const indice = encontrarIndiceProduto(id);

    if (indice !== -1) {
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
}

function atualizarSelectProdutos() {
    inpSelectProduto.innerHTML = "";
    selectProdutoAjuste.innerHTML = "";

    const produtosAtivos = produtos.filter(p =>
        p.ativo === true
    );

    produtosAtivos.forEach(p => {
        const opt = document.createElement("option");
        const optAjuste = document.createElement("option");

        opt.value = p.id;
        opt.textContent = p.nome;

        optAjuste.value = p.id;
        optAjuste.textContent = p.nome;

        inpSelectProduto.appendChild(opt);
        selectProdutoAjuste.appendChild(optAjuste);
    });

    atualizarEstoqueAtual();
}

function cancelarEdicao() {
    form.reset();

    idEditando = null;

    btnCancelar.style.display = "none";

    inpQuantidade.disabled = false;
    inpCustoInicial.disabled = false;

    btnCadastrar.textContent = "Cadastrar produto";
}

// Movimentações

function registrarMovimentacao() {
    const selectProduto = Number(inpSelectProduto.value);
    const qtdMovimentacao = Number(inpQuantidadeMovimentacao.value);
    const tipoMovimentacao = inpTipoMovimentacao.value;
    const valorUnitario = Number(inpCustoMovimentacao.value);

    const indice = encontrarIndiceProduto(selectProduto);

    if (indice === -1) {
        alert("Produto não encontrado.");
        return;
    }

    if (isNaN(qtdMovimentacao) || qtdMovimentacao <= 0) {
        alert("Quantidade inválida.");
        return;
    }

    const produto = produtos[indice];

    if (produto.ativo !== true) {
        alert("Produto inativo.");
        return;
    }

    if (tipoMovimentacao === "entrada") {
        if (isNaN(valorUnitario) || valorUnitario <= 0) {
            alert("Custo unitário inválido.");
            return;
        }

        const valorEstoqueAtual =
            produto.quantidade * produto.custoMedio;

        const novaMovimentacao = {
            id: proximoIdMovimentacao,
            produtoId: produto.id,
            produtoNome: produto.nome,
            tipo: "entrada",
            quantidade: qtdMovimentacao,
            valorUnitario,
            custoTotal: qtdMovimentacao * valorUnitario,
            data: new Date().toISOString()
        };

        produto.quantidade += qtdMovimentacao;

        const valorNovaEntrada =
            qtdMovimentacao * valorUnitario;

        const novoCustoMedio =
            (valorEstoqueAtual + valorNovaEntrada) /
            produto.quantidade;

        produto.custoMedio = novoCustoMedio;
        novaMovimentacao.custoMedio = novoCustoMedio;

        movimentacoes.push(novaMovimentacao);
        proximoIdMovimentacao++;

        renderizarProduto();
        formMovimentacao.reset();
        calcularResumo();

        salvarStorage("lista_produtos", produtos);
        salvarStorage("lista_movimentacoes", movimentacoes);
    } else if (tipoMovimentacao === "saida") {
        if (isNaN(valorUnitario) || valorUnitario <= 0) {
            alert("Valor unitário inválido.");
            return;
        }

        if (produto.quantidade >= qtdMovimentacao) {
            if (valorUnitario < produto.custoMedio) {
                const confirmar = confirm(
                    `O preço de venda está abaixo do custo médio.\n\n` +
                    `Custo médio: ${formatadorMoeda(produto.custoMedio)}\n` +
                    `Preço de venda: ${formatadorMoeda(valorUnitario)}\n\n` +
                    `Deseja continuar?`
                );

                if (!confirmar) {
                    return;
                }
            }

            produto.quantidade -= qtdMovimentacao;

            const custoMedio = produto.custoMedio;
            const valorVenda = qtdMovimentacao * valorUnitario;
            const custoTotal = qtdMovimentacao * custoMedio;
            const lucroBruto = valorVenda - custoTotal;

            const novaMovimentacao = {
                id: proximoIdMovimentacao,
                produtoId: produto.id,
                produtoNome: produto.nome,
                tipo: "saida",
                quantidade: qtdMovimentacao,
                valorUnitario,
                valorVenda,
                custoTotal,
                custoMedio,
                lucroBruto,
                data: new Date().toISOString()
            };

            movimentacoes.push(novaMovimentacao);
            proximoIdMovimentacao++;

            renderizarProduto();
            formMovimentacao.reset();
            calcularResumo();

            salvarStorage("lista_produtos", produtos);
            salvarStorage("lista_movimentacoes", movimentacoes);
        } else {
            alert("Estoque insuficiente.");
        }
    } else {
        alert("Tipo de movimentação inválido.");
    }
}

function buscarProduto() {
    const busca = produtos.filter(p =>
        p.nome.toLowerCase().includes(inpBusca.value.toLowerCase())
    );

    renderizarProduto(busca);
}

function atualizarFiltroCategorias() {
    selectCategoria.innerHTML = '<option value="todas">Todas</option>';

    const idsCategorias = [];

    produtos.forEach(p => {
        const idCategoria = Number(p.idCategoria);

        if (!idsCategorias.includes(idCategoria)) {
            idsCategorias.push(idCategoria);
        }
    });

    idsCategorias.forEach(idCateg => {
        const categoria = categorias.find(c => c.id === idCateg);

        if (!categoria) {
            return;
        }

        const opt = document.createElement("option");

        opt.value = categoria.id;
        opt.textContent = categoria.nome;

        selectCategoria.appendChild(opt);
    });
}

function filtroCategoria() {
    if (selectCategoria.value === "todas") {
        renderizarProduto(produtos);
        return;
    }

    const produtosFiltrados = produtos.filter(p =>
        p.idCategoria === Number(selectCategoria.value)
    );

    renderizarProduto(produtosFiltrados);
}

function filtrarEstoqueBaixo() {
    const estoqueBaixo = produtos.filter(p =>
        p.ativo === true && p.quantidade <= p.estoqueMinimo
    );

    renderizarProduto(estoqueBaixo);
}
function calcularResumo() {
    let produtosTotal = 0;
    let unidadesTotal = 0;
    let valorEstoque = 0;
    let valorPotencialVenda = 0;

    produtos.forEach(p => {
        valorEstoque += p.custoMedio * p.quantidade;

        if (p.ativo === true) {
            produtosTotal++;
            unidadesTotal += p.quantidade;
            valorPotencialVenda += p.quantidade * p.precoVendaPadrao;
        }
    });

    totalProdutos.textContent = produtosTotal;
    totalUnidades.textContent = unidadesTotal;
    valorTotalEstoque.textContent = formatadorMoeda(valorEstoque);
    valorPotencialEstoque.textContent =
        formatadorMoeda(valorPotencialVenda);
}

// Histórico

function renderizarHistorico(lista = movimentacoes) {
    listaHistorico.innerHTML = "";

    const listaOrdenada = [...lista];

    listaOrdenada.sort((a, b) => {
        return new Date(b.data) - new Date(a.data);
    });

    listaOrdenada.forEach(m => {
        const tr = document.createElement("tr");

        let resumo = null;
        let quantidadeExibida = null;

        if (m.tipo === "entrada") {
            resumo = "Entrada de Estoque";
            quantidadeExibida = m.quantidade;

        } else if (m.tipo === "saida") {
            resumo = "Saída de Estoque";
            quantidadeExibida = m.quantidade;

        } else if (m.tipo === "ajuste") {
            resumo = "Ajuste de Estoque";
            quantidadeExibida = m.diferenca;

        } else if (m.tipo === "estoque inicial") {
            resumo = "Estoque Inicial";
            quantidadeExibida = m.quantidade;

        } else if (m.tipo === "estorno") {
            resumo = `Estorno de ${m.tipoMovimentacaoOriginal}`;
            quantidadeExibida = "—";
        }

        let acoes = `
            <button onclick="renderizarDetalhesMovimentacao(${m.id})">
                Detalhes
            </button>`;

        if (
            (m.tipo === "entrada" ||
                m.tipo === "saida" ||
                m.tipo === "ajuste") &&
            !m.estornada
        ) {
            acoes += `
                <button onclick="estornarMovimentacao(${m.id})">
                    Estornar
                </button>`;
        }

        tr.innerHTML = `
            <td>${formatarData(m.data)}</td>
            <td>${m.produtoNome}</td>
            <td>${m.tipo}</td>
            <td>${resumo}</td>
            <td>${quantidadeExibida}</td>
            <td>${acoes}</td>`;

        listaHistorico.appendChild(tr);
    });
}

function renderizarSelectHistorico() {
    selectHistorico.innerHTML = "";

    const tipoMovimentacao = [];

    const optTodos = document.createElement("option");

    optTodos.value = "todos";
    optTodos.textContent = "Todos";

    selectHistorico.appendChild(optTodos);

    movimentacoes.forEach(m => {
        if (!tipoMovimentacao.includes(m.tipo)) {
            tipoMovimentacao.push(m.tipo);

            const opt = document.createElement("option");

            opt.value = m.tipo;
            opt.textContent = m.tipo;

            selectHistorico.appendChild(opt);
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
    if (selectHistorico.value === "todos" && selectProdutoHistorico.value === "todos") {
        renderizarHistorico(movimentacoes);

    } else if (selectHistorico.value === "todos" && selectProdutoHistorico.value !== "todos") {
        const idProduto = Number(selectProdutoHistorico.value);

        const movimentacaoProdutosFiltrados = movimentacoes.filter(m =>
            m.produtoId === idProduto);

        renderizarHistorico(movimentacaoProdutosFiltrados);
    } else if (selectHistorico.value !== "todos" && selectProdutoHistorico.value === "todos") {
        const movimentacaoTipoFiltrados = movimentacoes.filter(
            m => m.tipo === selectHistorico.value
        );

        renderizarHistorico(movimentacaoTipoFiltrados);
    } else {
        const idProduto = Number(selectProdutoHistorico.value);

        const movimentacaoTipoEProdutoFiltrados = movimentacoes.filter(
            m => m.tipo === selectHistorico.value && m.produtoId === idProduto
        );

        renderizarHistorico(movimentacaoTipoEProdutoFiltrados);
    }
}

function renderizarDetalhesMovimentacao(id) {
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

        tabela.innerHTML = `
            <thead>
                <tr>
                    <th>Campo</th>
                    <th>Informação</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Produto</td>
                    <td>${movimentacao.produtoNome}</td>
                </tr>
                <tr>
                    <td>Quantidade</td>
                    <td>${movimentacao.quantidade}</td>
                </tr>
                <tr>
                    <td>Custo unitário</td>
                    <td>${formatadorMoeda(movimentacao.valorUnitario)}</td>
                </tr>
                <tr>
                    <td>Custo total</td>
                    <td>${formatadorMoeda(movimentacao.custoTotal)}</td>
                </tr>
                <tr>
                    <td>Custo médio</td>
                    <td>${formatadorMoeda(movimentacao.custoMedio)}</td>
                </tr>
                <tr>
                    <td>Data</td>
                    <td>${formatarData(movimentacao.data)}</td>
                </tr>
            </tbody>
        `;

        conteudoDetalhes.appendChild(tabela);
    }

    if (movimentacao.tipo === "entrada") {
        const tabela = document.createElement("table");

        tabela.classList.add("tabela-detalhes");

        tabela.innerHTML = `
            <thead>
                <tr>
                    <th>Campo</th>
                    <th>Informação</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Produto</td>
                    <td>${movimentacao.produtoNome}</td>
                </tr>
                <tr>
                    <td>Quantidade</td>
                    <td>${movimentacao.quantidade}</td>
                </tr>
                <tr>
                    <td>Custo unitário</td>
                    <td>${formatadorMoeda(movimentacao.valorUnitario)}</td>
                </tr>
                <tr>
                    <td>Custo total</td>
                    <td>${formatadorMoeda(movimentacao.custoTotal)}</td>
                </tr>
                <tr>
                    <td>Custo médio após a entrada</td>
                    <td>${formatadorMoeda(movimentacao.custoMedio)}</td>
                </tr>
                <tr>
                    <td>Data</td>
                    <td>${formatarData(movimentacao.data)}</td>
                </tr>
            </tbody>
        `;

        conteudoDetalhes.appendChild(tabela);
    }

    if (movimentacao.tipo === "saida") {
        const tabela = document.createElement("table");

        tabela.classList.add("tabela-detalhes");

        tabela.innerHTML = `
            <thead>
                <tr>
                    <th>Campo</th>
                    <th>Informação</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Produto</td>
                    <td>${movimentacao.produtoNome}</td>
                </tr>
                <tr>
                    <td>Quantidade</td>
                    <td>${movimentacao.quantidade}</td>
                </tr>
                <tr>
                    <td>Valor unitário de venda</td>
                    <td>${formatadorMoeda(movimentacao.valorUnitario)}</td>
                </tr>
                <tr>
                    <td>Valor total da venda</td>
                    <td>${formatadorMoeda(movimentacao.valorVenda)}</td>
                </tr>
                <tr>
                    <td>Custo total</td>
                    <td>${formatadorMoeda(movimentacao.custoTotal)}</td>
                </tr>
                <tr>
                    <td>Custo médio</td>
                    <td>${formatadorMoeda(movimentacao.custoMedio)}</td>
                </tr>
                <tr>
                    <td>Lucro bruto</td>
                    <td>${formatadorMoeda(movimentacao.lucroBruto)}</td>
                </tr>
                <tr>
                    <td>Data</td>
                    <td>${formatarData(movimentacao.data)}</td>
                </tr>
            </tbody>
        `;

        conteudoDetalhes.appendChild(tabela);
    }

    if (movimentacao.tipo === "ajuste") {
        const tabela = document.createElement("table");

        tabela.classList.add("tabela-detalhes");

        tabela.innerHTML = `
            <thead>
                <tr>
                    <th>Campo</th>
                    <th>Informação</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Produto</td>
                    <td>${movimentacao.produtoNome}</td>
                </tr>
                <tr>
                    <td>Estoque anterior</td>
                    <td>${movimentacao.quantidadeAnterior}</td>
                </tr>
                <tr>
                    <td>Estoque final</td>
                    <td>${movimentacao.quantidadeFinal}</td>
                </tr>
                <tr>
                    <td>Diferença</td>
                    <td>${movimentacao.diferenca}</td>
                </tr>
                <tr>
                    <td>Motivo</td>
                    <td>${movimentacao.motivo}</td>
                </tr>
                <tr>
                    <td>Data</td>
                    <td>${formatarData(movimentacao.data)}</td>
                </tr>
            </tbody>
        `;

        conteudoDetalhes.appendChild(tabela);
    }

    if (movimentacao.tipo === "estorno") {
        const movimentacaoOriginal = movimentacoes.find(
            m => m.id === movimentacao.movimentacaoOriginalId
        );

        const tabela = document.createElement("table");

        tabela.classList.add("tabela-detalhes");

        tabela.innerHTML = `
            <thead>
                <tr>
                    <th>Campo</th>
                    <th>Informação</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Produto</td>
                    <td>${movimentacao.produtoNome}</td>
                </tr>
                <tr>
                    <td>Tipo</td>
                    <td>Estorno</td>
                </tr>
                <tr>
                    <td>Movimentação original</td>
                    <td>
                        ${movimentacaoOriginal ? ` ${movimentacaoOriginal.tipo}#${movimentacaoOriginal.id}
                            <button onclick="renderizarDetalhesMovimentacao(${movimentacaoOriginal.id})">Ver detalhes</button>` : "Movimentação não encontrada"}
                    </td>
                </tr>
                <tr>
                    <td>Motivo</td>
                    <td>${movimentacao.motivo}</td>
                </tr>
                <tr>
                    <td>Data</td>
                    <td>${formatarData(movimentacao.data)}</td>
                </tr>
            </tbody>
        `;

        conteudoDetalhes.appendChild(tabela);
    }
}

function registrarAjusteEstoque() {
    const quantidadeAjuste = Number(inpQuantidadeAjuste.value);
    const motivo = inpMotivoAjuste.value.trim();

    if (inpQuantidadeAjuste.value === "") {
        alert("Informe a quantidade encontrada.");
        return;
    }

    if (isNaN(quantidadeAjuste) || quantidadeAjuste < 0) {
        alert("Informe uma quantidade válida.");
        return;
    }

    if (!motivo) {
        alert("Informe o motivo do ajuste.");
        return;
    }

    const produto = produtos.find(
        p => p.id === Number(selectProdutoAjuste.value)
    );

    if (!produto) {
        alert("Produto não encontrado.");
        return;
    }

    if (produto.ativo !== true) {
        alert("Produto inativo.");
        return;
    }

    const quantidadeAnterior = produto.quantidade;
    const diferenca = quantidadeAjuste - quantidadeAnterior;

    if (diferenca === 0) {
        alert("O estoque já está correto.");
        return;
    }

    produto.quantidade = quantidadeAjuste;

    const novaMovimentacao = {
        id: proximoIdMovimentacao,
        produtoId: produto.id,
        produtoNome: produto.nome,
        tipo: "ajuste",
        quantidadeAnterior,
        quantidadeFinal: produto.quantidade,
        diferenca,
        motivo,
        data: new Date().toISOString()
    };

    movimentacoes.push(novaMovimentacao);
    proximoIdMovimentacao++;

    salvarStorage("lista_produtos", produtos);
    salvarStorage("lista_movimentacoes", movimentacoes);

    renderizarProduto();
    calcularResumo();
    atualizarEstoqueAtual();
    renderizarSelectHistorico();

    inpQuantidadeAjuste.value = "";
    inpMotivoAjuste.value = "";

    alert("Ajuste de estoque registrado com sucesso.");
}

function navegarPagina() {
    const paginaAtual =
        window.location.hash || "#page-dashboard";

    const secoes = document.querySelectorAll(".section");
    const linksNavegacao = document.querySelectorAll(".nav-item");

    secoes.forEach(secao => {
        secao.style.display = "none";
    });

    linksNavegacao.forEach(link => {
        link.classList.remove("active");
    });

    const secaoSelecionada =
        document.querySelector(paginaAtual);

    const linkSelecionado =
        document.querySelector(
            `.nav-item[href="${paginaAtual}"]`
        );

    if (secaoSelecionada) {
        secaoSelecionada.style.display = "block";
    }

    if (linkSelecionado) {
        linkSelecionado.classList.add("active");
    }

    if (paginaAtual === "#page-historico") {
        renderizarSelectHistorico();
        renderizarHistorico();
    }
}

window.addEventListener("hashchange", navegarPagina);

navegarPagina();

// Eventos

btnCancelar.addEventListener("click", function () {
    cancelarEdicao();
});

selectProdutoHistorico.addEventListener("change", function () {
    filtrarHistorico();
});

selectHistorico.addEventListener("change", function () {
    filtrarHistorico();
});

inpTipoMovimentacao.addEventListener("change", function () {
    if (inpTipoMovimentacao.value === "entrada") {
        btnMovimentacao.textContent = "Registrar entrada";
    } else {
        btnMovimentacao.textContent = "Registrar saída";
    }
});

btnEstoqueBaixo.addEventListener("click", function () {
    filtrarEstoqueBaixo();
});

btnTodosProdutos.addEventListener("click", function () {
    renderizarProduto(produtos);
});

selectCategoria.addEventListener("change", function () {
    filtroCategoria();
});

inpBusca.addEventListener("input", function () {
    buscarProduto();
});

form.addEventListener("submit", function (e) {
    e.preventDefault();
    cadastrarProduto();
});

formMovimentacao.addEventListener("submit", function (e) {
    e.preventDefault();
    registrarMovimentacao();
});

formCadastrarCategoria.addEventListener("submit", function (e) {
    e.preventDefault();
    cadastrarCategoria();
});

selectProdutoAjuste.addEventListener("change", function () {
    atualizarEstoqueAtual();
});

formAjusteEstoque.addEventListener("submit", function (e) {
    e.preventDefault();
    registrarAjusteEstoque();
});

btnFecharDetalhes.addEventListener("click", function () {
    overlayDetalhes.style.display = "none";
});

// Início

renderizarProduto();
renderizarCategorias();
calcularResumo();
atualizarSelectProdutos();
atualizarSelectCategoria();
atualizarFiltroCategorias();
atualizarEstoqueAtual();
