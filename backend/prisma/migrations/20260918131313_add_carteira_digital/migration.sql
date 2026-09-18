-- CreateEnum
CREATE TYPE "DestinoReembolso" AS ENUM ('cliente', 'carteira_fornecedor');

-- CreateEnum
CREATE TYPE "TipoCarteiraMovimento" AS ENUM ('credito', 'debito');

-- AlterTable
ALTER TABLE "reembolsos" ADD COLUMN     "destino" "DestinoReembolso" NOT NULL DEFAULT 'cliente',
ADD COLUMN     "fornecedorId" TEXT;

-- CreateTable
CREATE TABLE "carteira_movimentos" (
    "id" TEXT NOT NULL,
    "fornecedorId" TEXT NOT NULL,
    "tipo" "TipoCarteiraMovimento" NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "descricao" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "reembolsoId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carteira_movimentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "carteira_movimentos_reembolsoId_key" ON "carteira_movimentos"("reembolsoId");

-- AddForeignKey
ALTER TABLE "reembolsos" ADD CONSTRAINT "reembolsos_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carteira_movimentos" ADD CONSTRAINT "carteira_movimentos_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carteira_movimentos" ADD CONSTRAINT "carteira_movimentos_reembolsoId_fkey" FOREIGN KEY ("reembolsoId") REFERENCES "reembolsos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
