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
