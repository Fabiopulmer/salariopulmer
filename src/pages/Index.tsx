import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, DollarSign, Percent, Calculator, CalendarDays, RotateCcw, BadgeCheck, Minus, Rocket, Flame, Save, LogOut, History } from "lucide-react";

const formatCurrency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// INSS 2026 progressive table
const calcINSS = (bruto: number) => {
  const faixas = [
    { teto: 1518.00, aliquota: 0.075 },
    { teto: 2793.00, aliquota: 0.09 },
    { teto: 4190.00, aliquota: 0.12 },
    { teto: 8157.00, aliquota: 0.14 },
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
const calcIRRF = (bruto: number, inss: number) => {
  // Regra 1: isenção total se bruto <= 5000
  if (bruto <= 5000) return 0;

  const baseCalculo = bruto - inss;

  // Tabela progressiva IRRF 2026
  let irBruto = 0;
  if (baseCalculo <= 2428.80) {
    irBruto = 0;
  } else if (baseCalculo <= 3100.00) {
    irBruto = baseCalculo * 0.075 - 182.16;
  } else if (baseCalculo <= 4100.00) {
    irBruto = baseCalculo * 0.15 - 414.66;
  } else if (baseCalculo <= 5100.00) {
    irBruto = baseCalculo * 0.225 - 722.16;
  } else {
    irBruto = baseCalculo * 0.275 - 908.73;
  }

  // Regra de transição: bruto entre 5000.01 e 7350
  if (bruto > 5000 && bruto <= 7350) {
    const redutor = 978.62 - (0.133145 * bruto);
    irBruto = irBruto - redutor;
  }

  return Math.max(irBruto, 0);
};

const Index = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  const [mesReferencia, setMesReferencia] = useState("");
  const [meta, setMeta] = useState("");
  const [faturamento, setFaturamento] = useState("");
  const [salarioFixo, setSalarioFixo] = useState("2157.00");
  const [diasUteis, setDiasUteis] = useState("26");
  const [domingosFeriados, setDomingosFeriados] = useState("5");
  const [diasUteisRestantes, setDiasUteisRestantes] = useState("10");
  const [outrosDescontos, setOutrosDescontos] = useState("0");

  const loadUserData = async (uid: string) => {
    // 1) Configurações pessoais (salário fixo, outros descontos padrão)
    const { data: cfg } = await supabase
      .from("user_configuracoes")
      .select("salario_fixo, outros_descontos")
      .eq("user_id", uid)
      .maybeSingle();
    if (cfg) {
      if (cfg.salario_fixo) setSalarioFixo(String(cfg.salario_fixo));
      if (cfg.outros_descontos) setOutrosDescontos(String(cfg.outros_descontos));
    }
    // 2) Último mês salvo
    const { data: ultimo } = await supabase
      .from("vendas_historico")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (ultimo) {
      setMesReferencia(ultimo.mes_referencia ?? "");
      setMeta(String(ultimo.meta_mes ?? ""));
      setFaturamento(String(ultimo.faturamento_total ?? ""));
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const uid = session?.user.id ?? null;
      setUserId(uid);
      setAuthChecked(true);
      if (!session) {
        navigate("/auth", { replace: true });
      } else if (uid) {
        setTimeout(() => loadUserData(uid), 0);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user.id ?? null;
      setUserId(uid);
      setAuthChecked(true);
      if (!session) {
        navigate("/auth", { replace: true });
      } else if (uid) {
        loadUserData(uid);
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const metaNum = parseFloat(meta) || 0;
  const fatNum = parseFloat(faturamento) || 0;
  const salarioNum = parseFloat(salarioFixo) || 0;
  const diasUteisNum = parseFloat(diasUteis) || 1;
  const domingosFeriadosNum = parseFloat(domingosFeriados) || 0;
  const outrosDescontosNum = parseFloat(outrosDescontos) || 0;
  const diasUteisRestantesNum = parseFloat(diasUteisRestantes) || 1;

  const atingimento = metaNum > 0 ? (fatNum / metaNum) * 100 : 0;
  const aliquota = atingimento < 85 ? 0.5 : atingimento < 100 ? 0.75 : 1.0;
  const comissao = fatNum * (aliquota / 100);
  const dsr = (comissao / diasUteisNum) * domingosFeriadosNum;
  const salarioBruto = salarioNum + comissao + dsr;

  const inss = calcINSS(salarioBruto);
  const irrf = calcIRRF(salarioBruto, inss);
  const salarioLiquido = salarioBruto - inss - irrf - outrosDescontosNum;

  const progressColor =
    atingimento >= 100 ? "bg-success" : atingimento >= 85 ? "bg-warning" : "bg-destructive";

  const metaBatida = fatNum >= metaNum && metaNum > 0;
  const valorRestante = metaNum - fatNum;
  const metaDiaria = diasUteisRestantesNum > 0 ? valorRestante / diasUteisRestantesNum : 0;

  const handleLimpar = () => {
    setMesReferencia("");
    setMeta("");
    setFaturamento("");
    setSalarioFixo("2157.00");
    setDiasUteis("26");
    setDomingosFeriados("5");
    setDiasUteisRestantes("10");
    setOutrosDescontos("0");
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth", { replace: true });
  };

  const handleSalvarMes = async () => {
    if (!userId) {
      toast.error("Você precisa estar logado para salvar.");
      return;
    }
    if (!mesReferencia.trim()) {
      toast.error("Informe o mês de referência (ex: 03/2026).");
      return;
    }
    if (metaNum <= 0 || fatNum <= 0) {
      toast.error("Preencha meta e faturamento antes de salvar.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("vendas_historico").insert({
      user_id: userId,
      mes_referencia: mesReferencia.trim(),
      faturamento_total: fatNum,
      meta_mes: metaNum,
      comissao_valor: comissao,
      salario_liquido: salarioLiquido,
      salario_bruto: salarioBruto,
      inss,
      irrf,
      dsr,
    });
    // Persiste as configurações pessoais para reuso no próximo login
    await supabase.from("user_configuracoes").upsert(
      {
        user_id: userId,
        salario_fixo: salarioNum,
        outros_descontos: outrosDescontosNum,
      },
      { onConflict: "user_id" }
    );
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success(`Mês ${mesReferencia} salvo com sucesso!`);
    }
  };

  if (!authChecked) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">Carregando...</div>;
  }

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
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => navigate("/historico")} className="gap-2">
              <History className="h-4 w-4" />
              Histórico
            </Button>
            <Button variant="outline" size="sm" onClick={handleLimpar} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Limpar
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>

        {/* Inputs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="mesRef">Mês de Referência</Label>
                <Input id="mesRef" type="text" placeholder="03/2026" value={mesReferencia} onChange={(e) => setMesReferencia(e.target.value)} />
              </div>
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
            <div className="mt-4 border-t border-dashed pt-4">
              <div className="space-y-2 sm:max-w-xs">
                <Label htmlFor="outrosDescontos">Outros Descontos (R$)</Label>
                <Input id="outrosDescontos" type="number" placeholder="0,00" value={outrosDescontos} onChange={(e) => setOutrosDescontos(e.target.value)} className="border-muted-foreground/30 bg-muted/50" />
                <p className="text-xs text-muted-foreground">Convênio, Vale Refeição, Faltas, etc.</p>
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

        {/* Ritmo de Vendas */}
        <Card className="overflow-hidden border-2 border-highlight/30 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Flame className="h-5 w-5 text-highlight" />
              Ritmo de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metaBatida ? (
              <div className="flex flex-col items-center gap-3 rounded-lg bg-success/10 p-6 text-center">
                <Rocket className="h-10 w-10 text-success" />
                <p className="text-xl font-bold text-success">🚀 Meta Alcançada!</p>
                <p className="text-sm text-muted-foreground">
                  Tudo o que vier agora é bônus no comissionamento de 1%!
                </p>
                <p className="text-2xl font-extrabold text-success">
                  +{formatCurrency(fatNum - metaNum)} acima da meta
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="diasRestantes">Dias Úteis Restantes</Label>
                  <Input
                    id="diasRestantes"
                    type="number"
                    value={diasUteisRestantes}
                    onChange={(e) => setDiasUteisRestantes(e.target.value)}
                  />
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg bg-muted/50 p-4">
                  <p className="text-xs font-medium text-muted-foreground">Valor Restante</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{formatCurrency(valorRestante > 0 ? valorRestante : 0)}</p>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg bg-highlight/10 p-4">
                  <p className="text-xs font-medium text-highlight">Meta Diária Necessária</p>
                  <p className="mt-1 text-3xl font-extrabold text-highlight">
                    {formatCurrency(metaDiaria > 0 ? metaDiaria : 0)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">por dia útil restante</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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
                    <p className="text-xs text-muted-foreground/70">Faixas: 7,5% · 9% · 12% · 14% (teto R$ 8.157)</p>
                  </div>
                  <span className="font-medium text-destructive">− {formatCurrency(inss)}</span>
                </div>
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <span className="text-muted-foreground">IRRF</span>
                    <p className="text-xs text-muted-foreground/70">
                      {salarioBruto <= 5000
                        ? "Isento (bruto ≤ R$ 5.000)"
                        : salarioBruto <= 7350
                        ? "Tabela progressiva c/ redutor de transição"
                        : "Tabela progressiva (sem redutor)"}
                    </p>
                  </div>
                  <span className={`font-medium ${irrf > 0 ? "text-destructive" : "text-success"}`}>
                    {irrf > 0 ? `− ${formatCurrency(irrf)}` : "Isento"}
                  </span>
                </div>
                {outrosDescontosNum > 0 && (
                  <div className="flex items-center justify-between border-b pb-3">
                    <div>
                      <span className="text-muted-foreground">Outros Descontos</span>
                      <p className="text-xs text-muted-foreground/70">Convênio, VR, Faltas, etc.</p>
                    </div>
                    <span className="font-medium text-muted-foreground">− {formatCurrency(outrosDescontosNum)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="font-bold text-foreground">Total Descontos</span>
                  <span className="font-bold text-destructive">− {formatCurrency(inss + irrf + outrosDescontosNum)}</span>
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
                {outrosDescontosNum > 0 && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span>Outros: −{formatCurrency(outrosDescontosNum)}</span>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Salvar Mês */}
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-6 sm:flex-row sm:justify-between">
            <div className="text-center sm:text-left">
              <p className="font-semibold text-foreground">Salvar este mês no histórico</p>
              <p className="text-xs text-muted-foreground">
                Salva mês de referência, faturamento, meta, comissão e salário líquido na sua conta.
              </p>
            </div>
            <Button onClick={handleSalvarMes} disabled={saving} className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? "Salvando..." : "Salvar Mês"}
            </Button>
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
