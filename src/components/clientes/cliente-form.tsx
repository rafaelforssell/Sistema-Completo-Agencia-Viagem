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
import { DdiSelect } from "@/components/common/ddi-select";
import { CepInput } from "@/components/ui/cep-input";
import { CpfInput } from "@/components/ui/cpf-input";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCepLookup } from "@/hooks/use-cep-lookup";
import { clienteSchema, type ClienteFormValues } from "@/lib/schemas/cliente";
import type { Cliente } from "@/types/entities";

interface ClienteFormProps {
  cliente?: Cliente;
  onSubmit: (values: ClienteFormValues) => void;
  isSubmitting?: boolean;
  onCancel?: () => void;
}

export function ClienteForm({ cliente, onSubmit, isSubmitting, onCancel }: ClienteFormProps) {
  const { buscarCep, isLoading: isBuscandoCep } = useCepLookup();
  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: cliente?.nome ?? "",
      email: cliente?.email ?? "",
      telefone: cliente?.telefone ?? "",
      telefoneDdi: cliente?.telefoneDdi ?? "+55",
      dataNascimento: cliente?.dataNascimento?.slice(0, 10) ?? "",
      numeroPassaporte: cliente?.numeroPassaporte ?? "",
      validadePassaporte: cliente?.validadePassaporte?.slice(0, 10) ?? "",
      rg: cliente?.rg ?? "",
      cpf: cliente?.cpf ?? "",
      cep: cliente?.cep ?? "",
      logradouro: cliente?.logradouro ?? "",
      numero: cliente?.numero ?? "",
      complemento: cliente?.complemento ?? "",
      bairro: cliente?.bairro ?? "",
      cidade: cliente?.cidade ?? "",
      estado: cliente?.estado ?? "",
      observacoes: cliente?.observacoes ?? "",
    },
  });

  async function handleCepBlur(cep: string) {
    const endereco = await buscarCep(cep);
    if (!endereco) return;
    form.setValue("logradouro", endereco.logradouro, { shouldDirty: true });
    form.setValue("bairro", endereco.bairro, { shouldDirty: true });
    form.setValue("cidade", endereco.cidade, { shouldDirty: true });
    form.setValue("estado", endereco.estado, { shouldDirty: true });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome completo</FormLabel>
              <FormControl>
                <Input placeholder="Maria da Silva" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="maria@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="telefone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <div className="flex gap-2">
                  <FormField
                    control={form.control}
                    name="telefoneDdi"
                    render={({ field: ddiField }) => (
                      <DdiSelect value={ddiField.value} onChange={ddiField.onChange} />
                    )}
                  />
                  <FormControl>
                    <Input placeholder="11 99999-9999" {...field} />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="dataNascimento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de nascimento</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="numeroPassaporte"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número do passaporte</FormLabel>
                <FormControl>
                  <Input placeholder="FZ123456" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="validadePassaporte"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Validade do passaporte</FormLabel>
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
            name="rg"
            render={({ field }) => (
              <FormItem>
                <FormLabel>RG</FormLabel>
                <FormControl>
                  <Input placeholder="00.000.000-0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF</FormLabel>
                <FormControl>
                  <CpfInput {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-5 rounded-lg border border-border p-4">
          <p className="text-sm font-medium">Endereço</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="cep"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP {isBuscandoCep && "(buscando...)"}</FormLabel>
                  <FormControl>
                    <CepInput
                      {...field}
                      onBlur={(event) => {
                        field.onBlur();
                        void handleCepBlur(event.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="logradouro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logradouro</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, avenida..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="numero"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número</FormLabel>
                  <FormControl>
                    <Input placeholder="123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="complemento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complemento</FormLabel>
                  <FormControl>
                    <Input placeholder="Apto, bloco..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bairro"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bairro</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
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
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <FormControl>
                    <Input placeholder="UF" maxLength={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Preferências, restrições, contexto relevante..." {...field} />
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
            {cliente ? "Salvar alterações" : "Cadastrar cliente"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
