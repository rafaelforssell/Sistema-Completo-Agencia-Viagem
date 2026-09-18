# Contrato da API REST assumido pelo frontend

Este documento descreve os endpoints que o frontend espera encontrar no backend
(Node.js/Express + PostgreSQL, especificado em outro prompt). Use-o como
especificação para implementar ou ajustar a API.

## Convenções gerais

- Base URL: definida em `API_BASE_URL` (variável de ambiente do frontend, nunca exposta ao browser).
- Autenticação: JWT Bearer. Todas as rotas abaixo, exceto `POST /auth/login`, exigem
  `Authorization: Bearer <token>`. O frontend nunca envia o token do browser — ele fica em
  cookie httpOnly no servidor Next.js e é anexado nas chamadas via proxy interno
  (`src/app/api/[...path]/route.ts`).
- Formato de erro padrão (qualquer status 4xx/5xx):
  ```json
  { "mensagem": "Descrição legível do erro", "detalhes": { } }
  ```
- Listagens paginadas retornam sempre:
  ```json
  {
    "dados": [ /* itens */ ],
    "total": 123,
    "pagina": 1,
    "porPagina": 10,
    "totalPaginas": 13
  }
  ```
  Query params comuns: `pagina` (1-indexed), `porPagina`, `busca` (texto livre),
  `ordenarPor`, `ordem` (`asc`|`desc`).
- Datas em ISO 8601 (`YYYY-MM-DD` para datas simples, `YYYY-MM-DDTHH:mm:ssZ` para timestamps).
- Valores monetários em `number` (BRL, ponto decimal), não em centavos.

## Autenticação

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/login` | Body `{ email, senha }`. Resposta `{ token, admin: { id, nome, email } }`. |
| GET | `/auth/me` | Retorna `{ id, nome, email }` do admin autenticado. |

## Clientes

| Método | Rota | Descrição |
|---|---|---|
| GET | `/clientes` | Lista paginada. Filtros: `busca`. |
| GET | `/clientes/:id` | Detalhe, incluindo `anexos[]` e `viagens[]` (resumo). |
| POST | `/clientes` | Cria cliente. |
| PUT | `/clientes/:id` | Atualiza cliente. |
| DELETE | `/clientes/:id` | Remove cliente. |

Campos: `nome`, `email?`, `telefone?`, `telefoneDdi?` (código do país, ex.: `+55`),
`dataNascimento?`, `numeroPassaporte?`, `validadePassaporte?`, `rg?`, `cpf?`, `cep?`,
`logradouro?`, `numero?`, `complemento?`, `bairro?`, `cidade?`, `estado?`, `observacoes?`.

## Viagens

| Método | Rota | Descrição |
|---|---|---|
| GET | `/viagens` | Lista paginada. Filtros: `busca`, `status`, `clienteId`. |
| GET | `/viagens/:id` | Detalhe, incluindo `cliente`, `passageiros[]`, `pagamentos[]`, `reembolsos[]`, `anexos[]`. |
| POST | `/viagens` | Cria viagem vinculada a `clienteId`. |
| PUT | `/viagens/:id` | Atualiza viagem. |
| DELETE | `/viagens/:id` | Remove viagem (cascata: passageiros, pagamentos, reembolsos). |
| POST | `/viagens/:id/voucher` | Gera o PDF do voucher no servidor. Resposta `{ url, geradoEm }`. |

Campos: `clienteId`, `destino`, `dataIda`, `dataVolta`, `companhiaAerea?`,
`status` (`orcamento` \| `confirmada` \| `em_andamento` \| `concluida` \| `cancelada`), `observacoes?`.

### Passageiros (membros da família, aninhados em uma viagem)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/viagens/:viagemId/passageiros` | Lista passageiros da viagem. |
| POST | `/viagens/:viagemId/passageiros` | Adiciona passageiro. |
| PUT | `/viagens/:viagemId/passageiros/:passageiroId` | Atualiza passageiro. |
| DELETE | `/viagens/:viagemId/passageiros/:passageiroId` | Remove passageiro. |

Campos: `nome`, `parentesco?`, `dataNascimento?`, `numeroPassaporte?`,
`validadePassaporte?`, `numeroBilhete?`.

