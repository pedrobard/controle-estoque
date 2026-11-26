import { produtos } from "./produtos.js";
import { categorias } from "./categorias.js";
import { apiFetch } from "./api.js";


const formMovimentacao = document.querySelector("#form-movimentacao");
const inpSelectProduto = document.querySelector("#select-produto");
const inpQuantidadeMovimentacao = document.querySelector("#inp-quantidade-movimentacao");
const inpCustoMovimentacao = document.querySelector("#inp-custo-movimentacao");
const inpTipoMovimentacao = document.querySelector("#select-tipo-movimentacao");
const btnMovimentacao = formMovimentacao.querySelector('button[type="submit"]');
const formAjusteEstoque = document.querySelector("#form-ajuste-estoque");
const selectProdutoAjuste = document.querySelector("#select-produto-ajuste");
const inpEstoqueAtual = document.querySelector("#inp-estoque-atual");
const inpQuantidadeAjuste = document.querySelector("#inp-quantidade-ajuste");
const inpMotivoAjuste = document.querySelector("#inp-motivo-ajuste");
const grupoCustoUnitarioAjuste = document.querySelector("#grupo-custo-unitario-ajuste");
const inpCustoUnitarioAjuste = document.querySelector("#inp-custo-unitario-ajuste");

//funções

async function registrarMovimentacao() {
    const selectProduto = Number(inpSelectProduto.value);
    const qtdMovimentacao = Number(inpQuantidadeMovimentacao.value);
    const tipoMovimentacao = inpTipoMovimentacao.value;
    const valorUnitario = Number(inpCustoMovimentacao.value);

    if (isNaN(selectProduto) || selectProduto <= 0) {
        alert("Selecione um produto válido.");
        return;
    }


    if (isNaN(qtdMovimentacao) ||  !Number.isInteger(qtdMovimentacao) || qtdMovimentacao <= 0) {
        alert("Quantidade inválida.");
        return;
    }


    if (tipoMovimentacao !== 'entrada' && tipoMovimentacao !== 'saida') {
        alert("Tipo de movimentação inválido.");
        return;
    }

    if (isNaN(valorUnitario) || valorUnitario <= 0) {
        alert("Valor unitário inválido.");
        return;
    }

    try {

        const resposta = await apiFetch("/movimentacoes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                idProduto: selectProduto,
                tipo: tipoMovimentacao,
                quantidade: qtdMovimentacao,
                valorUnitario,
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.erro);
            return;
        }

        alert(dados.mensagem);
        formMovimentacao.reset();

        document.dispatchEvent(new CustomEvent("movimentacao-estoque-atualizada"));



    } catch (erro) {
        console.error(erro);
        alert("Não foi possível conectar ao servidor.");
    }


}

async function registrarAjusteEstoque() {
    const idProduto = Number(selectProdutoAjuste.value);
    const quantidadeAjuste = inpQuantidadeAjuste.value.trim();
    const motivo = inpMotivoAjuste.value.trim();
    const custoUnitario = inpCustoUnitarioAjuste.value;

    if (quantidadeAjuste === "") {
        alert("Informe a quantidade encontrada.");
        return;
    }

    const quantidadeAjusteNum = Number(quantidadeAjuste);

    if (!idProduto || !Number.isInteger(idProduto) || idProduto <= 0) {
        alert("Selecione um produto válido.");
        return;
    }

    if (!Number.isFinite(quantidadeAjusteNum) || !Number.isInteger(quantidadeAjusteNum) || quantidadeAjusteNum < 0) {

        alert("Informe uma quantidade inteira válida, maior ou igual a zero.");
        return;
    }

    if (!motivo) {
        alert("Informe o motivo do ajuste.");
        return;
    }

    const produto = produtos.find(p => p.id === idProduto);

    if (!produto) {
        alert("Produto não encontrado.");
        return;
    }

    if (produto.ativo !== true) {
        alert("Produto inativo.");
        return;
    }

    const diferenca = quantidadeAjusteNum- Number(inpEstoqueAtual.value);
    const produtoExigeCusto = diferenca > 0 && Number(produto.custoMedio) === 0;

    if (produtoExigeCusto) {
        const custoUnitarioNum = Number(custoUnitario);

        if (custoUnitario.trim() === "" || !Number.isFinite(custoUnitarioNum) || custoUnitarioNum <= 0) {
            alert("Informe um custo unitário válido para as unidades adicionadas.");
            return;
        }
    }



    if (quantidadeAjusteNum === Number(produto.quantidade)) {
        alert("O estoque já está correto.");
        return;
    }

    try {
        const resposta = await apiFetch("/ajustes-estoque", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                idProduto, quantidadeFisica: quantidadeAjusteNum, motivo,
                custoUnitario: produtoExigeCusto ? Number(custoUnitario) : null
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.erro);
            return;
        }

        alert(dados.mensagem);

        document.dispatchEvent(new CustomEvent("movimentacao-estoque-atualizada"));


        inpQuantidadeAjuste.value = "";
        inpMotivoAjuste.value = "";
        inpCustoUnitarioAjuste.value = "";
        atualizarCampoCustoAjuste();




    } catch (erro) {
        console.error(erro);
        alert("Não foi possível conectar ao servidor.");
    }
}

