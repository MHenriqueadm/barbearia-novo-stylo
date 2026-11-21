
-- 1. Hardening customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.customers;
DROP POLICY IF EXISTS "Customers viewable by authenticated" ON public.customers;
CREATE POLICY "Customers viewable by authenticated" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Customers insertable by authenticated" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Customers updatable by authenticated" ON public.customers FOR UPDATE TO authenticated USING (true);
-- Note: create_public_appointment RPC uses service_role internally or handle_customer logic which bypasses RLS if needed. 
-- If it uses the table directly, we might need a specific policy.
-- Let's check create_public_appointment later.

-- 2. Hardening appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.appointments;
DROP POLICY IF EXISTS "Appointments viewable by authenticated" ON public.appointments;
CREATE POLICY "Appointments viewable by authenticated" ON public.appointments FOR SELECT TO authenticated USING (true);
-- Creation is handled via RPCs (create_public_appointment for anon, direct for admin).

-- 3. Hardening payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.payments;
CREATE POLICY "Payments viewable by authenticated" ON public.payments FOR SELECT TO authenticated USING (true);

-- 4. Hardening financial_transactions
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.financial_transactions;
CREATE POLICY "Finance viewable by authenticated" ON public.financial_transactions FOR SELECT TO authenticated USING (true);

-- 5. Hardening cash_sessions
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.cash_sessions;
CREATE POLICY "Cash sessions viewable by authenticated" ON public.cash_sessions FOR SELECT TO authenticated USING (true);

-- 6. business_breaks (Must be public for availability)
ALTER TABLE public.business_breaks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.business_breaks;
CREATE POLICY "Public read business_breaks" ON public.business_breaks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin write business_breaks" ON public.business_breaks FOR ALL TO authenticated USING (true);

-- 7. services (Public catalog)
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.services;
CREATE POLICY "Public read services" ON public.services FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin write services" ON public.services FOR ALL TO authenticated USING (true);

-- 8. professionals (Public catalog)
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for all users" ON public.professionals;
CREATE POLICY "Public read professionals" ON public.professionals FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin write professionals" ON public.professionals FOR ALL TO authenticated USING (true);

-- 9. Storage policies (barbershop-assets bucket)
-- We'll do this via migration but usually bucket policies are separate.
-- Assuming standard Supabase storage.objects policies:
-- SELECT: anon & authenticated
-- INSERT/UPDATE/DELETE: authenticated only
