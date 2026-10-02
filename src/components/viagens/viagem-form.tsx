"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useFieldArray,
  useForm,
  type FieldErrors,
  type Path,
  type Resolver,
  type UseFormReturn,
} from "react-hook-form";
import { ArrowLeft, ArrowRight, Check, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CurrencyInput } from "@/components/ui/currency-input";
import { ClienteCombobox } from "@/components/clientes/cliente-combobox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PASSAGEIRO_VAZIO, PassageiroCampos, passageiroParaFormulario } from "@/components/viagens/passageiro-campos";
import { TrechosFields } from "@/components/viagens/trechos-fields";
import { Itinerario } from "@/components/viagens/viagem-resumo";
import {
  NumerosPedidoExtrasFields,
  VendaItensFields,
  type VendaItensShape,
} from "@/components/vendas/venda-itens-fields";
import { useCliente } from "@/hooks/use-clientes";
import { STATUS_VIAGEM_LABEL, STATUS_VIAGEM_OPTIONS, TIPO_VENDA_LABEL } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
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
  // Página inteira (Nova viagem): o rodapé com os botões fica sobre o card.
  paginaInteira?: boolean;
}

// Etapas do cadastro de uma viagem nova. Cada uma ocupa a tela inteira e só
// os campos dela são validados ao avançar.
const ETAPAS = [
  { id: "dados", titulo: "Dados", campos: ["clienteId", "destino", "status", "localizador"] },
  { id: "voos", titulo: "Voos", campos: ["trechos", "dataIda", "dataVolta", "companhiaAerea"] },
  { id: "passageiros", titulo: "Passageiros", campos: ["incluirCliente", "passageiros"] },
  { id: "venda", titulo: "Venda", campos: ["dataVenda", "itens", "numeroPedidoExtras", "vendaObservacoes"] },
  { id: "revisao", titulo: "Comissão e revisão", campos: ["comissaoValor", "comissaoFornecedor", "observacoes"] },
] as const satisfies readonly { id: string; titulo: string; campos: readonly Path<ViagemFormValues>[] }[];

