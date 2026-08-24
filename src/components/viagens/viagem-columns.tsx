"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusBadge, type StatusTone } from "@/components/common/status-badge";
import { STATUS_VIAGEM_LABEL } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import type { StatusViagem, Viagem } from "@/types/entities";

const STATUS_TONE: Record<StatusViagem, StatusTone> = {
  orcamento: "neutral",
  confirmada: "info",
  em_andamento: "warning",
  concluida: "success",
  cancelada: "danger",
};

export const viagemColumns: ColumnDef<Viagem>[] = [
  {
    accessorKey: "destino",
    header: "Destino",
    cell: ({ row }) => (
      <div>
        <p className="text-sm font-medium">{row.original.destino}</p>
        <p className="text-xs text-muted-foreground">{row.original.cliente?.nome ?? "—"}</p>
      </div>
    ),
  },
  {
    accessorKey: "dataIda",
    header: "Ida",
    cell: ({ row }) => formatDate(row.original.dataIda),
  },
  {
    accessorKey: "dataVolta",
    header: "Volta",
    cell: ({ row }) => formatDate(row.original.dataVolta),
  },
  {
    accessorKey: "companhiaAerea",
    header: "Companhia",
    cell: ({ row }) => row.original.companhiaAerea || "—",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge tone={STATUS_TONE[row.original.status]} label={STATUS_VIAGEM_LABEL[row.original.status]} />
    ),
  },
];
