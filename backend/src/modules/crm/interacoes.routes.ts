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

function serializeInteracao(interacao: InteracaoCrm) {
  return {
    id: interacao.id,
    leadId: interacao.leadId ?? undefined,
    clienteId: interacao.clienteId ?? undefined,
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
    if (!leadId && !clienteId) {
      throw HttpError.badRequest("Informe leadId ou clienteId.");
    }

    const interacoes = await prisma.interacaoCrm.findMany({
      where: { leadId, clienteId },
      orderBy: { data: "desc" },
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
