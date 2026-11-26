export const API_URL = "";

export function apiUrl(rota) {
    return `${API_URL}${rota}`;
}

export function apiFetch(rota, opcoes = {}) {
    return fetch(apiUrl(rota), {
        ...opcoes,
        credentials: "include"
    });
}