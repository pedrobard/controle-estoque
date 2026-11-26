# Documentação da API

## 1. Visão geral

A API do Gerenciador de Estoque permite consultar e gerenciar categorias, produtos e movimentações de estoque.

O backend foi desenvolvido com Node.js e Express, utilizando PostgreSQL para armazenar os dados.

As requisições que enviam informações devem utilizar o formato JSON, com o cabeçalho:

```http
Content-Type: application/json
```
Todas as rotas de categorias, produtos, movimentações e ajustes de estoque exigem uma sessão autenticada. Requisições realizadas sem uma sessão válida são rejeitadas com o código HTTP `401 Unauthorized`.

### Endereço local

Por padrão, considerando o servidor executado na porta `3000`, o endereço-base da API é:

```text
http://localhost:3000
```

## 2. Categorias

A rota `/categorias` permite cadastrar, consultar, editar e excluir categorias.

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/categorias` | Lista as categorias cadastradas. |
| POST | `/categorias` | Cadastra uma nova categoria. |
| PATCH | `/categorias/:id` | Atualiza o nome de uma categoria. |
| DELETE | `/categorias/:id` | Exclui uma categoria. |

### 2.1. Listar categorias

**Requisição**

```http
GET /categorias
```

Retorna as categorias cadastradas.

**Resposta de sucesso — 200**

```json
{
  "mensagem": "Categorias encontradas com sucesso.",
  "dados": [
    {
      "id": 1,
      "nome": "Eletrônicos"
    }
  ]
}
```

### 2.2. Cadastrar categoria

**Requisição**

```http
POST /categorias
```

**Corpo da requisição**

```json
{
  "nome": "Eletrônicos"
}
```

**Resposta de sucesso — 201**

```json
{
  "mensagem": "Categoria cadastrada com sucesso.",
  "dados": {
    "id": 1,
    "nome": "Eletrônicos"
  }
}
```

### 2.3. Editar categoria

**Requisição**

```http
PATCH /categorias/1
```

**Corpo da requisição**

```json
{
  "nome": "Acessórios"
}
```

**Resposta de sucesso — 200**

```json
{
  "mensagem": "Categoria atualizada com sucesso.",
  "dados": {
    "id": 1,
    "nome": "Acessórios"
  }
}
```

### 2.4. Excluir categoria

**Requisição**

```http
DELETE /categorias/1
```

A categoria só pode ser excluída quando não possuir produtos vinculados.

**Resposta de sucesso — 200**

```json
{
  "mensagem": "Categoria excluída com sucesso.",
  "dados": {
    "id": 1
  }
}
```

## 3. Produtos

A rota `/produtos` permite consultar, cadastrar, editar, alterar o status e excluir produtos.

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/produtos` | Lista os produtos cadastrados. |
| GET | `/produtos/:id` | Consulta um produto pelo identificador. |
| POST | `/produtos` | Cadastra um novo produto. |
| PATCH | `/produtos/:id` | Atualiza os dados permitidos do produto. |
| PATCH | `/produtos/:id/status` | Altera o status do produto. |
| DELETE | `/produtos/:id` | Exclui um produto conforme as regras do sistema. |

### 3.1. Listar produtos

**Requisição**

```http
GET /produtos
```

Retorna os produtos cadastrados, incluindo suas informações de estoque e situação.

**Resposta de sucesso — 200**

```json
{
  "mensagem": "Produtos encontrados com sucesso.",
  "dados": []
}
```

### 3.2. Buscar produto por ID

**Requisição**

```http
GET /produtos/1
```

O identificador do produto é informado como parâmetro da URL.

**Resposta de sucesso — 200**

```json
{
  "mensagem": "Produto encontrado com sucesso.",
  "dados": {
    "id": 1,
    "nome": "Produto exemplo"
  }
}
```

### 3.3. Cadastrar produto

**Requisição**

```http
POST /produtos
```

**Corpo da requisição**

```json
{
  "nome": "Produto exemplo",
  "idCategoria": 1,
  "quantidade": 10,
  "custoInicial": 15.50,
  "preco": 25.00,
  "estoqueMinimo": 3
}
```

**Campos recebidos**

| Campo | Tipo | Descrição |
|---|---|---|
| `nome` | String | Nome do produto. |
| `idCategoria` | Number | Identificador da categoria. |
| `quantidade` | Number | Quantidade inicial em estoque. |
| `custoInicial` | Number | Custo unitário inicial. |
| `preco` | Number | Preço de venda padrão. |
| `estoqueMinimo` | Number | Quantidade mínima desejada em estoque. |

