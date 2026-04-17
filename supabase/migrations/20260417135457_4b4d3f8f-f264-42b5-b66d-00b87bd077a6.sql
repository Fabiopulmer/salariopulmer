-- Create vendas_historico table
CREATE TABLE public.vendas_historico (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mes_referencia TEXT NOT NULL,
  faturamento_total NUMERIC NOT NULL DEFAULT 0,
  meta_mes NUMERIC NOT NULL DEFAULT 0,
  comissao_valor NUMERIC NOT NULL DEFAULT 0,
  salario_liquido NUMERIC NOT NULL DEFAULT 0,
  salario_bruto NUMERIC NOT NULL DEFAULT 0,
  inss NUMERIC NOT NULL DEFAULT 0,
  irrf NUMERIC NOT NULL DEFAULT 0,
  dsr NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vendas_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sales history"
  ON public.vendas_historico FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sales history"
  ON public.vendas_historico FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales history"
  ON public.vendas_historico FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sales history"
  ON public.vendas_historico FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_vendas_historico_updated_at
  BEFORE UPDATE ON public.vendas_historico
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_vendas_historico_user_id ON public.vendas_historico(user_id);
CREATE INDEX idx_vendas_historico_created_at ON public.vendas_historico(created_at DESC);