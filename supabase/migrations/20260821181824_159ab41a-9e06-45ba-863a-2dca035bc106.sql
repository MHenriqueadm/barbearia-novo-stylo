-- 1. Restaurar privilégios SELECT anon que foram revogados indevidamente por engano ou REVOKE global
GRANT SELECT ON public.barbershops TO anon;
GRANT SELECT ON public.barbershop_settings TO anon;
GRANT SELECT ON public.services TO anon;
GRANT SELECT ON public.professionals TO anon;
GRANT SELECT ON public.professional_services TO anon;
GRANT SELECT ON public.business_hours TO anon;
GRANT SELECT ON public.professional_schedules TO anon;
GRANT SELECT ON public.professional_breaks TO anon;

-- 2. Garantir que as policies RLS para anon existam (usando IF NOT EXISTS via DO block para evitar erros)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read barbershops') THEN
        CREATE POLICY "Public read barbershops" ON public.barbershops FOR SELECT TO anon USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read settings') THEN
        CREATE POLICY "Public read settings" ON public.barbershop_settings FOR SELECT TO anon USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read services') THEN
        CREATE POLICY "Public read services" ON public.services FOR SELECT TO anon USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read professionals') THEN
        CREATE POLICY "Public read professionals" ON public.professionals FOR SELECT TO anon USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read professional_services') THEN
        CREATE POLICY "Public read professional_services" ON public.professional_services FOR SELECT TO anon USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read business_hours') THEN
        CREATE POLICY "Public read business_hours" ON public.business_hours FOR SELECT TO anon USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read schedules') THEN
        CREATE POLICY "Public read schedules" ON public.professional_schedules FOR SELECT TO anon USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read breaks') THEN
        CREATE POLICY "Public read breaks" ON public.professional_breaks FOR SELECT TO anon USING (true);
    END IF;
END $$;