O campo `custoInicial` pode ser zero quando a quantidade inicial também for zero. Quando houver estoque inicial, o custo deve ser maior que zero.

**Resposta de sucesso — 201**

```json
{
  "mensagem": "Produto cadastrado com sucesso.",
  "dados": {}
}
```

O cadastro e o registro do estoque inicial, quando aplicável, são realizados na mesma transação.

### 3.4. Editar produto

**Requisição**

```http
PATCH /produtos/1
```

**Corpo da requisição**

```json
{
  "nome": "Produto atualizado",
  "idCategoria": 2,
  "preco": 30.00,
  "estoqueMinimo": 5
}
```

**Campos recebidos**

| Campo | Tipo | Descrição |
|---|---|---|
| `nome` | String | Novo nome do produto. |
| `idCategoria` | Number | Identificador da categoria. |
| `preco` | Number | Novo preço de venda padrão. |
| `estoqueMinimo` | Number | Novo estoque mínimo. |

A quantidade e o custo médio não são alterados por esse endpoint.

**Resposta de sucesso — 200**

```json
{
  "mensagem": "Produto atualizado com sucesso.",
  "dados": {}
}
```

### 3.5. Alterar status do produto

**Requisição**

```http
PATCH /produtos/1/status
```

**Corpo da requisição**

Para ativar:

```json
{
  "ativo": true
}
```

Para desativar:

```json
{
  "ativo": false
}
```

O campo `ativo` deve receber um valor booleano.

**Resposta de sucesso — 200**

```json
{
  "mensagem": "Status do produto atualizado com sucesso.",
  "dados": {}
}
```

Caso o produto já possua o status solicitado, a API também retorna `200`, informando que nenhuma alteração foi necessária.

**Observação sobre o retorno de `dados`:**

A estrutura de `dados` depende de o status do produto precisar ou não ser alterado:

- Quando o produto já possui o status solicitado, `dados` contém apenas os campos `ativo` e `excluido`.
- Quando ocorre uma alteração de status, `dados` contém o registro completo do produto, utilizando os nomes originais das colunas do banco de dados (snake_case).

### 3.6. Excluir produto

**Requisição**

```http
DELETE /produtos/1
```

A exclusão só é permitida quando o produto está inativo e possui estoque igual a zero.

A exclusão é lógica. O sistema altera o campo `excluido` para `true`, preservando o registro no banco de dados e o histórico de movimentações.

**Resposta de sucesso — 200**

```json
{
  "mensagem": "Produto excluído com sucesso.",
  "dados": {}
}
```

## 4. Movimentações

A rota `/movimentacoes` permite consultar o histórico de movimentações, registrar entradas e saídas e realizar estornos.

| Método | Endpoint | Descrição |
|---|---|---|
| GET | `/movimentacoes` | Lista as movimentações registradas. |
| POST | `/movimentacoes` | Registra uma entrada ou saída. |
| POST | `/movimentacoes/:id/estorno` | Estorna uma movimentação. |

### 4.1. Listar movimentações

**Requisição**

```http
GET /movimentacoes
```

Retorna o histórico de movimentações registradas no sistema.

**Resposta de sucesso — 200**

```json
{
  "mensagem": "Movimentações encontradas com sucesso.",
  "dados": []
}
```

### 4.2. Registrar movimentação

**Requisição**

```http
POST /movimentacoes
```

**Corpo da requisição — entrada**

```json
{
  "idProduto": 1,
  "tipo": "entrada",
  "quantidade": 5,
  "valorUnitario": 12.50
}
```

**Corpo da requisição — saída**

```json
{
  "idProduto": 1,
  "tipo": "saida",
  "quantidade": 2,
  "valorUnitario": 25.00
}
```

**Campos recebidos**

| Campo | Tipo | Descrição |
|---|---|---|
| `idProduto` | Number | Identificador do produto. |
| `tipo` | String | Tipo da movimentação: `entrada` ou `saida`. |
| `quantidade` | Number | Quantidade movimentada. |
| `valorUnitario` | Number | Custo unitário na entrada ou preço unitário de venda na saída. |

A quantidade e o valor unitário devem ser maiores que zero.

**Resposta de sucesso — 201**

```json
{
  "mensagem": "Movimentação cadastrada com sucesso.",
  "dados": {}
}
```

