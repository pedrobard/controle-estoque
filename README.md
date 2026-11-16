# Gerenciador de Estoque

## Sobre o projeto

A ideia deste projeto surgiu da minha necessidade de organizar os itens que compro e vendo em jogos Web3, que possuem valor financeiro e representam um investimento.

Eu precisava controlar meu estoque, registrar compras e vendas, acompanhar os custos e entender os resultados das negociações. Para resolver isso, desenvolvi o Gerenciador de Estoque, uma aplicação que centraliza o cadastro de itens, as movimentações e o histórico, além de apresentar informações financeiras por meio de um dashboard.

Embora tenha surgido de uma necessidade pessoal, o sistema foi desenvolvido para também atender a outros negócios que precisam controlar produtos e movimentações de estoque.

## Funcionalidades

- **Dashboard:** apresenta informações sobre o estoque, valores investidos, potencial de vendas, lucro realizado e movimentações.
- **Produtos:** permite cadastrar, editar, ativar e desativar produtos.
- **Categorias:** permite organizar os produtos em categorias.
- **Movimentações:** registra entradas e saídas de estoque.
- **Ajustes de estoque:** permite corrigir quantidades, registrando o motivo de cada ajuste.
- **Histórico:** reúne as movimentações realizadas e permite consultar seus detalhes e realizar estornos quando as regras do sistema permitem.

## Tecnologias utilizadas

**Frontend**
- HTML5
- CSS3
- JavaScript
- Chart.js
- Font Awesome

**Backend**
- Node.js
- Express
- JavaScript (ES Modules)
- PostgreSQL
- pg
- dotenv

## Organização do projeto

O backend foi organizado em camadas para separar as responsabilidades de cada parte da aplicação:

- **Routes:** definem os endpoints e encaminham as requisições.
- **Controllers:** recebem as requisições e organizam as respostas.
- **Services:** concentram as regras de negócio e coordenam as operações.
- **Repositories:** cuidam das consultas e operações no banco de dados.
- **Middlewares:** realizam validações e tratam erros das requisições.
- **Database:** concentra a conexão e a estrutura do banco de dados.
- **Utils:** reúne funções auxiliares utilizadas pelo backend.

Essa organização facilita a manutenção e deixa mais claro onde cada responsabilidade deve ser tratada.

## Estrutura de pastas

```text
gerenciador-de-estoque/
├── backend/
│   ├── controllers/
│   ├── database/
│   │   └── schema.sql
│   ├── middlewares/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   ├── .env.example
│   ├── db.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── css/
│   ├── js/
│   └── index.html
│
├── docs/
│   ├── arquitetura-backend.md
│   ├── regras-de-negocio.md
│   └── api.md
│
└── README.md
```

## Banco de dados

O projeto utiliza PostgreSQL para armazenar os dados de forma persistente.

O banco possui três tabelas principais:

- **categorias:** armazena as categorias utilizadas para organizar os produtos.
- **produtos:** armazena os dados dos produtos, suas quantidades, custos, preços e situação.
- **movimentacoes:** registra as entradas, saídas, ajustes e estornos realizados no estoque.

A estrutura completa do banco está disponível em `backend/database/schema.sql`.

## Como executar o projeto

### Pré-requisitos

- Node.js 18 ou superior.
- PostgreSQL.
- Um editor de código, como o Visual Studio Code.
- Live Server para executar o frontend localmente.

### 1. Configurar o banco de dados

Crie um banco de dados no PostgreSQL e execute o conteúdo do arquivo:

```text
backend/database/schema.sql
```

### 2. Configurar o backend

No terminal, entre na pasta do backend:

```bash
cd backend
```

Instale as dependências:

```bash
npm install
```

Crie um arquivo `.env` com base no `.env.example` e preencha os dados da conexão com o PostgreSQL:

```env
DB_USER=seu_usuario
DB_HOST=localhost
DB_NAME=nome_do_banco
DB_PASSWORD=sua_senha
DB_PORT=5432
PORT=3000
```

### 3. Iniciar o servidor

Ainda na pasta `backend`, execute:

```bash
npm start
```

Por padrão, o servidor utiliza a porta `3000` caso nenhuma outra seja definida na variável `PORT`.

### 4. Abrir o frontend

Abra a pasta `frontend` no Visual Studio Code e execute o arquivo `index.html` utilizando a extensão Live Server.

Com o backend em execução, a aplicação poderá realizar as requisições à API.

## Documentação complementar

Para conhecer melhor o funcionamento do sistema, consulte:

- [Arquitetura do backend](docs/arquitetura-backend.md)
- [Regras de negócio](docs/regras-de-negocio.md)
- [Documentação da API](docs/api.md)

## Status do projeto

O projeto está em desenvolvimento. Novas funcionalidades, melhorias e ajustes ainda estão sendo implementados conforme as necessidades identificadas durante o uso e o processo de desenvolvimento.