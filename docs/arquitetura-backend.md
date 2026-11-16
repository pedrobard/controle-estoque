# Arquitetura do Backend

## 1. Visão geral

O backend do Gerenciador de Estoque foi desenvolvido com Node.js, Express e PostgreSQL.

Sua estrutura foi organizada em camadas, separando as responsabilidades de recebimento das requisições, aplicação das regras de negócio, acesso ao banco de dados e tratamento de erros.

Essa divisão facilita a manutenção do sistema, evita que diferentes responsabilidades fiquem concentradas em um único arquivo e torna o código mais organizado.

## 2. Organização das pastas

O backend está dividido nas seguintes pastas:

```text
backend/
├── controllers/
├── database/
│   └── schema.sql
├── middlewares/
├── repositories/
├── routes/
├── services/
├── utils/
├── .env.example
├── db.js
├── server.js
└── package.json
```

Cada pasta possui uma responsabilidade específica:

- **controllers:** recebem os dados das requisições, chamam os serviços correspondentes e definem as respostas HTTP.
- **database:** contém o arquivo com a estrutura do banco de dados PostgreSQL.
- **middlewares:** executam verificações e tratamentos antes ou durante o processamento das requisições.
- **repositories:** concentram as consultas SQL e as operações de acesso ao banco de dados.
- **routes:** definem os caminhos da API e direcionam as requisições para os controllers.
- **services:** concentram as regras de negócio, realizam validações e coordenam as operações do sistema.
- **utils:** reúne funções auxiliares utilizadas em diferentes partes do backend.

Os arquivos `server.js` e `db.js` também possuem funções importantes: o primeiro configura e inicia o servidor Express, enquanto o segundo configura a conexão com o PostgreSQL.

## 3. Fluxo de uma requisição

O processamento de uma requisição segue esta sequência:

```text
Requisição HTTP
      |
      v
Middlewares globais
(cors, express.json)
      |
      v
    Routes
      |
      v
Validação do corpo
(quando aplicável)
      |
      v
 Controllers
      |
      v
   Services
      |
      v
 Repositories
      |
      v
 PostgreSQL
```

O resultado percorre o caminho inverso até chegar ao cliente.

Cada camada participa do processamento sem assumir a responsabilidade principal das demais.

O middleware `tratar-erros-json.js` é registrado após as rotas e trata erros ocorridos durante a interpretação do corpo JSON da requisição.

### Routes

As rotas definem os caminhos disponíveis na API e associam cada requisição ao controller responsável.

Elas também aplicam middlewares específicos quando necessário, como a validação do corpo das requisições que enviam dados.

### Middlewares

Os middlewares executam verificações antes que determinadas requisições cheguem aos controllers.

O projeto utiliza:

- **validar-corpo-requisicao.middleware.js:** verifica se o corpo da requisição possui um formato válido, rejeitando valores ausentes, nulos, arrays ou tipos que não sejam objetos.
- **tratar-erros-json.js:** identifica erros de interpretação de JSON e retorna uma resposta adequada quando o corpo enviado contém JSON inválido.

Além desses middlewares, o Express utiliza `express.json()` para interpretar os corpos das requisições no formato JSON.

### Controllers

Os controllers fazem a ligação entre as requisições HTTP e os serviços.

Suas responsabilidades são:

- Obter os dados enviados pelo cliente e os parâmetros da rota.
- Chamar o serviço correspondente.
- Retornar o resultado com o código HTTP adequado.
- Tratar erros e apresentar as mensagens de resposta.

As regras de negócio não devem ficar concentradas nos controllers. Elas são responsabilidade da camada de serviços.

### Services

Os services concentram as regras de negócio do sistema.

São responsáveis por:

- Validar os dados de acordo com as regras da aplicação.
- Coordenar operações que envolvem diferentes consultas ou alterações.
- Chamar os repositories necessários.
- Controlar transações quando uma operação exige mais de uma alteração no banco de dados.
- Tratar situações de erro e encaminhar informações adequadas para os controllers.

Essa camada é responsável por garantir que as operações respeitem as regras do sistema antes de serem confirmadas no banco de dados.

### Repositories

Os repositories realizam a comunicação com o PostgreSQL por meio de consultas SQL.

São responsáveis por operações como:

- Consultar registros.
- Inserir novos dados.
- Atualizar informações.
- Excluir registros.
- Bloquear registros durante operações que exigem controle de concorrência.