### 4.3. Estornar movimentação

**Requisição**

```http
POST /movimentacoes/1/estorno
```

O identificador informado na URL corresponde à movimentação original.

**Corpo da requisição**

```json
{
  "motivo": "Registro realizado incorretamente."
}
```

O motivo do estorno é obrigatório.

**Resposta de sucesso — 201**

```json
{
  "mensagem": "Movimentação estornada com sucesso.",
  "dados": {}
}
```

O estorno cria um novo registro vinculado à movimentação original, preservando o histórico.

## 5. Ajustes de estoque

A rota `/ajustes-estoque` permite corrigir a quantidade registrada quando ela não corresponde à quantidade física encontrada.

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/ajustes-estoque` | Registra um ajuste de estoque. |

### 5.1. Registrar ajuste

**Requisição**

```http
POST /ajustes-estoque
```

**Corpo da requisição**

```json
{
  "idProduto": 1,
  "quantidadeFisica": 8,
  "motivo": "Contagem física do estoque."
}
```

**Campos recebidos**

| Campo | Tipo | Descrição |
|---|---|---|
| `idProduto` | Number | Identificador do produto. |
| `quantidadeFisica` | Number | Quantidade encontrada na contagem física. |
| `motivo` | String | Justificativa do ajuste. |
| `custoUnitario` | Number | Custo das unidades adicionadas, quando necessário. |

O campo `custoUnitario` é obrigatório quando o ajuste aumenta a quantidade em estoque e o custo médio atual do produto é igual a zero. Nos demais casos, esse campo não é necessário.

A quantidade física pode ser zero, mas não pode ser negativa. O motivo é obrigatório e não pode estar vazio.

**Resposta de sucesso — 201**

```json
{
  "mensagem": "Estoque ajustado com sucesso.",
  "dados": {}
}
```

O sistema calcula a diferença entre a quantidade registrada e a quantidade física, atualiza o estoque e registra a movimentação de ajuste.

## 6. Códigos de resposta HTTP

A API utiliza códigos HTTP para indicar o resultado das operações.

| Código | Significado | Situação |
|---|---|---|
| `200` | OK | Consulta, edição, alteração de status ou exclusão realizada com sucesso. |
| `201` | Created | Novo registro ou operação de movimentação criada com sucesso. |
| `400` | Bad Request | Dados enviados inválidos ou parâmetros incorretos. |
| `401` | Unauthorized | Requisição sem autenticação válida. |
| `403` | Forbidden | Autenticação de dois fatores ainda não configurada. |
| `404` | Not Found | Registro solicitado não encontrado. |
| `409` | Conflict | Operação incompatível com o estado atual dos dados ou com uma regra do sistema. |
| `429` | Too Many Requests | Limite de tentativas de login ou verificação TOTP excedido. |
| `500` | Internal Server Error | Falha interna durante o processamento da requisição. |


Os códigos efetivamente utilizados dependem do endpoint e da situação encontrada durante a operação.

## 7. Padrão das respostas

As respostas de sucesso seguem um padrão com os campos `mensagem` e `dados`.

Exemplo:

```json
{
  "mensagem": "Operação realizada com sucesso.",
  "dados": {}
}
```

Quando ocorre uma falha, a resposta contém o campo `erro`.

Exemplo:

```json
{
  "erro": "Produto não encontrado."
}
```

O campo `dados` contém as informações retornadas pela operação. Em consultas que retornam vários registros, ele contém uma lista.

As estruturas apresentadas nos exemplos de resposta são ilustrativas e podem estar simplificadas. Os campos retornados variam conforme a operação realizada.

Nas consultas de produtos e movimentações, os dados são apresentados com propriedades em camelCase. Em algumas operações de cadastro, edição, exclusão, ajustes e estornos, os dados retornados utilizam os nomes originais das colunas do banco de dados.

## 8. Validação das requisições

As rotas que recebem dados no corpo da requisição utilizam um middleware para verificar se o conteúdo enviado possui um formato válido.

O corpo deve ser um objeto JSON. Valores ausentes, nulos, arrays ou tipos incompatíveis são rejeitados.

Além disso, os serviços realizam validações específicas de acordo com as regras de cada operação.

Quando o JSON enviado não pode ser interpretado, o middleware de tratamento de erros retorna uma resposta apropriada.

Essas verificações ajudam a impedir que dados inválidos sejam processados pelo sistema.

## 9. Autenticação

A API possui endpoints específicos para controlar o acesso ao sistema. A autenticação é realizada em duas etapas: usuário e senha, seguidos da verificação de um código TOTP.

Todas as rotas de autenticação utilizam o prefixo `/auth`.

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/auth/login` | Verifica o usuário e a senha. |
| POST | `/auth/totp` | Valida o código TOTP. |
| GET | `/auth/verificar` | Verifica se existe uma sessão autenticada. |
| POST | `/auth/logout` | Encerra a sessão. |

