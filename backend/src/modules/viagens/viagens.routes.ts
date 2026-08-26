import { Router } from "express";
import { z } from "zod";
import type { Prisma, StatusViagem, Viagem } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/http-error";
import { asyncHandler } from "../../middleware/async-handler";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { serializeCliente } from "../clientes/clientes.routes";
import { serializeAnexo } from "../anexos/anexos.routes";
import { serializePagamento, pagamentoSchema, sincronizarContaDoPagamento } from "../pagamentos/pagamentos.routes";
import { serializeReembolso, reembolsoSchema, reembolsoToData } from "../reembolsos/reembolsos.routes";
import { passageirosRouter } from "./passageiros.routes";
import { generateVoucherPdf, voucherUrl } from "./voucher.service";

const viagemBaseSchema = z.object({
  clienteId: z.string().uuid(),
  destino: z.string().min(2),
  dataIda: z.string().min(1),
  dataVolta: z.string().min(1),
  companhiaAerea: z.string().optional().or(z.literal("")),
  status: z.enum(["orcamento", "confirmada", "em_andamento", "concluida", "cancelada"]),
  observacoes: z.string().optional().or(z.literal("")),
});

const viagemSchema = viagemBaseSchema.refine((data) => data.dataVolta >= data.dataIda, {
  message: "A data de volta deve ser igual ou posterior à data de ida.",
  path: ["dataVolta"],
});

function toData(input: z.infer<typeof viagemSchema>) {
  return {
    clienteId: input.clienteId,
    destino: input.destino,
    dataIda: new Date(input.dataIda),
    dataVolta: new Date(input.dataVolta),
    companhiaAerea: input.companhiaAerea || null,
    status: input.status,
    observacoes: input.observacoes || null,
  };
}

export function serializeViagem(viagem: Viagem) {
  return {
    id: viagem.id,
    clienteId: viagem.clienteId,
    destino: viagem.destino,
    dataIda: viagem.dataIda.toISOString(),
    dataVolta: viagem.dataVolta.toISOString(),
    companhiaAerea: viagem.companhiaAerea ?? undefined,
    status: viagem.status,
    observacoes: viagem.observacoes ?? undefined,
    criadoEm: viagem.criadoEm.toISOString(),
    atualizadoEm: viagem.atualizadoEm.toISOString(),
  };
}

export const viagensRouter = Router();

viagensRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const pagination = parsePagination(req);
    const status = typeof req.query.status === "string" ? (req.query.status as StatusViagem) : undefined;
    const clienteId = typeof req.query.clienteId === "string" ? req.query.clienteId : undefined;

    const where: Prisma.ViagemWhereInput = {
      status,
      clienteId,
      destino: pagination.busca ? { contains: pagination.busca, mode: "insensitive" } : undefined,
    };

    const [viagens, total] = await Promise.all([
      prisma.viagem.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy: { [pagination.ordenarPor ?? "criadoEm"]: pagination.ordem },
        include: { cliente: true },
      }),
      prisma.viagem.count({ where }),
    ]);

    res.json(
      paginatedResponse(
        viagens.map((v) => ({ ...serializeViagem(v), cliente: serializeCliente(v.cliente) })),
        total,
        pagination
      )
    );
  })
);

viagensRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const viagem = await prisma.viagem.findUnique({
      where: { id: req.params.id },
      include: {
        cliente: true,
        passageiros: { orderBy: { criadoEm: "asc" } },
        pagamentos: { orderBy: { dataPagamento: "desc" } },
        reembolsos: { orderBy: { dataSolicitacao: "desc" } },
        anexos: true,
      },
    });
    if (!viagem) throw HttpError.notFound("Viagem não encontrada.");

    res.json({
      ...serializeViagem(viagem),
      cliente: serializeCliente(viagem.cliente),
      passageiros: viagem.passageiros.map((p) => ({
        id: p.id,
        viagemId: p.viagemId,
        nome: p.nome,
        parentesco: p.parentesco ?? undefined,
        dataNascimento: p.dataNascimento?.toISOString(),
        numeroPassaporte: p.numeroPassaporte ?? undefined,
        validadePassaporte: p.validadePassaporte?.toISOString(),
        numeroBilhete: p.numeroBilhete ?? undefined,
        criadoEm: p.criadoEm.toISOString(),
        atualizadoEm: p.atualizadoEm.toISOString(),
      })),
      pagamentos: viagem.pagamentos.map(serializePagamento),
      reembolsos: viagem.reembolsos.map(serializeReembolso),
      anexos: viagem.anexos.map(serializeAnexo),
    });
  })
);

viagensRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = viagemSchema.parse(req.body);
    const viagem = await prisma.viagem.create({ data: toData(input) });
    res.status(201).json(serializeViagem(viagem));
  })
);

viagensRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const input = viagemBaseSchema.partial().parse(req.body);
    const data: Prisma.ViagemUpdateInput = {};
    if (input.clienteId !== undefined) data.cliente = { connect: { id: input.clienteId } };
    if (input.destino !== undefined) data.destino = input.destino;
    if (input.dataIda !== undefined) data.dataIda = new Date(input.dataIda);
    if (input.dataVolta !== undefined) data.dataVolta = new Date(input.dataVolta);
    if (input.companhiaAerea !== undefined) data.companhiaAerea = input.companhiaAerea || null;
    if (input.status !== undefined) data.status = input.status;
    if (input.observacoes !== undefined) data.observacoes = input.observacoes || null;

    const viagem = await prisma.viagem.update({ where: { id: req.params.id }, data });
    res.json(serializeViagem(viagem));
  })
);

viagensRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.viagem.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

// ---------- Recursos aninhados ----------

viagensRouter.use("/:viagemId/passageiros", passageirosRouter);

viagensRouter.get(
  "/:viagemId/pagamentos",
  asyncHandler(async (req, res) => {
    const pagamentos = await prisma.pagamento.findMany({
      where: { viagemId: req.params.viagemId },
      orderBy: { dataPagamento: "desc" },
    });
    res.json(pagamentos.map(serializePagamento));
  })
);

viagensRouter.post(
  "/:viagemId/pagamentos",
  asyncHandler(async (req, res) => {
    const input = pagamentoSchema.parse(req.body);
    const viagem = await prisma.viagem.findUnique({
      where: { id: req.params.viagemId },
      include: { cliente: true },
    });
    if (!viagem) throw HttpError.notFound("Viagem não encontrada.");

    const pagamento = await prisma.pagamento.create({
      data: {
        viagemId: req.params.viagemId,
        companhiaAerea: input.companhiaAerea || null,
        fornecedor: input.fornecedor,
        formaPagamento: input.formaPagamento,
        tipoCartao: input.tipoCartao,
        nomeTitularTerceiro: input.tipoCartao === "terceiro" ? input.nomeTitularTerceiro || null : null,
        valor: input.valor,
        parcelas: input.parcelas,
        dataPagamento: new Date(input.dataPagamento),
        observacoes: input.observacoes || null,
      },
    });
    await sincronizarContaDoPagamento(pagamento, viagem);
    res.status(201).json(serializePagamento(pagamento));
  })
);

viagensRouter.get(
  "/:viagemId/reembolsos",
  asyncHandler(async (req, res) => {
    const reembolsos = await prisma.reembolso.findMany({
      where: { viagemId: req.params.viagemId },
      orderBy: { dataSolicitacao: "desc" },
    });
    res.json(reembolsos.map(serializeReembolso));
  })
);

viagensRouter.post(
  "/:viagemId/reembolsos",
  asyncHandler(async (req, res) => {
    const input = reembolsoSchema.parse(req.body);
    const reembolso = await prisma.reembolso.create({
      data: { viagemId: req.params.viagemId, ...reembolsoToData(input) },
    });
    res.status(201).json(serializeReembolso(reembolso));
  })
);

// ---------- Voucher ----------

viagensRouter.post(
  "/:id/voucher",
  asyncHandler(async (req, res) => {
    const viagem = await prisma.viagem.findUnique({
      where: { id: req.params.id },
      include: { cliente: true, passageiros: true, pagamentos: true },
    });
    if (!viagem) throw HttpError.notFound("Viagem não encontrada.");

    const filename = await generateVoucherPdf(viagem);
    const url = voucherUrl(filename);

    const voucher = await prisma.voucher.upsert({
      where: { viagemId: viagem.id },
      create: { viagemId: viagem.id, url },
      update: { url, geradoEm: new Date() },
    });

    res.json({ url: voucher.url, geradoEm: voucher.geradoEm.toISOString() });
  })
);
