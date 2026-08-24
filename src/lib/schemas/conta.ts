import { z } from "zod";

export const contaSchema = z.object({
  natureza: z.enum(["a_pagar", "a_receber"]),
  descricao: z.string().min(2, "Informe a descrição."),
  origem: z.enum(["cliente", "fornecedor"]),
  origemNome: z.string().min(2, "Informe o nome do cliente ou fornecedor."),
  viagemId: z.string().optional().or(z.literal("")),
  valor: z.coerce.number().positive("Informe um valor válido."),
  vencimento: z.string().min(1, "Informe o vencimento."),
  status: z.enum(["pendente", "pago", "atrasado", "cancelado"]),
  fonte: z.string().optional().or(z.literal("")),
});

export type ContaFormValues = z.infer<typeof contaSchema>;
