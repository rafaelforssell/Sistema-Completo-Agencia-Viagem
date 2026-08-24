import { z } from "zod";

export const pagamentoSchema = z
  .object({
    companhiaAerea: z.string().optional().or(z.literal("")),
    fornecedor: z.string().min(2, "Informe o fornecedor."),
    formaPagamento: z.enum([
      "cartao_credito",
      "cartao_debito",
      "pix",
      "boleto",
      "transferencia",
      "dinheiro",
    ]),
    tipoCartao: z.enum(["agencia", "cliente", "terceiro"]),
    nomeTitularTerceiro: z.string().optional().or(z.literal("")),
    valor: z.coerce.number().positive("Informe um valor válido."),
    parcelas: z.coerce.number().int().min(1, "Mínimo de 1 parcela."),
    dataPagamento: z.string().min(1, "Informe a data do pagamento."),
    observacoes: z.string().optional().or(z.literal("")),
  })
  .refine(
    (data) => data.tipoCartao !== "terceiro" || Boolean(data.nomeTitularTerceiro?.trim()),
    {
      message: "Informe o nome do titular do cartão de terceiro.",
      path: ["nomeTitularTerceiro"],
    }
  );

export type PagamentoFormValues = z.infer<typeof pagamentoSchema>;
