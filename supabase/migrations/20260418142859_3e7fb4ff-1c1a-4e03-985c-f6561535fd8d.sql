-- Tabela de configurações do usuário
CREATE TABLE public.user_configuracoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  salario_fixo NUMERIC NOT NULL DEFAULT 0,
  meta_padrao NUMERIC NOT NULL DEFAULT 0,
  percentual_comissao_padrao NUMERIC NOT NULL DEFAULT 0,
  outros_descontos NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_configuracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own config"
ON public.user_configuracoes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own config"
ON public.user_configuracoes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own config"
ON public.user_configuracoes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own config"
ON public.user_configuracoes FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_user_configuracoes_updated_at
BEFORE UPDATE ON public.user_configuracoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();