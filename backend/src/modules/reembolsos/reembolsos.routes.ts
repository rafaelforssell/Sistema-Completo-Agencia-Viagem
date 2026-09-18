import { Router } from "express";
import { z } from "zod";
import type { Prisma, Reembolso, StatusReembolso } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/async-handler";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { toNumber } from "../../utils/decimal";

const statusEnum = z.enum(["solicitado", "em_analise", "aprovado", "pago", "negado"]);
const destinoEnum = z.enum(["cliente", "carteira_fornecedor"]);

const reembolsoBaseSchema = z.object({
  pagamentoId: z.string().uuid().optional().or(z.literal("")),
  fornecedorId: z.string().optional().or(z.literal("")),
  destino: destinoEnum,
  motivo: z.string().min(3),
  valorSolicitado: z.number().positive(),
  valorAprovado: z.number().nonnegative().optional(),
  status: statusEnum,
  dataSolicitacao: z.string().min(1),
  dataConclusao: z.string().optional().or(z.literal("")),
  observacoes: z.string().optional().or(z.literal("")),
});

export const reembolsoSchema = reembolsoBaseSchema.refine(
  (data) => data.destino !== "carteira_fornecedor" || Boolean(data.fornecedorId),
  {
    message: "Selecione o fornecedor para creditar o valor na carteira digital.",
    path: ["fornecedorId"],
  }
);

function toData(input: z.infer<typeof reembolsoSchema>) {
  return {
    pagamentoId: input.pagamentoId || null,
    fornecedorId: input.fornecedorId || null,
    destino: input.destino,
    motivo: input.motivo,
    valorSolicitado: input.valorSolicitado,
    valorAprovado: input.valorAprovado ?? null,
    status: input.status,
    dataSolicitacao: new Date(input.dataSolicitacao),
    dataConclusao: input.dataConclusao ? new Date(input.dataConclusao) : null,
    observacoes: input.observacoes || null,
  };
}

export function serializeReembolso(reembolso: Reembolso) {
  return {
    id: reembolso.id,
    viagemId: reembolso.viagemId,
    pagamentoId: reembolso.pagamentoId ?? undefined,
    fornecedorId: reembolso.fornecedorId ?? undefined,
    destino: reembolso.destino,
    motivo: reembolso.motivo,
    valorSolicitado: toNumber(reembolso.valorSolicitado),
    valorAprovado: toNumber(reembolso.valorAprovado),
    status: reembolso.status,
    dataSolicitacao: reembolso.dataSolicitacao.toISOString(),
    dataConclusao: reembolso.dataConclusao?.toISOString(),
    observacoes: reembolso.observacoes ?? undefined,
    criadoEm: reembolso.criadoEm.toISOString(),
    atualizadoEm: reembolso.atualizadoEm.toISOString(),
  };
}

// Mantém o CarteiraMovimento (crédito) em sincronia com o reembolso: só existe
// um movimento quando o reembolso está marcado pra virar crédito no fornecedor
// E já foi pago. Qualquer outro estado remove o movimento (se existir).
export async function sincronizarCarteiraDoReembolso(reembolso: Reembolso) {
  const deveGerarCredito =
    reembolso.destino === "carteira_fornecedor" && reembolso.fornecedorId && reembolso.status === "pago";

  if (deveGerarCredito) {
    await prisma.carteiraMovimento.upsert({
      where: { reembolsoId: reembolso.id },
      create: {
        fornecedorId: reembolso.fornecedorId!,
        tipo: "credito",
        valor: reembolso.valorAprovado ?? reembolso.valorSolicitado,
        descricao: reembolso.motivo,
        data: reembolso.dataConclusao ?? reembolso.dataSolicitacao,
        reembolsoId: reembolso.id,
      },
      update: {
        fornecedorId: reembolso.fornecedorId!,
        valor: reembolso.valorAprovado ?? reembolso.valorSolicitado,
        descricao: reembolso.motivo,
        data: reembolso.dataConclusao ?? reembolso.dataSolicitacao,
      },
    });
  } else {
    await prisma.carteiraMovimento.deleteMany({ where: { reembolsoId: reembolso.id } });
  }
}

export const reembolsosRouter = Router();

reembolsosRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req);
    const status = typeof req.query.status === "string" ? (req.query.status as StatusReembolso) : undefined;
    const viagemId = typeof req.query.viagemId === "string" ? req.query.viagemId : undefined;

    const where: Prisma.ReembolsoWhereInput = {
      status,
      viagemId,
      motivo: pagination.busca ? { contains: pagination.busca, mode: "insensitive" } : undefined,
    };

    const [dados, total] = await Promise.all([
      prisma.reembolso.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { [pagination.ordenarPor ?? "criadoEm"]: pagination.ordem },
      }),
      prisma.reembolso.count({ where }),
    ]);

    res.json(paginatedResponse(dados.map(serializeReembolso), total, pagination));
  })
);

reembolsosRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = reembolsoBaseSchema.partial().parse(req.body);
    const data: Prisma.ReembolsoUpdateInput = {};
    if (input.pagamentoId !== undefined) data.pagamento = input.pagamentoId ? { connect: { id: input.pagamentoId } } : { disconnect: true };
    if (input.fornecedorId !== undefined) data.fornecedor = input.fornecedorId ? { connect: { id: input.fornecedorId } } : { disconnect: true };
    if (input.destino !== undefined) data.destino = input.destino;
    if (input.motivo !== undefined) data.motivo = input.motivo;
    if (input.valorSolicitado !== undefined) data.valorSolicitado = input.valorSolicitado;
    if (input.valorAprovado !== undefined) data.valorAprovado = input.valorAprovado;
    if (input.status !== undefined) data.status = input.status;
    if (input.dataSolicitacao !== undefined) data.dataSolicitacao = new Date(input.dataSolicitacao);
    if (input.dataConclusao !== undefined) data.dataConclusao = input.dataConclusao ? new Date(input.dataConclusao) : null;
    if (input.observacoes !== undefined) data.observacoes = input.observacoes || null;

    const reembolso = await prisma.reembolso.update({ where: { id: req.params.id }, data });
    await sincronizarCarteiraDoReembolso(reembolso);
    res.json(serializeReembolso(reembolso));
  })
);

reembolsosRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.reembolso.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

export { toData as reembolsoToData };
