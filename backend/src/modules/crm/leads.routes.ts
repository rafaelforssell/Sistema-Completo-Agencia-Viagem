import { Router } from "express";
import { z } from "zod";
import type { EtapaLead, Lead, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/http-error";
import { asyncHandler } from "../../middleware/async-handler";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { toNumber } from "../../utils/decimal";

const ETAPA_LEAD = ["novo", "contato", "proposta", "fechado", "perdido"] as const;

const leadSchema = z.object({
  nome: z.string().min(2, "Informe o nome."),
  email: z.string().email().optional().or(z.literal("")),
  telefone: z.string().optional().or(z.literal("")),
  origem: z.string().optional().or(z.literal("")),
  etapa: z.enum(ETAPA_LEAD),
  clienteId: z.string().optional().or(z.literal("")),
  valorEstimado: z.number().nonnegative().optional(),
  observacoes: z.string().optional().or(z.literal("")),
});

function serializeLead(lead: Lead) {
  return {
    id: lead.id,
    nome: lead.nome,
    email: lead.email ?? undefined,
    telefone: lead.telefone ?? undefined,
    origem: lead.origem ?? undefined,
    etapa: lead.etapa,
    clienteId: lead.clienteId ?? undefined,
    valorEstimado: toNumber(lead.valorEstimado),
    observacoes: lead.observacoes ?? undefined,
    criadoEm: lead.criadoEm.toISOString(),
    atualizadoEm: lead.atualizadoEm.toISOString(),
  };
}

export const leadsRouter = Router();

leadsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req);
    const etapa = typeof req.query.etapa === "string" ? (req.query.etapa as EtapaLead) : undefined;

    const where: Prisma.LeadWhereInput = {
      etapa,
      OR: pagination.busca
        ? [
            { nome: { contains: pagination.busca, mode: "insensitive" } },
            { email: { contains: pagination.busca, mode: "insensitive" } },
          ]
        : undefined,
    };

    const [dados, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { [pagination.ordenarPor ?? "criadoEm"]: pagination.ordem },
      }),
      prisma.lead.count({ where }),
    ]);

    res.json(paginatedResponse(dados.map(serializeLead), total, pagination));
  })
);

leadsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const lead = await prisma.lead.findUnique({ where: { id: req.params.id } });
    if (!lead) throw HttpError.notFound("Lead não encontrado.");
    res.json(serializeLead(lead));
  })
);

leadsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = leadSchema.parse(req.body);
    const lead = await prisma.lead.create({
      data: {
        nome: input.nome,
        email: input.email || null,
        telefone: input.telefone || null,
        origem: input.origem || null,
        etapa: input.etapa,
        clienteId: input.clienteId || null,
        valorEstimado: input.valorEstimado ?? null,
        observacoes: input.observacoes || null,
      },
    });
    res.status(201).json(serializeLead(lead));
  })
);

leadsRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = leadSchema.partial().parse(req.body);
    const data: Prisma.LeadUpdateInput = {};
    if (input.nome !== undefined) data.nome = input.nome;
    if (input.email !== undefined) data.email = input.email || null;
    if (input.telefone !== undefined) data.telefone = input.telefone || null;
    if (input.origem !== undefined) data.origem = input.origem || null;
    if (input.etapa !== undefined) data.etapa = input.etapa;
    if (input.clienteId !== undefined) {
      data.cliente = input.clienteId ? { connect: { id: input.clienteId } } : { disconnect: true };
    }
    if (input.valorEstimado !== undefined) data.valorEstimado = input.valorEstimado ?? null;
    if (input.observacoes !== undefined) data.observacoes = input.observacoes || null;

    const lead = await prisma.lead.update({ where: { id: req.params.id }, data });
    res.json(serializeLead(lead));
  })
);

leadsRouter.patch(
  "/:id/etapa",
  asyncHandler(async (req, res) => {
    const { etapa } = z.object({ etapa: z.enum(ETAPA_LEAD) }).parse(req.body);
    const lead = await prisma.lead.update({ where: { id: req.params.id }, data: { etapa } });
    res.json(serializeLead(lead));
  })
);

leadsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.lead.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

