"use client";

import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { StatusBadge, type StatusTone } from "@/components/common/status-badge";
import { STATUS_REEMBOLSO_LABEL } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Reembolso, StatusReembolso } from "@/types/entities";

const STATUS_TONE: Record<StatusReembolso, StatusTone> = {
  solicitado: "neutral",
  em_analise: "warning",
  aprovado: "info",
  pago: "success",
  negado: "danger",
};

export const reembolsoColumns: ColumnDef<Reembolso>[] = [
  {
    accessorKey: "motivo",
    header: "Motivo",
    cell: ({ row }) => (
      <div className="max-w-xs">
        <p className="truncate text-sm font-medium">{row.original.motivo}</p>
        <Link
          href={`/viagens/${row.original.viagemId}`}
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-primary hover:underline"
        >
          Ver viagem
        </Link>
      </div>
    ),
  },
  {
    accessorKey: "valorSolicitado",
    header: "Solicitado",
    cell: ({ row }) => formatCurrency(row.original.valorSolicitado),
  },
  {
    accessorKey: "valorAprovado",
    header: "Aprovado",
    cell: ({ row }) => formatCurrency(row.original.valorAprovado),
  },
  {
    accessorKey: "dataSolicitacao",
    header: "Solicitado em",
    cell: ({ row }) => formatDate(row.original.dataSolicitacao),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge tone={STATUS_TONE[row.original.status]} label={STATUS_REEMBOLSO_LABEL[row.original.status]} />
    ),
  },
];
