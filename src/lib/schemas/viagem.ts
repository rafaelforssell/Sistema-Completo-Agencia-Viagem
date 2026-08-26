import { z } from "zod";

export const viagemSchema = z
  .object({
    clienteId: z.string().min(1, "Selecione o cliente principal."),
    destino: z.string().min(2, "Informe o destino."),
    dataIda: z.string().min(1, "Informe a data de ida."),
    dataVolta: z.string().min(1, "Informe a data de volta."),
    companhiaAerea: z.string().optional().or(z.literal("")),
    status: z.enum(["orcamento", "confirmada", "em_andamento", "concluida", "cancelada"]),
    observacoes: z.string().optional().or(z.literal("")),
  })
  .refine((data) => data.dataVolta >= data.dataIda, {
    message: "A data de volta deve ser igual ou posterior à data de ida.",
    path: ["dataVolta"],
  });

export type ViagemFormValues = z.infer<typeof viagemSchema>;

export const passageiroSchema = z.object({
  nome: z.string().min(2, "Informe o nome completo."),
  parentesco: z.string().optional().or(z.literal("")),
  email: z.string().email("E-mail inválido.").optional().or(z.literal("")),
  telefone: z.string().optional().or(z.literal("")),
  dataNascimento: z.string().optional().or(z.literal("")),
  numeroPassaporte: z.string().optional().or(z.literal("")),
  validadePassaporte: z.string().optional().or(z.literal("")),
  numeroBilhete: z.string().optional().or(z.literal("")),
});

export type PassageiroFormValues = z.infer<typeof passageiroSchema>;
