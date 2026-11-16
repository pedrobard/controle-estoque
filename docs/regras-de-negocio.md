# Regras de negócio

## 1. Visão geral

Este documento descreve as regras de negócio do Gerenciador de Estoque, definindo as condições que devem ser respeitadas nas operações envolvendo categorias, produtos e movimentações de estoque.

As regras são aplicadas principalmente pela camada de serviços do backend, garantindo que as operações mantenham a consistência dos dados e respeitem o funcionamento esperado do sistema.

## 2. Categorias

As categorias são utilizadas para organizar os produtos cadastrados no estoque.

### Cadastro

- O nome da categoria é obrigatório.
- Não são permitidos nomes vazios ou compostos apenas por espaços.
- Os nomes são verificados desconsiderando diferenças entre letras maiúsculas e minúsculas e espaços nas extremidades.
- Não é permitido cadastrar duas categorias com nomes equivalentes após essa normalização.

### Edição

- A categoria precisa existir para ser editada.
- O novo nome deve respeitar as mesmas validações aplicadas no cadastro.
- Não é permitido alterar o nome para outro já utilizado por uma categoria diferente.

### Exclusão

- Uma categoria só pode ser excluída quando não possuir produtos vinculados.
- Caso existam produtos associados, a exclusão é impedida para preservar a integridade dos relacionamentos.

## 3. Produtos

Os produtos representam os itens controlados pelo sistema e possuem informações como categoria, quantidade em estoque, custo médio, preço de venda e estoque mínimo.

### Cadastro

- O nome do produto é obrigatório.
- A categoria informada precisa existir.
- A quantidade inicial deve ser um número inteiro maior ou igual a zero.
- O custo inicial deve ser maior ou igual a zero.
- Quando houver quantidade inicial maior que zero, o custo inicial deve ser obrigatoriamente maior que zero.
- O preço de venda padrão deve ser maior que zero.
- O estoque mínimo deve ser um número inteiro maior ou igual a zero.
- O produto é cadastrado como ativo.

Não existe uma restrição de unicidade para o nome dos produtos. Portanto, podem existir produtos diferentes com o mesmo nome.

### Estoque inicial

- Quando um produto é cadastrado com quantidade inicial maior que zero, o sistema registra automaticamente uma movimentação do tipo `estoque inicial`.
- Essa movimentação representa a quantidade e o custo inicial utilizados para formar o estoque.
- Quando a quantidade inicial é zero, não é criada uma movimentação de estoque inicial.

### Edição

- O produto precisa existir para ser editado.
- A edição permite alterar o nome, a categoria, o preço de venda padrão e o estoque mínimo.
- A quantidade em estoque e o custo médio não são alterados diretamente pela edição do cadastro.
- Alterações na quantidade e no custo devem ocorrer por meio das movimentações ou dos ajustes de estoque.

### Ativação e desativação

- Um produto pode ser ativado ou desativado.
- Produtos inativos permanecem registrados no sistema e continuam disponíveis para consulta no histórico.
- Produtos inativos não podem receber entradas, saídas ou ajustes de estoque.
- Produtos inativos não podem ter movimentações estornadas.
- A desativação não apaga o histórico nem os dados financeiros do produto.

### Exclusão

- A exclusão de produtos segue uma regra de segurança para preservar o histórico de movimentações.
- Um produto só pode ser excluído quando estiver inativo e possuir quantidade em estoque igual a zero.
- Produtos que não atendam a essas condições não podem ser excluídos.
- A exclusão é lógica: o produto recebe o status de excluído no banco de dados, sem que seu registro seja removido fisicamente.
- Produtos excluídos deixam de aparecer nas consultas normais, mas seus registros e histórico são preservados.

## 4. Movimentações de estoque

As movimentações registram as alterações realizadas no estoque e mantêm o histórico das operações.

O sistema trabalha com os seguintes tipos de movimentação:

- `estoque inicial`
- `entrada`
- `saida`
- `ajuste`
- `estorno`

As movimentações registram informações como produto, tipo, quantidade, valores envolvidos, saldo anterior, saldo final e data da operação, conforme o tipo de movimentação.

### 4.1. Entrada de estoque

A entrada representa a aquisição ou incorporação de novas unidades de um produto ao estoque.

Regras:

- O produto precisa existir e estar ativo.
- A quantidade informada deve ser maior que zero.
- O custo unitário da entrada deve ser maior que zero.
- A entrada aumenta a quantidade disponível em estoque.
- O custo médio é recalculado utilizando a média ponderada entre o estoque anterior e a nova entrada.

A fórmula utilizada é:

\[
Custo\ Médio =
\frac{(Quantidade\ Anterior \times Custo\ Médio\ Anterior) + (Quantidade\ Entrada \times Custo\ da\ Entrada)}
{Quantidade\ Anterior + Quantidade\ Entrada}
\]

O resultado passa a representar o custo médio do estoque após a entrada.

### 4.2. Saída de estoque

A saída representa a venda ou retirada de unidades do estoque.

Regras:

