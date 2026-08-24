"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { StatusBadge, type StatusTone } from "@/components/common/status-badge";
import { useAlertas, useMarcarAlertaLido } from "@/hooks/use-dashboard";
import { SEVERIDADE_ALERTA_LABEL, TIPO_ALERTA_LABEL } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { SeveridadeAlerta } from "@/types/entities";

const SEVERIDADE_TONE: Record<SeveridadeAlerta, StatusTone> = {
  info: "neutral",
  atencao: "warning",
  urgente: "danger",
};

export default function AlertasPage() {
  const [tipo, setTipo] = useState("todos");
  const { data: alertas, isLoading } = useAlertas(tipo === "todos" ? undefined : { tipo });
  const marcarLido = useMarcarAlertaLido();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alertas"
        description="Check-in aéreo, aniversários de clientes e passaportes vencendo."
        actions={
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {Object.entries(TIPO_ALERTA_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : !alertas || alertas.length === 0 ? (
            <EmptyState icon={Bell} title="Nenhum alerta no momento" description="Você será avisado sobre check-ins, aniversários e passaportes por aqui." />
          ) : (
            <div className="space-y-1.5">
              {alertas.map((alerta) => {
                const href = alerta.viagemId
                  ? `/viagens/${alerta.viagemId}`
                  : alerta.clienteId
                    ? `/clientes/${alerta.clienteId}`
                    : null;

                return (
                  <div
                    key={alerta.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{alerta.titulo}</p>
                        <StatusBadge tone={SEVERIDADE_TONE[alerta.severidade]} label={SEVERIDADE_ALERTA_LABEL[alerta.severidade]} />
                        {!alerta.lido && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{alerta.descricao}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {TIPO_ALERTA_LABEL[alerta.tipo]} · {formatDate(alerta.data)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {href && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={href}>Ver detalhes</Link>
                        </Button>
                      )}
                      {!alerta.lido && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => marcarLido.mutate(alerta.id)}
                          aria-label="Marcar como lido"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
