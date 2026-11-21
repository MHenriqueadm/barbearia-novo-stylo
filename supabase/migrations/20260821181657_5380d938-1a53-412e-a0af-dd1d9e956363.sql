-- 1. Criar função auxiliar SECURITY DEFINER corrigida (active em vez de status)
CREATE OR REPLACE FUNCTION public.check_is_barbershop_member(_barbershop_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.barbershop_users
    WHERE user_id = auth.uid()
      AND barbershop_id = _barbershop_id
      AND active = true
  );
$$;

-- 2. Limpar todas as policies existentes nas tabelas críticas
DO $$ 
DECLARE 
    pol RECORD;
BEGIN 
    FOR pol IN 
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename IN ('payments', 'financial_transactions', 'cash_sessions', 'customers', 'appointments')
    LOOP 
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 3. PAYMENTS
REVOKE ALL ON public.payments FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage payments of their barbershop" ON public.payments FOR ALL TO authenticated USING (public.check_is_barbershop_member(barbershop_id)) WITH CHECK (public.check_is_barbershop_member(barbershop_id));

-- 4. FINANCIAL_TRANSACTIONS
REVOKE ALL ON public.financial_transactions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_transactions TO authenticated;
GRANT ALL ON public.financial_transactions TO service_role;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage transactions of their barbershop" ON public.financial_transactions FOR ALL TO authenticated USING (public.check_is_barbershop_member(barbershop_id)) WITH CHECK (public.check_is_barbershop_member(barbershop_id));

-- 5. CASH_SESSIONS
REVOKE ALL ON public.cash_sessions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_sessions TO authenticated;
GRANT ALL ON public.cash_sessions TO service_role;
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage cash sessions of their barbershop" ON public.cash_sessions FOR ALL TO authenticated USING (public.check_is_barbershop_member(barbershop_id)) WITH CHECK (public.check_is_barbershop_member(barbershop_id));

-- 6. CUSTOMERS
REVOKE ALL ON public.customers FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage customers of their barbershop" ON public.customers FOR ALL TO authenticated USING (public.check_is_barbershop_member(barbershop_id)) WITH CHECK (public.check_is_barbershop_member(barbershop_id));

-- 7. APPOINTMENTS
REVOKE ALL ON public.appointments FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage appointments of their barbershop" ON public.appointments FOR ALL TO authenticated USING (public.check_is_barbershop_member(barbershop_id)) WITH CHECK (public.check_is_barbershop_member(barbershop_id));

-- 8. STORAGE RLS POLICIES
-- Nota: Buckets serão criados em paralelo via ferramenta dedicada
CREATE POLICY "Public Read for Logos" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'barbershop-logos');
CREATE POLICY "Public Read for Service Photos" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'service-photos');
CREATE POLICY "Public Read for Avatars" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'professional-avatars');
CREATE POLICY "Authenticated manage logos" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'barbershop-logos') WITH CHECK (bucket_id = 'barbershop-logos');
CREATE POLICY "Authenticated manage photos" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'service-photos') WITH CHECK (bucket_id = 'service-photos');
CREATE POLICY "Authenticated manage avatars" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'professional-avatars') WITH CHECK (bucket_id = 'professional-avatars');