- O produto precisa existir e estar ativo.
- A quantidade informada deve ser maior que zero.
- A quantidade solicitada não pode ser superior ao estoque disponível.
- O preço unitário de venda deve ser maior que zero.
- A saída reduz a quantidade disponível em estoque.
- O sistema registra o preço de venda, o custo considerado na operação e o lucro bruto obtido.
- O sistema permite registrar vendas com preço unitário inferior ao custo médio do produto, sem solicitar uma confirmação adicional.
- Quando o preço de venda é inferior ao custo médio, o lucro bruto da operação pode ser negativo.

O lucro bruto da saída é calculado pela diferença entre o valor total da venda e o custo total das unidades vendidas.

\[
Lucro\ Bruto = Valor\ Total\ da\ Venda - Custo\ Total
\]

### 4.3. Ajuste de estoque

O ajuste permite corrigir a quantidade registrada no sistema quando ela não corresponde à quantidade física existente.

Regras:

- O produto precisa existir e estar ativo.
- A quantidade informada deve ser válida e não pode ser negativa.
- O motivo do ajuste é obrigatório.
- O sistema compara a quantidade atual registrada com a nova quantidade informada.
- A diferença determina se o ajuste representa um aumento ou uma redução do estoque.
- O ajuste registra a quantidade anterior, a quantidade final e a diferença.
- Quando o ajuste aumenta a quantidade em estoque e o custo médio atual do produto é zero, é necessário informar o custo unitário das unidades adicionadas para que o sistema possa calcular corretamente o novo custo médio.
- Não é permitido realizar um ajuste quando a quantidade física informada é igual à quantidade atualmente registrada.
- A quantidade física deve ser um número inteiro maior ou igual a zero.

Todo ajuste deve permanecer registrado no histórico, permitindo identificar o motivo e o impacto da correção.

## 5. Custo médio e valores financeiros

O custo médio representa o custo unitário médio das unidades disponíveis em estoque.

- Entradas recalculam o custo médio por meio da média ponderada.
- Saídas utilizam o custo médio vigente para calcular o custo das unidades retiradas.
- Ajustes precisam preservar a coerência entre quantidade e custo do estoque.
- O sistema mantém os valores financeiros das movimentações para permitir a consulta dos resultados ao longo do tempo.

O valor investido no estoque considera a quantidade e o custo médio dos produtos.

O potencial de venda considera a quantidade em estoque e o preço de venda padrão dos produtos.

O lucro realizado considera os resultados das saídas registradas no período correspondente.

## 6. Histórico de movimentações

O histórico reúne as movimentações realizadas no sistema, permitindo consultar as alterações feitas no estoque.

Regras:

- As movimentações não são apagadas simplesmente para corrigir uma operação.
- As operações permanecem registradas para preservar a rastreabilidade.
- O histórico apresenta as movimentações em ordem decrescente de data, utilizando o identificador como critério adicional de ordenação.
- Os registros permitem consultar os detalhes das operações e identificar movimentações relacionadas a estornos.

Quando uma operação precisa ser desfeita, o sistema utiliza o processo de estorno.

## 7. Estorno de movimentações

O estorno permite reverter os efeitos de uma movimentação registrada anteriormente, preservando o histórico da operação original.

Regras:

- A movimentação original precisa existir.
- Movimentações do tipo `estoque inicial` não podem ser estornadas.
- Movimentações do tipo `estorno` não podem ser estornadas novamente.
- Uma movimentação original só pode receber um estorno.
- O motivo do estorno é obrigatório.
- O produto relacionado precisa estar ativo.
- O estorno deve respeitar as condições necessárias para manter a consistência do estoque.
- A operação registra uma nova movimentação vinculada à movimentação original, sem apagar o registro anterior.
- Não é permitido estornar movimentações vinculadas a produtos excluídos.

O estorno deve reverter os efeitos da operação original sobre a quantidade e os valores do estoque, considerando o histórico necessário para reconstruir corretamente o custo médio.

Caso a reversão não possa ser realizada sem violar as regras do sistema, a operação deve ser impedida.

Todo o processo é realizado dentro de uma transação no PostgreSQL, garantindo que as alterações sejam confirmadas em conjunto ou revertidas em caso de falha.

## 8. Integridade e consistência dos dados

Além das regras específicas de cada funcionalidade, o sistema adota cuidados gerais para preservar a integridade das informações.

- Operações que envolvem alterações relacionadas utilizam transações no banco de dados.
- Registros importantes são bloqueados durante operações críticas por meio de `SELECT ... FOR UPDATE`.
- Produtos e categorias precisam existir quando são utilizados em relacionamentos.
- As quantidades de estoque não podem ficar negativas.
- As operações devem respeitar o estado ativo ou inativo dos produtos.
- O histórico de movimentações deve ser preservado para permitir consultas e estornos.
- Falhas durante operações transacionais devem provocar a reversão das alterações realizadas naquela operação.

Essas regras ajudam a evitar inconsistências e garantem maior confiabilidade no controle do estoque.