**Efeito colateral em `POST`**: todo passageiro criado também gera (ou
reaproveita) um registro em `Cliente` com os mesmos dados pessoais — assim
qualquer membro de família cadastrado em uma viagem também aparece na
listagem de clientes. A busca de reaproveitamento usa `numeroPassaporte`
quando informado, senão `nome` (case-insensitive).

## Pagamentos

| Método | Rota | Descrição |
|---|---|---|
| GET | `/viagens/:viagemId/pagamentos` | Lista pagamentos da viagem. |
| POST | `/viagens/:viagemId/pagamentos` | Registra pagamento. |
| PUT | `/pagamentos/:id` | Atualiza pagamento. |
| DELETE | `/pagamentos/:id` | Remove pagamento. |

Campos: `companhiaAerea?`, `fornecedor`, `formaPagamento` (`cartao_credito` \|
`cartao_debito` \| `pix` \| `boleto` \| `transferencia` \| `dinheiro`),
`tipoCartao` (`agencia` \| `cliente` \| `terceiro`), `nomeTitularTerceiro?`
(obrigatório quando `tipoCartao = terceiro`), `valor`, `parcelas`, `dataPagamento`, `observacoes?`.

## Reembolsos

| Método | Rota | Descrição |
|---|---|---|
| GET | `/reembolsos` | Lista paginada (visão geral). Filtros: `busca`, `status`, `viagemId`. |
| GET | `/viagens/:viagemId/reembolsos` | Lista reembolsos da viagem (sem paginação). |
| POST | `/viagens/:viagemId/reembolsos` | Cria reembolso. |
| PUT | `/reembolsos/:id` | Atualiza reembolso. |
| DELETE | `/reembolsos/:id` | Remove reembolso. |

Campos: `pagamentoId?`, `fornecedorId?`, `destino` (`cliente` \| `carteira_fornecedor`
— obrigatório informar `fornecedorId` quando `carteira_fornecedor`), `motivo`,
`valorSolicitado`, `valorAprovado?`, `status` (`solicitado` \| `em_analise` \|
`aprovado` \| `pago` \| `negado`), `dataSolicitacao`, `dataConclusao?`, `observacoes?`.

**Efeito colateral**: quando `destino = carteira_fornecedor` e o `status` chega
em `pago`, o backend cria (ou atualiza) automaticamente um crédito na carteira
digital do fornecedor (ver seção Fornecedores). Se o status sair de `pago` ou o
destino mudar para `cliente`, o crédito correspondente é removido.

## Contas (financeiro geral)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/contas` | Lista paginada. Filtros: `busca`, `natureza`, `status`. |
| GET | `/contas/resumo` | `{ totalAPagar, totalAReceber, totalAtrasado, saldoPorFonte: [{ fonte, saldo }] }`. |
| POST | `/contas` | Cria conta. |
| PUT | `/contas/:id` | Atualiza conta. |
| DELETE | `/contas/:id` | Remove conta. |

Campos: `natureza` (`a_pagar` \| `a_receber`), `descricao`, `origem` (`cliente` \| `fornecedor`),
`origemNome`, `viagemId?`, `valor`, `vencimento`, `status` (`pendente` \| `pago` \| `atrasado` \| `cancelado`), `fonte?`.

## Comissionamento

| Método | Rota | Descrição |
|---|---|---|
| GET | `/comissoes` | Lista paginada. Filtros: `busca`, `status`, `viagemId`. |
| POST | `/comissoes` | Cria comissão. **`valorLiquido` é calculado pelo backend** a partir de `valorBruto` e `percentual`. |
| PUT | `/comissoes/:id` | Atualiza comissão (recalcula `valorLiquido`). |
| DELETE | `/comissoes/:id` | Remove comissão. |

Campos de entrada: `viagemId`, `fornecedor`, `percentual`, `valorBruto`,
`status` (`pendente` \| `recebida` \| `cancelada`), `dataPrevista?`, `dataRecebimento?`.
Resposta inclui também `valorLiquido` (calculado).

