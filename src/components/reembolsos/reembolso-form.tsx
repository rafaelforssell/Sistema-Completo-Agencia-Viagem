"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { STATUS_REEMBOLSO_OPTIONS } from "@/lib/constants";
import { reembolsoSchema, type ReembolsoFormValues } from "@/lib/schemas/reembolso";
import type { Pagamento, Reembolso } from "@/types/entities";

interface ReembolsoFormProps {
  reembolso?: Reembolso;
  pagamentos: Pagamento[];
  onSubmit: (values: ReembolsoFormValues) => void;
  isSubmitting?: boolean;
  onCancel: () => void;
}

export function ReembolsoForm({ reembolso, pagamentos, onSubmit, isSubmitting, onCancel }: ReembolsoFormProps) {
  const form = useForm<ReembolsoFormValues>({
    resolver: zodResolver(reembolsoSchema),
    defaultValues: {
      pagamentoId: reembolso?.pagamentoId ?? "",
      motivo: reembolso?.motivo ?? "",
      valorSolicitado: reembolso?.valorSolicitado ?? 0,
      valorAprovado: reembolso?.valorAprovado,
      status: reembolso?.status ?? "solicitado",
      dataSolicitacao: reembolso?.dataSolicitacao?.slice(0, 10) ?? "",
      dataConclusao: reembolso?.dataConclusao?.slice(0, 10) ?? "",
      observacoes: reembolso?.observacoes ?? "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {pagamentos.length > 0 && (
          <FormField
            control={form.control}
            name="pagamentoId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pagamento relacionado (opcional)</FormLabel>
                <Select value={field.value || "nenhum"} onValueChange={(v) => field.onChange(v === "nenhum" ? "" : v)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="nenhum">Nenhum</SelectItem>
                    {pagamentos.map((pagamento) => (
                      <SelectItem key={pagamento.id} value={pagamento.id}>
                        {pagamento.fornecedor} · {pagamento.valor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="motivo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Motivo</FormLabel>
              <FormControl>
                <Textarea rows={2} placeholder="Cancelamento, alteração de itinerário..." autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="valorSolicitado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor solicitado</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="valorAprovado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor aprovado</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" min="0" {...field} value={field.value ?? ""} />
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
                    {STATUS_REEMBOLSO_OPTIONS.map((option) => (
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
            name="dataSolicitacao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data da solicitação</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dataConclusao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data de conclusão</FormLabel>
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
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {reembolso ? "Salvar" : "Registrar reembolso"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
