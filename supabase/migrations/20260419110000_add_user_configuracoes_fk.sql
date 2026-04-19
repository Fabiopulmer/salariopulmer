DELETE FROM public.user_configuracoes uc
WHERE NOT EXISTS (
  SELECT 1
  FROM auth.users au
  WHERE au.id = uc.user_id
);

ALTER TABLE public.user_configuracoes
ADD CONSTRAINT user_configuracoes_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;
