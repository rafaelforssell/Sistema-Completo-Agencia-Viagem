import { prisma } from "../../lib/prisma";

export type TipoAtividade =
  | "viagem_proxima"
  | "pagamento_pendente"
  | "reembolso_aberto"
  | "cliente_novo"
  | "viagem_concluida";

export interface AtividadeFeed {
  id: string;
  tipo: TipoAtividade;
  titulo: string;
  descricao: string;
  data: string;
  referenciaId?: string;
  referenciaTipo?: "cliente" | "viagem" | "pagamento" | "reembolso";
}

export async function computeAtividades(limite: number): Promise<AtividadeFeed[]> {
  const [clientesNovos, viagensProximas, viagensConcluidas, contasPendentes, reembolsosAbertos] = await Promise.all([
    prisma.cliente.findMany({ orderBy: { criadoEm: "desc" }, take: limite }),
    prisma.viagem.findMany({
      where: { status: { in: ["confirmada", "em_andamento"] }, dataIda: { gte: new Date() } },
      include: { cliente: true },
      orderBy: { dataIda: "asc" },
      take: limite,
    }),
    prisma.viagem.findMany({
      where: { status: "concluida" },
      include: { cliente: true },
      orderBy: { atualizadoEm: "desc" },
      take: limite,
    }),
    prisma.contaFinanceira.findMany({
      where: { status: "pendente" },
      orderBy: { vencimento: "asc" },
      take: limite,
    }),
    prisma.reembolso.findMany({
      where: { status: { in: ["solicitado", "em_analise"] } },
      orderBy: { dataSolicitacao: "desc" },
      take: limite,
    }),
  ]);

  const atividades: AtividadeFeed[] = [
    ...clientesNovos.map((cliente): AtividadeFeed => ({
      id: `cliente_novo:${cliente.id}`,
      tipo: "cliente_novo",
      titulo: "Novo cliente cadastrado",
      descricao: cliente.nome,
      data: cliente.criadoEm.toISOString(),
      referenciaId: cliente.id,
      referenciaTipo: "cliente",
    })),
    ...viagensProximas.map((viagem): AtividadeFeed => ({
      id: `viagem_proxima:${viagem.id}`,
      tipo: "viagem_proxima",
      titulo: "Viagem se aproxima",
      descricao: `${viagem.cliente.nome} · ${viagem.destino}`,
      data: viagem.dataIda.toISOString(),
      referenciaId: viagem.id,
      referenciaTipo: "viagem",
    })),
    ...viagensConcluidas.map((viagem): AtividadeFeed => ({
      id: `viagem_concluida:${viagem.id}`,
      tipo: "viagem_concluida",
      titulo: "Viagem concluída",
      descricao: `${viagem.cliente.nome} · ${viagem.destino}`,
      data: viagem.atualizadoEm.toISOString(),
      referenciaId: viagem.id,
      referenciaTipo: "viagem",
    })),
    ...contasPendentes.map((conta): AtividadeFeed => ({
      id: `pagamento_pendente:${conta.id}`,
      tipo: "pagamento_pendente",
      titulo: conta.natureza === "a_pagar" ? "Pagamento a fornecedor pendente" : "Recebimento de cliente pendente",
      descricao: `${conta.descricao} · ${conta.origemNome}`,
      data: conta.vencimento.toISOString(),
      referenciaId: conta.viagemId ?? undefined,
      referenciaTipo: conta.viagemId ? "viagem" : undefined,
    })),
    ...reembolsosAbertos.map((reembolso): AtividadeFeed => ({
      id: `reembolso_aberto:${reembolso.id}`,
      tipo: "reembolso_aberto",
      titulo: "Reembolso em aberto",
      descricao: reembolso.motivo,
      data: reembolso.dataSolicitacao.toISOString(),
      referenciaId: reembolso.viagemId,
      referenciaTipo: "viagem",
    })),
  ];

  atividades.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  return atividades.slice(0, limite);
}