// usada no select do formulario de movimentações
export function atualizarSelectProdutos() {
    inpSelectProduto.innerHTML = "";
    selectProdutoAjuste.innerHTML = "";

    const produtosAtivos = produtos.filter(p => p.ativo === true);

    if (produtosAtivos.length === 0) {
        const opcaoMovimentacao = document.createElement("option");
        opcaoMovimentacao.value = "";
        opcaoMovimentacao.textContent = "Nenhum produto ativo";

        const opcaoAjuste = document.createElement("option");
        opcaoAjuste.value = "";
        opcaoAjuste.textContent = "Nenhum produto ativo";

        inpSelectProduto.appendChild(opcaoMovimentacao);
        selectProdutoAjuste.appendChild(opcaoAjuste);

        atualizarEstoqueAtual();
        atualizarCampoCustoAjuste();
        return;
    }

    produtosAtivos.forEach(p => {
        const opt = document.createElement("option");
        const optAjuste = document.createElement("option");

        const categoria = categorias.find(
            c => c.id === Number(p.idCategoria)
        );

        const nomeCategoria = categoria ? categoria.nome : "Categoria não encontrada";

        opt.value = p.id;
        opt.textContent = `${p.nome} (${nomeCategoria})`;

        optAjuste.value = p.id;
        optAjuste.textContent = `${p.nome} (${nomeCategoria})`;

        inpSelectProduto.appendChild(opt);
        selectProdutoAjuste.appendChild(optAjuste);
    });

    atualizarEstoqueAtual();
    atualizarCampoCustoAjuste();
}

//usada no formulario de ajuste que é uma movimentação
export function atualizarEstoqueAtual() {
    const id = Number(selectProdutoAjuste.value);
    const produto = produtos.find(p => p.id === id);

    if (produto !== undefined) {
        inpEstoqueAtual.value = Number(produto.quantidade);
    } else {
        inpEstoqueAtual.value = 0;
    }
}
function atualizarCampoCustoAjuste() {
    const idProduto = Number(selectProdutoAjuste.value);
    const produto = produtos.find(p => p.id === idProduto);

    if (!produto) {
        grupoCustoUnitarioAjuste.hidden = true;
        inpCustoUnitarioAjuste.value = "";
        return;
    }

    const quantidadeEncontrada = Number(inpQuantidadeAjuste.value);
    const estoqueAtual = Number(produto.quantidade);
    const diferenca = quantidadeEncontrada - estoqueAtual;
    const custoMedioAtual = Number(produto.custoMedio);

    const solicitarCusto = diferenca > 0 && custoMedioAtual === 0;

    grupoCustoUnitarioAjuste.hidden = !solicitarCusto;

    if (!solicitarCusto) {
        inpCustoUnitarioAjuste.value = "";
    }
}

//eventos
inpTipoMovimentacao.addEventListener("change", function () {
    if (inpTipoMovimentacao.value === "entrada") {
        btnMovimentacao.textContent = "Registrar entrada";
    } else {
        btnMovimentacao.textContent = "Registrar saída";
    }
});

formMovimentacao.addEventListener("submit", function (e) {
    e.preventDefault();
    registrarMovimentacao();
});



selectProdutoAjuste.addEventListener("change", function () {
    atualizarEstoqueAtual();
    atualizarCampoCustoAjuste();
});

inpQuantidadeAjuste.addEventListener("input", function () {
    atualizarCampoCustoAjuste();
});

formAjusteEstoque.addEventListener("submit", function (e) {
    e.preventDefault();
    registrarAjusteEstoque();
});
