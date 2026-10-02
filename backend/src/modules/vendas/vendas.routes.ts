import { Router } from "express";
import { z } from "zod";
import type { NumeroPedidoExtra, Prisma, PrismaClient, StatusVenda, TipoVenda, Venda, VendaItem } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/http-error";
import { asyncHandler } from "../../middleware/async-handler";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { toNumber } from "../../utils/decimal";
import { serializeCliente } from "../clientes/clientes.routes";
import { serializeViagem } from "../viagens/viagens.routes";

const TIPO_VENDA = [
  "viagem",
  "aereo",
  "hotel",
  "transfer",
  "seguro",
  "cruzeiro",
  "passeio",
  "aluguel_carro",
  "ingressos",
  "outro",
] as const;
const STATUS_VENDA = ["orcamento", "confirmada", "cancelada"] as const;

export const numeroPedidoExtraSchema = z.object({
  numero: z.string().min(1, "Informe o número."),
  descricao: z.string().optional().or(z.literal("")),
});

export const vendaItemSchema = z.object({
  tipo: z.enum(TIPO_VENDA),
  fornecedorId: z.string().optional().or(z.literal("")),
  descricao: z.string().optional().or(z.literal("")),
  valor: z.number().nonnegative(),
  dataAluguel: z.string().optional().or(z.literal("")),
  seguroCompleto: z.boolean().optional(),
});

const vendaSchema = z.object({
  clienteId: z.string().min(1, "Selecione o cliente."),
  viagemId: z.string().optional().or(z.literal("")),
  status: z.enum(STATUS_VENDA),
  dataVenda: z.string().min(1, "Informe a data da venda."),
  observacoes: z.string().optional().or(z.literal("")),
  numeroPedidoExtras: z.array(numeroPedidoExtraSchema).optional(),
  itens: z.array(vendaItemSchema).min(1, "Adicione ao menos um item à venda."),
});

export type VendaCompleta = Venda & { numeroPedidoExtras: NumeroPedidoExtra[]; itens: VendaItem[] };

export function serializeVenda(venda: VendaCompleta) {
  const itens = venda.itens.map((item) => ({
    id: item.id,
    tipo: item.tipo,
    fornecedorId: item.fornecedorId ?? undefined,
    descricao: item.descricao ?? undefined,
    valor: toNumber(item.valor) ?? 0,
    dataAluguel: item.dataAluguel?.toISOString(),
    seguroCompleto: item.seguroCompleto ?? undefined,
  }));

  return {
    id: venda.id,
    clienteId: venda.clienteId,
    viagemId: venda.viagemId ?? undefined,
    status: venda.status,
    dataVenda: venda.dataVenda.toISOString(),
    numeroPedido: venda.numeroPedido,
    observacoes: venda.observacoes ?? undefined,
    itens,
    valorTotal: itens.reduce((soma, item) => soma + item.valor, 0),
    numeroPedidoExtras: venda.numeroPedidoExtras.map((extra) => ({
      id: extra.id,
      numero: extra.numero,
      descricao: extra.descricao ?? undefined,
    })),
    criadoEm: venda.criadoEm.toISOString(),
    atualizadoEm: venda.atualizadoEm.toISOString(),
  };
}

export function toItemData(item: z.infer<typeof vendaItemSchema>) {
  return {
    tipo: item.tipo,
    fornecedorId: item.fornecedorId || null,
    descricao: item.descricao || null,
    valor: item.valor,
    dataAluguel: item.dataAluguel ? new Date(item.dataAluguel) : null,
    seguroCompleto: item.seguroCompleto ?? null,
  };
}

export async function gerarNumeroPedido(db: Prisma.TransactionClient | PrismaClient = prisma): Promise<string> {
  const total = await db.venda.count();
  return `PED-${String(total + 1).padStart(6, "0")}`;
}

export const vendasRouter = Router();

vendasRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req);
    const tipo = typeof req.query.tipo === "string" ? (req.query.tipo as TipoVenda) : undefined;
    const status = typeof req.query.status === "string" ? (req.query.status as StatusVenda) : undefined;
    const clienteId = typeof req.query.clienteId === "string" ? req.query.clienteId : undefined;

    const where: Prisma.VendaWhereInput = {
      status,
      clienteId,
      itens: tipo ? { some: { tipo } } : undefined,
      OR: pagination.busca
        ? [
            { numeroPedido: { contains: pagination.busca, mode: "insensitive" } },
            { itens: { some: { descricao: { contains: pagination.busca, mode: "insensitive" } } } },
          ]
        : undefined,
    };

    const [dados, total] = await Promise.all([
      prisma.venda.findMany({
        where,
        include: { numeroPedidoExtras: true, itens: true },
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { [pagination.ordenarPor ?? "criadoEm"]: pagination.ordem },
      }),
      prisma.venda.count({ where }),
    ]);

    res.json(paginatedResponse(dados.map(serializeVenda), total, pagination));
  })
);

vendasRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const venda = await prisma.venda.findUnique({
      where: { id: req.params.id },
      include: {
        numeroPedidoExtras: true,
        itens: { include: { fornecedor: true } },
        cliente: true,
        viagem: true,
      },
    });
    if (!venda) throw HttpError.notFound("Venda não encontrada.");

    // Detalhe usado no resumo da venda: além dos dados da venda, traz o
    // cliente, a viagem vinculada e o nome do fornecedor de cada item.
    const serializada = serializeVenda(venda);
    res.json({
      ...serializada,
      itens: serializada.itens.map((item, i) => ({ ...item, fornecedorNome: venda.itens[i].fornecedor?.nome })),
      cliente: serializeCliente(venda.cliente),
      viagem: venda.viagem ? serializeViagem(venda.viagem) : undefined,
    });
  })
);

vendasRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = vendaSchema.parse(req.body);
    const numeroPedido = await gerarNumeroPedido();

    const venda = await prisma.venda.create({
      data: {
        clienteId: input.clienteId,
        viagemId: input.viagemId || null,
        status: input.status,
        dataVenda: new Date(input.dataVenda),
        observacoes: input.observacoes || null,
        numeroPedido,
        numeroPedidoExtras: {
          create: (input.numeroPedidoExtras ?? []).map((extra) => ({
            numero: extra.numero,
            descricao: extra.descricao || null,
          })),
        },
        itens: {
          create: input.itens.map(toItemData),
        },
      },
      include: { numeroPedidoExtras: true, itens: true },
    });

    res.status(201).json(serializeVenda(venda));
  })
);

vendasRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = vendaSchema.partial().parse(req.body);
    const data: Prisma.VendaUpdateInput = {};
    if (input.clienteId !== undefined) data.cliente = { connect: { id: input.clienteId } };
    if (input.viagemId !== undefined) {
      data.viagem = input.viagemId ? { connect: { id: input.viagemId } } : { disconnect: true };
    }
    if (input.status !== undefined) data.status = input.status;
    if (input.dataVenda !== undefined) data.dataVenda = new Date(input.dataVenda);
    if (input.observacoes !== undefined) data.observacoes = input.observacoes || null;

    if (input.numeroPedidoExtras !== undefined) {
      data.numeroPedidoExtras = {
        deleteMany: {},
        create: input.numeroPedidoExtras.map((extra) => ({
          numero: extra.numero,
          descricao: extra.descricao || null,
        })),
      };
    }

    if (input.itens !== undefined) {
      data.itens = {
        deleteMany: {},
        create: input.itens.map(toItemData),
      };
    }

    const venda = await prisma.venda.update({
      where: { id: req.params.id },
      data,
      include: { numeroPedidoExtras: true, itens: true },
    });
    res.json(serializeVenda(venda));
  })
);

vendasRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.venda.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
