import { Router } from "express";
import { z } from "zod";
import type { CarteiraMovimento, Fornecedor, FornecedorContato, Prisma, TipoFornecedor } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/async-handler";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { toNumber } from "../../utils/decimal";

const TIPO_FORNECEDOR = [
  "companhia_aerea",
  "hotel",
  "operadora",
  "seguradora",
  "transfer",
  "aluguel_carro",
  "passeios",
  "cruzeiro",
  "ingressos",
  "outro",
] as const;

const contatoSchema = z.object({
  nome: z.string().min(1, "Informe o nome."),
  funcao: z.string().optional().or(z.literal("")),
});

const fornecedorSchema = z.object({
  nome: z.string().min(2),
  tipo: z.enum(TIPO_FORNECEDOR),
  email: z.string().email().optional().or(z.literal("")),
  email2: z.string().email().optional().or(z.literal("")),
  telefone: z.string().optional().or(z.literal("")),
  telefone2: z.string().optional().or(z.literal("")),
  telefone3: z.string().optional().or(z.literal("")),
  site: z.string().optional().or(z.literal("")),
  cidade: z.string().optional().or(z.literal("")),
  pais: z.string().optional().or(z.literal("")),
  descricaoServicos: z.string().optional().or(z.literal("")),
  observacoes: z.string().optional().or(z.literal("")),
  contatos: z.array(contatoSchema).optional(),
});

function toData(input: z.infer<typeof fornecedorSchema>) {
  return {
    nome: input.nome,
    tipo: input.tipo,
    email: input.email || null,
    email2: input.email2 || null,
    telefone: input.telefone || null,
    telefone2: input.telefone2 || null,
    telefone3: input.telefone3 || null,
    site: input.site || null,
    cidade: input.cidade || null,
    pais: input.pais || null,
    descricaoServicos: input.descricaoServicos || null,
    observacoes: input.observacoes || null,
  };
}

type FornecedorComContatos = Fornecedor & { contatos: FornecedorContato[] };

export function serializeFornecedor(fornecedor: FornecedorComContatos) {
  return {
    id: fornecedor.id,
    nome: fornecedor.nome,
    tipo: fornecedor.tipo,
    email: fornecedor.email ?? undefined,
    email2: fornecedor.email2 ?? undefined,
    telefone: fornecedor.telefone ?? undefined,
    telefone2: fornecedor.telefone2 ?? undefined,
    telefone3: fornecedor.telefone3 ?? undefined,
    site: fornecedor.site ?? undefined,
    cidade: fornecedor.cidade ?? undefined,
    pais: fornecedor.pais ?? undefined,
    descricaoServicos: fornecedor.descricaoServicos ?? undefined,
    observacoes: fornecedor.observacoes ?? undefined,
    contatos: fornecedor.contatos.map((contato) => ({
      id: contato.id,
      nome: contato.nome,
      funcao: contato.funcao ?? undefined,
    })),
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
        include: { contatos: true },
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
    const fornecedor = await prisma.fornecedor.create({
      data: {
        ...toData(input),
        contatos: {
          create: (input.contatos ?? []).map((contato) => ({
            nome: contato.nome,
            funcao: contato.funcao || null,
          })),
        },
      },
      include: { contatos: true },
    });
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
    if (input.email2 !== undefined) data.email2 = input.email2 || null;
    if (input.telefone !== undefined) data.telefone = input.telefone || null;
    if (input.telefone2 !== undefined) data.telefone2 = input.telefone2 || null;
    if (input.telefone3 !== undefined) data.telefone3 = input.telefone3 || null;
    if (input.site !== undefined) data.site = input.site || null;
    if (input.cidade !== undefined) data.cidade = input.cidade || null;
    if (input.pais !== undefined) data.pais = input.pais || null;
    if (input.descricaoServicos !== undefined) data.descricaoServicos = input.descricaoServicos || null;
    if (input.observacoes !== undefined) data.observacoes = input.observacoes || null;

    if (input.contatos !== undefined) {
      data.contatos = {
        deleteMany: {},
        create: input.contatos.map((contato) => ({
          nome: contato.nome,
          funcao: contato.funcao || null,
        })),
      };
    }

    const fornecedor = await prisma.fornecedor.update({
      where: { id: req.params.id },
      data,
      include: { contatos: true },
    });
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

// ---------- Carteira digital ----------

const carteiraMovimentoSchema = z.object({
  tipo: z.enum(["credito", "debito"]),
  valor: z.number().positive(),
  descricao: z.string().optional().or(z.literal("")),
  data: z.string().min(1),
});

function serializeMovimento(movimento: CarteiraMovimento) {
  return {
    id: movimento.id,
    fornecedorId: movimento.fornecedorId,
    tipo: movimento.tipo,
    valor: toNumber(movimento.valor) ?? 0,
    descricao: movimento.descricao ?? undefined,
    data: movimento.data.toISOString(),
    origem: movimento.reembolsoId ? ("reembolso" as const) : ("manual" as const),
    reembolsoId: movimento.reembolsoId ?? undefined,
    criadoEm: movimento.criadoEm.toISOString(),
  };
}

fornecedoresRouter.get(
  "/:id/carteira",
  asyncHandler(async (req, res) => {
    const movimentos = await prisma.carteiraMovimento.findMany({
      where: { fornecedorId: req.params.id },
      orderBy: { data: "desc" },
    });
    const saldo = movimentos.reduce(
      (soma, m) => soma + (m.tipo === "credito" ? toNumber(m.valor)! : -toNumber(m.valor)!),
      0
    );
    res.json({ saldo, movimentos: movimentos.map(serializeMovimento) });
  })
);

fornecedoresRouter.post(
  "/:id/carteira/movimentos",
  asyncHandler(async (req, res) => {
    const input = carteiraMovimentoSchema.parse(req.body);
    const movimento = await prisma.carteiraMovimento.create({
      data: {
        fornecedorId: req.params.id,
        tipo: input.tipo,
        valor: input.valor,
        descricao: input.descricao || null,
        data: new Date(input.data),
      },
    });
    res.status(201).json(serializeMovimento(movimento));
  })
);

fornecedoresRouter.delete(
  "/:id/carteira/movimentos/:movimentoId",
  asyncHandler(async (req, res) => {
    await prisma.carteiraMovimento.delete({ where: { id: req.params.movimentoId } });
    res.status(204).send();
  })
);
