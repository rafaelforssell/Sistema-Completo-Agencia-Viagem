"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { viagemColumns } from "@/components/viagens/viagem-columns";
import { useViagens } from "@/hooks/use-viagens";
import { useDebounce } from "@/hooks/use-debounce";
import { STATUS_VIAGEM_OPTIONS } from "@/lib/constants";
import type { Viagem } from "@/types/entities";

const PAGE_SIZE = 10;

export default function ViagensPage() {
  const router = useRouter();
  const [pageIndex, setPageIndex] = useState(0);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<string>("todas");
  const buscaDebounced = useDebounce(busca);

  const { data, isLoading, isPlaceholderData } = useViagens({
    pagina: pageIndex + 1,
    porPagina: PAGE_SIZE,
    busca: buscaDebounced || undefined,
    status: status === "todas" ? undefined : status,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Viagens"
        description="Roteiros, passageiros e status de cada viagem."
        actions={
          <Button asChild>
            <Link href="/viagens/nova">
              <Plus className="h-4 w-4" />
              Nova viagem
            </Link>
          </Button>
        }
      />

      <DataTableToolbar
        searchValue={busca}
        onSearchChange={(value) => {
          setBusca(value);
          setPageIndex(0);
        }}
        searchPlaceholder="Buscar por destino ou cliente..."
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
              <SelectItem value="todas">Todos os status</SelectItem>
              {STATUS_VIAGEM_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <DataTable<Viagem, unknown>
        columns={viagemColumns}
        data={data?.dados ?? []}
        isLoading={isLoading && !isPlaceholderData}
        pageIndex={pageIndex}
        pageSize={PAGE_SIZE}
        pageCount={data?.totalPaginas ?? 0}
        totalItems={data?.total ?? 0}
        onPageChange={setPageIndex}
        onRowClick={(viagem) => router.push(`/viagens/${viagem.id}`)}
        emptyTitle="Nenhuma viagem cadastrada"
        emptyDescription="Cadastre uma viagem vinculada a um cliente para começar."
      />
    </div>
  );
}
