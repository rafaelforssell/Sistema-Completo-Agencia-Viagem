import { z } from "zod";

export const clienteSchema = z.object({
  nome: z.string().min(2, "Informe o nome completo."),
  email: z.string().email("E-mail inválido.").optional().or(z.literal("")),
  telefone: z.string().optional().or(z.literal("")),
  telefoneDdi: z.string().optional().or(z.literal("")),
  dataNascimento: z.string().optional().or(z.literal("")),
  numeroPassaporte: z.string().optional().or(z.literal("")),
  validadePassaporte: z.string().optional().or(z.literal("")),
  rg: z.string().optional().or(z.literal("")),
  cpf: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || value.replace(/\D/g, "").length === 11, {
      message: "CPF inválido.",
    }),
  cep: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || value.replace(/\D/g, "").length === 8, {
      message: "CEP inválido.",
    }),
  logradouro: z.string().optional().or(z.literal("")),
  numero: z.string().optional().or(z.literal("")),
  complemento: z.string().optional().or(z.literal("")),
  bairro: z.string().optional().or(z.literal("")),
  cidade: z.string().optional().or(z.literal("")),
  estado: z.string().optional().or(z.literal("")),
  observacoes: z.string().optional().or(z.literal("")),
});

export type ClienteFormValues = z.infer<typeof clienteSchema>;
