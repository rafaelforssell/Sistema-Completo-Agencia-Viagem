import { Router } from "express";
import { z } from "zod";
import type { Cliente, Pagamento, Prisma, Viagem } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/async-handler";
import { toNumber } from "../../utils/decimal";

const formaPagamentoEnum = z.enum([
  "cartao_credito",
  "cartao_debito",
  "pix",
  "boleto",
  "transferencia",
  "dinheiro",
]);
const tipoCartaoEnum = z.enum(["agencia", "cliente", "terceiro"]);

// Mesmo texto que o frontend monta em origemPagamentoLabel (src/lib/constants.ts)
// para o campo "fonte" da conta gerada ficar coerente com o que aparece no
// formulário de pagamento (ex.: "Pix do Cliente" em vez de "Cartão Cliente"
// quando a forma de pagamento não é cartão).
const ORIGEM_PREFIXO: Record<z.infer<typeof formaPagamentoEnum>, string> = {
  cartao_credito: "Cartão",
  cartao_debito: "Cartão",
  pix: "Pix",
  boleto: "Boleto",
  transferencia: "Transferência",
  dinheiro: "Dinheiro",
};

const ORIGEM_SUFIXO: Record<z.infer<typeof tipoCartaoEnum>, string> = {
  agencia: "da Agência",
  cliente: "do Cliente",
  terceiro: "de Terceiro",
};

function fonteLabel(forma: z.infer<typeof formaPagamentoEnum>, tipo: z.infer<typeof tipoCartaoEnum>): string {
  return `${ORIGEM_PREFIXO[forma]} ${ORIGEM_SUFIXO[tipo]}`;
}

const pagamentoBaseSchema = z.object({
  companhiaAerea: z.string().optional().or(z.literal("")),
  fornecedor: z.string().min(2),
  formaPagamento: formaPagamentoEnum,
  tipoCartao: tipoCartaoEnum,
  nomeTitularTerceiro: z.string().optional().or(z.literal("")),
  valor: z.number().positive(),
  parcelas: z.number().int().min(1),
  dataPagamento: z.string().min(1),
  observacoes: z.string().optional().or(z.literal("")),
});

export const pagamentoSchema = pagamentoBaseSchema.refine(
  (data) => data.tipoCartao !== "terceiro" || Boolean(data.nomeTitularTerceiro?.trim()),
  {
    message: "Informe o nome do titular do cartão de terceiro.",
    path: ["nomeTitularTerceiro"],
  }
);

function toData(input: z.infer<typeof pagamentoSchema>) {
  return {
    companhiaAerea: input.companhiaAerea || null,
    fornecedor: input.fornecedor,
    formaPagamento: input.formaPagamento,
    tipoCartao: input.tipoCartao,
    nomeTitularTerceiro: input.tipoCartao === "terceiro" ? input.nomeTitularTerceiro || null : null,
    valor: input.valor,
    parcelas: input.parcelas,
    dataPagamento: new Date(input.dataPagamento),
    observacoes: input.observacoes || null,
  };
}

export function serializePagamento(pagamento: Pagamento) {
  return {
    id: pagamento.id,
    viagemId: pagamento.viagemId,
    companhiaAerea: pagamento.companhiaAerea ?? undefined,
    fornecedor: pagamento.fornecedor,
    formaPagamento: pagamento.formaPagamento,
    tipoCartao: pagamento.tipoCartao,
    nomeTitularTerceiro: pagamento.nomeTitularTerceiro ?? undefined,
    valor: toNumber(pagamento.valor),
    parcelas: pagamento.parcelas,
    dataPagamento: pagamento.dataPagamento.toISOString(),
    observacoes: pagamento.observacoes ?? undefined,
    criadoEm: pagamento.criadoEm.toISOString(),
    atualizadoEm: pagamento.atualizadoEm.toISOString(),
  };
}

// Todo pagamento (exceto de terceiro, onde não fica claro quem deve a quem)
// gera automaticamente uma conta vinculada, pra servir de agenda/cronograma
// em Contas e no Painel:
// - Cartão Agência: a agência adiantou o valor, o cliente ainda precisa
//   repassar — conta "a receber" pendente, entra nos totais (contabilizavel).
// - Cartão Cliente: o cliente já pagou direto, não há dívida — conta criada
//   só como registro/agenda, com status "pago" (fixo) e fora dos totais
//   (contabilizavel = false), pra não inflar "a receber" com algo já quitado.
// O vínculo por pagamentoId (unique + onDelete: Cascade) mantém a conta em
// sincronia e a remove automaticamente se o pagamento for excluído.
async function sincronizarContaDoPagamento(pagamento: Pagamento, viagem: Viagem & { cliente: Cliente }) {
  if (pagamento.tipoCartao === "terceiro") {
    await prisma.contaFinanceira.deleteMany({ where: { pagamentoId: pagamento.id } });
    return;
  }

  const ehAgencia = pagamento.tipoCartao === "agencia";
  const parcelasTexto = pagamento.parcelas > 1 ? ` — ${pagamento.parcelas}x` : "";
  const descricao = `Pagamento a ${pagamento.fornecedor} (${viagem.destino})${parcelasTexto}`;
  const fonte = fonteLabel(pagamento.formaPagamento, pagamento.tipoCartao);

  const dadosComuns = {
    descricao,
    origemNome: viagem.cliente.nome,
    clienteId: viagem.clienteId,
    valor: pagamento.valor,
    vencimento: pagamento.dataPagamento,
    fonte,
    contabilizavel: ehAgencia,
  };

  await prisma.contaFinanceira.upsert({
    where: { pagamentoId: pagamento.id },
    create: {
      natureza: "a_receber",
      origem: "cliente",
      viagemId: viagem.id,
      pagamentoId: pagamento.id,
      status: ehAgencia ? "pendente" : "pago",
      ...dadosComuns,
    },
    // Status do "Cartão Cliente" é sempre "pago" (nada a cobrar); do
    // "Cartão Agência" fica como o admin deixou (evita resetar pra
    // "pendente" um pagamento que ele já marcou como pago manualmente).
    update: ehAgencia ? dadosComuns : { ...dadosComuns, status: "pago" },
  });
}

export const pagamentosRouter = Router();

pagamentosRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = pagamentoBaseSchema.partial().parse(req.body);
    const data: Prisma.PagamentoUpdateInput = {};
    if (input.companhiaAerea !== undefined) data.companhiaAerea = input.companhiaAerea || null;
    if (input.fornecedor !== undefined) data.fornecedor = input.fornecedor;
    if (input.formaPagamento !== undefined) data.formaPagamento = input.formaPagamento;
    if (input.tipoCartao !== undefined) data.tipoCartao = input.tipoCartao;
    if (input.nomeTitularTerceiro !== undefined) {
      data.nomeTitularTerceiro = input.tipoCartao === "terceiro" ? input.nomeTitularTerceiro || null : null;
    }
    if (input.valor !== undefined) data.valor = input.valor;
    if (input.parcelas !== undefined) data.parcelas = input.parcelas;
    if (input.dataPagamento !== undefined) data.dataPagamento = new Date(input.dataPagamento);
    if (input.observacoes !== undefined) data.observacoes = input.observacoes || null;

    const pagamento = await prisma.pagamento.update({
      where: { id: req.params.id },
      data,
      include: { viagem: { include: { cliente: true } } },
    });
    await sincronizarContaDoPagamento(pagamento, pagamento.viagem);
    res.json(serializePagamento(pagamento));
  })
);

pagamentosRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.pagamento.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

export { toData as pagamentoToData, sincronizarContaDoPagamento };
