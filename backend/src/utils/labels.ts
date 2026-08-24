import type { FormaPagamento, StatusViagem, TipoCartao } from "@prisma/client";

export const STATUS_VIAGEM_LABEL: Record<StatusViagem, string> = {
  orcamento: "Orçamento",
  confirmada: "Confirmada",
  em_andamento: "Em andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export const TIPO_CARTAO_LABEL: Record<TipoCartao, string> = {
  agencia: "Cartão Agência",
  cliente: "Cartão Cliente",
  terceiro: "Cartão de Terceiro",
};

export const FORMA_PAGAMENTO_LABEL: Record<FormaPagamento, string> = {
  cartao_credito: "Cartão de crédito",
  cartao_debito: "Cartão de débito",
  pix: "Pix",
  boleto: "Boleto",
  transferencia: "Transferência",
  dinheiro: "Dinheiro",
};
