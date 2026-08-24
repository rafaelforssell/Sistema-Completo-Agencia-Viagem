import { z } from "zod";

export const comissaoSchema = z.object({
  viagemId: z.string().min(1, "Selecione a viagem."),
  fornecedor: z.string().min(2, "Informe o fornecedor."),
  percentual: z.coerce.number().min(0).max(100, "Percentual entre 0 e 100."),
  valorBruto: z.coerce.number().positive("Informe um valor válido."),
  status: z.enum(["pendente", "recebida", "cancelada"]),
  dataPrevista: z.string().optional().or(z.literal("")),
  dataRecebimento: z.string().optional().or(z.literal("")),
});

export type ComissaoFormValues = z.infer<typeof comissaoSchema>;
