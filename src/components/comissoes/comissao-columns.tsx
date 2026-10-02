"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusBadge, type StatusTone } from "@/components/common/status-badge";
import { STATUS_COMISSAO_LABEL } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Comissao, StatusComissao } from "@/types/entities";

const STATUS_TONE: Record<StatusComissao, StatusTone> = {
  pendente: "neutral",
  recebida: "success",
  cancelada: "danger",
};

export const comissaoColumns: ColumnDef<Comissao>[] = [
  {
    id: "viagem",
    header: "Viagem",
    cell: ({ row }) =>
      row.original.viagem ? (
        <div className="max-w-xs">
          <p className="truncate text-sm font-medium">{row.original.viagem.destino}</p>
          <p className="truncate text-xs text-muted-foreground">{row.original.viagem.clienteNome}</p>
        </div>
      ) : (
        "—"
      ),
  },
  {
    accessorKey: "fornecedor",
    header: "Fornecedor",
    cell: ({ row }) => row.original.fornecedor || "—",
  },
  {
    accessorKey: "valor",
    header: "Comissão",
    cell: ({ row }) => formatCurrency(row.original.valor),
  },
  {
    accessorKey: "dataPrevista",
    header: "Previsão",
    cell: ({ row }) => formatDate(row.original.dataPrevista),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge tone={STATUS_TONE[row.original.status]} label={STATUS_COMISSAO_LABEL[row.original.status]} />
    ),
  },
];
