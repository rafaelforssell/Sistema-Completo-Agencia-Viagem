import { Router } from "express";
import { z } from "zod";
import type { InteracaoCrm } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/http-error";
import { asyncHandler } from "../../middleware/async-handler";

const interacaoSchema = z
  .object({
    leadId: z.string().optional().or(z.literal("")),
    clienteId: z.string().optional().or(z.literal("")),
    tipo: z.enum(["ligacao", "email", "whatsapp", "reuniao", "nota"]),
    descricao: z.string().min(1, "Descreva a interação."),
    data: z.string().min(1, "Informe a data."),
  })
  .refine((data) => Boolean(data.leadId) !== Boolean(data.clienteId), {
    message: "Informe leadId ou clienteId (exatamente um dos dois).",
    path: ["leadId"],
  });

type InteracaoComNomes = InteracaoCrm & { lead?: { nome: string } | null; cliente?: { nome: string } | null };

const comNomes = { lead: { select: { nome: true } }, cliente: { select: { nome: true } } } as const;

function serializeInteracao(interacao: InteracaoComNomes) {
  return {
    id: interacao.id,
    leadId: interacao.leadId ?? undefined,
    clienteId: interacao.clienteId ?? undefined,
    // Nome de quem a interação é, pra timeline geral (sem filtro).
    nome: interacao.lead?.nome ?? interacao.cliente?.nome,
    tipo: interacao.tipo,
    descricao: interacao.descricao,
    data: interacao.data.toISOString(),
    criadoEm: interacao.criadoEm.toISOString(),
    atualizadoEm: interacao.atualizadoEm.toISOString(),
  };
}

export const interacoesCrmRouter = Router();

interacoesCrmRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const leadId = typeof req.query.leadId === "string" ? req.query.leadId : undefined;
    const clienteId = typeof req.query.clienteId === "string" ? req.query.clienteId : undefined;

    // Sem filtro: timeline geral, com as interações mais recentes de todos.
    const interacoes = await prisma.interacaoCrm.findMany({
      where: { leadId, clienteId },
      include: comNomes,
      orderBy: [{ data: "desc" }, { criadoEm: "desc" }],
      take: leadId || clienteId ? undefined : 200,
    });

    res.json(interacoes.map(serializeInteracao));
  })
);

interacoesCrmRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = interacaoSchema.parse(req.body);
    const interacao = await prisma.interacaoCrm.create({
      data: {
        leadId: input.leadId || null,
        clienteId: input.clienteId || null,
        tipo: input.tipo,
        descricao: input.descricao,
        data: new Date(input.data),
      },
      include: comNomes,
    });
    res.status(201).json(serializeInteracao(interacao));
  })
);

interacoesCrmRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.interacaoCrm.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
