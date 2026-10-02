import { z } from "zod";
import { vendaItemSchema } from "@/lib/schemas/venda";

const textoOpcional = z.string().optional().or(z.literal(""));

export const passageiroSchema = z.object({
  nome: z.string().min(2, "Informe o nome completo."),
  parentesco: textoOpcional,
  email: z.string().email("E-mail inválido.").optional().or(z.literal("")),
  telefone: textoOpcional,
  dataNascimento: textoOpcional,
  numeroPassaporte: textoOpcional,
  validadePassaporte: textoOpcional,
  numeroBilhete: textoOpcional,
});

export type PassageiroFormValues = z.infer<typeof passageiroSchema>;

export const trechoSchema = z.object({
  sentido: z.enum(["ida", "volta"]),
  numeroVoo: textoOpcional,
  companhia: textoOpcional,
  origemIata: textoOpcional,
  origemAeroporto: textoOpcional,
  destinoIata: textoOpcional,
  destinoAeroporto: textoOpcional,
  // "AAAA-MM-DDTHH:mm" (input datetime-local), horário local do aeroporto.
  partidaPrevista: textoOpcional,
  chegadaPrevista: textoOpcional,
  terminalPartida: textoOpcional,
  terminalChegada: textoOpcional,
  aeronave: textoOpcional,
  classe: textoOpcional,
  bagagem: textoOpcional,
});

export type TrechoFormValues = z.infer<typeof trechoSchema>;

const viagemCampos = {
  clienteId: z.string().min(1, "Selecione o cliente principal."),
  destino: z.string().min(2, "Informe o destino."),
  dataIda: z.string().min(1, "Informe a data de ida."),
  dataVolta: z.string().min(1, "Informe a data de volta."),
  companhiaAerea: textoOpcional,
  localizador: textoOpcional,
  status: z.enum(["orcamento", "confirmada", "em_andamento", "concluida", "cancelada"]),
  observacoes: textoOpcional,
  trechos: z.array(trechoSchema),
  comissaoValor: z.coerce.number().nonnegative("Informe um valor válido."),
  comissaoFornecedor: textoOpcional,
};

// Campos que só existem na criação: passageiros e a venda nascem junto com
// a viagem. Na edição eles ficam nas abas Passageiros / Venda.
const criacaoCampos = {
  incluirCliente: z.boolean(),
  passageiros: z.array(passageiroSchema),
  dataVenda: z.string().min(1, "Informe a data da venda."),
  vendaObservacoes: textoOpcional,
  itens: z.array(vendaItemSchema).min(1, "Adicione ao menos um item à venda."),
  numeroPedidoExtras: z
    .array(z.object({ numero: z.string().min(1, "Informe o número."), descricao: textoOpcional }))
    .optional(),
};

const datasCoerentes = (data: { dataIda: string; dataVolta: string }) => data.dataVolta >= data.dataIda;
const datasErro = {
  message: "A data de volta deve ser igual ou posterior à data de ida.",
  path: ["dataVolta"],
};

export const viagemCriacaoSchema = z.object({ ...viagemCampos, ...criacaoCampos }).refine(datasCoerentes, datasErro);

// Na edição os campos de criação continuam no formulário (com valores
// vazios), mas não são validados nem enviados.
export const viagemEdicaoSchema = z.object(viagemCampos).passthrough().refine(datasCoerentes, datasErro);

export type ViagemFormValues = z.infer<typeof viagemCriacaoSchema>;
