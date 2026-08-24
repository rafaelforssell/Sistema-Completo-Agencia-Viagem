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
  },
  {
    accessorKey: "percentual",
    header: "%",
    cell: ({ row }) => `${row.original.percentual}%`,
  },
  {
    accessorKey: "valorBruto",
    header: "Valor bruto",
    cell: ({ row }) => formatCurrency(row.original.valorBruto),
  },
  {
    accessorKey: "valorLiquido",
    header: "Valor líquido",
    cell: ({ row }) => formatCurrency(row.original.valorLiquido),
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
