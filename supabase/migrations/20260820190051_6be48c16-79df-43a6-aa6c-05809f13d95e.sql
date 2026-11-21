
-- 1. Assegurar que as políticas de 'profiles' estão corretas
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);

-- 2. Garantir permissões de execução e acesso
GRANT SELECT ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 3. Hardening de funções internas
GRANT EXECUTE ON FUNCTION public.get_busy_slots(date) TO anon;
GRANT EXECUTE ON FUNCTION public.get_busy_slots(date) TO authenticated;
