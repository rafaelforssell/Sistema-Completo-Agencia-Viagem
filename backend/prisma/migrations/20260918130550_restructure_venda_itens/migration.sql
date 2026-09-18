/*
  Warnings:

  - You are about to drop the column `descricao` on the `vendas` table. All the data in the column will be lost.
  - You are about to drop the column `tipo` on the `vendas` table. All the data in the column will be lost.
  - You are about to drop the column `valor` on the `vendas` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoVenda" ADD VALUE 'aereo';
ALTER TYPE "TipoVenda" ADD VALUE 'cruzeiro';
ALTER TYPE "TipoVenda" ADD VALUE 'ingressos';

-- AlterTable
ALTER TABLE "vendas" DROP COLUMN "descricao",
DROP COLUMN "tipo",
DROP COLUMN "valor";

-- CreateTable
CREATE TABLE "vendas_itens" (
    "id" TEXT NOT NULL,
    "vendaId" TEXT NOT NULL,
    "tipo" "TipoVenda" NOT NULL,
    "fornecedorId" TEXT,
    "descricao" TEXT,
    "valor" DECIMAL(12,2) NOT NULL,
    "dataAluguel" TIMESTAMP(3),
    "seguroCompleto" BOOLEAN,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendas_itens_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "vendas_itens" ADD CONSTRAINT "vendas_itens_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES "vendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas_itens" ADD CONSTRAINT "vendas_itens_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
