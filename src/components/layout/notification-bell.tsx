"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useAlertas } from "@/hooks/use-dashboard";
import { SEVERIDADE_ALERTA_LABEL } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const SEVERIDADE_DOT: Record<string, string> = {
  info: "bg-muted-foreground",
  atencao: "bg-warning",
  urgente: "bg-destructive",
};

export function NotificationBell() {
  const { data: alertas } = useAlertas({ lido: false });
  const total = alertas?.length ?? 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-4 w-4" />
          {total > 0 && (
            <Badge className="absolute -right-1 -top-1 h-4 min-w-4 justify-center rounded-full p-0 text-[10px]">
              {total}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-medium">Alertas</p>
          <span className="text-xs text-muted-foreground">{total} pendente(s)</span>
        </div>
        <Separator />
        <div className="max-h-80 overflow-y-auto">
          {total === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              Nenhum alerta pendente.
            </p>
          ) : (
            alertas?.slice(0, 6).map((alerta) => (
              <div key={alerta.id} className="flex gap-2.5 px-4 py-3 hover:bg-muted/50">
                <span
                  className={cn(
                    "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                    SEVERIDADE_DOT[alerta.severidade]
                  )}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{alerta.titulo}</p>
                  <p className="truncate text-xs text-muted-foreground">{alerta.descricao}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {SEVERIDADE_ALERTA_LABEL[alerta.severidade]} · {formatDate(alerta.data)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
        <Separator />
        <Link
          href="/alertas"
          className="block px-4 py-2.5 text-center text-sm font-medium text-primary hover:bg-muted/50"
        >
          Ver todos os alertas
        </Link>
      </PopoverContent>
    </Popover>
  );
}
