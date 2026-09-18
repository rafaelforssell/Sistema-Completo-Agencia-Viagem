"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClienteCombobox } from "@/components/clientes/cliente-combobox";
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
import { Textarea } from "@/components/ui/textarea";
import { VooResultadoCard } from "@/components/viagens/voo-resultado-card";
import { useBuscarVoo } from "@/hooks/use-integracoes";
import { STATUS_VIAGEM_OPTIONS } from "@/lib/constants";
import { viagemSchema, type ViagemFormValues } from "@/lib/schemas/viagem";
import type { Viagem } from "@/types/entities";

interface ViagemFormProps {
  viagem?: Viagem;
  clienteFixo?: { id: string; nome: string };
  onSubmit: (values: ViagemFormValues) => void;
  isSubmitting?: boolean;
  onCancel?: () => void;
}

export function ViagemForm({ viagem, clienteFixo, onSubmit, isSubmitting, onCancel }: ViagemFormProps) {
  const [numeroVoo, setNumeroVoo] = useState("");
  const buscarVoo = useBuscarVoo();
  const form = useForm<ViagemFormValues>({
    resolver: zodResolver(viagemSchema),
    defaultValues: {
      clienteId: viagem?.clienteId ?? clienteFixo?.id ?? "",
      destino: viagem?.destino ?? "",
      dataIda: viagem?.dataIda?.slice(0, 10) ?? "",
      dataVolta: viagem?.dataVolta?.slice(0, 10) ?? "",
      companhiaAerea: viagem?.companhiaAerea ?? "",
      status: viagem?.status ?? "orcamento",
      observacoes: viagem?.observacoes ?? "",
    },
  });

  function handleBuscarVoo() {
    if (!numeroVoo.trim()) return;
    buscarVoo.mutate(numeroVoo.trim(), {
      onSuccess: (dados) => {
        form.setValue("companhiaAerea", dados.companhiaAerea, { shouldDirty: true });
        form.setValue("destino", dados.aeroportoDestino, { shouldDirty: true });
        form.setValue("dataIda", dados.dataIda, { shouldDirty: true });
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {!viagem && (
          <div className="space-y-2 rounded-lg border border-border p-3">
            <p className="text-sm font-medium">Buscar por número do voo (opcional)</p>
            <div className="flex gap-2">
              <Input
                placeholder="Ex.: LA3400"
                value={numeroVoo}
                onChange={(e) => setNumeroVoo(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleBuscarVoo();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleBuscarVoo} disabled={buscarVoo.isPending}>
                {buscarVoo.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Buscar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Preenche companhia aérea, destino e data de ida automaticamente — revise antes de salvar.
            </p>
            {buscarVoo.data && <VooResultadoCard dados={buscarVoo.data} />}
          </div>
        )}

        <FormField
          control={form.control}
          name="clienteId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente principal</FormLabel>
              <FormControl>
                {clienteFixo ? (
                  <Input value={clienteFixo.nome} disabled />
                ) : (
                  <ClienteCombobox value={field.value} onChange={(id) => field.onChange(id)} />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="destino"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Destino</FormLabel>
              <FormControl>
                <Input placeholder="Lisboa, Portugal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="dataIda"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de ida</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dataVolta"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de volta</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="companhiaAerea"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Companhia aérea</FormLabel>
                <FormControl>
                  <Input placeholder="TAP, LATAM..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STATUS_VIAGEM_OPTIONS.map((option) => (
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
        </div>

        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Roteiro, hospedagem, detalhes relevantes..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-1">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {viagem ? "Salvar alterações" : "Cadastrar viagem"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
