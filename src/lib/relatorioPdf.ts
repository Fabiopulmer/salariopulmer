import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type LinhaRelatorio = {
  mes_referencia: string;
  faturamento_total: number;
  comissao_valor: number;
  dsr: number;
  salario_bruto: number;
  inss: number;
  irrf: number;
  salario_liquido: number;
  decimo: number;
  ferias: number;
};

const brl = (v: number) =>
  (Number(v) || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const gerarRelatorioAnualPdf = (ano: number, linhas: LinhaRelatorio[]) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const ordenadas = linhas
    .filter((l) => l.mes_referencia.endsWith(`/${ano}`))
    .sort((a, b) => parseInt(a.mes_referencia) - parseInt(b.mes_referencia));

  doc.setFontSize(18);
  doc.text(`Relatório Anual de Salário - ${ano}`, 14, 16);
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`, 14, 22);
  doc.setTextColor(0);

  const t = { fat: 0, com: 0, bruto: 0, desc: 0, liq: 0, dec: 0, fer: 0 };
  const body = ordenadas.map((l) => {
    const descontos = (Number(l.salario_bruto) || 0) - (Number(l.salario_liquido) || 0);
    const total = (Number(l.salario_liquido) || 0) + l.decimo + l.ferias;
    t.fat += Number(l.faturamento_total) || 0;
    t.com += (Number(l.comissao_valor) || 0) + (Number(l.dsr) || 0);
    t.bruto += Number(l.salario_bruto) || 0;
    t.desc += descontos;
    t.liq += Number(l.salario_liquido) || 0;
    t.dec += l.decimo;
    t.fer += l.ferias;
    return [
      l.mes_referencia,
      brl(l.faturamento_total),
      brl((Number(l.comissao_valor) || 0) + (Number(l.dsr) || 0)),
      brl(l.salario_bruto),
      brl(descontos),
      brl(l.salario_liquido),
      l.decimo > 0 ? brl(l.decimo) : "-",
      l.ferias > 0 ? brl(l.ferias) : "-",
      brl(total),
    ];
  });

  autoTable(doc, {
    startY: 28,
    head: [["Mês", "Faturamento", "Comissão + DSR", "Salário Bruto", "Descontos (INSS/IRRF/outros)", "Salário Líquido", "13º Líquido", "Férias Líquidas", "Total Recebido"]],
    body,
    foot: [["Total", brl(t.fat), brl(t.com), brl(t.bruto), brl(t.desc), brl(t.liq), brl(t.dec), brl(t.fer), brl(t.liq + t.dec + t.fer)]],
    styles: { fontSize: 9, halign: "right" },
    columnStyles: { 0: { halign: "left" } },
    headStyles: { fillColor: [59, 130, 246], halign: "center" },
    footStyles: { fillColor: [249, 115, 22], textColor: 255 },
  });

  const y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  doc.setFontSize(11);
  doc.text(`Meses registrados: ${ordenadas.length}`, 14, y);
  doc.text(`Total recebido no ano (salário + 13º + férias): ${brl(t.liq + t.dec + t.fer)}`, 14, y + 6);
  doc.setFontSize(8);
  doc.setTextColor(110);
  doc.text("13º e férias calculados sobre salário fixo + média de comissão e DSR do ano. Valores estimados.", 14, y + 13);

  doc.save(`relatorio-anual-${ano}.pdf`);
};