## Anexos (documentos)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/anexos` | Filtros (ao menos um obrigatório): `clienteId`, `viagemId`, `passageiroId`. |
| POST | `/anexos` | `multipart/form-data` com `arquivo`, `tipo` (`passaporte` \| `rg` \| `cpf` \| `visto` \| `outro`) e um de `clienteId`/`viagemId`/`passageiroId`. |
| DELETE | `/anexos/:id` | Remove o anexo (e o arquivo armazenado). |

Resposta de cada anexo inclui `url` (link de download direto, pode ser um
storage assinado) e `tamanhoBytes`, `mimeType`, `nomeArquivo`.

## Painel / Resumo / Alertas

| Método | Rota | Descrição |
|---|---|---|
| GET | `/dashboard/metricas` | `{ totalClientes, viagensAtivas, viagensPorStatus: { emCotacao, emAndamento, finalizadas }, proximosCheckIns, aniversariantesSemana, passaportesVencendoEm30Dias, contasAPagar, contasAReceber }`. |
| GET | `/atividades?limite=20` | Feed cronológico (mais recente primeiro) de eventos: viagens próximas, pagamentos pendentes, reembolsos em aberto, clientes novos, viagens concluídas. |
| GET | `/alertas` | Filtros: `lido` (boolean), `tipo` (`checkin` \| `aniversario` \| `passaporte` \| `termino`). Nunca inclui alertas excluídos. |
| PATCH | `/alertas/:id/lido` | Marca um alerta como lido. |
| PATCH | `/alertas/lidos` | Marca **todos** os alertas pendentes como lidos. |
| DELETE | `/alertas/:id` | Descarta o alerta (não volta a aparecer, mesmo que a condição que o gerou continue verdadeira). |

`Alerta` inclui `severidade` (`info` \| `atencao` \| `urgente`), `titulo`, `descricao`,
`data`, e opcionalmente `clienteId`/`viagemId` para navegação.

## Fornecedores

| Método | Rota | Descrição |
|---|---|---|
| GET | `/fornecedores` | Lista paginada. Filtros: `busca`, `tipo`. |
| POST | `/fornecedores` | Cria fornecedor. |
| PUT | `/fornecedores/:id` | Atualiza fornecedor. |
| DELETE | `/fornecedores/:id` | Remove fornecedor. |

Campos: `nome`, `tipo` (`companhia_aerea` \| `hotel` \| `operadora` \| `seguradora` \|
`transfer` \| `aluguel_carro` \| `passeios` \| `cruzeiro` \| `ingressos` \| `outro`),
`email?`, `email2?`, `telefone?`, `telefone2?`, `telefone3?`, `site?`, `cidade?`, `pais?`,
`descricaoServicos?`, `observacoes?`, `contatos?` (array de `{ nome, funcao? }` —
pessoas de contato no fornecedor, ex.: executiva de contas, vendedor, T.I.).

### Carteira digital

| Método | Rota | Descrição |
|---|---|---|
| GET | `/fornecedores/:id/carteira` | `{ saldo, movimentos[] }`. `saldo` é sempre calculado (créditos - débitos), nunca armazenado. |
| POST | `/fornecedores/:id/carteira/movimentos` | Registra um movimento manual (uso da carteira numa compra, ajuste). |
| DELETE | `/fornecedores/:id/carteira/movimentos/:movimentoId` | Remove um movimento manual. |

Campos de cada movimento: `tipo` (`credito` \| `debito`), `valor`, `descricao?`,
`data`. Cada movimento também expõe `origem` (`manual` \| `reembolso`) e, quando
`origem = reembolso`, `reembolsoId` — esses são gerados automaticamente e não
devem ser criados/removidos direto por aqui (ver seção Reembolsos).

## Integrações

| Método | Rota | Descrição |
|---|---|---|
| GET | `/integracoes/voo/:numero` | Busca dados de um voo pelo número (ex.: `LA3400`) via Aviationstack. Requer `AVIATIONSTACK_API_KEY` configurada no backend — sem ela, responde 400 com mensagem explicando. |

