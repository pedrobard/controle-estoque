export function formatadorMoeda(valor) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(valor);
}

export function formatarData(data) {
    return new Date(data).toLocaleString("pt-BR");
}
export function formatarQuantidade(valor) {
    return Number(valor).toLocaleString("pt-BR");
}


