
-- Enable read access for anon and authenticated roles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'financial_transactions' 
        AND policyname = 'Allow public read'
    ) THEN
        CREATE POLICY "Allow public read" ON public.financial_transactions FOR SELECT TO anon, authenticated USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'payments' 
        AND policyname = 'Allow public read'
    ) THEN
        CREATE POLICY "Allow public read" ON public.payments FOR SELECT TO anon, authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'appointments' 
        AND policyname = 'Allow public read'
    ) THEN
        CREATE POLICY "Allow public read" ON public.appointments FOR SELECT TO anon, authenticated USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'customers' 
        AND policyname = 'Allow public read'
    ) THEN
        CREATE POLICY "Allow public read" ON public.customers FOR SELECT TO anon, authenticated USING (true);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'cash_sessions' 
        AND policyname = 'Allow public read'
    ) THEN
        CREATE POLICY "Allow public read" ON public.cash_sessions FOR SELECT TO anon, authenticated USING (true);
    END IF;
END
$$;

-- Grant select on all relevant tables to anon and authenticated
GRANT SELECT ON public.financial_transactions TO anon, authenticated;
GRANT SELECT ON public.payments TO anon, authenticated;
GRANT SELECT ON public.appointments TO anon, authenticated;
GRANT SELECT ON public.customers TO anon, authenticated;
GRANT SELECT ON public.cash_sessions TO anon, authenticated;
GRANT SELECT ON public.professionals TO anon, authenticated;
GRANT SELECT ON public.services TO anon, authenticated;
