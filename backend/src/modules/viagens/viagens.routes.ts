import { Router } from "express";
import { z } from "zod";
import type { Prisma, StatusVenda, StatusViagem, Viagem, VooTrecho } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/http-error";
import { asyncHandler } from "../../middleware/async-handler";
import { parsePagination, paginatedResponse } from "../../utils/pagination";
import { toNumber } from "../../utils/decimal";
import { serializeCliente } from "../clientes/clientes.routes";
import { serializeAnexo } from "../anexos/anexos.routes";
import { serializeComissao } from "../comissoes/comissoes.routes";
import { serializeConta } from "../contas/contas.routes";
import { serializePagamento, pagamentoSchema, sincronizarContaDoPagamento } from "../pagamentos/pagamentos.routes";
import {
  serializeReembolso,
  reembolsoSchema,
  reembolsoToData,
  sincronizarCarteiraDoReembolso,
} from "../reembolsos/reembolsos.routes";
import {
  gerarNumeroPedido,
  numeroPedidoExtraSchema,
  serializeVenda,
  toItemData,
  vendaItemSchema,
} from "../vendas/vendas.routes";
import {
  garantirClienteParaPassageiro,
  passageiroSchema,
  passageiroToData,
  passageirosRouter,
  serializePassageiro,
} from "./passageiros.routes";
import { generateVoucherPdf, voucherUrl } from "./voucher.service";

const textoOpcional = z.string().optional().or(z.literal(""));

const trechoSchema = z.object({
  sentido: z.enum(["ida", "volta"]),
  numeroVoo: textoOpcional,
  companhia: textoOpcional,
  origemIata: textoOpcional,
  origemAeroporto: textoOpcional,
  destinoIata: textoOpcional,
  destinoAeroporto: textoOpcional,
  // Horário local do aeroporto ("AAAA-MM-DDTHH:mm"), guardado como se fosse
  // UTC — igual às datas de calendário — pra exibir sempre o horário que
  // está no bilhete, independente do fuso de quem olha a tela.
  partidaPrevista: textoOpcional,
  chegadaPrevista: textoOpcional,
  terminalPartida: textoOpcional,
  terminalChegada: textoOpcional,
  aeronave: textoOpcional,
  classe: textoOpcional,
  bagagem: textoOpcional,
});

const comissaoViagemSchema = z.object({
  valor: z.number().nonnegative(),
  fornecedor: textoOpcional,
});

const viagemBaseSchema = z.object({
  clienteId: z.string().uuid(),
  destino: z.string().min(2),
  dataIda: z.string().min(1),
  dataVolta: z.string().min(1),
  companhiaAerea: textoOpcional,
  localizador: textoOpcional,
  status: z.enum(["orcamento", "confirmada", "em_andamento", "concluida", "cancelada"]),
  observacoes: textoOpcional,
  trechos: z.array(trechoSchema).optional(),
  comissao: comissaoViagemSchema.nullable().optional(),
});

// Só na criação: passageiros e a venda nascem junto com a viagem. Na edição
// eles têm abas próprias (Passageiros / Venda).
const viagemCriacaoSchema = viagemBaseSchema.extend({
  passageiros: z.array(passageiroSchema).optional(),
  venda: z.object({
    dataVenda: z.string().min(1, "Informe a data da venda."),
    observacoes: textoOpcional,
    numeroPedidoExtras: z.array(numeroPedidoExtraSchema).optional(),
    itens: z.array(vendaItemSchema).min(1, "Adicione ao menos um item à venda."),
  }),
});

const viagemSchema = viagemCriacaoSchema.refine((data) => data.dataVolta >= data.dataIda, {
  message: "A data de volta deve ser igual ou posterior à data de ida.",
  path: ["dataVolta"],
});

function horarioLocal(valor: string | undefined) {
  if (!valor) return null;
  const data = new Date(`${valor.slice(0, 16)}:00Z`);
  return Number.isNaN(data.getTime()) ? null : data;
}

function trechosToData(trechos: z.infer<typeof trechoSchema>[]) {
  return trechos.map((t, ordem) => ({
    ordem,
    sentido: t.sentido,
    numeroVoo: t.numeroVoo?.trim().toUpperCase() || null,
    companhia: t.companhia || null,
    origemIata: t.origemIata?.trim().toUpperCase() || null,
    origemAeroporto: t.origemAeroporto || null,
    destinoIata: t.destinoIata?.trim().toUpperCase() || null,
    destinoAeroporto: t.destinoAeroporto || null,
    partidaPrevista: horarioLocal(t.partidaPrevista),
    chegadaPrevista: horarioLocal(t.chegadaPrevista),
    terminalPartida: t.terminalPartida || null,
    terminalChegada: t.terminalChegada || null,
    aeronave: t.aeronave || null,
    classe: t.classe || null,
    bagagem: t.bagagem || null,
  }));
}

