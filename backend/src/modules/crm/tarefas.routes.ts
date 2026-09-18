import { Router } from "express";
import { z } from "zod";
import type { Prisma, TarefaCrm } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/async-handler";

const tarefaBaseSchema = z.object({
  leadId: z.string().optional().or(z.literal("")),
  clienteId: z.string().optional().or(z.literal("")),
  titulo: z.string().min(1, "Informe o título."),
  descricao: z.string().optional().or(z.literal("")),
  dataVencimento: z.string().min(1, "Informe o vencimento."),
  concluida: z.boolean().optional(),
});

const tarefaSchema = tarefaBaseSchema.refine((data) => !(data.leadId && data.clienteId), {
  message: "Informe apenas leadId ou clienteId, não os dois.",
  path: ["leadId"],
});

function serializeTarefa(tarefa: TarefaCrm) {
  return {
    id: tarefa.id,
    leadId: tarefa.leadId ?? undefined,
    clienteId: tarefa.clienteId ?? undefined,
    titulo: tarefa.titulo,
    descricao: tarefa.descricao ?? undefined,
    dataVencimento: tarefa.dataVencimento.toISOString(),
    concluida: tarefa.concluida,
    criadoEm: tarefa.criadoEm.toISOString(),
    atualizadoEm: tarefa.atualizadoEm.toISOString(),
  };
}

export const tarefasCrmRouter = Router();

tarefasCrmRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const leadId = typeof req.query.leadId === "string" ? req.query.leadId : undefined;
    const clienteId = typeof req.query.clienteId === "string" ? req.query.clienteId : undefined;
    const concluida =
      req.query.concluida === "true" ? true : req.query.concluida === "false" ? false : undefined;

    const tarefas = await prisma.tarefaCrm.findMany({
      where: { leadId, clienteId, concluida },
      orderBy: { dataVencimento: "asc" },
    });

    res.json(tarefas.map(serializeTarefa));
  })
);

tarefasCrmRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = tarefaSchema.parse(req.body);
    const tarefa = await prisma.tarefaCrm.create({
      data: {
        leadId: input.leadId || null,
        clienteId: input.clienteId || null,
        titulo: input.titulo,
        descricao: input.descricao || null,
        dataVencimento: new Date(input.dataVencimento),
        concluida: input.concluida ?? false,
      },
    });
    res.status(201).json(serializeTarefa(tarefa));
  })
);

tarefasCrmRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = tarefaBaseSchema.partial().parse(req.body);
    const data: Prisma.TarefaCrmUpdateInput = {};
    if (input.titulo !== undefined) data.titulo = input.titulo;
    if (input.descricao !== undefined) data.descricao = input.descricao || null;
    if (input.dataVencimento !== undefined) data.dataVencimento = new Date(input.dataVencimento);
    if (input.concluida !== undefined) data.concluida = input.concluida;

    const tarefa = await prisma.tarefaCrm.update({ where: { id: req.params.id }, data });
    res.json(serializeTarefa(tarefa));
  })
);

tarefasCrmRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.tarefaCrm.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
