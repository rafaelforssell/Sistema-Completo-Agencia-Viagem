"use client";

import Link from "next/link";
import {
  ArrowRight,
  Cake,
  PlaneTakeoff,
  Stamp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { StatCard } from "@/components/common/stat-card";
import { StatusBadge, type StatusTone } from "@/components/common/status-badge";
import { useClientes } from "@/hooks/use-clientes";
import { useDashboardMetricas } from "@/hooks/use-dashboard";
import { useViagens } from "@/hooks/use-viagens";
import { STATUS_VIAGEM_LABEL } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import type { StatusViagem } from "@/types/entities";

const STATUS_TONE: Record<StatusViagem, StatusTone> = {
  orcamento: "neutral",
  confirmada: "info",
  em_andamento: "warning",
  concluida: "success",
  cancelada: "danger",
};

export default function DashboardPage() {
  const { data: metricas, isLoading: metricasLoading } = useDashboardMetricas();
  const { data: clientesRecentes, isLoading: clientesLoading } = useClientes({
    porPagina: 5,
    ordenarPor: "criadoEm",
    ordem: "desc",
  });
  const { data: viagensRecentes, isLoading: viagensLoading } = useViagens({
    porPagina: 5,
    ordenarPor: "criadoEm",
    ordem: "desc",
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Painel"
        description="Visão geral de clientes, viagens e financeiro da agência."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/clientes/novo">
                <UserPlus className="h-4 w-4" />
                Novo cliente
              </Link>
            </Button>
            <Button asChild>
              <Link href="/viagens/nova">
                <PlaneTakeoff className="h-4 w-4" />
                Nova viagem
              </Link>
            </Button>
          </>
        }
      />

      {metricasLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Clientes cadastrados" value={metricas?.totalClientes ?? 0} icon={Users} tone="primary" />
          <StatCard label="Viagens ativas" value={metricas?.viagensAtivas ?? 0} icon={PlaneTakeoff} tone="primary" />
          <StatCard
            label="Próximos check-ins"
            value={metricas?.proximosCheckIns ?? 0}
            icon={PlaneTakeoff}
            tone="warning"
          />
          <StatCard
            label="Aniversários da semana"
            value={metricas?.aniversariantesSemana ?? 0}
            icon={Cake}
            tone="warning"
          />
          <StatCard
            label="Passaportes vencendo"
            value={metricas?.passaportesVencendoEm30Dias ?? 0}
            icon={Stamp}
            tone="danger"
          />
          <StatCard
            label="A pagar a fornecedores"
            value={formatCurrency(metricas?.contasAPagar ?? 0)}
            icon={Wallet}
            tone="warning"
          />
          <StatCard
            label="A receber de clientes"
            value={formatCurrency(metricas?.contasAReceber ?? 0)}
            icon={Wallet}
            tone="success"
          />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Clientes recentes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/clientes">
                Ver todos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {clientesLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : !clientesRecentes || clientesRecentes.dados.length === 0 ? (
              <EmptyState icon={Users} title="Nenhum cliente ainda" description="Cadastre o primeiro cliente da agência." />
            ) : (
              clientesRecentes.dados.map((cliente) => (
                <Link
                  key={cliente.id}
                  href={`/clientes/${cliente.id}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{cliente.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">{cliente.email || cliente.telefone || "—"}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDate(cliente.criadoEm)}</span>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Viagens recentes</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/viagens">
                Ver todas
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {viagensLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
            ) : !viagensRecentes || viagensRecentes.dados.length === 0 ? (
              <EmptyState icon={PlaneTakeoff} title="Nenhuma viagem ainda" description="Cadastre a primeira viagem vinculada a um cliente." />
            ) : (
              viagensRecentes.dados.map((viagem) => (
                <Link
                  key={viagem.id}
                  href={`/viagens/${viagem.id}`}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{viagem.destino}</p>
                    <p className="truncate text-xs text-muted-foreground">{viagem.cliente?.nome ?? "—"}</p>
                  </div>
                  <StatusBadge tone={STATUS_TONE[viagem.status]} label={STATUS_VIAGEM_LABEL[viagem.status]} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
