import { Router } from "express";
import { z } from "zod";
import type { Comissao, Prisma, StatusComissao } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/async-handler";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { toNumber } from "../../utils/decimal";

const comissaoSchema = z.object({
  viagemId: z.string().uuid(),
  fornecedor: z.string().min(2),
  percentual: z.number().min(0).max(100),
  valorBruto: z.number().positive(),
  status: z.enum(["pendente", "recebida", "cancelada"]),
  dataPrevista: z.string().optional().or(z.literal("")),
  dataRecebimento: z.string().optional().or(z.literal("")),
});

function calcularValorLiquido(valorBruto: number, percentual: number) {
  return Math.round(valorBruto * (1 - percentual / 100) * 100) / 100;
}

export function serializeComissao(comissao: Comissao) {
  return {
    id: comissao.id,
    viagemId: comissao.viagemId,
    fornecedor: comissao.fornecedor,
    percentual: toNumber(comissao.percentual),
    valorBruto: toNumber(comissao.valorBruto),
    valorLiquido: toNumber(comissao.valorLiquido),
    status: comissao.status,
    dataPrevista: comissao.dataPrevista?.toISOString(),
    dataRecebimento: comissao.dataRecebimento?.toISOString(),
    criadoEm: comissao.criadoEm.toISOString(),
    atualizadoEm: comissao.atualizadoEm.toISOString(),
  };
}

export const comissoesRouter = Router();

comissoesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req);
    const status = typeof req.query.status === "string" ? (req.query.status as StatusComissao) : undefined;
    const viagemId = typeof req.query.viagemId === "string" ? req.query.viagemId : undefined;

    const where: Prisma.ComissaoWhereInput = {
      status,
      viagemId,
      fornecedor: pagination.busca ? { contains: pagination.busca, mode: "insensitive" } : undefined,
    };

    const [dados, total] = await Promise.all([
      prisma.comissao.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { [pagination.ordenarPor ?? "criadoEm"]: pagination.ordem },
      }),
      prisma.comissao.count({ where }),
    ]);

    res.json(paginatedResponse(dados.map(serializeComissao), total, pagination));
  })
);

comissoesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = comissaoSchema.parse(req.body);
    const comissao = await prisma.comissao.create({
      data: {
        viagemId: input.viagemId,
        fornecedor: input.fornecedor,
        percentual: input.percentual,
        valorBruto: input.valorBruto,
        valorLiquido: calcularValorLiquido(input.valorBruto, input.percentual),
        status: input.status,
        dataPrevista: input.dataPrevista ? new Date(input.dataPrevista) : null,
        dataRecebimento: input.dataRecebimento ? new Date(input.dataRecebimento) : null,
      },
    });
    res.status(201).json(serializeComissao(comissao));
  })
);

comissoesRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = comissaoSchema.partial().parse(req.body);
    const atual = await prisma.comissao.findUniqueOrThrow({ where: { id: req.params.id } });

    const valorBruto = input.valorBruto ?? Number(atual.valorBruto);
    const percentual = input.percentual ?? Number(atual.percentual);

    const data: Prisma.ComissaoUpdateInput = {
      valorLiquido: calcularValorLiquido(valorBruto, percentual),
    };
    if (input.viagemId !== undefined) data.viagem = { connect: { id: input.viagemId } };
    if (input.fornecedor !== undefined) data.fornecedor = input.fornecedor;
    if (input.percentual !== undefined) data.percentual = input.percentual;
    if (input.valorBruto !== undefined) data.valorBruto = input.valorBruto;
    if (input.status !== undefined) data.status = input.status;
    if (input.dataPrevista !== undefined) data.dataPrevista = input.dataPrevista ? new Date(input.dataPrevista) : null;
    if (input.dataRecebimento !== undefined) data.dataRecebimento = input.dataRecebimento ? new Date(input.dataRecebimento) : null;

    const comissao = await prisma.comissao.update({ where: { id: req.params.id }, data });
    res.json(serializeComissao(comissao));
  })
);

comissoesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.comissao.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
