import { z } from "zod";

export const fornecedorSchema = z.object({
  nome: z.string().min(2, "Informe o nome do fornecedor."),
  tipo: z.enum([
    "companhia_aerea",
    "hotel",
    "operadora",
    "seguradora",
    "transfer",
    "aluguel_carro",
    "passeios",
    "cruzeiro",
    "ingressos",
    "outro",
  ]),
  email: z.string().email("E-mail inválido.").optional().or(z.literal("")),
  email2: z.string().email("E-mail inválido.").optional().or(z.literal("")),
  telefone: z.string().optional().or(z.literal("")),
  telefone2: z.string().optional().or(z.literal("")),
  telefone3: z.string().optional().or(z.literal("")),
  site: z.string().optional().or(z.literal("")),
  cidade: z.string().optional().or(z.literal("")),
  pais: z.string().optional().or(z.literal("")),
  descricaoServicos: z.string().optional().or(z.literal("")),
  observacoes: z.string().optional().or(z.literal("")),
  contatos: z
    .array(
      z.object({
        nome: z.string().min(1, "Informe o nome."),
        funcao: z.string().optional().or(z.literal("")),
      })
    )
    .optional(),
});

export type FornecedorFormValues = z.infer<typeof fornecedorSchema>;
