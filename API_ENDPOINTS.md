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

Campos: `nome`, `email?`, `telefone?`, `dataNascimento?`, `numeroPassaporte?`,
`validadePassaporte?`, `observacoes?`.

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

Campos: `pagamentoId?`, `motivo`, `valorSolicitado`, `valorAprovado?`,
`status` (`solicitado` \| `em_analise` \| `aprovado` \| `pago` \| `negado`),
`dataSolicitacao`, `dataConclusao?`, `observacoes?`.

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
| GET | `/dashboard/metricas` | `{ totalClientes, viagensAtivas, proximosCheckIns, aniversariantesSemana, passaportesVencendoEm30Dias, contasAPagar, contasAReceber }`. |
| GET | `/atividades?limite=20` | Feed cronológico (mais recente primeiro) de eventos: viagens próximas, pagamentos pendentes, reembolsos em aberto, clientes novos, viagens concluídas. |
| GET | `/alertas` | Filtros: `lido` (boolean), `tipo` (`checkin` \| `aniversario` \| `passaporte`). |
| PATCH | `/alertas/:id/lido` | Marca o alerta como lido. |

`Alerta` inclui `severidade` (`info` \| `atencao` \| `urgente`), `titulo`, `descricao`,
`data`, e opcionalmente `clienteId`/`viagemId` para navegação.

---

Os tipos completos usados pelo frontend estão em
[`src/types/entities.ts`](src/types/entities.ts) e devem ser a fonte de verdade
para os formatos de request/response ao implementar o backend.
