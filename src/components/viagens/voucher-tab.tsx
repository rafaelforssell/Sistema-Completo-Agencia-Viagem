"use client";

import { Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGerarVoucher } from "@/hooks/use-viagens";

export function VoucherTab({ viagemId }: { viagemId: string }) {
  const gerarVoucher = useGerarVoucher(viagemId);

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FileText className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Voucher da viagem</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Gere o voucher em PDF com os dados do cliente, família, itinerário e pagamento.
            O documento é montado pelo servidor a partir dos dados cadastrados.
          </p>
        </div>

        {gerarVoucher.data?.url ? (
          <Button asChild>
            <a href={gerarVoucher.data.url} target="_blank" rel="noopener noreferrer" download>
              <Download className="h-4 w-4" />
              Baixar voucher gerado
            </a>
          </Button>
        ) : (
          <Button onClick={() => gerarVoucher.mutate()} disabled={gerarVoucher.isPending}>
            {gerarVoucher.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Gerar voucher em PDF
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
