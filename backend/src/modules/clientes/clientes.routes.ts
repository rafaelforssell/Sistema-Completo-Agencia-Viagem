import { Router } from "express";
import { z } from "zod";
import { Prisma, type Cliente } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/http-error";
import { asyncHandler } from "../../middleware/async-handler";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { serializeAnexo } from "../anexos/anexos.routes";

const clienteSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email().optional().or(z.literal("")),
  telefone: z.string().optional().or(z.literal("")),
  dataNascimento: z.string().optional().or(z.literal("")),
  numeroPassaporte: z.string().optional().or(z.literal("")),
  validadePassaporte: z.string().optional().or(z.literal("")),
  observacoes: z.string().optional().or(z.literal("")),
});

function toDate(value?: string) {
  return value ? new Date(value) : undefined;
}

function toData(input: z.infer<typeof clienteSchema>) {
  return {
    nome: input.nome,
    email: input.email || null,
    telefone: input.telefone || null,
    dataNascimento: toDate(input.dataNascimento) ?? null,
    numeroPassaporte: input.numeroPassaporte || null,
    validadePassaporte: toDate(input.validadePassaporte) ?? null,
    observacoes: input.observacoes || null,
  };
}

export function serializeCliente(cliente: Cliente) {
  return {
    id: cliente.id,
    nome: cliente.nome,
    email: cliente.email ?? undefined,
    telefone: cliente.telefone ?? undefined,
    dataNascimento: cliente.dataNascimento?.toISOString(),
    numeroPassaporte: cliente.numeroPassaporte ?? undefined,
    validadePassaporte: cliente.validadePassaporte?.toISOString(),
    observacoes: cliente.observacoes ?? undefined,
    criadoEm: cliente.criadoEm.toISOString(),
    atualizadoEm: cliente.atualizadoEm.toISOString(),
  };
}

export const clientesRouter = Router();

clientesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req);
    const where: Prisma.ClienteWhereInput = pagination.busca
      ? {
          OR: [
            { nome: { contains: pagination.busca, mode: "insensitive" } },
            { email: { contains: pagination.busca, mode: "insensitive" } },
            { telefone: { contains: pagination.busca, mode: "insensitive" } },
          ],
        }
      : {};

    const [dados, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { [pagination.ordenarPor ?? "criadoEm"]: pagination.ordem },
      }),
      prisma.cliente.count({ where }),
    ]);

    res.json(paginatedResponse(dados.map(serializeCliente), total, pagination));
  })
);

clientesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const cliente = await prisma.cliente.findUnique({
      where: { id: req.params.id },
      include: {
        anexos: true,
        viagens: {
          orderBy: { dataIda: "desc" },
          select: { id: true, destino: true, dataIda: true, dataVolta: true, status: true },
        },
      },
    });
    if (!cliente) throw HttpError.notFound("Cliente não encontrado.");

    res.json({
      ...serializeCliente(cliente),
      anexos: cliente.anexos.map(serializeAnexo),
      viagens: cliente.viagens.map((v) => ({
        id: v.id,
        destino: v.destino,
        dataIda: v.dataIda.toISOString(),
        dataVolta: v.dataVolta.toISOString(),
        status: v.status,
      })),
    });
  })
);

clientesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = clienteSchema.parse(req.body);
    const cliente = await prisma.cliente.create({ data: toData(input) });
    res.status(201).json(serializeCliente(cliente));
  })
);

clientesRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = clienteSchema.partial().parse(req.body);
    const data: Prisma.ClienteUpdateInput = {};
    if (input.nome !== undefined) data.nome = input.nome;
    if (input.email !== undefined) data.email = input.email || null;
    if (input.telefone !== undefined) data.telefone = input.telefone || null;
    if (input.dataNascimento !== undefined) data.dataNascimento = toDate(input.dataNascimento) ?? null;
    if (input.numeroPassaporte !== undefined) data.numeroPassaporte = input.numeroPassaporte || null;
    if (input.validadePassaporte !== undefined) data.validadePassaporte = toDate(input.validadePassaporte) ?? null;
    if (input.observacoes !== undefined) data.observacoes = input.observacoes || null;

    const cliente = await prisma.cliente.update({ where: { id: req.params.id }, data });
    res.json(serializeCliente(cliente));
  })
);

clientesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.cliente.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