Resposta: `{ numeroVoo, companhiaAerea, aeroportoOrigem, aeroportoDestino, dataIda, horarioPartida, horarioChegada }`.
Usado no formulário de nova viagem pra pré-preencher `companhiaAerea`, `destino` e `dataIda` a partir do número do voo — o usuário sempre revisa antes de salvar.

## Vendas

| Método | Rota | Descrição |
|---|---|---|
| GET | `/vendas` | Lista paginada. Filtros: `busca`, `tipo` (retorna vendas com ao menos um item desse tipo), `status`, `clienteId`. |
| GET | `/vendas/:id` | Detalhe, incluindo `itens[]` e `numeroPedidoExtras[]`. |
| POST | `/vendas` | Cria venda vinculada a `clienteId`, com um ou mais `itens`. **`numeroPedido` é gerado pelo backend** (`PED-000123`, sequencial). |
| PUT | `/vendas/:id` | Atualiza venda (substitui `itens` por completo quando enviado). |
| DELETE | `/vendas/:id` | Remove venda. |

Uma venda é um "carrinho": tem vários itens (ex.: hotel + aéreo + transfer no
mesmo pedido), cada um com seu próprio tipo, fornecedor e valor. O valor total
(`valorTotal`) é calculado pelo backend como a soma dos itens — não é um campo
de entrada.

Campos da venda: `clienteId`, `viagemId?`, `status` (`orcamento` \| `confirmada` \|
`cancelada`), `dataVenda`, `observacoes?`, `numeroPedidoExtras?` (array de
`{ numero, descricao? }` — números de referência extras, ex.: localizador da
cia aérea, confirmação do hotel), `itens` (array, obrigatório ao menos 1 item).

Campos de cada item (`itens[]`): `tipo` (`viagem` \| `aereo` \| `hotel` \|
`transfer` \| `seguro` \| `cruzeiro` \| `passeio` \| `aluguel_carro` \|
`ingressos` \| `outro`), `fornecedorId?` (fornecedor responsável por esse item
específico — é assim que um pacote fechado com uma operadora pode ter um item
de hotel apontando para o fornecedor do hotel), `descricao?`, `valor`,
`dataAluguel?` e `seguroCompleto?` (só fazem sentido quando `tipo = aluguel_carro`).

## CRM

### Leads (funil)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/crm/leads` | Lista paginada. Filtros: `busca`, `etapa`. |
| GET | `/crm/leads/:id` | Detalhe. |
| POST | `/crm/leads` | Cria lead. |
| PUT | `/crm/leads/:id` | Atualiza lead. |
| PATCH | `/crm/leads/:id/etapa` | Move o lead entre etapas do funil. Body `{ etapa }`. |
| DELETE | `/crm/leads/:id` | Remove lead. |

Campos: `nome`, `email?`, `telefone?`, `origem?`, `etapa` (`novo` \| `contato` \|
`proposta` \| `fechado` \| `perdido`), `clienteId?`, `valorEstimado?`, `observacoes?`.

### Interações (timeline)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/crm/interacoes` | Filtros (um obrigatório): `leadId` ou `clienteId`. Sem paginação. |
| POST | `/crm/interacoes` | Cria interação vinculada a `leadId` OU `clienteId` (exatamente um). |
| DELETE | `/crm/interacoes/:id` | Remove interação. |

Campos: `leadId?`, `clienteId?`, `tipo` (`ligacao` \| `email` \| `whatsapp` \|
`reuniao` \| `nota`), `descricao`, `data`.

### Tarefas (follow-up)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/crm/tarefas` | Filtros: `leadId?`, `clienteId?`, `concluida?`. Sem paginação. |
| POST | `/crm/tarefas` | Cria tarefa. |
| PUT | `/crm/tarefas/:id` | Atualiza tarefa (inclui marcar `concluida`). |
| DELETE | `/crm/tarefas/:id` | Remove tarefa. |

Campos: `leadId?`, `clienteId?` (não pode ter os dois), `titulo`, `descricao?`,
`dataVencimento`, `concluida?`.

---

Os tipos completos usados pelo frontend estão em
[`src/types/entities.ts`](src/types/entities.ts) e devem ser a fonte de verdade
para os formatos de request/response ao implementar o backend.
