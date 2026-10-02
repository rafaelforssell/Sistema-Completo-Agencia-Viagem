"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, type Resolver, type UseFormReturn } from "react-hook-form";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyInput } from "@/components/ui/currency-input";
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
import { PassageiroCampos } from "@/components/viagens/passageiro-campos";
import { TrechosFields } from "@/components/viagens/trechos-fields";
import {
  NumerosPedidoExtrasFields,
  VendaItensFields,
  type VendaItensShape,
} from "@/components/vendas/venda-itens-fields";
import { useCliente } from "@/hooks/use-clientes";
import { STATUS_VIAGEM_OPTIONS } from "@/lib/constants";
import {
  viagemCriacaoSchema,
  viagemEdicaoSchema,
  type PassageiroFormValues,
  type TrechoFormValues,
  type ViagemFormValues,
} from "@/lib/schemas/viagem";
import type { Cliente, PassageiroInput, Viagem, ViagemInput } from "@/types/entities";

interface ViagemFormProps {
  viagem?: Viagem;
  clienteFixo?: { id: string; nome: string };
  onSubmit: (values: ViagemInput) => void;
  isSubmitting?: boolean;
  onCancel?: () => void;
}

function hojeISO() {
  const agora = new Date();
  return new Date(agora.getTime() - agora.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function passageiroDoCliente(cliente: Cliente): PassageiroInput {
  return {
    nome: cliente.nome,
    parentesco: "Titular",
    email: cliente.email ?? "",
    telefone: cliente.telefone ? `${cliente.telefoneDdi ?? ""} ${cliente.telefone}`.trim() : "",
    dataNascimento: cliente.dataNascimento?.slice(0, 10) ?? "",
    numeroPassaporte: cliente.numeroPassaporte ?? "",
    validadePassaporte: cliente.validadePassaporte?.slice(0, 10) ?? "",
    numeroBilhete: "",
  };
}

// Data de ida = partida do 1º trecho de ida; data de volta = partida do
// último trecho de volta; companhia e destino vêm dos trechos de ida.
function derivarDosTrechos(trechos: TrechoFormValues[]) {
  const ida = trechos.filter((t) => t.sentido === "ida");
  const volta = trechos.filter((t) => t.sentido === "volta");
  return {
    dataIda: ida[0]?.partidaPrevista?.slice(0, 10),
    dataVolta: volta.at(-1)?.partidaPrevista?.slice(0, 10),
    companhiaAerea: trechos.find((t) => t.companhia)?.companhia,
    destino: ida.at(-1)?.destinoAeroporto,
  };
}

export function ViagemForm({ viagem, clienteFixo, onSubmit, isSubmitting, onCancel }: ViagemFormProps) {
  const criando = !viagem;
  const form = useForm<ViagemFormValues>({
    resolver: (criando
      ? zodResolver(viagemCriacaoSchema)
      : zodResolver(viagemEdicaoSchema)) as Resolver<ViagemFormValues>,
    defaultValues: {
      clienteId: viagem?.clienteId ?? clienteFixo?.id ?? "",
      destino: viagem?.destino ?? "",
      dataIda: viagem?.dataIda?.slice(0, 10) ?? "",
      dataVolta: viagem?.dataVolta?.slice(0, 10) ?? "",
      companhiaAerea: viagem?.companhiaAerea ?? "",
      localizador: viagem?.localizador ?? "",
      status: viagem?.status ?? "orcamento",
      observacoes: viagem?.observacoes ?? "",
      trechos:
        viagem?.trechos?.map((t) => ({
          sentido: t.sentido,
          numeroVoo: t.numeroVoo ?? "",
          companhia: t.companhia ?? "",
          origemIata: t.origemIata ?? "",
          origemAeroporto: t.origemAeroporto ?? "",
          destinoIata: t.destinoIata ?? "",
          destinoAeroporto: t.destinoAeroporto ?? "",
          partidaPrevista: t.partidaPrevista?.slice(0, 16) ?? "",
          chegadaPrevista: t.chegadaPrevista?.slice(0, 16) ?? "",
          terminalPartida: t.terminalPartida ?? "",
          terminalChegada: t.terminalChegada ?? "",
          aeronave: t.aeronave ?? "",
          classe: t.classe ?? "",
          bagagem: t.bagagem ?? "",
        })) ?? [],
      comissaoValor: viagem?.comissao?.valor ?? 0,
      comissaoFornecedor: viagem?.comissao?.fornecedor ?? "",
      incluirCliente: true,
      passageiros: [],
      dataVenda: hojeISO(),
      vendaObservacoes: "",
      itens: criando
        ? [{ tipo: "viagem", fornecedorId: "", descricao: "", valor: 0, dataAluguel: "", seguroCompleto: false }]
        : [],
      numeroPedidoExtras: [],
    },
  });

  // Mudou um trecho → atualiza datas/companhia/destino. Só reage a edições
  // do usuário (não ao carregar), e o destino só é preenchido se vazio.
  useEffect(() => {
    const assinatura = form.watch((valores, { name }) => {
      if (!name?.startsWith("trechos")) return;
      const derivado = derivarDosTrechos((valores.trechos ?? []) as TrechoFormValues[]);
      const opcoes = { shouldDirty: true, shouldValidate: form.formState.isSubmitted };
      if (derivado.dataIda && derivado.dataIda !== valores.dataIda) form.setValue("dataIda", derivado.dataIda, opcoes);
      if (derivado.dataVolta && derivado.dataVolta !== valores.dataVolta) form.setValue("dataVolta", derivado.dataVolta, opcoes);
      if (derivado.companhiaAerea && !valores.companhiaAerea) form.setValue("companhiaAerea", derivado.companhiaAerea, opcoes);
      if (derivado.destino && !valores.destino) form.setValue("destino", derivado.destino, opcoes);
    });
    return () => assinatura.unsubscribe();
  }, [form]);

  const clienteId = form.watch("clienteId");
  const incluirCliente = form.watch("incluirCliente");
  const { data: clienteSelecionado } = useCliente(criando && incluirCliente ? clienteId || undefined : undefined);

  function handleSubmit(valores: ViagemFormValues) {
    const base = {
      clienteId: valores.clienteId,
      destino: valores.destino,
      dataIda: valores.dataIda,
      dataVolta: valores.dataVolta,
      companhiaAerea: valores.companhiaAerea,
      localizador: valores.localizador,
      status: valores.status,
      observacoes: valores.observacoes,
      trechos: valores.trechos,
      comissao: { valor: Number(valores.comissaoValor) || 0, fornecedor: valores.comissaoFornecedor },
    };

    if (!criando) {
      onSubmit(base);
      return;
    }

    const passageiros: PassageiroInput[] = [
      ...(valores.incluirCliente && clienteSelecionado ? [passageiroDoCliente(clienteSelecionado)] : []),
      ...valores.passageiros,
    ];

    onSubmit({
      ...base,
      passageiros,
      venda: {
        dataVenda: valores.dataVenda,
        observacoes: valores.vendaObservacoes,
        itens: valores.itens,
        numeroPedidoExtras: valores.numeroPedidoExtras ?? [],
      },
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Secao titulo="Dados da viagem">
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

          <div className="grid gap-5 sm:grid-cols-2">
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
        </Secao>

        <TrechosFields form={form} />

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
            name="localizador"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Localizador da reserva</FormLabel>
                <FormControl>
                  <Input placeholder="Ex.: ABC123" className="uppercase" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {criando && (
          <PassageirosFields form={form} nomeCliente={clienteSelecionado?.nome ?? clienteFixo?.nome} />
        )}

        {criando && (
          <Secao
            titulo="Venda"
            descricao="A venda é criada automaticamente junto com a viagem e aparece em Vendas."
          >
            <FormField
              control={form.control}
              name="dataVenda"
              render={({ field }) => (
                <FormItem className="max-w-xs">
                  <FormLabel>Data da venda</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <VendaItensFields form={form as unknown as UseFormReturn<VendaItensShape>} />
            <NumerosPedidoExtrasFields form={form as unknown as UseFormReturn<VendaItensShape>} />
            <FormField
              control={form.control}
              name="vendaObservacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações da venda</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Secao>
        )}

        <Secao titulo="Comissão">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="comissaoValor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor da comissão</FormLabel>
                  <FormControl>
                    <CurrencyInput {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="comissaoFornecedor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fornecedor (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Operadora, companhia..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Secao>

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

function Secao({ titulo, descricao, children }: { titulo: string; descricao?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{titulo}</h3>
        {descricao && <p className="text-xs text-muted-foreground">{descricao}</p>}
      </div>
      {children}
    </section>
  );
}

function PassageirosFields({ form, nomeCliente }: { form: UseFormReturn<ViagemFormValues>; nomeCliente?: string }) {
  const passageiros = useFieldArray({ control: form.control, name: "passageiros" });

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium">Passageiros</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            passageiros.append({
              nome: "",
              parentesco: "",
              email: "",
              telefone: "",
              dataNascimento: "",
              numeroPassaporte: "",
              validadePassaporte: "",
              numeroBilhete: "",
            })
          }
        >
          <Plus className="h-4 w-4" />
          Adicionar passageiro
        </Button>
      </div>

      <FormField
        control={form.control}
        name="incluirCliente"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center gap-2 space-y-0">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
            </FormControl>
            <FormLabel className="font-normal">
              Incluir o cliente{nomeCliente ? ` (${nomeCliente})` : ""} como passageiro
            </FormLabel>
          </FormItem>
        )}
      />

      {passageiros.fields.map((passageiro, index) => (
        <div key={passageiro.id} className="space-y-3 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Passageiro {index + 1}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => passageiros.remove(index)}
              aria-label="Remover passageiro"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <PassageiroCampos
            form={form as unknown as UseFormReturn<PassageiroFormValues>}
            prefixo={`passageiros.${index}.`}
          />
        </div>
      ))}
    </div>
  );
}
