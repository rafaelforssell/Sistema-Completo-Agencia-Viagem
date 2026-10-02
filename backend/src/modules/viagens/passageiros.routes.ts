import { Router } from "express";
import { z } from "zod";
import type { Passageiro, Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/async-handler";

const textoOpcional = z.string().optional().or(z.literal(""));

// Campos de texto que o passageiro tem em comum com o cadastro de Cliente.
const CAMPOS_CLIENTE = [
  "email",
  "telefone",
  "telefoneDdi",
  "numeroPassaporte",
  "rg",
  "cpf",
  "cep",
  "logradouro",
  "numero",
  "complemento",
  "bairro",
  "cidade",
  "estado",
  "observacoes",
] as const;

// Campos de texto exclusivos do passageiro (dizem respeito à viagem).
const CAMPOS_PASSAGEIRO = ["parentesco", "numeroBilhete"] as const;

type CampoTexto = (typeof CAMPOS_CLIENTE)[number] | (typeof CAMPOS_PASSAGEIRO)[number];

export const passageiroSchema = z.object({
  nome: z.string().min(2),
  parentesco: textoOpcional,
  email: z.string().email().optional().or(z.literal("")),
  telefone: textoOpcional,
  telefoneDdi: textoOpcional,
  dataNascimento: textoOpcional,
  numeroPassaporte: textoOpcional,
  validadePassaporte: textoOpcional,
  numeroBilhete: textoOpcional,
  rg: textoOpcional,
  cpf: textoOpcional,
  cep: textoOpcional,
  logradouro: textoOpcional,
  numero: textoOpcional,
  complemento: textoOpcional,
  bairro: textoOpcional,
  cidade: textoOpcional,
  estado: textoOpcional,
  observacoes: textoOpcional,
});

type PassageiroInput = z.infer<typeof passageiroSchema>;

const data = (valor: string | undefined) => (valor ? new Date(valor) : null);

function textos<C extends CampoTexto>(input: Partial<PassageiroInput>, campos: readonly C[]) {
  return Object.fromEntries(campos.map((c) => [c, input[c] || null])) as Record<C, string | null>;
}

export function serializePassageiro(passageiro: Passageiro) {
  const campos = Object.fromEntries(
    [...CAMPOS_CLIENTE, ...CAMPOS_PASSAGEIRO].map((c) => [c, passageiro[c] ?? undefined])
  ) as Record<CampoTexto, string | undefined>;

  return {
    id: passageiro.id,
    viagemId: passageiro.viagemId,
    nome: passageiro.nome,
    ...campos,
    dataNascimento: passageiro.dataNascimento?.toISOString(),
    validadePassaporte: passageiro.validadePassaporte?.toISOString(),
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
// maiúsculas/minúsculas), reaproveita esse cadastro — e só completa os campos
// que ainda estão vazios nele, sem sobrescrever o que já foi preenchido.
export async function garantirClienteParaPassageiro(
  input: PassageiroInput,
  db: Prisma.TransactionClient | PrismaClient = prisma
) {
  const dados = {
    nome: input.nome,
    ...textos(input, CAMPOS_CLIENTE),
    dataNascimento: data(input.dataNascimento),
    validadePassaporte: data(input.validadePassaporte),
  };

  const existente = input.numeroPassaporte
    ? await db.cliente.findFirst({ where: { numeroPassaporte: input.numeroPassaporte } })
    : await db.cliente.findFirst({ where: { nome: { equals: input.nome, mode: "insensitive" } } });

  if (!existente) return db.cliente.create({ data: dados });

  const faltando = Object.fromEntries(
    Object.entries(dados).filter(([campo, valor]) => valor !== null && existente[campo as keyof typeof existente] === null)
  );
  if (Object.keys(faltando).length === 0) return existente;
  return db.cliente.update({ where: { id: existente.id }, data: faltando });
}

export function passageiroToData(input: PassageiroInput) {
  return {
    nome: input.nome,
    ...textos(input, [...CAMPOS_CLIENTE, ...CAMPOS_PASSAGEIRO]),
    dataNascimento: data(input.dataNascimento),
    validadePassaporte: data(input.validadePassaporte),
  };
}

passageirosRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = passageiroSchema.parse(req.body);
    await garantirClienteParaPassageiro(input);

    const passageiro = await prisma.passageiro.create({
      data: { viagemId: req.params.viagemId, ...passageiroToData(input) },
    });
    res.status(201).json(serializePassageiro(passageiro));
  })
);

passageirosRouter.put(
  "/:passageiroId",
  asyncHandler(async (req, res) => {
    const input = passageiroSchema.partial().parse(req.body);
    const campos = [...CAMPOS_CLIENTE, ...CAMPOS_PASSAGEIRO].filter((c) => input[c] !== undefined);

    const dados: Prisma.PassageiroUpdateInput = textos(input, campos);
    if (input.nome !== undefined) dados.nome = input.nome;
    if (input.dataNascimento !== undefined) dados.dataNascimento = data(input.dataNascimento);
    if (input.validadePassaporte !== undefined) dados.validadePassaporte = data(input.validadePassaporte);

    const passageiro = await prisma.passageiro.update({
      where: { id: req.params.passageiroId },
      data: dados,
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
