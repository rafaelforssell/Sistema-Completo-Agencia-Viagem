import type {
  DestinoReembolso,
  EtapaLead,
  FormaPagamento,
  NaturezaConta,
  SeveridadeAlerta,
  StatusComissao,
  StatusConta,
  StatusReembolso,
  StatusVenda,
  StatusViagem,
  TipoAlerta,
  TipoCartao,
  TipoDocumento,
  TipoFornecedor,
  TipoInteracaoCrm,
  TipoVenda,
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

// "tipoCartao" no banco representa quem adiantou o dinheiro (agência, cliente
// ou terceiro) — isso vale para qualquer forma de pagamento, não só cartão.
// O texto exibido, porém, precisa soar certo pra Pix/boleto/dinheiro também,
// daí o rótulo e as opções serem montados a partir da forma de pagamento
// escolhida em vez de um texto fixo com a palavra "Cartão".
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

const CAMPO_ORIGEM_LABEL: Record<FormaPagamento, string> = {
  cartao_credito: "Cartão utilizado",
  cartao_debito: "Cartão utilizado",
  pix: "Chave Pix utilizada",
  boleto: "Origem do boleto",
  transferencia: "Conta de origem",
  dinheiro: "Origem do dinheiro",
};

const ORIGEM_PREFIXO: Record<FormaPagamento, string> = {
  cartao_credito: "Cartão",
  cartao_debito: "Cartão",
  pix: "Pix",
  boleto: "Boleto",
  transferencia: "Transferência",
  dinheiro: "Dinheiro",
};

const ORIGEM_SUFIXO: Record<TipoCartao, string> = {
  agencia: "da Agência",
  cliente: "do Cliente",
  terceiro: "de Terceiro",
};

export function campoOrigemLabel(forma: FormaPagamento): string {
  return CAMPO_ORIGEM_LABEL[forma];
}

export function origemPagamentoOptions(forma: FormaPagamento) {
  return (Object.keys(ORIGEM_SUFIXO) as TipoCartao[]).map((tipo) => ({
    value: tipo,
    label: `${ORIGEM_PREFIXO[forma]} ${ORIGEM_SUFIXO[tipo]}`,
  }));
}

export function origemPagamentoLabel(forma: FormaPagamento, tipo: TipoCartao): string {
  return `${ORIGEM_PREFIXO[forma]} ${ORIGEM_SUFIXO[tipo]}`;
}

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

export const DESTINO_REEMBOLSO_LABEL: Record<DestinoReembolso, string> = {
  cliente: "Devolver ao cliente",
  carteira_fornecedor: "Virar crédito no fornecedor (carteira digital)",
};

export const DESTINO_REEMBOLSO_OPTIONS = Object.entries(DESTINO_REEMBOLSO_LABEL).map(
  ([value, label]) => ({ value: value as DestinoReembolso, label })
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
  companhia_aerea: "Aéreo",
  hotel: "Hotel",
  operadora: "Operadora",
  seguradora: "Seguro viagem",
  transfer: "Transfer",
  aluguel_carro: "Aluguel de carro",
  passeios: "Passeio",
  cruzeiro: "Cruzeiro",
  ingressos: "Ingressos",
  outro: "Outro",
};

export const TIPO_FORNECEDOR_OPTIONS = Object.entries(TIPO_FORNECEDOR_LABEL).map(
  ([value, label]) => ({ value: value as TipoFornecedor, label })
);

export const TIPO_VENDA_LABEL: Record<TipoVenda, string> = {
  viagem: "Viagem",
  aereo: "Aéreo",
  hotel: "Hotel",
  transfer: "Transfer",
  seguro: "Seguro viagem",
  cruzeiro: "Cruzeiro",
  passeio: "Passeio",
  aluguel_carro: "Aluguel de carro",
  ingressos: "Ingressos",
  outro: "Outro",
};

export const TIPO_VENDA_OPTIONS = Object.entries(TIPO_VENDA_LABEL).map(
  ([value, label]) => ({ value: value as TipoVenda, label })
);

export const STATUS_VENDA_LABEL: Record<StatusVenda, string> = {
  orcamento: "Orçamento",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
};

export const STATUS_VENDA_OPTIONS = Object.entries(STATUS_VENDA_LABEL).map(
  ([value, label]) => ({ value: value as StatusVenda, label })
);

export const ETAPA_LEAD_LABEL: Record<EtapaLead, string> = {
  novo: "Novo",
  contato: "Contato",
  proposta: "Proposta",
  fechado: "Fechado",
  perdido: "Perdido",
};

export const ETAPA_LEAD_OPTIONS = Object.entries(ETAPA_LEAD_LABEL).map(
  ([value, label]) => ({ value: value as EtapaLead, label })
);

export const TIPO_INTERACAO_CRM_LABEL: Record<TipoInteracaoCrm, string> = {
  ligacao: "Ligação",
  email: "E-mail",
  whatsapp: "WhatsApp",
  reuniao: "Reunião",
  nota: "Nota",
};

export const TIPO_INTERACAO_CRM_OPTIONS = Object.entries(TIPO_INTERACAO_CRM_LABEL).map(
  ([value, label]) => ({ value: value as TipoInteracaoCrm, label })
);

export const TIPO_ALERTA_LABEL: Record<TipoAlerta, string> = {
  checkin: "Check-in aéreo",
  aniversario: "Aniversário",
  passaporte: "Passaporte vencendo",
  termino: "Término de viagem",
};

export const SEVERIDADE_ALERTA_LABEL: Record<SeveridadeAlerta, string> = {
  info: "Informativo",
  atencao: "Atenção",
  urgente: "Urgente",
};
