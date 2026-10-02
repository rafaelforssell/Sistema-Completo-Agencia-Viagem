"use client";

import { useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { ViagemResumo } from "@/components/viagens/viagem-resumo";
import { useViagemResumo } from "@/hooks/use-viagens";

// Versão de página inteira do resumo — aberta em outra aba pelo botão
// "Imprimir / PDF". Com ?imprimir=1, abre a janela de impressão assim que os
// dados carregam (dali o usuário também pode salvar em PDF).
export default function ViagemResumoPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { data } = useViagemResumo(params.id);
  const imprimir = searchParams.get("imprimir") === "1";

  useEffect(() => {
    if (!imprimir || !data) return;
    const timer = setTimeout(() => window.print(), 300);
    return () => clearTimeout(timer);
  }, [imprimir, data]);

  return (
    <div className="mx-auto max-w-4xl">
      <ViagemResumo viagemId={params.id} acoes={!imprimir} />
    </div>
  );
}
