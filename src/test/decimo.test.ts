import { describe, it, expect } from "vitest";
import { mediaVariavel, calcularDecimoEFerias, calcINSS, calcIRRF } from "@/lib/calculos";

describe("13º e férias com média variável", () => {
  it("média usa comissão + DSR apenas dos meses do ano", () => {
    const m = mediaVariavel([
      { mes_referencia: "01/2026", comissao_valor: 1000, dsr: 200 },
      { mes_referencia: "02/2026", comissao_valor: 2000, dsr: 400 },
      { mes_referencia: "12/2025", comissao_valor: 9999, dsr: 999 },
    ], 2026);
    expect(m).toBe(1800);
  });
  it("13º = fixo + média, metade em novembro e metade em dezembro", () => {
    const r = calcularDecimoEFerias(2157, 1800);
    expect(r.decimoTotal).toBe(3957);
    expect(r.parcelaNovembro).toBe(1978.5);
    expect(r.parcelaDezembro).toBe(1978.5);
  });
  it("férias = fixo + média, mais 1/3", () => {
    const r = calcularDecimoEFerias(2157, 1800);
    expect(r.ferias).toBe(3957);
    expect(r.tercoFerias).toBeCloseTo(1319, 2);
  });
  it("férias líquidas descontam INSS e IRRF sobre férias + 1/3", () => {
    const r = calcularDecimoEFerias(2157, 1800);
    const bruto = 3957 + 1319;
    expect(r.inssFerias).toBeCloseTo(calcINSS(bruto), 2);
    expect(r.feriasLiquidas).toBeCloseTo(bruto - r.inssFerias - calcIRRF(bruto, r.inssFerias), 2);
    expect(r.feriasLiquidas).toBeLessThan(bruto);
  });
  it("1ª parcela sem descontos; 2ª desconta INSS do 13º total", () => {
    const r = calcularDecimoEFerias(2157, 1800);
    expect(r.parcelaNovembro).toBe(1978.5);
    expect(r.inssDecimo).toBeCloseTo(calcINSS(3957), 2);
    expect(r.parcelaDezembroLiquida).toBeCloseTo(1978.5 - r.inssDecimo - r.irrfDecimo, 2);
  });
});
