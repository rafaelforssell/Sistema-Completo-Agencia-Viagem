"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { StatusBadge } from "@/components/common/status-badge";
import { TIPO_FORNECEDOR_LABEL } from "@/lib/constants";
import type { Fornecedor } from "@/types/entities";

export const fornecedorColumns: ColumnDef<Fornecedor>[] = [
  {
    accessorKey: "nome",
    header: "Nome",
    cell: ({ row }) => (
      <div>
        <p className="text-sm font-medium">{row.original.nome}</p>
        <p className="text-xs text-muted-foreground">{row.original.email || "—"}</p>
      </div>
    ),
  },
  {
    accessorKey: "tipo",
    header: "Tipo",
    cell: ({ row }) => <StatusBadge tone="info" label={TIPO_FORNECEDOR_LABEL[row.original.tipo]} />,
  },
  {
    accessorKey: "telefone",
    header: "Telefone",
    cell: ({ row }) => row.original.telefone || "—",
  },
];
