"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Plus, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import {
  useAdicionarMovimentoCarteira,
  useCarteiraFornecedor,
  useRemoverMovimentoCarteira,
} from "@/hooks/use-carteira";
import { formatCurrency, formatDate } from "@/lib/format";

const movimentoSchema = z.object({
  tipo: z.enum(["credito", "debito"]),
  valor: z.number().positive("Informe um valor válido."),
  descricao: z.string().optional().or(z.literal("")),
  data: z.string().min(1, "Informe a data."),
});

type MovimentoFormValues = z.infer<typeof movimentoSchema>;

export function CarteiraTab({ fornecedorId }: { fornecedorId: string }) {
  const { data, isLoading } = useCarteiraFornecedor(fornecedorId);
  const adicionar = useAdicionarMovimentoCarteira(fornecedorId);
  const remover = useRemoverMovimentoCarteira(fornecedorId);

  const form = useForm<MovimentoFormValues>({
    resolver: zodResolver(movimentoSchema),
    defaultValues: {
      tipo: "debito",
      valor: 0,
      descricao: "",
      data: new Date().toISOString().slice(0, 10),
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Saldo atual</span>
        </div>
        <span className="font-display text-xl font-semibold">
          {isLoading ? "—" : formatCurrency(data?.saldo ?? 0)}
        </span>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => {
            adicionar.mutate(values, { onSuccess: () => form.reset({ ...values, valor: 0, descricao: "" }) });
          })}
          className="space-y-3 rounded-lg border border-border p-3"
        >
          <p className="text-sm font-medium">Registrar uso ou ajuste manual</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Tipo</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="debito">Uso da carteira (débito)</SelectItem>
                      <SelectItem value="credito">Crédito manual</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="valor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Valor</FormLabel>
                  <FormControl>
                    <CurrencyInput {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="data"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Data</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Descrição</FormLabel>
                <FormControl>
                  <Input placeholder="Ex.: usado na compra do transfer do pedido PED-000045" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={adicionar.isPending}>
              {adicionar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <Plus className="h-4 w-4" />
              Registrar
            </Button>
          </div>
        </form>
      </Form>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : !data || data.movimentos.length === 0 ? (
        <EmptyState icon={Wallet} title="Nenhum movimento ainda" description="Créditos de reembolsos e usos manuais aparecerão aqui." />
      ) : (
        <div className="space-y-1.5">
          {data.movimentos.map((movimento) => (
            <div
              key={movimento.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={movimento.tipo === "credito" ? "text-sm font-medium text-success" : "text-sm font-medium text-destructive"}>
                    {movimento.tipo === "credito" ? "+" : "-"} {formatCurrency(movimento.valor)}
                  </span>
                  {movimento.origem === "reembolso" && <StatusBadge tone="info" label="Reembolso" />}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {movimento.descricao || "—"} · {formatDate(movimento.data)}
                </p>
              </div>
              {movimento.origem === "manual" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                  onClick={() => remover.mutate(movimento.id)}
                  aria-label="Remover movimento"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
