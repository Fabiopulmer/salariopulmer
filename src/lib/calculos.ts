// Funções compartilhadas de cálculo de impostos e recomposição de linhas do histórico.

// INSS 2026 progressivo
export const calcINSS = (bruto: number) => {
  const faixas = [
    { teto: 1518.0, aliquota: 0.075 },
    { teto: 2793.0, aliquota: 0.09 },
    { teto: 4190.0, aliquota: 0.12 },
    { teto: 8157.0, aliquota: 0.14 },
  ];
  let desconto = 0;
  let anterior = 0;
  for (const faixa of faixas) {
    if (bruto <= anterior) break;
    const base = Math.min(bruto, faixa.teto) - anterior;
    if (base > 0) desconto += base * faixa.aliquota;
    anterior = faixa.teto;
  }
  return desconto;
};

// IRRF 2026 com tabela tradicional + regra de isenção/transição
export const calcIRRF = (bruto: number, inss: number) => {
  if (bruto <= 5000) return 0;
  const baseCalculo = bruto - inss;
  let irBruto = 0;
  if (baseCalculo <= 2428.8) {
    irBruto = 0;
  } else if (baseCalculo <= 3100.0) {
    irBruto = baseCalculo * 0.075 - 182.16;
  } else if (baseCalculo <= 4100.0) {
    irBruto = baseCalculo * 0.15 - 414.66;
  } else if (baseCalculo <= 5100.0) {
    irBruto = baseCalculo * 0.225 - 722.16;
  } else {
    irBruto = baseCalculo * 0.275 - 908.73;
  }
  if (bruto > 5000 && bruto <= 7350) {
    const redutor = 978.62 - 0.133145 * bruto;
    irBruto = irBruto - redutor;
  }
  return Math.max(irBruto, 0);
};

export type LinhaHistorico = {
  faturamento_total: number;
  meta_mes: number;
  comissao_valor: number;
  salario_bruto: number;
  salario_liquido: number;
  inss: number;
  irrf: number;
  dsr: number;
};

export type LinhaRecalculada = {
  comissao_valor: number;
  dsr: number;
  salario_bruto: number;
  inss: number;
  irrf: number;
  salario_liquido: number;
};

// Recalcula comissão, impostos e salário líquido para um novo faturamento,
// preservando salário fixo, outros descontos e a proporção de DSR derivados da linha original.
export const recalcularLinha = (
  prev: LinhaHistorico,
  novoFaturamento: number
): LinhaRecalculada => {
  // Derivações a partir da linha original
  const comissaoOrig = Number(prev.comissao_valor) || 0;
  const dsrOrig = Number(prev.dsr) || 0;
  const brutoOrig = Number(prev.salario_bruto) || 0;
  const liquidoOrig = Number(prev.salario_liquido) || 0;
  const inssOrig = Number(prev.inss) || 0;
  const irrfOrig = Number(prev.irrf) || 0;

  const ratioDsr = comissaoOrig > 0 ? dsrOrig / comissaoOrig : 0;
  const salarioFixo = Math.max(brutoOrig - comissaoOrig - dsrOrig, 0);
  const outrosDescontos = Math.max(brutoOrig - inssOrig - irrfOrig - liquidoOrig, 0);

  // Recalcular alíquota com base no novo atingimento
  const meta = Number(prev.meta_mes) || 0;
  const atingimento = meta > 0 ? (novoFaturamento / meta) * 100 : 0;
  const aliquota = atingimento < 85 ? 0.5 : atingimento < 100 ? 0.75 : 1.0;

  const comissao = novoFaturamento * (aliquota / 100);
  const dsr = comissao * ratioDsr;
  const salarioBruto = salarioFixo + comissao + dsr;
  const inss = calcINSS(salarioBruto);
  const irrf = calcIRRF(salarioBruto, inss);
  const salarioLiquido = salarioBruto - inss - irrf - outrosDescontos;

  return {
    comissao_valor: comissao,
    dsr,
    salario_bruto: salarioBruto,
    inss,
    irrf,
    salario_liquido: salarioLiquido,
  };
};