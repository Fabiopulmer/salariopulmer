-- Remove duplicates first (keep most recent per user/mes)
DELETE FROM public.vendas_historico v
USING public.vendas_historico v2
WHERE v.user_id = v2.user_id
  AND v.mes_referencia = v2.mes_referencia
  AND v.created_at < v2.created_at;

ALTER TABLE public.vendas_historico
ADD CONSTRAINT vendas_historico_user_mes_unique UNIQUE (user_id, mes_referencia);