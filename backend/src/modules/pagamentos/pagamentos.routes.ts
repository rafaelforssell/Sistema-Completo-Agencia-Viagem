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

// Quando um pagamento é feito no cartão da própria agência, a agência
// adiantou o valor e o cliente precisa repassar — isso gera automaticamente
// uma conta "a receber" vinculada ao pagamento (ver
// AskUserQuestion/decisão do usuário: só tipoCartao "agencia" gera conta;
// "cliente" e "terceiro" não, pois não há dívida a cobrar). O vínculo por
// pagamentoId (unique + onDelete: Cascade) mantém a conta em sincronia e a
// remove automaticamente se o pagamento for excluído.
async function sincronizarContaDoPagamento(pagamento: Pagamento, viagem: Viagem & { cliente: Cliente }) {
  if (pagamento.tipoCartao !== "agencia") {
    await prisma.contaFinanceira.deleteMany({ where: { pagamentoId: pagamento.id } });
    return;
  }

  const descricao = `Repasse do cliente — pagamento a ${pagamento.fornecedor} (${viagem.destino})`;

  await prisma.contaFinanceira.upsert({
    where: { pagamentoId: pagamento.id },
    create: {
      natureza: "a_receber",
      descricao,
      origem: "cliente",
      origemNome: viagem.cliente.nome,
      clienteId: viagem.clienteId,
      viagemId: viagem.id,
      pagamentoId: pagamento.id,
      valor: pagamento.valor,
      vencimento: pagamento.dataPagamento,
      status: "pendente",
      fonte: "Cartão Agência",
    },
    update: {
      descricao,
      origemNome: viagem.cliente.nome,
      clienteId: viagem.clienteId,
      valor: pagamento.valor,
      vencimento: pagamento.dataPagamento,
    },
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
