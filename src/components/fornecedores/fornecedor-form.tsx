"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { Loader2, Plus, Trash2 } from "lucide-react";
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
import { TIPO_FORNECEDOR_OPTIONS } from "@/lib/constants";
import { fornecedorSchema, type FornecedorFormValues } from "@/lib/schemas/fornecedor";
import type { Fornecedor } from "@/types/entities";

interface FornecedorFormProps {
  fornecedor?: Fornecedor;
  onSubmit: (values: FornecedorFormValues) => void;
  isSubmitting?: boolean;
  onCancel: () => void;
}

export function FornecedorForm({ fornecedor, onSubmit, isSubmitting, onCancel }: FornecedorFormProps) {
  const form = useForm<FornecedorFormValues>({
    resolver: zodResolver(fornecedorSchema),
    defaultValues: {
      nome: fornecedor?.nome ?? "",
      tipo: fornecedor?.tipo ?? "outro",
      email: fornecedor?.email ?? "",
      email2: fornecedor?.email2 ?? "",
      telefone: fornecedor?.telefone ?? "",
      telefone2: fornecedor?.telefone2 ?? "",
      telefone3: fornecedor?.telefone3 ?? "",
      site: fornecedor?.site ?? "",
      cidade: fornecedor?.cidade ?? "",
      pais: fornecedor?.pais ?? "",
      descricaoServicos: fornecedor?.descricaoServicos ?? "",
      observacoes: fornecedor?.observacoes ?? "",
      contatos: fornecedor?.contatos?.map((contato) => ({
        nome: contato.nome,
        funcao: contato.funcao ?? "",
      })) ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contatos",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Nome do fornecedor" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {TIPO_FORNECEDOR_OPTIONS.map((option) => (
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

        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="(11) 99999-9999" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="telefone2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone 2</FormLabel>
                <FormControl>
                  <Input placeholder="(11) 99999-9999" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="telefone3"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone 3</FormLabel>
                <FormControl>
                  <Input placeholder="(11) 99999-9999" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="contato@fornecedor.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail 2</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="financeiro@fornecedor.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="site"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Site</FormLabel>
              <FormControl>
                <Input placeholder="https://www.fornecedor.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="cidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cidade</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pais"
            render={({ field }) => (
              <FormItem>
                <FormLabel>País</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="descricaoServicos"
          render={({ field }) => (
            <FormItem>
              <FormLabel>O que a empresa oferece</FormLabel>
              <FormControl>
                <Textarea rows={2} placeholder="Pacotes de hotel + aéreo, transfer aeroporto..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3 rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Pessoas de contato</p>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ nome: "", funcao: "" })}>
              <Plus className="h-4 w-4" />
              Adicionar contato
            </Button>
          </div>
          {fields.length === 0 ? (
            <p className="text-xs text-muted-foreground">Ex.: executiva de contas, vendedor, T.I.</p>
          ) : (
            fields.map((item, index) => (
              <div key={item.id} className="flex items-end gap-2">
                <FormField
                  control={form.control}
                  name={`contatos.${index}.nome`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs">Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da pessoa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`contatos.${index}.funcao`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-xs">Função</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex.: Executiva, Vendedor, T.I." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mb-0.5 shrink-0 text-destructive hover:text-destructive"
                  onClick={() => remove(index)}
                  aria-label="Remover contato"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
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
            {fornecedor ? "Salvar" : "Cadastrar fornecedor"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
