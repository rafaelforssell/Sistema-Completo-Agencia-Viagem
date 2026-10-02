import { z } from "zod";

export const comissaoSchema = z.object({
  viagemId: z.string().min(1, "Selecione a viagem."),
  fornecedor: z.string().optional().or(z.literal("")),
  valor: z.coerce.number().positive("Informe o valor da comissão."),
  status: z.enum(["pendente", "recebida", "cancelada"]),
  dataPrevista: z.string().optional().or(z.literal("")),
  dataRecebimento: z.string().optional().or(z.literal("")),
});

export type ComissaoFormValues = z.infer<typeof comissaoSchema>;
