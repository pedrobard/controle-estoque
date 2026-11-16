import { apiUrl } from "./api.js";

const formCadastrarCategoria = document.querySelector("#form-cadastrar-categoria");
const inpNomeCategoria = document.querySelector("#inp-nome-categoria");
const btnCadastrarCategoria = document.querySelector("#btn-cadastrar-categoria");
const listaCategorias = document.querySelector("#lista-categorias");

export let categorias = [];
let idCategoriaEditando = null;

//funções

export async function carregarCategorias() {
    try {
        const resposta = await fetch(apiUrl("/categorias"));

        const dados = await resposta.json();

        if (!resposta.ok) {
            console.error(dados.erro);
            alert(dados.erro);
            return false;
        }

        categorias = dados.dados;

        renderizarCategorias();

        return true;

    } catch (erro) {
        console.error(erro);
        alert("Não foi possível carregar as categorias. Verifique a conexão com o servidor.");
        return false;
    }
}

async function cadastrarCategoria() {
    if (idCategoriaEditando === null) {
        const nomeCategoria = inpNomeCategoria.value.trim();

        if (!nomeCategoria) {
            alert("Preencha os campos corretamente.");
            return;
        }

        try {
            const resposta = await fetch(apiUrl("/categorias"), {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ nome: nomeCategoria })
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                alert(dados.erro);
                return;
            }

            alert(dados.mensagem);

            const carregou = await carregarCategorias();

            if (!carregou) {
                alert("Categoria cadastrada, mas não foi possível atualizar a lista.");
                formCadastrarCategoria.reset();
                return;
            }

            document.dispatchEvent(new CustomEvent("categorias-atualizadas"));


            formCadastrarCategoria.reset();

        } catch (erro) {
            console.error(erro);
            alert("Não foi possível conectar ao servidor.");
        }

    } else {
        const nomeCategoria = inpNomeCategoria.value.trim();

        if (!nomeCategoria) {
            alert("Preencha o campo corretamente.");
            return;
        }
        try {
            const resposta = await fetch(apiUrl(`/categorias/${idCategoriaEditando}`), {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ nome: nomeCategoria })
            });

            const dados = await resposta.json();

            if (!resposta.ok) {
                alert(dados.erro);
                return;
            }

            alert(dados.mensagem);

            const carregou = await carregarCategorias();

            if (!carregou) {
                alert("Categoria alterada, mas não foi possível atualizar a lista.");
                return;
            }

            idCategoriaEditando = null;
            btnCadastrarCategoria.textContent = "Cadastrar Categoria";

            document.dispatchEvent(new CustomEvent("categorias-atualizadas"));


            formCadastrarCategoria.reset();

        } catch (erro) {
            console.error(erro);
            alert("Não foi possível conectar ao servidor.");
        }
    }
}

export async function removerCategoria(id) {

    if (!confirm("Tem certeza que quer excluir essa categoria?")) {
        return;
    }
    try {
        const resposta = await fetch(apiUrl(`/categorias/${id}`), {
            method: "DELETE",
        })
        const dados = await resposta.json();

        if (!resposta.ok) {
            alert(dados.erro);
            return;
        }

        alert(dados.mensagem);

        if (idCategoriaEditando === id) {
            idCategoriaEditando = null;
            formCadastrarCategoria.reset();
            btnCadastrarCategoria.textContent = "Cadastrar Categoria";
        }

        const carregou = await carregarCategorias();

        if (!carregou) {
            alert("Categoria excluída, mas não foi possível atualizar a lista.");
            return;
        }

        document.dispatchEvent(new CustomEvent("categorias-atualizadas"));



    } catch (erro) {
        console.error(erro);
        alert("Não foi possível conectar ao servidor.");
    }

}

export function editarCategoria(id) {
    const indice = categorias.findIndex(categoria => categoria.id === id);

    if (indice === -1) {
        alert("Categoria não encontrada.");
        return;
    }

    const categoria = categorias[indice];

    inpNomeCategoria.value = categoria.nome;
    idCategoriaEditando = id;
    btnCadastrarCategoria.textContent = "Salvar alteração";
}


function renderizarCategorias() {
    listaCategorias.innerHTML = "";

    categorias.forEach(categoria => {
        const tr = document.createElement("tr");

        const tdNome = document.createElement("td");
        tdNome.textContent = categoria.nome;

        const tdAcoes = document.createElement("td");

        const btnEditar = document.createElement("button");
        btnEditar.type = "button";
        btnEditar.dataset.acao = "editar";
        btnEditar.dataset.id = categoria.id;
        btnEditar.textContent = "Editar";

        const btnRemover = document.createElement("button");
        btnRemover.type = "button";
        btnRemover.dataset.acao = "remover";
        btnRemover.dataset.id = categoria.id;
        btnRemover.textContent = "Excluir";

        tdAcoes.append(btnEditar, btnRemover);
        tr.append(tdNome, tdAcoes);

        listaCategorias.appendChild(tr);
    });
}

//eventos

formCadastrarCategoria.addEventListener("submit", function (e) {
    e.preventDefault();
    cadastrarCategoria();
});

listaCategorias.addEventListener("click", (e) => {
    const botao = e.target.closest("button[data-acao]");

    if (!botao) {
        return;
    }

    const acao = botao.dataset.acao;
    const id = Number(botao.dataset.id);

    if (acao === "editar") {
        editarCategoria(id);
    } else if (acao === "remover") {
        removerCategoria(id);
    }
});