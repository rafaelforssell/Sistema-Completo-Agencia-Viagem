import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import type { Cliente, Pagamento, Passageiro, Viagem } from "@prisma/client";
import { env } from "../../env";
import { STATUS_VIAGEM_LABEL, TIPO_CARTAO_LABEL, FORMA_PAGAMENTO_LABEL } from "../../utils/labels";

type ViagemComRelacoes = Viagem & {
  cliente: Cliente;
  passageiros: Passageiro[];
  pagamentos: Pagamento[];
};

function formatDate(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function formatCurrency(value: unknown): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
}

const VOUCHERS_DIR = path.join(env.uploadsDir, "vouchers");

export async function generateVoucherPdf(viagem: ViagemComRelacoes): Promise<string> {
  fs.mkdirSync(VOUCHERS_DIR, { recursive: true });

  const filename = `voucher-${viagem.id}.pdf`;
  const filePath = path.join(VOUCHERS_DIR, filename);

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.fontSize(20).text("Voucher de Viagem", { align: "center" });
  doc.moveDown(1.5);

  doc.fontSize(13).text("Cliente responsável", { underline: true });
  doc.fontSize(11).moveDown(0.3);
  doc.text(`Nome: ${viagem.cliente.nome}`);
  if (viagem.cliente.email) doc.text(`E-mail: ${viagem.cliente.email}`);
  if (viagem.cliente.telefone) doc.text(`Telefone: ${viagem.cliente.telefone}`);
  doc.moveDown();

  doc.fontSize(13).text("Itinerário", { underline: true });
  doc.fontSize(11).moveDown(0.3);
  doc.text(`Destino: ${viagem.destino}`);
  doc.text(`Ida: ${formatDate(viagem.dataIda)}    Volta: ${formatDate(viagem.dataVolta)}`);
  if (viagem.companhiaAerea) doc.text(`Companhia aérea: ${viagem.companhiaAerea}`);
  doc.text(`Status: ${STATUS_VIAGEM_LABEL[viagem.status]}`);
  if (viagem.observacoes) doc.text(`Observações: ${viagem.observacoes}`);
  doc.moveDown();

  doc.fontSize(13).text("Passageiros", { underline: true });
  doc.fontSize(11).moveDown(0.3);
  if (viagem.passageiros.length === 0) {
    doc.text("Nenhum passageiro adicional além do cliente responsável.");
  } else {
    viagem.passageiros.forEach((passageiro) => {
      const detalhes = [
        passageiro.parentesco,
        passageiro.numeroPassaporte ? `Passaporte ${passageiro.numeroPassaporte}` : null,
        passageiro.numeroBilhete ? `Bilhete ${passageiro.numeroBilhete}` : null,
      ]
        .filter(Boolean)
        .join(" · ");
      doc.text(`• ${passageiro.nome}${detalhes ? ` (${detalhes})` : ""}`);
    });
  }
  doc.moveDown();

  doc.fontSize(13).text("Pagamentos", { underline: true });
  doc.fontSize(11).moveDown(0.3);
  if (viagem.pagamentos.length === 0) {
    doc.text("Nenhum pagamento registrado até o momento.");
  } else {
    let total = 0;
    viagem.pagamentos.forEach((pagamento) => {
      total += Number(pagamento.valor);
      doc.text(
        `• ${pagamento.fornecedor} — ${formatCurrency(pagamento.valor)} (${FORMA_PAGAMENTO_LABEL[pagamento.formaPagamento]}, ${
          pagamento.parcelas
        }x, ${TIPO_CARTAO_LABEL[pagamento.tipoCartao]})`
      );
    });
    doc.moveDown(0.3);
    doc.font("Helvetica-Bold").text(`Total pago: ${formatCurrency(total)}`);
    doc.font("Helvetica");
  }

  doc.moveDown(2);
  doc.fontSize(9).fillColor("#666666").text(`Documento gerado em ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date())}`, {
    align: "right",
  });

  doc.end();

  await new Promise<void>((resolve, reject) => {
    stream.on("finish", () => resolve());
    stream.on("error", reject);
  });

  return filename;
}

export function voucherUrl(filename: string): string {
  return `${env.publicUrl}/uploads/vouchers/${filename}`;
}
