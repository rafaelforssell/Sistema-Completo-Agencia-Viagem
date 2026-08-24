import type {
  FormaPagamento,
  NaturezaConta,
  SeveridadeAlerta,
  StatusComissao,
  StatusConta,
  StatusReembolso,
  StatusViagem,
  TipoAlerta,
  TipoCartao,
  TipoDocumento,
  TipoFornecedor,
} from "@/types/entities";

export const STATUS_VIAGEM_LABEL: Record<StatusViagem, string> = {
  orcamento: "Orçamento",
  confirmada: "Confirmada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export const STATUS_VIAGEM_OPTIONS = Object.entries(STATUS_VIAGEM_LABEL).map(
  ([value, label]) => ({ value: value as StatusViagem, label })
);

export const TIPO_CARTAO_LABEL: Record<TipoCartao, string> = {
  agencia: "Cartão Agência",
  cliente: "Cartão Cliente",
  terceiro: "Cartão de Terceiro",
};

export const TIPO_CARTAO_OPTIONS = Object.entries(TIPO_CARTAO_LABEL).map(
  ([value, label]) => ({ value: value as TipoCartao, label })
);

export const FORMA_PAGAMENTO_LABEL: Record<FormaPagamento, string> = {
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  pix: "Pix",
  boleto: "Boleto",
  transferencia: "Transferência",
  dinheiro: "Dinheiro",
};

export const FORMA_PAGAMENTO_OPTIONS = Object.entries(FORMA_PAGAMENTO_LABEL).map(
  ([value, label]) => ({ value: value as FormaPagamento, label })
);

export const STATUS_REEMBOLSO_LABEL: Record<StatusReembolso, string> = {
  solicitado: "Solicitado",
  em_analise: "Em análise",
  aprovado: "Aprovado",
  pago: "Pago",
  negado: "Negado",
};

export const STATUS_REEMBOLSO_OPTIONS = Object.entries(STATUS_REEMBOLSO_LABEL).map(
  ([value, label]) => ({ value: value as StatusReembolso, label })
);

export const NATUREZA_CONTA_LABEL: Record<NaturezaConta, string> = {
  a_pagar: "A pagar",
  a_receber: "A receber",
};

export const STATUS_CONTA_LABEL: Record<StatusConta, string> = {
  pendente: "Pendente",
  pago: "Pago",
  atrasado: "Atrasado",
  cancelado: "Cancelado",
};

export const STATUS_CONTA_OPTIONS = Object.entries(STATUS_CONTA_LABEL).map(
  ([value, label]) => ({ value: value as StatusConta, label })
);

export const STATUS_COMISSAO_LABEL: Record<StatusComissao, string> = {
  pendente: "Pendente",
  recebida: "Recebida",
  cancelada: "Cancelada",
};

export const STATUS_COMISSAO_OPTIONS = Object.entries(STATUS_COMISSAO_LABEL).map(
  ([value, label]) => ({ value: value as StatusComissao, label })
);

export const TIPO_DOCUMENTO_LABEL: Record<TipoDocumento, string> = {
  passaporte: "Passaporte",
  rg: "RG",
  cpf: "CPF",
  visto: "Visto",
  outro: "Outro",
};

export const TIPO_DOCUMENTO_OPTIONS = Object.entries(TIPO_DOCUMENTO_LABEL).map(
  ([value, label]) => ({ value: value as TipoDocumento, label })
);

export const TIPO_FORNECEDOR_LABEL: Record<TipoFornecedor, string> = {
  companhia_aerea: "Companhia aérea",
  hotel: "Hotel",
  operadora: "Operadora",
  seguradora: "Seguradora",
  outro: "Outro",
};

export const TIPO_FORNECEDOR_OPTIONS = Object.entries(TIPO_FORNECEDOR_LABEL).map(
  ([value, label]) => ({ value: value as TipoFornecedor, label })
);

export const TIPO_ALERTA_LABEL: Record<TipoAlerta, string> = {
  checkin: "Check-in aéreo",
  aniversario: "Aniversário",
  passaporte: "Passaporte vencendo",
};

export const SEVERIDADE_ALERTA_LABEL: Record<SeveridadeAlerta, string> = {
  info: "Informativo",
  atencao: "Atenção",
  urgente: "Urgente",
};
