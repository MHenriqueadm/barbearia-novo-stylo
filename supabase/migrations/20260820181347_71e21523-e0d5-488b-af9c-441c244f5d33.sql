-- 1. APPOINTMENTS: remove public read
DROP POLICY IF EXISTS "Allow anon select on appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow public read" ON public.appointments;
REVOKE ALL ON public.appointments FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;

-- 2. CUSTOMERS
DROP POLICY IF EXISTS "Allow public read" ON public.customers;
REVOKE ALL ON public.customers FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
DROP POLICY IF EXISTS "Authenticated users can delete customers" ON public.customers;
CREATE POLICY "Authenticated users can delete customers" ON public.customers FOR DELETE TO authenticated USING (true);

-- 3. PAYMENTS / FINANCIAL_TRANSACTIONS / CASH_SESSIONS
DROP POLICY IF EXISTS "Allow public read" ON public.payments;
DROP POLICY IF EXISTS "Allow public read" ON public.financial_transactions;
DROP POLICY IF EXISTS "Allow public read" ON public.cash_sessions;
REVOKE ALL ON public.payments FROM anon;
REVOKE ALL ON public.financial_transactions FROM anon;
REVOKE ALL ON public.cash_sessions FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financial_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cash_sessions TO authenticated;
GRANT ALL ON public.payments, public.financial_transactions, public.cash_sessions TO service_role;

-- 4. BUSINESS_BREAKS: anon read-only
DROP POLICY IF EXISTS "Allow all access to business_breaks for everyone" ON public.business_breaks;
DROP POLICY IF EXISTS "Public read business_breaks" ON public.business_breaks;
DROP POLICY IF EXISTS "Allow public read of business breaks" ON public.business_breaks;
CREATE POLICY "Anyone can read business_breaks" ON public.business_breaks FOR SELECT TO anon, authenticated USING (true);
REVOKE ALL ON public.business_breaks FROM anon;
GRANT SELECT ON public.business_breaks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_breaks TO authenticated;
GRANT ALL ON public.business_breaks TO service_role;

-- 5. Catalog tables: anon read-only, authenticated full manage
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['barbershop_settings','business_hours','services','professionals','professional_services','professional_schedules','professional_breaks','professional_blocks']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Public access to ' || replace(t,'_',' '), t);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Public access to barbershop settings" ON public.barbershop_settings;
DROP POLICY IF EXISTS "Public access to business hours" ON public.business_hours;
DROP POLICY IF EXISTS "Public access to services" ON public.services;
DROP POLICY IF EXISTS "Public access to professionals" ON public.professionals;
DROP POLICY IF EXISTS "Public access to professional services" ON public.professional_services;
DROP POLICY IF EXISTS "Public access to professional schedules" ON public.professional_schedules;
DROP POLICY IF EXISTS "Public access to professional breaks" ON public.professional_breaks;
DROP POLICY IF EXISTS "Public access to professional blocks" ON public.professional_blocks;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['barbershop_settings','business_hours','services','professionals','professional_services','professional_schedules','professional_breaks','professional_blocks']
  LOOP
    EXECUTE format('CREATE POLICY "Anyone can read %s" ON public.%I FOR SELECT TO anon, authenticated USING (true)', t, t);
    EXECUTE format('CREATE POLICY "Authenticated can manage %s" ON public.%I FOR ALL TO authenticated USING (true) WITH CHECK (true)', t, t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT ON public.%I TO anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

-- 6. Busy slots for the public booking page (no customer PII)
CREATE OR REPLACE FUNCTION public.get_busy_slots(p_date date)
RETURNS TABLE (professional_id uuid, start_at timestamptz, end_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.professional_id, a.start_at, a.end_at
  FROM public.appointments a
  WHERE a.status <> 'cancelled'
    AND a.start_at >= (p_date::timestamp AT TIME ZONE 'America/Bahia')
    AND a.start_at < ((p_date + 1)::timestamp AT TIME ZONE 'America/Bahia');
$$;
REVOKE ALL ON FUNCTION public.get_busy_slots(date) FROM public;
GRANT EXECUTE ON FUNCTION public.get_busy_slots(date) TO anon, authenticated, service_role;

-- 7. RPC exposure: payments admin-only, booking stays public
REVOKE ALL ON FUNCTION public.register_appointment_payment(uuid, numeric, text, text, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.register_appointment_payment(uuid, numeric, text, text, text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.create_public_appointment(uuid, uuid, timestamptz, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.create_public_appointment(uuid, uuid, timestamptz, text, text, text) TO anon, authenticated, service_role;

-- 8. search_path hardening
ALTER FUNCTION public.handle_updated_at() SET search_path = public;

-- 9. Storage: public read, authenticated writes only
DROP POLICY IF EXISTS "Allow Anonymous Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow Anonymous Updates" ON storage.objects;
DROP POLICY IF EXISTS "Allow Anonymous Deletions" ON storage.objects;
CREATE POLICY "Authenticated can upload barbershop assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'barbershop-assets');
CREATE POLICY "Authenticated can update barbershop assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'barbershop-assets');
CREATE POLICY "Authenticated can delete barbershop assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'barbershop-assets');