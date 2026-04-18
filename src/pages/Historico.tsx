import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { ArrowLeft, Download, History, Target } from "lucide-react";

type Registro = {
  id: string;
  mes_referencia: string;
  faturamento_total: number;
  meta_mes: number;
  comissao_valor: number;
  salario_liquido: number;
  created_at: string;
};

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const Historico = () => {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registros, setRegistros] = useState<Registro[]>([]);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth", { replace: true });
        return;
      }
      setAuthChecked(true);
      const { data, error } = await supabase
        .from("vendas_historico")
        .select("id, mes_referencia, faturamento_total, meta_mes, comissao_valor, salario_liquido, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: true });
      if (error) {
        toast.error("Erro ao carregar histórico: " + error.message);
      } else {
        setRegistros((data ?? []) as Registro[]);
      }
      setLoading(false);
    };
    init();
  }, [navigate]);

  const { metasBatidas, metasNaoBatidas } = useMemo(() => {
    let bat = 0;
    let nao = 0;
    for (const r of registros) {
      if (r.meta_mes > 0 && r.faturamento_total >= r.meta_mes) bat++;
      else nao++;
    }
    return { metasBatidas: bat, metasNaoBatidas: nao };
  }, [registros]);

  const chartData = registros.map((r) => ({
    mes: r.mes_referencia,
    liquido: Number(r.salario_liquido) || 0,
  }));

  const pieData = [
    { name: "Metas Batidas", value: metasBatidas },
    { name: "Não Batidas", value: metasNaoBatidas },
  ];
  const PIE_COLORS = ["hsl(var(--success))", "hsl(var(--muted-foreground))"];

  const handleExportCSV = () => {
    if (!registros.length) {
      toast.error("Nenhum registro para exportar.");
      return;
    }
    const header = ["Mes/Ano", "Faturamento", "Meta", "% da Meta", "Comissao", "Salario Liquido"];
    const rows = registros.map((r) => {
      const pct = r.meta_mes > 0 ? ((r.faturamento_total / r.meta_mes) * 100).toFixed(1) : "0";
      return [
        r.mes_referencia,
        r.faturamento_total.toFixed(2),
        r.meta_mes.toFixed(2),
        pct,
        r.comissao_valor.toFixed(2),
        r.salario_liquido.toFixed(2),
      ].join(";");
    });
    const csv = [header.join(";"), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historico-performance-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Histórico exportado!");
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
        Carregando...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8 pb-12">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <History className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Histórico de Performance
              </h1>
            </div>
            <p className="text-muted-foreground">
              Sua evolução mês a mês — apenas seus dados
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <Button size="sm" onClick={handleExportCSV} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar Histórico
            </Button>
          </div>
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Carregando dados...
            </CardContent>
          </Card>
        ) : registros.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum mês salvo ainda. Volte à calculadora e clique em "Salvar Mês".
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Indicadores */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="border-none shadow-md">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-muted-foreground">Meses registrados</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">{registros.length}</p>
                </CardContent>
              </Card>
              <Card className="border-none bg-success/10 shadow-md">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-success">Metas batidas (100%+)</p>
                    <Target className="h-4 w-4 text-success" />
                  </div>
                  <p className="mt-2 text-3xl font-bold text-success">{metasBatidas}</p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md">
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-muted-foreground">Taxa de sucesso</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">
                    {((metasBatidas / registros.length) * 100).toFixed(0)}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabela */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mês/Ano</TableHead>
                      <TableHead className="text-right">Faturamento</TableHead>
                      <TableHead className="text-right">% da Meta</TableHead>
                      <TableHead className="text-right">Comissão</TableHead>
                      <TableHead className="text-right">Salário Líquido</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registros.map((r) => {
                      const pct = r.meta_mes > 0 ? (r.faturamento_total / r.meta_mes) * 100 : 0;
                      const batida = pct >= 100;
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.mes_referencia}</TableCell>
                          <TableCell className="text-right">{formatCurrency(r.faturamento_total)}</TableCell>
                          <TableCell className={`text-right font-medium ${batida ? "text-success" : "text-muted-foreground"}`}>
                            {pct.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(r.comissao_valor)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(r.salario_liquido)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Gráficos */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Evolução do Salário Líquido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="mes" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${(v/1000).toFixed(1)}k`} />
                        <Tooltip
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "0.5rem",
                          }}
                        />
                        <Bar dataKey="liquido" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Salário Líquido" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Metas Batidas no Período</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={90}
                          label={(entry) => `${entry.name}: ${entry.value}`}
                        >
                          {pieData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i]} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "0.5rem",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Historico;