### 9.1. Login

**Requisição**

```http
POST /auth/login
```

**Corpo da requisição**

```json
{
  "nomeUsuario": "administrador",
  "senha": "sua_senha"
}
```

O nome de usuário é normalizado antes da consulta, removendo espaços nas extremidades e convertendo os caracteres para letras minúsculas.

**Resposta de sucesso — 200**

```json
{
  "mensagem": "Credenciais verificadas com sucesso.",
  "etapa": "totp"
}
```

Essa etapa verifica as credenciais e inicia uma sessão temporária de autenticação, com duração de 5 minutos. A autenticação ainda não está concluída.

**Possíveis erros**

- `401`: usuário ou senha inválidos.
- `403`: autenticação de dois fatores ainda não foi configurada.
- `429`: limite de tentativas de login excedido.
- `500`: erro interno do servidor.

### 9.2. Verificar código TOTP

**Requisição**

```http
POST /auth/totp
```

**Corpo da requisição**

```json
{
  "codigo": "123456"
}
```

O código enviado é validado utilizando o segredo TOTP armazenado de forma criptografada.

**Resposta de sucesso — 200**

```json
{
  "mensagem": "Autenticação concluída com sucesso."
}
```

Após a validação, a sessão temporária é substituída por uma sessão autenticada, com duração de 5 horas.

**Possíveis erros**

- `401`: sessão temporária inválida ou expirada, ou código TOTP inválido ou expirado.
- `429`: limite de tentativas de verificação excedido.
- `500`: erro interno do servidor ou falha na configuração da chave de criptografia.

### 9.3. Verificar sessão

**Requisição**

```http
GET /auth/verificar
```

Essa rota verifica se o usuário possui uma sessão autenticada válida. É necessário enviar o cookie de sessão.

**Resposta de sucesso — 200**

```json
{
  "autenticado": true
}
```

**Possíveis erros — 401**

Quando não existe uma sessão autenticada:

```json
{
   "erro": "Autenticação necessária."
}
```

Quando a sessão ultrapassa o limite de duração:

```json
{
  "erro": "Sua sessão expirou. Faça login novamente."
}
```

### 9.4. Encerrar sessão

**Requisição**

```http
POST /auth/logout
```

Encerra a sessão atual e limpa o cookie de autenticação.

**Resposta de sucesso — 200**

```json
{
  "mensagem": "Logout realizado com sucesso."
}
```

**Possível erro**

- `500`: não foi possível encerrar a sessão.

### 9.5. Limitação de tentativas

As rotas de login e verificação TOTP possuem limites de tentativas para reduzir tentativas repetidas de acesso não autorizado.

| Operação | Limite | Período |
|---|---:|---:|
| Login | 5 tentativas | 15 minutos |
| Verificação TOTP | 5 tentativas | 5 minutos |

Requisições bem-sucedidas não são contabilizadas nesses limites.

Quando o limite é excedido, a API retorna HTTP `429 (Too Many Requests)`.

**Login:**

```json
{
  "erro": "Muitas tentativas de login. Tente novamente mais tarde."
}
```

**Verificação TOTP:**

```json
{
  "erro": "Muitas tentativas de verificação. Tente novamente mais tarde."
}
```

### 9.6. Sessões e envio de credenciais

A autenticação utiliza sessões armazenadas no PostgreSQL, por meio da tabela `sessoes`.

O cookie de sessão possui as seguintes configurações:

- `httpOnly`: impede o acesso ao cookie por JavaScript no navegador.
- `secure`: habilitado quando o ambiente está configurado como produção.
- `sameSite`: configurado como `lax`.
- Duração: 5 minutos durante a autenticação temporária e 5 horas após a autenticação completa.

As requisições autenticadas devem preservar e enviar o cookie de sessão para que o servidor consiga identificar o usuário.

Como a API utiliza CORS com credenciais habilitadas, o frontend deve permitir o envio de cookies nas requisições.