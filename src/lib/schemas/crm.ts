import { z } from "zod";

export const leadSchema = z.object({
  nome: z.string().min(2, "Informe o nome."),
  email: z.string().email("E-mail inválido.").optional().or(z.literal("")),
  telefone: z.string().optional().or(z.literal("")),
  origem: z.string().optional().or(z.literal("")),
  etapa: z.enum(["novo", "contato", "proposta", "fechado", "perdido"]),
  clienteId: z.string().optional().or(z.literal("")),
  valorEstimado: z.number().nonnegative().optional(),
  observacoes: z.string().optional().or(z.literal("")),
});

export type LeadFormValues = z.infer<typeof leadSchema>;

export const interacaoCrmSchema = z.object({
  leadId: z.string().optional().or(z.literal("")),
  clienteId: z.string().optional().or(z.literal("")),
  tipo: z.enum(["ligacao", "email", "whatsapp", "reuniao", "nota"]),
  descricao: z.string().min(1, "Descreva a interação."),
  data: z.string().min(1, "Informe a data."),
});

export type InteracaoCrmFormValues = z.infer<typeof interacaoCrmSchema>;

export const tarefaCrmSchema = z.object({
  leadId: z.string().optional().or(z.literal("")),
  clienteId: z.string().optional().or(z.literal("")),
  titulo: z.string().min(1, "Informe o título."),
  descricao: z.string().optional().or(z.literal("")),
  dataVencimento: z.string().min(1, "Informe o vencimento."),
  concluida: z.boolean().optional(),
});

export type TarefaCrmFormValues = z.infer<typeof tarefaCrmSchema>;