Quando uma operação faz parte de uma transação, o repository recebe a conexão utilizada naquela transação. Isso permite que todas as consultas envolvidas participem da mesma operação.

## 4. Conexão com o banco de dados

A conexão com o PostgreSQL é configurada no arquivo `db.js`, utilizando a biblioteca `pg`.

O projeto utiliza um `Pool` de conexões, que permite reutilizar conexões com o banco de dados em diferentes requisições.

As informações de conexão são obtidas por meio de variáveis de ambiente, carregadas com a biblioteca `dotenv`.

As configurações são definidas no arquivo `.env`, que não deve ser enviado ao repositório. O arquivo `.env.example` apresenta os nomes das variáveis necessárias para configurar o ambiente.

## 5. Transações no PostgreSQL

As operações que envolvem múltiplas alterações relacionadas utilizam transações para preservar a consistência dos dados.

O fluxo de uma transação segue estas etapas:

1. Obter uma conexão do pool.
2. Iniciar a transação com `BEGIN`.
3. Executar as consultas necessárias.
4. Confirmar as alterações com `COMMIT` quando tudo ocorrer corretamente.
5. Reverter as alterações com `ROLLBACK` quando ocorrer algum erro.

Dessa forma, uma operação não deixa alterações parciais no banco de dados quando uma de suas etapas falha.

As transações são utilizadas em operações como cadastro de produtos com estoque inicial, movimentações, ajustes de estoque, estornos e operações de cadastro, edição ou exclusão que exigem mais de uma etapa.

O controle das transações fica na camada de serviços, que utiliza uma conexão específica durante toda a operação.

### Tratamento de falhas nas transações

Durante uma transação, o serviço acompanha se ela foi iniciada e em qual etapa ocorreu uma possível falha.

Quando necessário, a função auxiliar `reverterTransacao`, localizada em `utils/transacoes.js`, executa o `ROLLBACK`.

Se a reversão falhar, a conexão é descartada do pool para evitar que uma conexão com estado inconsistente seja reutilizada.

Ao final da operação, a conexão é liberada.

## 6. Controle de concorrência

O sistema utiliza o comando `SELECT ... FOR UPDATE` em operações que precisam proteger registros contra alterações simultâneas.

Esse recurso bloqueia os registros selecionados até o encerramento da transação, impedindo que outra transação modifique os mesmos registros de maneira concorrente enquanto a operação atual está em andamento.

Esse controle é importante principalmente nas operações que alteram o estoque, como entradas, saídas, ajustes e estornos.

Também é utilizado em operações de edição, alteração de status e exclusão que precisam consultar e proteger o registro antes de realizar alterações.

Assim, o sistema reduz o risco de inconsistências quando mais de uma operação tenta modificar o mesmo registro ao mesmo tempo.

## 7. Tratamento de respostas e erros

O backend utiliza um padrão para organizar as respostas enviadas pela API.

Em operações realizadas com sucesso, a resposta contém:

- `mensagem`: descrição do resultado da operação.
- `dados`: informações retornadas pela operação, quando aplicável.

Exemplo:

```json
{
  "mensagem": "Produto cadastrado com sucesso.",
  "dados": {
    "id": 1,
    "nome": "Produto exemplo"
  }
}
```

Quando ocorre uma falha, a resposta contém:

- `erro`: descrição do problema encontrado.

Exemplo:

```json
{
  "erro": "Produto não encontrado."
}
```

Os controllers utilizam os códigos HTTP adequados para representar o resultado das operações, como `200` para operações realizadas com sucesso, `201` para novos registros e `400`, `404`, `409` ou `500` para diferentes situações de erro.

As mensagens retornadas ao cliente são separadas dos detalhes técnicos utilizados para registrar e investigar falhas no backend.

## 8. Considerações sobre a arquitetura

A separação em camadas permite que cada parte do backend tenha uma responsabilidade bem definida.

Com essa organização:

- As rotas ficam responsáveis pelo direcionamento das requisições.
- Os controllers cuidam da comunicação HTTP.
- Os services concentram as regras de negócio.
- Os repositories cuidam do acesso aos dados.
- Os middlewares realizam verificações e tratamentos específicos.
- As transações ajudam a preservar a consistência do banco de dados.

Essa estrutura torna o backend mais organizado, facilita a identificação de problemas e permite evoluir o sistema sem concentrar toda a lógica em poucos arquivos.