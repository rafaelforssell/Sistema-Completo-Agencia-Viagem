import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma";
import { HttpError } from "../../lib/http-error";
import { asyncHandler } from "../../middleware/async-handler";
import { toNumber } from "../../utils/decimal";
import { addDays, diffInDays, nextAnniversary } from "../../utils/dates";
import {
  computeAlertasComLeitura,
  excluirAlerta,
  marcarAlertaComoLido,
  marcarTodosAlertasComoLidos,
} from "./alertas.service";
import { computeAtividades } from "./atividades.service";

export const dashboardRouter = Router();

const CHECKIN_JANELA_DIAS = 7;
const ANIVERSARIO_JANELA_DIAS = 7;
const PASSAPORTE_JANELA_DIAS = 30;

dashboardRouter.get(
  "/metricas",
  asyncHandler(async (_req, res) => {
    const hoje = new Date();

    const [
      totalClientes,
      viagensAtivas,
      proximosCheckIns,
      clientesComNascimento,
      clientesComPassaporte,
      passageirosComPassaporte,
      aPagar,
      aReceber,
    ] = await Promise.all([
      prisma.cliente.count(),
      prisma.viagem.count({ where: { status: { in: ["confirmada", "em_andamento"] } } }),
      prisma.viagem.count({
        where: {
          status: { in: ["confirmada", "em_andamento"] },
          dataIda: { gte: hoje, lte: addDays(hoje, CHECKIN_JANELA_DIAS) },
        },
      }),
      prisma.cliente.findMany({ where: { dataNascimento: { not: null } }, select: { dataNascimento: true } }),
      prisma.cliente.findMany({
        where: { validadePassaporte: { not: null } },
        select: { validadePassaporte: true },
      }),
      prisma.passageiro.findMany({
        where: { validadePassaporte: { not: null } },
        select: { validadePassaporte: true },
      }),
      prisma.contaFinanceira.aggregate({
        where: { natureza: "a_pagar", status: { not: "cancelado" }, contabilizavel: true },
        _sum: { valor: true },
      }),
      prisma.contaFinanceira.aggregate({
        where: { natureza: "a_receber", status: { not: "cancelado" }, contabilizavel: true },
        _sum: { valor: true },
      }),
    ]);

    const aniversariantesSemana = clientesComNascimento.filter((c) => {
      if (!c.dataNascimento) return false;
      const dias = diffInDays(nextAnniversary(c.dataNascimento, hoje), hoje);
      return dias >= 0 && dias <= ANIVERSARIO_JANELA_DIAS;
    }).length;

    const passaportesClientes = clientesComPassaporte.filter(
      (c) => c.validadePassaporte && diffInDays(c.validadePassaporte, hoje) <= PASSAPORTE_JANELA_DIAS
    ).length;
    const passaportesPassageiros = passageirosComPassaporte.filter(
      (p) => p.validadePassaporte && diffInDays(p.validadePassaporte, hoje) <= PASSAPORTE_JANELA_DIAS
    ).length;

    res.json({
      totalClientes,
      viagensAtivas,
      proximosCheckIns,
      aniversariantesSemana,
      passaportesVencendoEm30Dias: passaportesClientes + passaportesPassageiros,
      contasAPagar: toNumber(aPagar._sum.valor) ?? 0,
      contasAReceber: toNumber(aReceber._sum.valor) ?? 0,
    });
  })
);

export const atividadesRouter = Router();

atividadesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const limite = Math.min(100, Math.max(1, Number(req.query.limite) || 20));
    res.json(await computeAtividades(limite));
  })
);

export const alertasRouter = Router();

const alertasQuerySchema = z.object({
  lido: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  tipo: z.enum(["checkin", "aniversario", "passaporte"]).optional(),
});

alertasRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = alertasQuerySchema.parse(req.query);
    res.json(await computeAlertasComLeitura(query));
  })
);

alertasRouter.patch(
  "/lidos",
  asyncHandler(async (_req, res) => {
    await marcarTodosAlertasComoLidos();
    res.json({ ok: true });
  })
);

alertasRouter.patch(
  "/:id/lido",
  asyncHandler(async (req, res) => {
    const alertas = await computeAlertasComLeitura({});
    const alerta = alertas.find((a) => a.id === req.params.id);
    if (!alerta) throw HttpError.notFound("Alerta não encontrado.");

    await marcarAlertaComoLido(alerta.id);

    res.json({ ...alerta, lido: true });
  })
);

alertasRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await excluirAlerta(req.params.id);
    res.status(204).send();
  })
);
