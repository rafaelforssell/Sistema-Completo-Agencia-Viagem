import { Router } from "express";
import { z } from "zod";
import type { Cliente, ContaFinanceira, NaturezaConta, Prisma, StatusConta } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { asyncHandler } from "../../middleware/async-handler";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { toNumber } from "../../utils/decimal";
import { serializeCliente } from "../clientes/clientes.routes";

const contaSchema = z.object({
  natureza: z.enum(["a_pagar", "a_receber"]),
  descricao: z.string().min(2),
  origem: z.enum(["cliente", "fornecedor"]),
  origemNome: z.string().min(2),
  viagemId: z.string().uuid().optional().or(z.literal("")),
  clienteId: z.string().uuid().optional().or(z.literal("")),
  valor: z.number().positive(),
  vencimento: z.string().min(1),
  status: z.enum(["pendente", "pago", "atrasado", "cancelado"]),
  fonte: z.string().optional().or(z.literal("")),
});

function toData(input: z.infer<typeof contaSchema>) {
  return {
    natureza: input.natureza,
    descricao: input.descricao,
    origem: input.origem,
    origemNome: input.origemNome,
    viagemId: input.viagemId || null,
    clienteId: input.clienteId || null,
    valor: input.valor,
    vencimento: new Date(input.vencimento),
    status: input.status,
    fonte: input.fonte || null,
  };
}

export function serializeConta(conta: ContaFinanceira & { cliente?: Cliente | null }) {
  return {
    id: conta.id,
    natureza: conta.natureza,
    descricao: conta.descricao,
    origem: conta.origem,
    origemNome: conta.origemNome,
    viagemId: conta.viagemId ?? undefined,
    clienteId: conta.clienteId ?? undefined,
    cliente: conta.cliente ? serializeCliente(conta.cliente) : undefined,
    valor: toNumber(conta.valor),
    vencimento: conta.vencimento.toISOString(),
    status: conta.status,
    fonte: conta.fonte ?? undefined,
    criadoEm: conta.criadoEm.toISOString(),
    atualizadoEm: conta.atualizadoEm.toISOString(),
  };
}

export const contasRouter = Router();

contasRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req);
    const natureza = typeof req.query.natureza === "string" ? (req.query.natureza as NaturezaConta) : undefined;
    const status = typeof req.query.status === "string" ? (req.query.status as StatusConta) : undefined;

    const where: Prisma.ContaFinanceiraWhereInput = {
      natureza,
      status,
      OR: pagination.busca
        ? [
            { descricao: { contains: pagination.busca, mode: "insensitive" } },
            { origemNome: { contains: pagination.busca, mode: "insensitive" } },
          ]
        : undefined,
    };

    const [dados, total] = await Promise.all([
      prisma.contaFinanceira.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { [pagination.ordenarPor ?? "criadoEm"]: pagination.ordem },
        include: { cliente: true },
      }),
      prisma.contaFinanceira.count({ where }),
    ]);

    res.json(paginatedResponse(dados.map(serializeConta), total, pagination));
  })
);

contasRouter.get(
  "/resumo",
  asyncHandler(async (_req, res) => {
    const [aPagar, aReceber, atrasado, porFonte] = await Promise.all([
      prisma.contaFinanceira.aggregate({
        where: { natureza: "a_pagar", status: { not: "cancelado" } },
        _sum: { valor: true },
      }),
      prisma.contaFinanceira.aggregate({
        where: { natureza: "a_receber", status: { not: "cancelado" } },
        _sum: { valor: true },
      }),
      prisma.contaFinanceira.aggregate({
        where: { status: "atrasado" },
        _sum: { valor: true },
      }),
      prisma.contaFinanceira.groupBy({
        by: ["fonte"],
        where: { fonte: { not: null }, status: { not: "cancelado" } },
        _sum: { valor: true },
      }),
    ]);

    res.json({
      totalAPagar: toNumber(aPagar._sum.valor) ?? 0,
      totalAReceber: toNumber(aReceber._sum.valor) ?? 0,
      totalAtrasado: toNumber(atrasado._sum.valor) ?? 0,
      saldoPorFonte: porFonte.map((item) => ({
        fonte: item.fonte ?? "Outros",
        saldo: toNumber(item._sum.valor) ?? 0,
      })),
    });
  })
);

contasRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = contaSchema.parse(req.body);
    const conta = await prisma.contaFinanceira.create({
      data: toData(input),
      include: { cliente: true },
    });
    res.status(201).json(serializeConta(conta));
  })
);

contasRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = contaSchema.partial().parse(req.body);
    const data: Prisma.ContaFinanceiraUpdateInput = {};
    if (input.natureza !== undefined) data.natureza = input.natureza;
    if (input.descricao !== undefined) data.descricao = input.descricao;
    if (input.origem !== undefined) data.origem = input.origem;
    if (input.origemNome !== undefined) data.origemNome = input.origemNome;
    if (input.viagemId !== undefined) {
      data.viagem = input.viagemId ? { connect: { id: input.viagemId } } : { disconnect: true };
    }
    if (input.clienteId !== undefined) {
      data.cliente = input.clienteId ? { connect: { id: input.clienteId } } : { disconnect: true };
    }
    if (input.valor !== undefined) data.valor = input.valor;
    if (input.vencimento !== undefined) data.vencimento = new Date(input.vencimento);
    if (input.status !== undefined) data.status = input.status;
    if (input.fonte !== undefined) data.fonte = input.fonte || null;

    const conta = await prisma.contaFinanceira.update({
      where: { id: req.params.id },
      data,
      include: { cliente: true },
    });
    res.json(serializeConta(conta));
  })
);

contasRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.contaFinanceira.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
