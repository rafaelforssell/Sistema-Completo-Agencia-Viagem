import { z } from "zod";

export const vendaItemSchema = z.object({
  tipo: z.enum(["viagem", "aereo", "hotel", "transfer", "seguro", "cruzeiro", "passeio", "aluguel_carro", "ingressos", "outro"]),
  fornecedorId: z.string().optional().or(z.literal("")),
  descricao: z.string().optional().or(z.literal("")),
  valor: z.number().nonnegative("Informe um valor válido."),
  dataAluguel: z.string().optional().or(z.literal("")),
  seguroCompleto: z.boolean().optional(),
});

export const vendaSchema = z.object({
  clienteId: z.string().min(1, "Selecione o cliente."),
  viagemId: z.string().optional().or(z.literal("")),
  status: z.enum(["orcamento", "confirmada", "cancelada"]),
  dataVenda: z.string().min(1, "Informe a data da venda."),
  observacoes: z.string().optional().or(z.literal("")),
  numeroPedidoExtras: z
    .array(
      z.object({
        numero: z.string().min(1, "Informe o número."),
        descricao: z.string().optional().or(z.literal("")),
      })
    )
    .optional(),
  itens: z.array(vendaItemSchema).min(1, "Adicione ao menos um item à venda."),
});

export type VendaItemFormValues = z.infer<typeof vendaItemSchema>;
export type VendaFormValues = z.infer<typeof vendaSchema>;
