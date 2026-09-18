"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CheckSquare, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import {
  useAtualizarTarefaCrm,
  useCriarTarefaCrm,
  useRemoverTarefaCrm,
  useTarefasCrm,
} from "@/hooks/use-tarefas-crm";
import { formatDate } from "@/lib/format";
import { tarefaCrmSchema, type TarefaCrmFormValues } from "@/lib/schemas/crm";
import { cn } from "@/lib/utils";

function isAtrasada(dataVencimento: string, concluida: boolean) {
  if (concluida) return false;
  return new Date(dataVencimento) < new Date(new Date().toDateString());
}

function NovaTarefaForm() {
  const criar = useCriarTarefaCrm();
  const form = useForm<TarefaCrmFormValues>({
    resolver: zodResolver(tarefaCrmSchema),
    defaultValues: { titulo: "", descricao: "", dataVencimento: "", concluida: false },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          criar.mutate(
            { ...values, concluida: values.concluida ?? false },
            { onSuccess: () => form.reset({ titulo: "", descricao: "", dataVencimento: "", concluida: false }) }
          );
        })}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <FormField
          control={form.control}
          name="titulo"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="text-xs">Tarefa</FormLabel>
              <FormControl>
                <Input placeholder="Ligar para o cliente..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dataVencimento"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Vencimento</FormLabel>
              <FormControl>
                <Input type="date" className="w-40" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={criar.isPending}>
          {criar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          <Plus className="h-4 w-4" />
          Adicionar
        </Button>
      </form>
    </Form>
  );
}

export function TarefaList() {
  const { data: tarefas, isLoading } = useTarefasCrm();
  const atualizar = useAtualizarTarefaCrm();
  const remover = useRemoverTarefaCrm();
  const [removendoId, setRemovendoId] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <NovaTarefaForm />
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando tarefas...</p>
      ) : !tarefas || tarefas.length === 0 ? (
        <EmptyState icon={CheckSquare} title="Nenhuma tarefa cadastrada" description="Crie lembretes de follow-up com cliente ou lead." />
      ) : (
        <div className="space-y-1.5">
          {tarefas.map((tarefa) => {
            const atrasada = isAtrasada(tarefa.dataVencimento, tarefa.concluida);
            return (
              <div
                key={tarefa.id}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3",
                  atrasada && "border-destructive/40 bg-destructive/5"
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Checkbox
                    checked={tarefa.concluida}
                    onCheckedChange={(checked) =>
                      atualizar.mutate({ id: tarefa.id, input: { concluida: Boolean(checked) } })
                    }
                  />
                  <div className="min-w-0">
                    <p className={cn("truncate text-sm font-medium", tarefa.concluida && "text-muted-foreground line-through")}>
                      {tarefa.titulo}
                    </p>
                    <p className="text-xs text-muted-foreground">Vence em {formatDate(tarefa.dataVencimento)}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {atrasada && <StatusBadge tone="danger" label="Atrasada" />}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setRemovendoId(tarefa.id)}
                    aria-label="Remover tarefa"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(removendoId)}
        onOpenChange={(open) => !open && setRemovendoId(null)}
        title="Remover tarefa"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Remover"
        isLoading={remover.isPending}
        onConfirm={() => {
          if (!removendoId) return;
          remover.mutate(removendoId, { onSuccess: () => setRemovendoId(null) });
        }}
      />
    </div>
  );
}
