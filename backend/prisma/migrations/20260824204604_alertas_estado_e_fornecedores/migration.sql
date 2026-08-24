-- CreateEnum
CREATE TYPE "TipoFornecedor" AS ENUM ('companhia_aerea', 'hotel', 'operadora', 'seguradora', 'outro');

-- AlterTable
ALTER TABLE "alertas_lidos" ADD COLUMN     "excluido" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "excluidoEm" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "fornecedores" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoFornecedor" NOT NULL DEFAULT 'outro',
    "email" TEXT,
    "telefone" TEXT,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fornecedores_pkey" PRIMARY KEY ("id")
);
