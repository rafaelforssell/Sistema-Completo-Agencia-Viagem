"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/common/status-badge";
import { daysUntil, formatDate, initials } from "@/lib/format";
import type { Cliente } from "@/types/entities";

export const clienteColumns: ColumnDef<Cliente>[] = [
  {
    accessorKey: "nome",
    header: "Cliente",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10 text-xs text-primary">
            {initials(row.original.nome)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{row.original.nome}</p>
          <p className="truncate text-xs text-muted-foreground">{row.original.email || "—"}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "telefone",
    header: "Telefone",
    cell: ({ row }) => row.original.telefone || "—",
  },
  {
    accessorKey: "dataNascimento",
    header: "Nascimento",
    cell: ({ row }) => formatDate(row.original.dataNascimento),
  },
  {
    accessorKey: "validadePassaporte",
    header: "Passaporte",
    cell: ({ row }) => {
      const dias = daysUntil(row.original.validadePassaporte);
      if (dias === null) return "—";
      const vencendo = dias <= 180;
      return (
        <div className="flex items-center gap-1.5">
          <span>{formatDate(row.original.validadePassaporte)}</span>
          {vencendo && (
            <StatusBadge
              tone={dias < 0 ? "danger" : dias <= 30 ? "danger" : "warning"}
              label={dias < 0 ? "Vencido" : `${dias}d`}
              className="gap-1 px-1.5"
            />
          )}
        </div>
      );
    },
  },
];
