# Documentação da autenticação

## 1. Visão geral

O Gerenciador de Estoque utiliza autenticação em duas etapas para controlar o acesso ao sistema.

O processo combina dois fatores:

- **Conhecimento:** nome de usuário e senha.
- **Posse:** código temporário gerado por um aplicativo autenticador, utilizando o protocolo TOTP (Time-based One-Time Password).

A autenticação só é concluída depois que as duas etapas são validadas.

## 2. Fluxo de autenticação

O processo de autenticação ocorre em duas etapas.

### 2.1. Primeira etapa — usuário e senha

O usuário informa seu nome de usuário e sua senha.

O sistema:

1. Normaliza o nome de usuário, removendo espaços nas extremidades e convertendo os caracteres para letras minúsculas.
2. Consulta o administrador cadastrado.
3. Verifica a senha utilizando a biblioteca Argon2.
4. Confere se a autenticação TOTP já foi configurada para o administrador.
5. Cria uma sessão temporária para a segunda etapa da autenticação.

Se as credenciais forem válidas, o sistema informa que a próxima etapa é a verificação TOTP.

A sessão temporária possui duração de 5 minutos e ainda não permite acesso às funcionalidades protegidas do sistema.

### 2.2. Segunda etapa — código TOTP

O usuário informa o código de seis dígitos gerado pelo aplicativo autenticador.

O sistema:

1. Recupera o segredo TOTP armazenado de forma criptografada.
2. Descriptografa o segredo utilizando a chave de criptografia configurada no ambiente.
3. Verifica se o código informado é válido e está dentro do período de validade.
4. Regenera a sessão, substituindo a sessão temporária por uma nova sessão autenticada.

Após a validação, o usuário passa a ter acesso às funcionalidades protegidas do sistema.

## 3. Proteção das credenciais

### 3.1. Senhas

As senhas dos administradores são armazenadas como hashes, utilizando a biblioteca Argon2.

O sistema não precisa armazenar a senha original. Durante o login, a senha informada é comparada com o hash armazenado por meio da função de verificação da biblioteca.

Essa abordagem evita manter senhas em texto puro no banco de dados.

### 3.2. Segredo TOTP

O segredo utilizado para gerar e validar os códigos TOTP precisa ser recuperado durante a autenticação. Por isso, ele é armazenado de forma criptografada, e não como um hash.

A criptografia utiliza o algoritmo AES-256-GCM.

A chave de criptografia é fornecida pela variável de ambiente `TOTP_ENCRYPTION_KEY` e deve ser mantida em segredo.

A aplicação verifica se a chave possui os 32 bytes necessários para utilizar o algoritmo AES-256-GCM.

O segredo criptografado é armazenado com os dados necessários para sua recuperação e validação de integridade.

## 4. Gerenciamento de sessões

O sistema utiliza `express-session` para gerenciar as sessões e `connect-pg-simple` para armazená-las no PostgreSQL.

Os registros das sessões são armazenados na tabela `sessoes`.

### 4.1. Duração das sessões

O sistema utiliza dois períodos diferentes:

| Etapa | Duração |
|---|---:|
| Sessão temporária, após usuário e senha | 5 minutos |
| Sessão autenticada, após validação TOTP | 5 horas |

Quando o usuário conclui a autenticação, a sessão temporária é regenerada e substituída por uma nova sessão autenticada.

A aplicação também verifica o horário em que a autenticação foi concluída. Quando o limite de cinco horas é atingido, a sessão é destruída e o usuário precisa realizar o login novamente.

### 4.2. Configurações do cookie

O cookie de sessão utiliza as seguintes configurações:

- `httpOnly`: impede que scripts executados no navegador acessem diretamente o cookie.
- `secure`: exige conexão HTTPS quando a aplicação está em produção.
- `sameSite: "lax"`: aplica uma restrição ao envio do cookie em determinadas requisições entre sites.
- `maxAge`: define a duração do cookie de acordo com a etapa da autenticação.

Essas configurações ajudam a proteger a identificação da sessão durante a comunicação entre frontend e backend.

## 5. Proteção contra tentativas repetidas

As rotas de login e verificação TOTP utilizam a biblioteca `express-rate-limit` para limitar tentativas de autenticação.

| Operação | Limite | Período |
|---|---:|---:|
| Login | 5 tentativas | 15 minutos |
| Verificação TOTP | 5 tentativas | 5 minutos |

As requisições bem-sucedidas são desconsideradas na contagem.

Quando o limite é excedido, a API retorna HTTP `429 (Too Many Requests)`.

Essa proteção dificulta tentativas repetidas de descobrir credenciais ou códigos válidos.

## 6. Variáveis de ambiente

A autenticação depende de variáveis de ambiente para proteger informações sensíveis.

| Variável | Finalidade |
|---|---|
| `SESSION_SECRET` | Chave utilizada pelo `express-session` para assinar a identificação das sessões. |
| `TOTP_ENCRYPTION_KEY` | Chave utilizada para criptografar e descriptografar os segredos TOTP. |
| `NODE_ENV` | Define o ambiente de execução e influencia a configuração de segurança do cookie. |

Essas informações devem permanecer privadas e não devem ser publicadas no repositório.

O arquivo `.env.example` apresenta as variáveis necessárias sem expor seus valores reais.

## 7. Encerramento da sessão

O sistema disponibiliza uma rota de logout que:

1. Destrói a sessão atual no servidor.
2. Limpa o cookie `connect.sid` no navegador.
3. Retorna a confirmação do encerramento da sessão.

Após o logout, o usuário precisa realizar novamente as duas etapas de autenticação para acessar as funcionalidades protegidas.

## 8. Decisões de segurança

Algumas decisões foram adotadas para reduzir riscos relacionados ao armazenamento de credenciais e ao controle de acesso:

- Utilização do Argon2 para armazenamento seguro de senhas.
- Utilização de TOTP como segundo fator de autenticação.
- Criptografia do segredo TOTP com AES-256-GCM.
- Armazenamento das sessões no PostgreSQL.
- Regeneração da sessão após a conclusão de cada etapa da autenticação.
- Utilização de cookies com as configurações `httpOnly`, `secure` e `sameSite`.
- Limitação de tentativas de login e verificação TOTP.
- Expiração da sessão autenticada após cinco horas.

## 9. Limitações da primeira versão

A primeira versão do sistema não possui funcionalidade de recuperação de acesso.

Por isso, a configuração inicial da autenticação de dois fatores e o armazenamento seguro das informações necessárias são etapas importantes para evitar a perda de acesso ao sistema.

Novas funcionalidades de recuperação e outras melhorias de segurança poderão ser avaliadas em versões futuras.