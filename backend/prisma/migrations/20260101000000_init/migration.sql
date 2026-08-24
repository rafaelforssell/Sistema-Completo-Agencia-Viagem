-- CreateEnum
CREATE TYPE "StatusViagem" AS ENUM ('orcamento', 'confirmada', 'em_andamento', 'concluida', 'cancelada');

-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('cartao_credito', 'cartao_debito', 'pix', 'boleto', 'transferencia', 'dinheiro');

-- CreateEnum
CREATE TYPE "TipoCartao" AS ENUM ('agencia', 'cliente', 'terceiro');

-- CreateEnum
CREATE TYPE "StatusReembolso" AS ENUM ('solicitado', 'em_analise', 'aprovado', 'pago', 'negado');

-- CreateEnum
CREATE TYPE "NaturezaConta" AS ENUM ('a_pagar', 'a_receber');

-- CreateEnum
CREATE TYPE "StatusConta" AS ENUM ('pendente', 'pago', 'atrasado', 'cancelado');

-- CreateEnum
CREATE TYPE "StatusComissao" AS ENUM ('pendente', 'recebida', 'cancelada');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('passaporte', 'rg', 'cpf', 'visto', 'outro');

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "numeroPassaporte" TEXT,
    "validadePassaporte" TIMESTAMP(3),
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "viagens" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "destino" TEXT NOT NULL,
    "dataIda" TIMESTAMP(3) NOT NULL,
    "dataVolta" TIMESTAMP(3) NOT NULL,
    "companhiaAerea" TEXT,
    "status" "StatusViagem" NOT NULL DEFAULT 'orcamento',
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "viagens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "passageiros" (
    "id" TEXT NOT NULL,
    "viagemId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "parentesco" TEXT,
    "dataNascimento" TIMESTAMP(3),
    "numeroPassaporte" TEXT,
    "validadePassaporte" TIMESTAMP(3),
    "numeroBilhete" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "passageiros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" TEXT NOT NULL,
    "viagemId" TEXT NOT NULL,
    "companhiaAerea" TEXT,
    "fornecedor" TEXT NOT NULL,
    "formaPagamento" "FormaPagamento" NOT NULL,
    "tipoCartao" "TipoCartao" NOT NULL,
    "nomeTitularTerceiro" TEXT,
    "valor" DECIMAL(12,2) NOT NULL,
    "parcelas" INTEGER NOT NULL DEFAULT 1,
    "dataPagamento" TIMESTAMP(3) NOT NULL,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reembolsos" (
    "id" TEXT NOT NULL,
    "viagemId" TEXT NOT NULL,
    "pagamentoId" TEXT,
    "motivo" TEXT NOT NULL,
    "valorSolicitado" DECIMAL(12,2) NOT NULL,
    "valorAprovado" DECIMAL(12,2),
    "status" "StatusReembolso" NOT NULL DEFAULT 'solicitado',
    "dataSolicitacao" TIMESTAMP(3) NOT NULL,
    "dataConclusao" TIMESTAMP(3),
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reembolsos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contas_financeiras" (
    "id" TEXT NOT NULL,
    "natureza" "NaturezaConta" NOT NULL,
    "descricao" TEXT NOT NULL,
    "origem" TEXT NOT NULL,
    "origemNome" TEXT NOT NULL,
    "viagemId" TEXT,
    "valor" DECIMAL(12,2) NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "status" "StatusConta" NOT NULL DEFAULT 'pendente',
    "fonte" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contas_financeiras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comissoes" (
    "id" TEXT NOT NULL,
    "viagemId" TEXT NOT NULL,
    "fornecedor" TEXT NOT NULL,
    "percentual" DECIMAL(5,2) NOT NULL,
    "valorBruto" DECIMAL(12,2) NOT NULL,
    "valorLiquido" DECIMAL(12,2) NOT NULL,
    "status" "StatusComissao" NOT NULL DEFAULT 'pendente',
    "dataPrevista" TIMESTAMP(3),
    "dataRecebimento" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comissoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anexos" (
    "id" TEXT NOT NULL,
    "tipo" "TipoDocumento" NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "caminhoArquivo" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tamanhoBytes" INTEGER NOT NULL,
    "clienteId" TEXT,
    "viagemId" TEXT,
    "passageiroId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anexos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertas_lidos" (
    "chave" TEXT NOT NULL,
    "lidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alertas_lidos_pkey" PRIMARY KEY ("chave")
);

-- CreateTable
CREATE TABLE "vouchers" (
    "id" TEXT NOT NULL,
    "viagemId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "geradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_viagemId_key" ON "vouchers"("viagemId");

-- AddForeignKey
ALTER TABLE "viagens" ADD CONSTRAINT "viagens_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "passageiros" ADD CONSTRAINT "passageiros_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "viagens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "viagens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reembolsos" ADD CONSTRAINT "reembolsos_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "viagens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reembolsos" ADD CONSTRAINT "reembolsos_pagamentoId_fkey" FOREIGN KEY ("pagamentoId") REFERENCES "pagamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_financeiras" ADD CONSTRAINT "contas_financeiras_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "viagens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comissoes" ADD CONSTRAINT "comissoes_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "viagens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "viagens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_passageiroId_fkey" FOREIGN KEY ("passageiroId") REFERENCES "passageiros"("id") ON DELETE CASCADE ON UPDATE CASCADE;

