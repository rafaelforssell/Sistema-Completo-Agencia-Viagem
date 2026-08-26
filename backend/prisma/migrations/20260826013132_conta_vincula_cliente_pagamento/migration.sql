-- AlterTable
ALTER TABLE "contas_financeiras" ADD COLUMN     "clienteId" TEXT,
ADD COLUMN     "pagamentoId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "contas_financeiras_pagamentoId_key" ON "contas_financeiras"("pagamentoId");

-- AddForeignKey
ALTER TABLE "contas_financeiras" ADD CONSTRAINT "contas_financeiras_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contas_financeiras" ADD CONSTRAINT "contas_financeiras_pagamentoId_fkey" FOREIGN KEY ("pagamentoId") REFERENCES "pagamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

