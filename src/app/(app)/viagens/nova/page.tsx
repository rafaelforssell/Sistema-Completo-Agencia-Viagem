"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/common/page-header";
import { ViagemForm } from "@/components/viagens/viagem-form";
import { useCriarViagem } from "@/hooks/use-viagens";
import type { ViagemFormValues } from "@/lib/schemas/viagem";

export default function NovaViagemPage() {
  const router = useRouter();
  const criarViagem = useCriarViagem();

  function handleSubmit(values: ViagemFormValues) {
    criarViagem.mutate(values, {
      onSuccess: (viagem) => router.push(`/viagens/${viagem.id}`),
    });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Nova viagem" description="Vincule a viagem a um cliente principal." />
      <Card>
        <CardContent className="pt-6">
          <ViagemForm
            onSubmit={handleSubmit}
            isSubmitting={criarViagem.isPending}
            onCancel={() => router.back()}
          />
        </CardContent>
      </Card>
    </div>
  );
}
