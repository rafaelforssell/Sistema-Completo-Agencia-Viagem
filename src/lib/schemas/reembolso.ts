import { z } from "zod";

export const reembolsoSchema = z.object({
  pagamentoId: z.string().optional().or(z.literal("")),
  motivo: z.string().min(3, "Descreva o motivo do reembolso."),
  valorSolicitado: z.coerce.number().positive("Informe um valor válido."),
  valorAprovado: z.coerce.number().nonnegative().optional(),
  status: z.enum(["solicitado", "em_analise", "aprovado", "pago", "negado"]),
  dataSolicitacao: z.string().min(1, "Informe a data da solicitação."),
  dataConclusao: z.string().optional().or(z.literal("")),
  observacoes: z.string().optional().or(z.literal("")),
});

export type ReembolsoFormValues = z.infer<typeof reembolsoSchema>;
