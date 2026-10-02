-- CreateEnum
CREATE TYPE "SentidoTrecho" AS ENUM ('ida', 'volta');

-- AlterTable
ALTER TABLE "viagens" ADD COLUMN     "localizador" TEXT;

-- AlterTable
ALTER TABLE "contas_financeiras" ADD COLUMN     "observacoes" TEXT;

-- CreateTable
CREATE TABLE "voo_trechos" (
    "id" TEXT NOT NULL,
    "viagemId" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL,
    "sentido" "SentidoTrecho" NOT NULL,
    "numeroVoo" TEXT,
    "companhia" TEXT,
    "origemIata" TEXT,
    "origemAeroporto" TEXT,
    "destinoIata" TEXT,
    "destinoAeroporto" TEXT,
    "partidaPrevista" TIMESTAMP(3),
    "chegadaPrevista" TIMESTAMP(3),
    "terminalPartida" TEXT,
    "terminalChegada" TEXT,
    "aeronave" TEXT,
    "classe" TEXT,
    "bagagem" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voo_trechos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "voo_trechos" ADD CONSTRAINT "voo_trechos_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "viagens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Comissão passa a ser um valor em R$. Backfill a partir do modelo antigo:
-- o valor líquido era valorBruto * (1 - percentual/100), então a comissão
-- da agência era valorBruto * percentual / 100.
ALTER TABLE "comissoes" ADD COLUMN "valor" DECIMAL(12,2);
UPDATE "comissoes" SET "valor" = ROUND("valorBruto" * "percentual" / 100, 2);
ALTER TABLE "comissoes" ALTER COLUMN "valor" SET NOT NULL;
ALTER TABLE "comissoes" ALTER COLUMN "fornecedor" DROP NOT NULL;
ALTER TABLE "comissoes" ALTER COLUMN "percentual" DROP NOT NULL;
ALTER TABLE "comissoes" ALTER COLUMN "valorBruto" DROP NOT NULL;
ALTER TABLE "comissoes" ALTER COLUMN "valorLiquido" DROP NOT NULL;
