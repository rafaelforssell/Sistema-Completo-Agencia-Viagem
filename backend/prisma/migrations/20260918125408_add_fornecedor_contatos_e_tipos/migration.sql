-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TipoFornecedor" ADD VALUE 'cruzeiro';
ALTER TYPE "TipoFornecedor" ADD VALUE 'ingressos';

-- AlterTable
ALTER TABLE "fornecedores" ADD COLUMN     "cidade" TEXT,
ADD COLUMN     "descricaoServicos" TEXT,
ADD COLUMN     "email2" TEXT,
ADD COLUMN     "pais" TEXT,
ADD COLUMN     "site" TEXT,
ADD COLUMN     "telefone2" TEXT,
ADD COLUMN     "telefone3" TEXT;

-- CreateTable
CREATE TABLE "fornecedor_contatos" (
    "id" TEXT NOT NULL,
    "fornecedorId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "funcao" TEXT,

    CONSTRAINT "fornecedor_contatos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "fornecedor_contatos" ADD CONSTRAINT "fornecedor_contatos_fornecedorId_fkey" FOREIGN KEY ("fornecedorId") REFERENCES "fornecedores"("id") ON DELETE CASCADE ON UPDATE CASCADE;
