"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusBadge, type StatusTone } from "@/components/common/status-badge";
import { NATUREZA_CONTA_LABEL, STATUS_CONTA_LABEL } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ContaFinanceira, StatusConta } from "@/types/entities";

const STATUS_TONE: Record<StatusConta, StatusTone> = {
  pendente: "neutral",
  pago: "success",
  atrasado: "danger",
  cancelado: "neutral",
};

export const contaColumns: ColumnDef<ContaFinanceira>[] = [
  {
    accessorKey: "descricao",
    header: "Descrição",
    cell: ({ row }) => (
      <div className="max-w-xs">
        <p className="truncate text-sm font-medium">{row.original.descricao}</p>
        <p className="truncate text-xs text-muted-foreground">
          {row.original.origemNome}
          {row.original.contabilizavel === false && " · só agenda, não conta no total"}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "natureza",
    header: "Natureza",
    cell: ({ row }) => (
      <StatusBadge
        tone={row.original.natureza === "a_receber" ? "success" : "warning"}
        label={NATUREZA_CONTA_LABEL[row.original.natureza]}
      />
    ),
  },
  {
    accessorKey: "valor",
    header: "Valor",
    cell: ({ row }) => formatCurrency(row.original.valor),
  },
  {
    accessorKey: "vencimento",
    header: "Vencimento",
    cell: ({ row }) => formatDate(row.original.vencimento),
  },
  {
    accessorKey: "fonte",
    header: "Fonte",
    cell: ({ row }) => row.original.fonte || "—",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge tone={STATUS_TONE[row.original.status]} label={STATUS_CONTA_LABEL[row.original.status]} />
    ),
  },
];
