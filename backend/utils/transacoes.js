export async function reverterTransacao(client) {
    try {
        await client.query("ROLLBACK");
        return true;
    } catch (erro) {
        console.error("Erro ao reverter a transação:", erro);
        return false;
    }
}