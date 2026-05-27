CREATE TABLE public.vendas_diarias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mes_referencia TEXT NOT NULL,
  dia DATE NOT NULL,
  valor NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, dia)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendas_diarias TO authenticated;
GRANT ALL ON public.vendas_diarias TO service_role;

ALTER TABLE public.vendas_diarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own daily sales" ON public.vendas_diarias FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own daily sales" ON public.vendas_diarias FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own daily sales" ON public.vendas_diarias FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own daily sales" ON public.vendas_diarias FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_vendas_diarias_updated_at
BEFORE UPDATE ON public.vendas_diarias
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_vendas_diarias_user_mes ON public.vendas_diarias(user_id, mes_referencia);