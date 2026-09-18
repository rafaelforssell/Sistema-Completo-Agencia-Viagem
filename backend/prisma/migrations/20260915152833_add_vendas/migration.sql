-- CreateEnum
CREATE TYPE "TipoVenda" AS ENUM ('viagem', 'passeio', 'aluguel_carro', 'hotel', 'seguro', 'transfer', 'outro');

-- CreateEnum
CREATE TYPE "StatusVenda" AS ENUM ('orcamento', 'confirmada', 'cancelada');

-- CreateTable
CREATE TABLE "vendas" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "viagemId" TEXT,
    "tipo" "TipoVenda" NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "status" "StatusVenda" NOT NULL DEFAULT 'orcamento',
    "dataVenda" TIMESTAMP(3) NOT NULL,
    "numeroPedido" TEXT NOT NULL,
    "observacoes" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "numeros_pedido_extra" (
    "id" TEXT NOT NULL,
    "vendaId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "descricao" TEXT,

    CONSTRAINT "numeros_pedido_extra_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vendas_numeroPedido_key" ON "vendas"("numeroPedido");

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_viagemId_fkey" FOREIGN KEY ("viagemId") REFERENCES "viagens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "numeros_pedido_extra" ADD CONSTRAINT "numeros_pedido_extra_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES "vendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