function hojeISO() {
  const agora = new Date();
  return new Date(agora.getTime() - agora.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function passageiroDoCliente(cliente: Cliente): PassageiroInput {
  return { ...passageiroParaFormulario(cliente), parentesco: "Titular" };
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

export function ViagemForm({ viagem, clienteFixo, onSubmit, isSubmitting, onCancel, paginaInteira }: ViagemFormProps) {
  const criando = !viagem;
  const [etapa, setEtapa] = useState(0);
  const [etapaMaxima, setEtapaMaxima] = useState(0);

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
      if (derivado.dataVolta && derivado.dataVolta !== valores.dataVolta)
        form.setValue("dataVolta", derivado.dataVolta, opcoes);
      if (derivado.companhiaAerea && !valores.companhiaAerea)
        form.setValue("companhiaAerea", derivado.companhiaAerea, opcoes);
      if (derivado.destino && !valores.destino) form.setValue("destino", derivado.destino, opcoes);
    });
    return () => assinatura.unsubscribe();
  }, [form]);

  const clienteId = form.watch("clienteId");
  const incluirCliente = form.watch("incluirCliente");
  const { data: clienteSelecionado } = useCliente(criando && incluirCliente ? clienteId || undefined : undefined);
  const nomeCliente = clienteSelecionado?.nome ?? clienteFixo?.nome;

  function enviar(valores: ViagemFormValues) {
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

  // Se algo de uma etapa anterior estiver inválido no envio final, volta pra ela.
  function aoFalharEnvio(erros: FieldErrors<ViagemFormValues>) {
    const comErro = ETAPAS.findIndex((e) => e.campos.some((campo) => campo in erros));
    if (comErro >= 0) setEtapa(comErro);
  }

  async function avancar() {
    const valido = await form.trigger([...ETAPAS[etapa].campos]);
    if (!valido) return;
    const proxima = etapa + 1;
    setEtapa(proxima);
    setEtapaMaxima((maxima) => Math.max(maxima, proxima));
  }

  const ultimaEtapa = etapa === ETAPAS.length - 1;

  // Enter num campo não envia o cadastro no meio das etapas: avança.
  function handleFormSubmit(evento: React.FormEvent<HTMLFormElement>) {
    if (criando && !ultimaEtapa) {
      evento.preventDefault();
      void avancar();
      return;
    }
    void form.handleSubmit(enviar, aoFalharEnvio)(evento);
  }

  const secaoDados = (
    <Secao titulo="Dados da viagem">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <FormField
          control={form.control}
          name="clienteId"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
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
            <FormItem className="sm:col-span-2">
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
        <FormField
          control={form.control}
          name="localizador"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Localizador</FormLabel>
              <FormControl>
                <Input placeholder="Ex.: ABC123" className="uppercase" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Secao>
  );

  const secaoVoos = (
    <div className="space-y-5">
      <TrechosFields form={form} />
      <div className="grid gap-5 sm:grid-cols-3">
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
      </div>
      <p className="text-xs text-muted-foreground">
        Datas e companhia são preenchidas automaticamente a partir dos voos — dá para ajustar à mão.
      </p>
    </div>
  );

  const secaoVenda = (
    <Secao titulo="O que o cliente fechou?" descricao="A venda é criada junto com a viagem e aparece em Vendas.">
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
      <VendaItensFields form={form as unknown as UseFormReturn<VendaItensShape>} titulo="Itens da venda" />
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
  );

  const secaoComissao = (
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
  );

  const secaoObservacoes = (
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
  );

  const rodapeClasse = cn(
    "flex flex-wrap items-center justify-between gap-2 pt-1",
    "sticky bottom-0 z-10 -mx-6 border-t border-border px-6 py-3",
    paginaInteira ? "bg-card" : "bg-background"
  );

  // Edição: passageiros e venda têm abas próprias, então tudo cabe numa tela.
  if (!criando) {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(enviar)} className="space-y-6">
          {secaoDados}
          {secaoVoos}
          {secaoComissao}
          {secaoObservacoes}
          <div className={rodapeClasse}>
            <span />
            <div className="flex gap-2">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancelar
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar alterações
              </Button>
            </div>
          </div>
        </form>
      </Form>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <Etapas atual={etapa} maxima={etapaMaxima} onSelecionar={setEtapa} />

        <div className="min-h-[50vh]">
          {etapa === 0 && secaoDados}
          {etapa === 1 && secaoVoos}
          {etapa === 2 && <PassageirosFields form={form} nomeCliente={nomeCliente} />}
          {etapa === 3 && secaoVenda}
          {etapa === 4 && (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                {secaoComissao}
                {secaoObservacoes}
              </div>
              <Revisao valores={form.getValues()} nomeCliente={nomeCliente} clienteSelecionado={clienteSelecionado} />
            </div>
          )}
        </div>

        <div className={rodapeClasse}>
          <div>
            {etapa > 0 && (
              <Button type="button" variant="outline" onClick={() => setEtapa(etapa - 1)}>
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              Etapa {etapa + 1} de {ETAPAS.length}
            </span>
            {onCancel && (
              <Button type="button" variant="ghost" onClick={onCancel}>
                Cancelar
              </Button>
            )}
            {ultimaEtapa ? (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Cadastrar viagem
              </Button>
            ) : (
              <Button type="button" onClick={() => void avancar()}>
                Próximo: {ETAPAS[etapa + 1].titulo.toLowerCase()}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}

// Barra de progresso. Etapas já visitadas podem ser reabertas com um clique.
function Etapas({
  atual,
  maxima,
  onSelecionar,
}: {
  atual: number;
  maxima: number;
  onSelecionar: (indice: number) => void;
}) {
  return (
    <ol className="flex flex-wrap items-center gap-2">
      {ETAPAS.map((etapa, i) => {
        const feita = i < atual || (i <= maxima && i !== atual);
        const clicavel = i <= maxima && i !== atual;
        return (
          <li key={etapa.id} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              disabled={!clicavel}
              onClick={() => onSelecionar(i)}
              aria-current={i === atual ? "step" : undefined}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap rounded-md text-sm",
                i === atual ? "font-medium text-foreground" : "text-muted-foreground",
                clicavel && "hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs",
                  i === atual && "border-primary bg-primary text-primary-foreground",
                  feita && "border-success/40 bg-success/10 text-success"
                )}
              >
                {feita ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              {etapa.titulo}
            </button>
            {i < ETAPAS.length - 1 && <span className="hidden h-px flex-1 bg-border sm:block" />}
          </li>
        );
      })}
    </ol>
  );
}

// Resumo do que vai ser cadastrado, na última etapa.
function Revisao({
  valores,
  nomeCliente,
  clienteSelecionado,
}: {
  valores: ViagemFormValues;
  nomeCliente?: string;
  clienteSelecionado?: Cliente;
}) {
  const passageiros = [
    ...(valores.incluirCliente && (clienteSelecionado || nomeCliente) ? [nomeCliente ?? ""] : []),
    ...valores.passageiros.map((p) => p.nome),
  ].filter(Boolean);
  const total = valores.itens.reduce((soma, item) => soma + (Number(item.valor) || 0), 0);
  // Horários do formulário ("AAAA-MM-DDTHH:mm") no formato salvo (UTC), pro
  // itinerário mostrar a hora do bilhete.
  const trechos = valores.trechos.map((t) => ({
    ...t,
    partidaPrevista: t.partidaPrevista ? `${t.partidaPrevista.slice(0, 16)}:00Z` : undefined,
    chegadaPrevista: t.chegadaPrevista ? `${t.chegadaPrevista.slice(0, 16)}:00Z` : undefined,
  }));

  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4 text-sm">
      <h3 className="text-sm font-semibold">Revisão</h3>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Viagem</p>
          <p className="font-medium">{valores.destino || "—"}</p>
          <p className="text-muted-foreground">
            {formatDate(valores.dataIda)} – {formatDate(valores.dataVolta)} · {STATUS_VIAGEM_LABEL[valores.status]}
          </p>
          {nomeCliente && <p className="text-muted-foreground">Cliente: {nomeCliente}</p>}
          {valores.localizador && <p className="text-muted-foreground">Localizador: {valores.localizador}</p>}
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Passageiros ({passageiros.length})</p>
          {passageiros.length === 0 ? (
            <p className="text-muted-foreground">Nenhum passageiro.</p>
          ) : (
            <ul className="space-y-0.5">
              {passageiros.map((nome, i) => (
                <li key={i}>{nome}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Venda · {formatCurrency(total)}</p>
          <ul className="space-y-0.5">
            {valores.itens.map((item, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span className="truncate">
                  {TIPO_VENDA_LABEL[item.tipo]}
                  {item.descricao && <span className="text-muted-foreground"> · {item.descricao}</span>}
                </span>
                <span>{formatCurrency(Number(item.valor) || 0)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Voos</p>
        <Itinerario trechos={trechos} />
      </div>
    </div>
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
        <Button type="button" variant="outline" size="sm" onClick={() => passageiros.append({ ...PASSAGEIRO_VAZIO })}>
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
            largo
            enderecoRecolhido
          />
        </div>
      ))}
    </div>
  );
}
