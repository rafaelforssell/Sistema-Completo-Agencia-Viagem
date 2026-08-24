// Tipos de domínio do sistema. Espelham o formato de resposta assumido da API REST
// (ver API_ENDPOINTS.md na raiz do projeto para o contrato completo).

export type ID = string;

export interface Timestamps {
  criadoEm: string;
  atualizadoEm: string;
}

// ---------- Admin / Auth ----------

export interface Admin {
  id: ID;
  nome: string;
  email: string;
}

export interface LoginPayload {
  email: string;
  senha: string;
}

// ---------- Cliente ----------

export type TipoDocumento = "passaporte" | "rg" | "cpf" | "visto" | "outro";

export interface DocumentoAnexo extends Timestamps {
  id: ID;
  tipo: TipoDocumento;
  nomeArquivo: string;
  url: string;
  tamanhoBytes: number;
  mimeType: string;
  clienteId?: ID;
  viagemId?: ID;
  passageiroId?: ID;
}

export interface Cliente extends Timestamps {
  id: ID;
  nome: string;
  email?: string;
  telefone?: string;
  dataNascimento?: string;
  numeroPassaporte?: string;
  validadePassaporte?: string;
  observacoes?: string;
  anexos?: DocumentoAnexo[];
  viagens?: ViagemResumo[];
}

export type ClienteInput = Omit<
  Cliente,
  "id" | "criadoEm" | "atualizadoEm" | "anexos" | "viagens"
>;

// ---------- Viagem / Passageiros ----------

export type StatusViagem =
  | "orcamento"
  | "confirmada"
  | "em_andamento"
  | "concluida"
  | "cancelada";

export interface Passageiro extends Timestamps {
  id: ID;
  viagemId: ID;
  nome: string;
  parentesco?: string;
  dataNascimento?: string;
  numeroPassaporte?: string;
  validadePassaporte?: string;
  numeroBilhete?: string;
}

export type PassageiroInput = Omit<
  Passageiro,
  "id" | "viagemId" | "criadoEm" | "atualizadoEm"
>;

export interface Viagem extends Timestamps {
  id: ID;
  clienteId: ID;
  cliente?: Cliente;
  destino: string;
  dataIda: string;
  dataVolta: string;
  companhiaAerea?: string;
  status: StatusViagem;
  observacoes?: string;
  passageiros?: Passageiro[];
  pagamentos?: Pagamento[];
  reembolsos?: Reembolso[];
  anexos?: DocumentoAnexo[];
}

export interface ViagemResumo {
  id: ID;
  destino: string;
  dataIda: string;
  dataVolta: string;
  status: StatusViagem;
}

export type ViagemInput = Omit<
  Viagem,
  | "id"
  | "criadoEm"
  | "atualizadoEm"
  | "cliente"
  | "passageiros"
  | "pagamentos"
  | "reembolsos"
  | "anexos"
>;

// ---------- Pagamentos ----------

export type TipoCartao = "agencia" | "cliente" | "terceiro";
export type FormaPagamento =
  | "cartao_credito"
  | "cartao_debito"
  | "pix"
  | "boleto"
  | "transferencia"
  | "dinheiro";

export interface Pagamento extends Timestamps {
  id: ID;
  viagemId: ID;
  companhiaAerea?: string;
  fornecedor: string;
  formaPagamento: FormaPagamento;
  tipoCartao: TipoCartao;
  nomeTitularTerceiro?: string;
  valor: number;
  parcelas: number;
  dataPagamento: string;
  observacoes?: string;
}

export type PagamentoInput = Omit<
  Pagamento,
  "id" | "viagemId" | "criadoEm" | "atualizadoEm"
>;

// ---------- Reembolsos ----------

export type StatusReembolso = "solicitado" | "em_analise" | "aprovado" | "pago" | "negado";

export interface Reembolso extends Timestamps {
  id: ID;
  viagemId: ID;
  pagamentoId?: ID;
  motivo: string;
  valorSolicitado: number;
  valorAprovado?: number;
  status: StatusReembolso;
  dataSolicitacao: string;
  dataConclusao?: string;
  observacoes?: string;
}

export type ReembolsoInput = Omit<
  Reembolso,
  "id" | "viagemId" | "criadoEm" | "atualizadoEm"
>;

// ---------- Contas / Financeiro ----------

export type NaturezaConta = "a_pagar" | "a_receber";
export type StatusConta = "pendente" | "pago" | "atrasado" | "cancelado";

export interface ContaFinanceira extends Timestamps {
  id: ID;
  natureza: NaturezaConta;
  descricao: string;
  origem: "cliente" | "fornecedor";
  origemNome: string;
  viagemId?: ID;
  valor: number;
  vencimento: string;
  status: StatusConta;
  fonte?: string; // ex.: nome do cartão / conta bancária
}

export interface ResumoFinanceiro {
  totalAPagar: number;
  totalAReceber: number;
  totalAtrasado: number;
  saldoPorFonte: { fonte: string; saldo: number }[];
}

// ---------- Comissionamento ----------

export type StatusComissao = "pendente" | "recebida" | "cancelada";

export interface Comissao extends Timestamps {
  id: ID;
  viagemId: ID;
  fornecedor: string;
  percentual: number;
  valorBruto: number;
  valorLiquido: number;
  status: StatusComissao;
  dataPrevista?: string;
  dataRecebimento?: string;
}

export type ComissaoInput = Omit<
  Comissao,
  "id" | "criadoEm" | "atualizadoEm" | "valorLiquido"
>;

// ---------- Dashboard / Resumo / Alertas ----------

export interface DashboardMetricas {
  totalClientes: number;
  viagensAtivas: number;
  proximosCheckIns: number;
  aniversariantesSemana: number;
  passaportesVencendoEm30Dias: number;
  contasAPagar: number;
  contasAReceber: number;
}

export type TipoAtividade =
  | "viagem_proxima"
  | "pagamento_pendente"
  | "reembolso_aberto"
  | "cliente_novo"
  | "viagem_concluida";

export interface AtividadeFeed {
  id: ID;
  tipo: TipoAtividade;
  titulo: string;
  descricao: string;
  data: string;
  referenciaId?: ID;
  referenciaTipo?: "cliente" | "viagem" | "pagamento" | "reembolso";
}

export type TipoAlerta = "checkin" | "aniversario" | "passaporte";
export type SeveridadeAlerta = "info" | "atencao" | "urgente";

export interface Alerta {
  id: ID;
  tipo: TipoAlerta;
  severidade: SeveridadeAlerta;
  titulo: string;
  descricao: string;
  data: string;
  clienteId?: ID;
  viagemId?: ID;
  lido: boolean;
}

// ---------- Voucher ----------

export interface VoucherResponse {
  url: string;
  geradoEm: string;
}

// ---------- Listagem paginada (padrão da API) ----------

export interface PaginatedResponse<T> {
  dados: T[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
}

export interface PaginationParams {
  pagina?: number;
  porPagina?: number;
  busca?: string;
  ordenarPor?: string;
  ordem?: "asc" | "desc";
}