// A venda criada junto com a viagem acompanha o status dela.
function statusVendaDaViagem(status: StatusViagem): StatusVenda {
  if (status === "orcamento") return "orcamento";
  if (status === "cancelada") return "cancelada";
  return "confirmada";
}

function toData(input: z.infer<typeof viagemSchema>) {
  return {
    clienteId: input.clienteId,
    destino: input.destino,
    dataIda: new Date(input.dataIda),
    dataVolta: new Date(input.dataVolta),
    companhiaAerea: input.companhiaAerea || null,
    localizador: input.localizador?.trim().toUpperCase() || null,
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
    localizador: viagem.localizador ?? undefined,
    status: viagem.status,
    observacoes: viagem.observacoes ?? undefined,
    criadoEm: viagem.criadoEm.toISOString(),
    atualizadoEm: viagem.atualizadoEm.toISOString(),
  };
}

export function serializeTrecho(trecho: VooTrecho) {
  return {
    id: trecho.id,
    ordem: trecho.ordem,
    sentido: trecho.sentido,
    numeroVoo: trecho.numeroVoo ?? undefined,
    companhia: trecho.companhia ?? undefined,
    origemIata: trecho.origemIata ?? undefined,
    origemAeroporto: trecho.origemAeroporto ?? undefined,
    destinoIata: trecho.destinoIata ?? undefined,
    destinoAeroporto: trecho.destinoAeroporto ?? undefined,
    partidaPrevista: trecho.partidaPrevista?.toISOString(),
    chegadaPrevista: trecho.chegadaPrevista?.toISOString(),
    terminalPartida: trecho.terminalPartida ?? undefined,
    terminalChegada: trecho.terminalChegada ?? undefined,
    aeronave: trecho.aeronave ?? undefined,
    classe: trecho.classe ?? undefined,
    bagagem: trecho.bagagem ?? undefined,
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
        trechos: { orderBy: { ordem: "asc" } },
        passageiros: { orderBy: { criadoEm: "asc" } },
        pagamentos: { orderBy: { dataPagamento: "desc" } },
        reembolsos: { orderBy: { dataSolicitacao: "desc" } },
        comissoes: { orderBy: { criadoEm: "asc" } },
        vendas: { orderBy: { criadoEm: "asc" }, include: { numeroPedidoExtras: true, itens: true } },
        anexos: true,
      },
    });
    if (!viagem) throw HttpError.notFound("Viagem não encontrada.");

    res.json({
      ...serializeViagem(viagem),
      cliente: serializeCliente(viagem.cliente),
      trechos: viagem.trechos.map(serializeTrecho),
      passageiros: viagem.passageiros.map(serializePassageiro),
      pagamentos: viagem.pagamentos.map(serializePagamento),
      reembolsos: viagem.reembolsos.map(serializeReembolso),
      comissao: viagem.comissoes[0] ? serializeComissao(viagem.comissoes[0]) : undefined,
      vendas: viagem.vendas.map(serializeVenda),
      anexos: viagem.anexos.map(serializeAnexo),
    });
  })
);

viagensRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const input = viagemSchema.parse(req.body);

    // Passageiros novos também viram Clientes (mesma regra da aba
    // Passageiros). Feito antes da transação pra não segurá-la aberta.
    for (const passageiro of input.passageiros ?? []) {
      await garantirClienteParaPassageiro(passageiro);
    }

    const viagem = await prisma.$transaction(
      async (tx) => {
        const criada = await tx.viagem.create({
          data: {
            ...toData(input),
            trechos: { create: trechosToData(input.trechos ?? []) },
            passageiros: { create: (input.passageiros ?? []).map(passageiroToData) },
            comissoes:
              input.comissao && input.comissao.valor > 0
                ? { create: { valor: input.comissao.valor, fornecedor: input.comissao.fornecedor || null } }
                : undefined,
          },
        });

        // Toda viagem registrada já entra em Vendas.
        await tx.venda.create({
          data: {
            clienteId: input.clienteId,
            viagemId: criada.id,
            status: statusVendaDaViagem(input.status),
            dataVenda: new Date(input.venda.dataVenda),
            observacoes: input.venda.observacoes || null,
            numeroPedido: await gerarNumeroPedido(tx),
            numeroPedidoExtras: {
              create: (input.venda.numeroPedidoExtras ?? []).map((extra) => ({
                numero: extra.numero,
                descricao: extra.descricao || null,
              })),
            },
            itens: { create: input.venda.itens.map(toItemData) },
          },
        });

        return criada;
      },
      { timeout: 20_000 }
    );

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
    if (input.localizador !== undefined) data.localizador = input.localizador?.trim().toUpperCase() || null;
    if (input.status !== undefined) data.status = input.status;
    if (input.observacoes !== undefined) data.observacoes = input.observacoes || null;
    if (input.trechos !== undefined) {
      data.trechos = { deleteMany: {}, create: trechosToData(input.trechos) };
    }

    const viagem = await prisma.$transaction(
      async (tx) => {
        const atualizada = await tx.viagem.update({ where: { id: req.params.id }, data });

        // A viagem tem uma comissão "principal" (a primeira); valor 0 remove.
        if (input.comissao !== undefined) {
          const existente = await tx.comissao.findFirst({
            where: { viagemId: atualizada.id },
            orderBy: { criadoEm: "asc" },
          });
          const valor = input.comissao?.valor ?? 0;
          if (valor > 0) {
            const dados = { valor, fornecedor: input.comissao?.fornecedor || null };
            if (existente) await tx.comissao.update({ where: { id: existente.id }, data: dados });
            else await tx.comissao.create({ data: { viagemId: atualizada.id, ...dados } });
          } else if (existente) {
            await tx.comissao.delete({ where: { id: existente.id } });
          }
        }

        if (input.status !== undefined) {
          await tx.venda.updateMany({
            where: { viagemId: atualizada.id },
            data: { status: statusVendaDaViagem(input.status) },
          });
        }

        return atualizada;
      },
      { timeout: 20_000 }
    );

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

// ---------- Resumo ----------

// Guia completo da viagem para o cliente: itinerário, passageiros, o que foi
// comprado, como foi pago, contas e comissão, com os totais já calculados.
viagensRouter.get(
  "/:id/resumo",
  asyncHandler(async (req, res) => {
    const viagem = await prisma.viagem.findUnique({
      where: { id: req.params.id },
      include: {
        cliente: true,
        trechos: { orderBy: { ordem: "asc" } },
        passageiros: { orderBy: { criadoEm: "asc" } },
        pagamentos: { orderBy: { dataPagamento: "asc" } },
        reembolsos: { orderBy: { dataSolicitacao: "asc" } },
        comissoes: { orderBy: { criadoEm: "asc" } },
        contas: { orderBy: { vencimento: "asc" } },
        vendas: {
          orderBy: { criadoEm: "asc" },
          include: { numeroPedidoExtras: true, itens: { include: { fornecedor: true } } },
        },
      },
    });
    if (!viagem) throw HttpError.notFound("Viagem não encontrada.");

    const soma = (valores: (number | undefined)[]) =>
      Math.round(valores.reduce<number>((total, v) => total + (v ?? 0), 0) * 100) / 100;

    const vendas = viagem.vendas.map((venda) => {
      const serializada = serializeVenda(venda);
      return {
        ...serializada,
        itens: serializada.itens.map((item, i) => ({ ...item, fornecedorNome: venda.itens[i].fornecedor?.nome })),
      };
    });
    const contas = viagem.contas.map(serializeConta);
    const contasReceber = contas.filter((c) => c.natureza === "a_receber" && c.contabilizavel);

    res.json({
      ...serializeViagem(viagem),
      cliente: serializeCliente(viagem.cliente),
      trechos: viagem.trechos.map(serializeTrecho),
      passageiros: viagem.passageiros.map(serializePassageiro),
      vendas,
      pagamentos: viagem.pagamentos.map(serializePagamento),
      reembolsos: viagem.reembolsos.map(serializeReembolso),
      comissoes: viagem.comissoes.map(serializeComissao),
      contas,
      totais: {
        totalVendido: soma(vendas.filter((v) => v.status !== "cancelada").map((v) => v.valorTotal)),
        pagoFornecedores: soma(viagem.pagamentos.map((p) => toNumber(p.valor))),
        recebido: soma(contasReceber.filter((c) => c.status === "pago").map((c) => c.valor)),
        aReceber: soma(
          contasReceber.filter((c) => c.status === "pendente" || c.status === "atrasado").map((c) => c.valor)
        ),
        comissao: soma(viagem.comissoes.filter((c) => c.status !== "cancelada").map((c) => toNumber(c.valor))),
      },
    });
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
    await sincronizarCarteiraDoReembolso(reembolso);
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
