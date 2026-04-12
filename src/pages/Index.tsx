import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, DollarSign, Percent, Calculator, CalendarDays, RotateCcw, BadgeCheck, Minus } from "lucide-react";

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// INSS 2026 progressive table
const calcINSS = (bruto: number) => {
  const faixas = [
    { teto: 1518.00, aliquota: 0.075 },
    { teto: 2793.88, aliquota: 0.09 },
    { teto: 4190.83, aliquota: 0.12 },
    { teto: 8157.41, aliquota: 0.14 },
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

// IRRF 2026: isenção até R$5000
const calcIRRF = (bruto: number, inss: number) => {
  const baseCalculo = bruto - inss;
  if (baseCalculo <= 5000) return 0;
  // Alíquota mínima de 7,5% sobre o excedente
  const excedente = baseCalculo - 5000;
  return excedente * 0.075;
};

const Index = () => {
  const [meta, setMeta] = useState("");
  const [faturamento, setFaturamento] = useState("");
  const [salarioFixo, setSalarioFixo] = useState("1993.00");
  const [diasUteis, setDiasUteis] = useState("26");
  const [domingosFeriados, setDomingosFeriados] = useState("5");
  const [outrosDescontos, setOutrosDescontos] = useState("0");

  const metaNum = parseFloat(meta) || 0;
  const fatNum = parseFloat(faturamento) || 0;
  const salarioNum = parseFloat(salarioFixo) || 0;
  const diasUteisNum = parseFloat(diasUteis) || 1;
  const domingosFeriadosNum = parseFloat(domingosFeriados) || 0;

  const atingimento = metaNum > 0 ? (fatNum / metaNum) * 100 : 0;
  const aliquota = atingimento < 85 ? 0.5 : atingimento < 100 ? 0.75 : 1.0;
  const comissao = fatNum * (aliquota / 100);
  const dsr = (comissao / diasUteisNum) * domingosFeriadosNum;
  const salarioBruto = salarioNum + comissao + dsr;

  const inss = calcINSS(salarioBruto);
  const irrf = calcIRRF(salarioBruto, inss);
  const salarioLiquido = salarioBruto - inss - irrf;

  const progressColor =
    atingimento >= 100 ? "bg-success" : atingimento >= 85 ? "bg-warning" : "bg-destructive";

  const handleLimpar = () => {
    setMeta("");
    setFaturamento("");
    setSalarioFixo("1993.00");
    setDiasUteis("26");
    setDomingosFeriados("5");
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-8 pb-12">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Calculator className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Calculadora de Salário
              </h1>
            </div>
            <p className="text-muted-foreground">
              Calcule comissões e salário total dos vendedores
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLimpar} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Limpar
          </Button>
        </div>

        {/* Inputs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="meta">Meta do Mês (R$)</Label>
                <Input id="meta" type="number" placeholder="0,00" value={meta} onChange={(e) => setMeta(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faturamento">Faturamento Realizado (R$)</Label>
                <Input id="faturamento" type="number" placeholder="0,00" value={faturamento} onChange={(e) => setFaturamento(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salario">Salário Fixo (R$)</Label>
                <Input id="salario" type="number" value={salarioFixo} onChange={(e) => setSalarioFixo(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diasUteis">Dias Úteis</Label>
                <Input id="diasUteis" type="number" value={diasUteis} onChange={(e) => setDiasUteis(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domingos">Domingos/Feriados</Label>
                <Input id="domingos" type="number" value={domingosFeriados} onChange={(e) => setDomingosFeriados(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Result Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="border-none shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Atingimento</p>
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-3xl font-bold text-foreground">{atingimento.toFixed(1)}%</p>
              <div className="mt-3 overflow-hidden rounded-full bg-secondary">
                <div className={`h-2 rounded-full transition-all duration-500 ${progressColor}`} style={{ width: `${Math.min(atingimento, 100)}%` }} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Alíquota</p>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-3xl font-bold text-foreground">{aliquota}%</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {atingimento < 85 ? "Abaixo de 85%" : atingimento < 100 ? "Entre 85% e 99,99%" : "Meta atingida!"}
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Comissão</p>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-3xl font-bold text-foreground">{formatCurrency(comissao)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{aliquota}% sobre {formatCurrency(fatNum)}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">DSR</p>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-3xl font-bold text-foreground">{formatCurrency(dsr)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatCurrency(comissao)} / {diasUteisNum} × {domingosFeriadosNum}</p>
            </CardContent>
          </Card>

          <Card className="border-none bg-primary shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-primary-foreground/80">Salário Bruto</p>
                <DollarSign className="h-4 w-4 text-primary-foreground/80" />
              </div>
              <p className="mt-2 text-3xl font-bold text-primary-foreground">{formatCurrency(salarioBruto)}</p>
              <p className="mt-1 text-xs text-primary-foreground/70">Fixo + Comissão + DSR</p>
            </CardContent>
          </Card>
        </div>

        {/* Detalhamento Completo */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Composição do Salário</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                {[
                  { label: "Salário Fixo", value: salarioNum, type: "add" },
                  { label: `Comissão (${aliquota}%)`, value: comissao, type: "add" },
                  { label: `DSR`, value: dsr, type: "add" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between border-b pb-3">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium text-foreground">+ {formatCurrency(item.value)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1">
                  <span className="font-bold text-foreground">Salário Bruto</span>
                  <span className="font-bold text-foreground">{formatCurrency(salarioBruto)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Descontos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <span className="text-muted-foreground">INSS (Progressivo)</span>
                    <p className="text-xs text-muted-foreground/70">7,5% a 14% por faixa</p>
                  </div>
                  <span className="font-medium text-destructive">− {formatCurrency(inss)}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <span className="text-muted-foreground">IRRF</span>
                    <p className="text-xs text-muted-foreground/70">
                      {salarioBruto - inss <= 5000 ? "Isento (base ≤ R$ 5.000)" : "7,5% sobre excedente de R$ 5.000"}
                    </p>
                  </div>
                  <span className={`font-medium ${irrf > 0 ? "text-destructive" : "text-success"}`}>
                    {irrf > 0 ? `− ${formatCurrency(irrf)}` : "Isento"}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-bold text-foreground">Total Descontos</span>
                  <span className="font-bold text-destructive">− {formatCurrency(inss + irrf)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Salário Líquido - Destaque */}
        <Card className="overflow-hidden border-none bg-gradient-to-r from-primary to-primary/80 shadow-lg">
          <CardContent className="py-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-foreground/20">
                <BadgeCheck className="h-6 w-6 text-primary-foreground" />
              </div>
              <p className="text-sm font-medium text-primary-foreground/80">Salário Líquido Estimado</p>
              <p className="text-4xl font-extrabold tracking-tight text-primary-foreground md:text-5xl">
                {formatCurrency(salarioLiquido)}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-primary-foreground/70">
                <span>Bruto: {formatCurrency(salarioBruto)}</span>
                <span className="hidden sm:inline">•</span>
                <span>INSS: −{formatCurrency(inss)}</span>
                <span className="hidden sm:inline">•</span>
                <span>IRRF: {irrf > 0 ? `−${formatCurrency(irrf)}` : "Isento"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Comissões */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tabela de Comissões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Faixa de Atingimento</th>
                    <th className="pb-2 font-medium">Alíquota</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="text-foreground">
                  {[
                    { faixa: "Abaixo de 85%", taxa: "0,50%", active: atingimento < 85 },
                    { faixa: "85% a 99,99%", taxa: "0,75%", active: atingimento >= 85 && atingimento < 100 },
                    { faixa: "100% ou mais", taxa: "1,00%", active: atingimento >= 100 },
                  ].map((row) => (
                    <tr key={row.faixa} className={`border-b last:border-0 ${row.active ? "font-semibold" : "opacity-60"}`}>
                      <td className="py-3">{row.faixa}</td>
                      <td className="py-3">{row.taxa}</td>
                      <td className="py-3">
                        {row.active && metaNum > 0 && (
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Atual</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
