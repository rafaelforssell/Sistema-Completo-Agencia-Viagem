import { Router } from "express";
import { z } from "zod";
import type { Passageiro, Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/async-handler";

export const passageiroSchema = z.object({
  nome: z.string().min(2),
  parentesco: z.string().optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  telefone: z.string().optional().or(z.literal("")),
  dataNascimento: z.string().optional().or(z.literal("")),
  numeroPassaporte: z.string().optional().or(z.literal("")),
  validadePassaporte: z.string().optional().or(z.literal("")),
  numeroBilhete: z.string().optional().or(z.literal("")),
});

export function serializePassageiro(passageiro: Passageiro) {
  return {
    id: passageiro.id,
    viagemId: passageiro.viagemId,
    nome: passageiro.nome,
    parentesco: passageiro.parentesco ?? undefined,
    email: passageiro.email ?? undefined,
    telefone: passageiro.telefone ?? undefined,
    dataNascimento: passageiro.dataNascimento?.toISOString(),
    numeroPassaporte: passageiro.numeroPassaporte ?? undefined,
    validadePassaporte: passageiro.validadePassaporte?.toISOString(),
    numeroBilhete: passageiro.numeroBilhete ?? undefined,
    criadoEm: passageiro.criadoEm.toISOString(),
    atualizadoEm: passageiro.atualizadoEm.toISOString(),
  };
}

export const passageirosRouter = Router({ mergeParams: true });

passageirosRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const passageiros = await prisma.passageiro.findMany({
      where: { viagemId: req.params.viagemId },
      orderBy: { criadoEm: "asc" },
    });
    res.json(passageiros.map(serializePassageiro));
  })
);

// Garante que todo passageiro também exista como Cliente cadastrado (para
// aparecer na aba Clientes). Evita duplicar: se já existir um cliente com o
// mesmo número de passaporte, ou com o mesmo nome (sem diferenciar
// maiúsculas/minúsculas), reaproveita esse cadastro em vez de criar outro.
async function garantirClienteParaPassageiro(input: z.infer<typeof passageiroSchema>) {
  const existente = input.numeroPassaporte
    ? await prisma.cliente.findFirst({ where: { numeroPassaporte: input.numeroPassaporte } })
    : await prisma.cliente.findFirst({ where: { nome: { equals: input.nome, mode: "insensitive" } } });

  if (existente) return existente;

  return prisma.cliente.create({
    data: {
      nome: input.nome,
      email: input.email || null,
      telefone: input.telefone || null,
      dataNascimento: input.dataNascimento ? new Date(input.dataNascimento) : null,
      numeroPassaporte: input.numeroPassaporte || null,
      validadePassaporte: input.validadePassaporte ? new Date(input.validadePassaporte) : null,
    },
  });
}

passageirosRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = passageiroSchema.parse(req.body);
    await garantirClienteParaPassageiro(input);

    const passageiro = await prisma.passageiro.create({
      data: {
        viagemId: req.params.viagemId,
        nome: input.nome,
        parentesco: input.parentesco || null,
        email: input.email || null,
        telefone: input.telefone || null,
        dataNascimento: input.dataNascimento ? new Date(input.dataNascimento) : null,
        numeroPassaporte: input.numeroPassaporte || null,
        validadePassaporte: input.validadePassaporte ? new Date(input.validadePassaporte) : null,
        numeroBilhete: input.numeroBilhete || null,
      },
    });
    res.status(201).json(serializePassageiro(passageiro));
  })
);

passageirosRouter.put(
  "/:passageiroId",
  asyncHandler(async (req, res) => {
    const input = passageiroSchema.partial().parse(req.body);
    const data: Prisma.PassageiroUpdateInput = {};
    if (input.nome !== undefined) data.nome = input.nome;
    if (input.parentesco !== undefined) data.parentesco = input.parentesco || null;
    if (input.email !== undefined) data.email = input.email || null;
    if (input.telefone !== undefined) data.telefone = input.telefone || null;
    if (input.dataNascimento !== undefined) data.dataNascimento = input.dataNascimento ? new Date(input.dataNascimento) : null;
    if (input.numeroPassaporte !== undefined) data.numeroPassaporte = input.numeroPassaporte || null;
    if (input.validadePassaporte !== undefined) data.validadePassaporte = input.validadePassaporte ? new Date(input.validadePassaporte) : null;
    if (input.numeroBilhete !== undefined) data.numeroBilhete = input.numeroBilhete || null;

    const passageiro = await prisma.passageiro.update({
      where: { id: req.params.passageiroId },
      data,
    });
    res.json(serializePassageiro(passageiro));
  })
);

passageirosRouter.delete(
  "/:passageiroId",
  asyncHandler(async (req, res) => {
    await prisma.passageiro.delete({ where: { id: req.params.passageiroId } });
    res.status(204).send();
  })
);
