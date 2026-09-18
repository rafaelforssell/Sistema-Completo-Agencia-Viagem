-- CreateEnum
CREATE TYPE "EtapaLead" AS ENUM ('novo', 'contato', 'proposta', 'fechado', 'perdido');

-- CreateEnum
CREATE TYPE "TipoInteracaoCrm" AS ENUM ('ligacao', 'email', 'whatsapp', 'reuniao', 'nota');

-- CreateTable
CREATE TABLE "crm_leads" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "origem" TEXT,
    "etapa" "EtapaLead" NOT NULL DEFAULT 'novo',
    "clienteId" TEXT,
    "valorEstimado" DECIMAL(12,2),
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_interacoes" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "clienteId" TEXT,
    "tipo" "TipoInteracaoCrm" NOT NULL,
    "descricao" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_interacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_tarefas" (
    "id" TEXT NOT NULL,
    "leadId" TEXT,
    "clienteId" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "concluida" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_tarefas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "crm_leads" ADD CONSTRAINT "crm_leads_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_interacoes" ADD CONSTRAINT "crm_interacoes_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_interacoes" ADD CONSTRAINT "crm_interacoes_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_tarefas" ADD CONSTRAINT "crm_tarefas_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "crm_leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_tarefas" ADD CONSTRAINT "crm_tarefas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
