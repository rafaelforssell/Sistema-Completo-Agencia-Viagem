"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";
import { ViagemForm } from "@/components/viagens/viagem-form";
import { useCriarViagem } from "@/hooks/use-viagens";
import type { ViagemInput } from "@/types/entities";

export default function NovaViagemPage() {
  const router = useRouter();
  const criarViagem = useCriarViagem();

  function handleSubmit(values: ViagemInput) {
    criarViagem.mutate(values, {
      onSuccess: (viagem) => router.push(`/viagens/${viagem.id}`),
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Nova viagem" description="Voos, passageiros, venda e comissão — tudo em um só cadastro." />
      <Card>
        <CardContent className="pt-6">
          <ViagemForm
            duasColunas
            onSubmit={handleSubmit}
            isSubmitting={criarViagem.isPending}
            onCancel={() => router.back()}
          />
        </CardContent>
      </Card>
    </div>
  );
}
