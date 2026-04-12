import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingUp, DollarSign, Percent, Calculator, CalendarDays } from "lucide-react";

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const Index = () => {
  const [meta, setMeta] = useState("");
  const [faturamento, setFaturamento] = useState("");
  const [salarioFixo, setSalarioFixo] = useState("1993.00");

  const metaNum = parseFloat(meta) || 0;
  const fatNum = parseFloat(faturamento) || 0;
  const salarioNum = parseFloat(salarioFixo) || 0;

  const atingimento = metaNum > 0 ? (fatNum / metaNum) * 100 : 0;
  const aliquota = atingimento < 85 ? 0.5 : atingimento < 100 ? 0.75 : 1.0;
  const comissao = fatNum * (aliquota / 100);
  const salarioTotal = salarioNum + comissao;

  const progressColor =
    atingimento >= 100 ? "bg-success" : atingimento >= 85 ? "bg-warning" : "bg-destructive";

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* Header */}
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

        {/* Inputs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="meta">Meta do Mês (R$)</Label>
                <Input
                  id="meta"
                  type="number"
                  placeholder="0,00"
                  value={meta}
                  onChange={(e) => setMeta(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faturamento">Faturamento Realizado (R$)</Label>
                <Input
                  id="faturamento"
                  type="number"
                  placeholder="0,00"
                  value={faturamento}
                  onChange={(e) => setFaturamento(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salario">Salário Fixo (R$)</Label>
                <Input
                  id="salario"
                  type="number"
                  value={salarioFixo}
                  onChange={(e) => setSalarioFixo(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Result Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Atingimento */}
          <Card className="border-none shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Atingimento</p>
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {atingimento.toFixed(1)}%
              </p>
              <div className="mt-3 overflow-hidden rounded-full bg-secondary">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${progressColor}`}
                  style={{ width: `${Math.min(atingimento, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Alíquota */}
          <Card className="border-none shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Alíquota</p>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-3xl font-bold text-foreground">{aliquota}%</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {atingimento < 85
                  ? "Abaixo de 85%"
                  : atingimento < 100
                  ? "Entre 85% e 99,99%"
                  : "Meta atingida!"}
              </p>
            </CardContent>
          </Card>

          {/* Comissão */}
          <Card className="border-none shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Comissão</p>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-2 text-3xl font-bold text-foreground">
                {formatCurrency(comissao)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {aliquota}% sobre {formatCurrency(fatNum)}
              </p>
            </CardContent>
          </Card>

          {/* Salário Total */}
          <Card className="border-none bg-primary shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-primary-foreground/80">Salário Total</p>
                <DollarSign className="h-4 w-4 text-primary-foreground/80" />
              </div>
              <p className="mt-2 text-3xl font-bold text-primary-foreground">
                {formatCurrency(salarioTotal)}
              </p>
              <p className="mt-1 text-xs text-primary-foreground/70">
                Fixo + Comissão
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer table */}
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
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            Atual
                          </span>
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
