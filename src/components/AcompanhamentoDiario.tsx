import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CalendarCheck, Save } from "lucide-react";

const formatCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Lancamento = { dia: string; valor: number };

interface Props {
  userId: string | null;
  mesReferencia: string;
  onTotalChange: (total: number) => void;
}

const parseMesAno = (s: string) => {
  const m = s.trim().match(/^(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const mes = parseInt(m[1], 10);
  const ano = parseInt(m[2], 10);
  if (mes < 1 || mes > 12) return null;
  return { mes, ano };
};

const isoDay = (ano: number, mes: number, dia: number) =>
  `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

const AcompanhamentoDiario = ({ userId, mesReferencia, onTotalChange }: Props) => {
  const [lancamentos, setLancamentos] = useState<Record<string, string>>({});
  const [savingDay, setSavingDay] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const parsed = parseMesAno(mesReferencia);

  const dias = useMemo(() => {
    if (!parsed) return [] as { iso: string; dia: number; dow: number }[];
    const { mes, ano } = parsed;
    const qtd = new Date(ano, mes, 0).getDate();
    const arr: { iso: string; dia: number; dow: number }[] = [];
    for (let d = 1; d <= qtd; d++) {
      const dt = new Date(ano, mes - 1, d);
      arr.push({ iso: isoDay(ano, mes, d), dia: d, dow: dt.getDay() });
    }
    return arr;
  }, [parsed?.mes, parsed?.ano]);

  useEffect(() => {
    if (!userId || !parsed) return;
    let cancel = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("vendas_diarias")
        .select("dia, valor")
        .eq("user_id", userId)
        .eq("mes_referencia", mesReferencia);
      if (cancel) return;
      if (error) {
        toast.error("Erro ao carregar vendas diárias: " + error.message);
      } else {
        const map: Record<string, string> = {};
        (data as Lancamento[] | null)?.forEach((r) => {
          map[r.dia] = String(Number(r.valor) || 0);
        });
        setLancamentos(map);
      }
      setLoading(false);
    })();
    return () => {
      cancel = true;
    };
  }, [userId, mesReferencia]);

  const total = useMemo(
    () =>
      Object.values(lancamentos).reduce(
        (acc, v) => acc + (parseFloat(v) || 0),
        0,
      ),
    [lancamentos],
  );

  useEffect(() => {
    onTotalChange(total);
  }, [total, onTotalChange]);

  const handleBlur = async (iso: string, raw: string) => {
    if (!userId) return;
    const valor = parseFloat(raw) || 0;
    setSavingDay(iso);
    const { error } = await supabase
      .from("vendas_diarias")
      .upsert(
        { user_id: userId, mes_referencia: mesReferencia, dia: iso, valor },
        { onConflict: "user_id,dia" },
      );
    setSavingDay(null);
    if (error) toast.error("Erro ao salvar dia: " + error.message);
  };

  const hojeIso = (() => {
    const h = new Date();
    return isoDay(h.getFullYear(), h.getMonth() + 1, h.getDate());
  })();

  if (!parsed) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarCheck className="h-5 w-5 text-primary" />
          Acompanhamento Diário — {mesReferencia}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-xs text-muted-foreground">
          Lance suas vendas dia a dia. Os valores são salvos automaticamente ao sair do campo.
          Dias passados podem ser editados em caso de devolução ou cancelamento. O total alimenta o
          <strong> Faturamento Realizado</strong> da calculadora.
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {dias.map(({ iso, dia, dow }) => {
            const ehDomingo = dow === 0;
            const ehHoje = iso === hojeIso;
            const valor = lancamentos[iso] ?? "";
            return (
              <div
                key={iso}
                className={`rounded-md border p-2 ${
                  ehHoje
                    ? "border-primary bg-primary/5"
                    : ehDomingo
                    ? "border-muted-foreground/20 bg-muted/30"
                    : "border-border"
                }`}
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Dia {dia}</span>
                  <span className="text-[10px] uppercase text-muted-foreground">
                    {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][dow]}
                  </span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="0,00"
                    value={valor}
                    disabled={loading}
                    onChange={(e) =>
                      setLancamentos((prev) => ({ ...prev, [iso]: e.target.value }))
                    }
                    onBlur={(e) => handleBlur(iso, e.target.value)}
                    className="h-8 text-sm"
                  />
                  {savingDay === iso && (
                    <Save className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 animate-pulse text-primary" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-md bg-primary/10 px-4 py-3">
          <span className="text-sm font-medium text-muted-foreground">Total do mês (acumulado)</span>
          <span className="text-xl font-bold text-primary">{formatCurrency(total)}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default AcompanhamentoDiario;