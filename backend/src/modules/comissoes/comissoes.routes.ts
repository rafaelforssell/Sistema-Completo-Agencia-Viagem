import { Router } from "express";
import { z } from "zod";
import type { Comissao, Prisma, StatusComissao } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/async-handler";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { toNumber } from "../../utils/decimal";

const comissaoSchema = z.object({
  viagemId: z.string().uuid(),
  fornecedor: z.string().optional().or(z.literal("")),
  valor: z.number().positive(),
  status: z.enum(["pendente", "recebida", "cancelada"]),
  dataPrevista: z.string().optional().or(z.literal("")),
  dataRecebimento: z.string().optional().or(z.literal("")),
});

export function serializeComissao(comissao: Comissao) {
  return {
    id: comissao.id,
    viagemId: comissao.viagemId,
    fornecedor: comissao.fornecedor ?? undefined,
    valor: toNumber(comissao.valor) ?? 0,
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
        include: { viagem: { include: { cliente: true } } },
      }),
      prisma.comissao.count({ where }),
    ]);

    // Inclui a origem (viagem e cliente) pra mostrar na lista de onde veio.
    res.json(
      paginatedResponse(
        dados.map((c) => ({
          ...serializeComissao(c),
          viagem: { id: c.viagem.id, destino: c.viagem.destino, clienteNome: c.viagem.cliente.nome },
        })),
        total,
        pagination
      )
    );
  })
);

comissoesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = comissaoSchema.parse(req.body);
    const comissao = await prisma.comissao.create({
      data: {
        viagemId: input.viagemId,
        fornecedor: input.fornecedor || null,
        valor: input.valor,
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
    const data: Prisma.ComissaoUpdateInput = {};
    if (input.viagemId !== undefined) data.viagem = { connect: { id: input.viagemId } };
    if (input.fornecedor !== undefined) data.fornecedor = input.fornecedor || null;
    if (input.valor !== undefined) data.valor = input.valor;
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
