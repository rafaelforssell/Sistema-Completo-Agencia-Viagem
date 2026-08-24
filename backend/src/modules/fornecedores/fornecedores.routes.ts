import { Router } from "express";
import { z } from "zod";
import type { Fornecedor, Prisma, TipoFornecedor } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/async-handler";
import { parsePagination, paginatedResponse } from "../../utils/pagination";

const fornecedorSchema = z.object({
  nome: z.string().min(2),
  tipo: z.enum(["companhia_aerea", "hotel", "operadora", "seguradora", "outro"]),
  email: z.string().email().optional().or(z.literal("")),
  telefone: z.string().optional().or(z.literal("")),
  observacoes: z.string().optional().or(z.literal("")),
});

function toData(input: z.infer<typeof fornecedorSchema>) {
  return {
    nome: input.nome,
    tipo: input.tipo,
    email: input.email || null,
    telefone: input.telefone || null,
    observacoes: input.observacoes || null,
  };
}

export function serializeFornecedor(fornecedor: Fornecedor) {
  return {
    id: fornecedor.id,
    nome: fornecedor.nome,
    tipo: fornecedor.tipo,
    email: fornecedor.email ?? undefined,
    telefone: fornecedor.telefone ?? undefined,
    observacoes: fornecedor.observacoes ?? undefined,
    criadoEm: fornecedor.criadoEm.toISOString(),
    atualizadoEm: fornecedor.atualizadoEm.toISOString(),
  };
}

export const fornecedoresRouter = Router();

fornecedoresRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req);
    const tipo = typeof req.query.tipo === "string" ? (req.query.tipo as TipoFornecedor) : undefined;

    const where: Prisma.FornecedorWhereInput = {
      tipo,
      OR: pagination.busca
        ? [
            { nome: { contains: pagination.busca, mode: "insensitive" } },
            { email: { contains: pagination.busca, mode: "insensitive" } },
          ]
        : undefined,
    };

    const [dados, total] = await Promise.all([
      prisma.fornecedor.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { [pagination.ordenarPor ?? "criadoEm"]: pagination.ordem },
      }),
      prisma.fornecedor.count({ where }),
    ]);

    res.json(paginatedResponse(dados.map(serializeFornecedor), total, pagination));
  })
);

fornecedoresRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = fornecedorSchema.parse(req.body);
    const fornecedor = await prisma.fornecedor.create({ data: toData(input) });
    res.status(201).json(serializeFornecedor(fornecedor));
  })
);

fornecedoresRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = fornecedorSchema.partial().parse(req.body);
    const data: Prisma.FornecedorUpdateInput = {};
    if (input.nome !== undefined) data.nome = input.nome;
    if (input.tipo !== undefined) data.tipo = input.tipo;
    if (input.email !== undefined) data.email = input.email || null;
    if (input.telefone !== undefined) data.telefone = input.telefone || null;
    if (input.observacoes !== undefined) data.observacoes = input.observacoes || null;

    const fornecedor = await prisma.fornecedor.update({ where: { id: req.params.id }, data });
    res.json(serializeFornecedor(fornecedor));
  })
);

fornecedoresRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.fornecedor.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
