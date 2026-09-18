"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, MessageSquare, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ClienteCombobox } from "@/components/clientes/cliente-combobox";
import { LeadCombobox } from "@/components/crm/lead-combobox";
import { EmptyState } from "@/components/common/empty-state";
import { useCriarInteracaoCrm, useInteracoesCrm, useRemoverInteracaoCrm } from "@/hooks/use-interacoes-crm";
import { TIPO_INTERACAO_CRM_LABEL, TIPO_INTERACAO_CRM_OPTIONS } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { interacaoCrmSchema, type InteracaoCrmFormValues } from "@/lib/schemas/crm";

type Assunto = "cliente" | "lead";

function NovaInteracaoForm({
  leadId,
  clienteId,
  onSuccess,
}: {
  leadId?: string;
  clienteId?: string;
  onSuccess: () => void;
}) {
  const criar = useCriarInteracaoCrm();
  const form = useForm<InteracaoCrmFormValues>({
    resolver: zodResolver(interacaoCrmSchema),
    defaultValues: {
      leadId: leadId ?? "",
      clienteId: clienteId ?? "",
      tipo: "nota",
      descricao: "",
      data: new Date().toISOString().slice(0, 10),
    },
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((values) => {
          criar.mutate(values, {
            onSuccess: () => {
              form.reset({ ...values, descricao: "" });
              onSuccess();
            },
          });
        })}
        className="space-y-3"
      >
        <div className="grid gap-3 sm:grid-cols-2">
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
                    {TIPO_INTERACAO_CRM_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <input
                    type="date"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    {...field}
                  />
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
                <Textarea rows={2} placeholder="O que foi conversado..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={criar.isPending}>
            {criar.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <Plus className="h-4 w-4" />
            Registrar interação
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function InteracaoTimeline() {
  const [assunto, setAssunto] = useState<Assunto>("cliente");
  const [selecionadoId, setSelecionadoId] = useState<string>("");

  const leadId = assunto === "lead" ? selecionadoId : undefined;
  const clienteId = assunto === "cliente" ? selecionadoId : undefined;

  const { data: interacoes, isLoading } = useInteracoesCrm({ leadId, clienteId });
  const remover = useRemoverInteracaoCrm();

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
        <Select
          value={assunto}
          onValueChange={(v) => {
            setAssunto(v as Assunto);
            setSelecionadoId("");
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cliente">Cliente</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
          </SelectContent>
        </Select>
        {assunto === "cliente" ? (
          <ClienteCombobox value={selecionadoId} onChange={(id) => setSelecionadoId(id)} />
        ) : (
          <LeadCombobox value={selecionadoId} onChange={(id) => setSelecionadoId(id)} />
        )}
      </div>

      {!selecionadoId ? (
        <EmptyState
          icon={MessageSquare}
          title="Selecione um cliente ou lead"
          description="Escolha quem você quer ver o histórico de interações."
        />
      ) : (
        <>
          <Card>
            <CardContent className="pt-6">
              <NovaInteracaoForm leadId={leadId} clienteId={clienteId} onSuccess={() => {}} />
            </CardContent>
          </Card>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : !interacoes || interacoes.length === 0 ? (
            <EmptyState icon={MessageSquare} title="Nenhuma interação registrada" description="O histórico aparecerá aqui." />
          ) : (
            <div className="space-y-1.5">
              {interacoes.map((interacao) => (
                <div
                  key={interacao.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{TIPO_INTERACAO_CRM_LABEL[interacao.tipo]}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(interacao.data)}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{interacao.descricao}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                    onClick={() => remover.mutate(interacao.id)}
                    aria-label="Remover interação"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
