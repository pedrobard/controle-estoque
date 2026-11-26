export const API_URL = "http://127.0.0.1:3000";

export function apiUrl(rota) {
    return `${API_URL}${rota}`;
}

export function apiFetch(rota, opcoes = {}) {
    return fetch(apiUrl(rota), {
        ...opcoes,
        credentials: "include"
    });
}