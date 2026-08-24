"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/common/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { reembolsoColumns } from "@/components/reembolsos/reembolso-columns";
import { useReembolsos } from "@/hooks/use-reembolsos";
import { useDebounce } from "@/hooks/use-debounce";
import { STATUS_REEMBOLSO_OPTIONS } from "@/lib/constants";
import type { Reembolso } from "@/types/entities";

const PAGE_SIZE = 10;

export default function ReembolsosPage() {
  const router = useRouter();
  const [pageIndex, setPageIndex] = useState(0);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("todos");
  const buscaDebounced = useDebounce(busca);

  const { data, isLoading, isPlaceholderData } = useReembolsos({
    pagina: pageIndex + 1,
    porPagina: PAGE_SIZE,
    busca: buscaDebounced || undefined,
    status: status === "todos" ? undefined : status,
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Reembolsos" description="Acompanhe todas as solicitações de reembolso." />

      <DataTableToolbar
        searchValue={busca}
        onSearchChange={(value) => {
          setBusca(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Buscar por motivo..."
        filters={
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              setPageIndex(0);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {STATUS_REEMBOLSO_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <DataTable<Reembolso, unknown>
        columns={reembolsoColumns}
        data={data?.dados ?? []}
        isLoading={isLoading && !isPlaceholderData}
        pageIndex={pageIndex}
        pageSize={PAGE_SIZE}
        pageCount={data?.totalPaginas ?? 0}
        totalItems={data?.total ?? 0}
        onPageChange={setPageIndex}
        onRowClick={(reembolso) => router.push(`/viagens/${reembolso.viagemId}`)}
        emptyTitle="Nenhum reembolso registrado"
        emptyDescription="Reembolsos solicitados em viagens aparecerão aqui."
      />
    </div>
  );
}
