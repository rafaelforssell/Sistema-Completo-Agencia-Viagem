import { prisma } from "../../lib/prisma";
import { diffInDays, nextAnniversary } from "../../utils/dates";

export type TipoAlerta = "checkin" | "aniversario" | "passaporte";
export type SeveridadeAlerta = "info" | "atencao" | "urgente";

export interface AlertaComputado {
  id: string;
  tipo: TipoAlerta;
  severidade: SeveridadeAlerta;
  titulo: string;
  descricao: string;
  data: string;
  clienteId?: string;
  viagemId?: string;
}

const CHECKIN_JANELA_DIAS = 3;
const ANIVERSARIO_JANELA_DIAS = 7;
const PASSAPORTE_JANELA_DIAS = 60;

export async function computeAlertas(): Promise<AlertaComputado[]> {
  const hoje = new Date();
  const alertas: AlertaComputado[] = [];

  const viagens = await prisma.viagem.findMany({
    where: { status: { in: ["confirmada", "em_andamento"] } },
    include: { cliente: true },
  });

  for (const viagem of viagens) {
    const dias = diffInDays(viagem.dataIda, hoje);
    if (dias >= 0 && dias <= CHECKIN_JANELA_DIAS) {
      alertas.push({
        id: `checkin:${viagem.id}`,
        tipo: "checkin",
        severidade: dias <= 1 ? "urgente" : "atencao",
        titulo: "Check-in aéreo se aproxima",
        descricao: `${viagem.cliente.nome} · ${viagem.destino} embarca em ${dias === 0 ? "hoje" : `${dias} dia(s)`}`,
        data: viagem.dataIda.toISOString(),
        clienteId: viagem.clienteId,
        viagemId: viagem.id,
      });
    }
  }

  const clientesComNascimento = await prisma.cliente.findMany({
    where: { dataNascimento: { not: null } },
  });

  for (const cliente of clientesComNascimento) {
    if (!cliente.dataNascimento) continue;
    const proximo = nextAnniversary(cliente.dataNascimento, hoje);
    const dias = diffInDays(proximo, hoje);
    if (dias >= 0 && dias <= ANIVERSARIO_JANELA_DIAS) {
      alertas.push({
        id: `aniversario:${cliente.id}:${proximo.getFullYear()}`,
        tipo: "aniversario",
        severidade: dias === 0 ? "urgente" : "atencao",
        titulo: dias === 0 ? "Aniversário de cliente hoje" : "Aniversário de cliente esta semana",
        descricao: `${cliente.nome} — ${dias === 0 ? "hoje" : `em ${dias} dia(s)`}`,
        data: proximo.toISOString(),
        clienteId: cliente.id,
      });
    }
  }

  const clientesComPassaporte = await prisma.cliente.findMany({
    where: { validadePassaporte: { not: null } },
  });

  for (const cliente of clientesComPassaporte) {
    if (!cliente.validadePassaporte) continue;
    const dias = diffInDays(cliente.validadePassaporte, hoje);
    if (dias <= PASSAPORTE_JANELA_DIAS) {
      alertas.push({
        id: `passaporte:cliente:${cliente.id}`,
        tipo: "passaporte",
        severidade: dias < 0 ? "urgente" : dias <= 15 ? "urgente" : "atencao",
        titulo: dias < 0 ? "Passaporte vencido" : "Passaporte perto de vencer",
        descricao: `${cliente.nome} — validade em ${new Intl.DateTimeFormat("pt-BR").format(cliente.validadePassaporte)}`,
        data: cliente.validadePassaporte.toISOString(),
        clienteId: cliente.id,
      });
    }
  }

  const passageirosComPassaporte = await prisma.passageiro.findMany({
    where: { validadePassaporte: { not: null } },
    include: { viagem: true },
  });

  for (const passageiro of passageirosComPassaporte) {
    if (!passageiro.validadePassaporte) continue;
    const dias = diffInDays(passageiro.validadePassaporte, hoje);
    if (dias <= PASSAPORTE_JANELA_DIAS) {
      alertas.push({
        id: `passaporte:passageiro:${passageiro.id}`,
        tipo: "passaporte",
        severidade: dias < 0 ? "urgente" : dias <= 15 ? "urgente" : "atencao",
        titulo: dias < 0 ? "Passaporte vencido" : "Passaporte perto de vencer",
        descricao: `${passageiro.nome} (viagem ${passageiro.viagem.destino}) — validade em ${new Intl.DateTimeFormat(
          "pt-BR"
        ).format(passageiro.validadePassaporte)}`,
        data: passageiro.validadePassaporte.toISOString(),
        viagemId: passageiro.viagemId,
      });
    }
  }

  alertas.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  return alertas;
}

export async function computeAlertasComLeitura(filtros: { lido?: boolean; tipo?: TipoAlerta }) {
  const [alertas, estados] = await Promise.all([computeAlertas(), prisma.alertaLido.findMany()]);
  const lidosSet = new Set(estados.filter((e) => e.lido).map((e) => e.chave));
  const excluidosSet = new Set(estados.filter((e) => e.excluido).map((e) => e.chave));

  return alertas
    .filter((alerta) => !excluidosSet.has(alerta.id))
    .map((alerta) => ({ ...alerta, lido: lidosSet.has(alerta.id) }))
    .filter((alerta) => (filtros.tipo ? alerta.tipo === filtros.tipo : true))
    .filter((alerta) => (filtros.lido !== undefined ? alerta.lido === filtros.lido : true));
}

export async function marcarAlertaComoLido(id: string) {
  await prisma.alertaLido.upsert({
    where: { chave: id },
    create: { chave: id, lido: true, lidoEm: new Date() },
    update: { lido: true, lidoEm: new Date() },
  });
}

export async function marcarTodosAlertasComoLidos() {
  const alertas = await computeAlertasComLeitura({ lido: false });
  await prisma.$transaction(
    alertas.map((alerta) =>
      prisma.alertaLido.upsert({
        where: { chave: alerta.id },
        create: { chave: alerta.id, lido: true, lidoEm: new Date() },
        update: { lido: true, lidoEm: new Date() },
      })
    )
  );
}

export async function excluirAlerta(id: string) {
  await prisma.alertaLido.upsert({
    where: { chave: id },
    create: { chave: id, excluido: true, excluidoEm: new Date() },
    update: { excluido: true, excluidoEm: new Date() },
  });
}
