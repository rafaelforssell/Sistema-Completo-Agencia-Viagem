import { z } from "zod";

export const fornecedorSchema = z.object({
  nome: z.string().min(2, "Informe o nome do fornecedor."),
  tipo: z.enum(["companhia_aerea", "hotel", "operadora", "seguradora", "outro"]),
  email: z.string().email("E-mail inválido.").optional().or(z.literal("")),
  telefone: z.string().optional().or(z.literal("")),
  observacoes: z.string().optional().or(z.literal("")),
});

export type FornecedorFormValues = z.infer<typeof fornecedorSchema>;
