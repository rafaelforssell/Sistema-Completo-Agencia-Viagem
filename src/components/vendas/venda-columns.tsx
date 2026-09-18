"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusBadge, type StatusTone } from "@/components/common/status-badge";
import { STATUS_VENDA_LABEL, TIPO_VENDA_LABEL } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import type { StatusVenda, Venda } from "@/types/entities";

const STATUS_TONE: Record<StatusVenda, StatusTone> = {
  orcamento: "neutral",
  confirmada: "success",
  cancelada: "danger",
};

export const vendaColumns: ColumnDef<Venda>[] = [
  {
    accessorKey: "numeroPedido",
    header: "Pedido",
    cell: ({ row }) => (
      <div>
        <p className="text-sm font-medium">{row.original.numeroPedido}</p>
        <p className="truncate text-xs text-muted-foreground">
          {row.original.itens.map((item) => TIPO_VENDA_LABEL[item.tipo]).join(", ") || "—"}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "valorTotal",
    header: "Valor total",
    cell: ({ row }) => formatCurrency(row.original.valorTotal),
  },
  {
    accessorKey: "dataVenda",
    header: "Data",
    cell: ({ row }) => formatDate(row.original.dataVenda),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge tone={STATUS_TONE[row.original.status]} label={STATUS_VENDA_LABEL[row.original.status]} />
    ),
  },
];
