
-- Revoke all execute permissions from public and roles for internal functions
REVOKE ALL ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_confirmation_code() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.register_appointment_payment(uuid, numeric, text, text, text) FROM public, anon, authenticated;

-- Grant to authenticated only where needed
GRANT EXECUTE ON FUNCTION public.register_appointment_payment(uuid, numeric, text, text, text) TO authenticated;

-- get_busy_slots needs to be public for the booking flow
REVOKE ALL ON FUNCTION public.get_busy_slots(date) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_busy_slots(date) TO anon, authenticated;

-- ====================================================================
-- RLS POLICIES FOR MULTI-TENANT ISOLATION
-- ====================================================================

-- 1. Table: barbershops (Public visibility for booking)
ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Barbershops are viewable by everyone" ON public.barbershops;
CREATE POLICY "Barbershops are viewable by everyone" ON public.barbershops
  FOR SELECT USING (active = true);

-- 2. Table: barbershop_settings (Public visibility for booking)
ALTER TABLE public.barbershop_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Barbershop settings are viewable by everyone" ON public.barbershop_settings;
CREATE POLICY "Barbershop settings are viewable by everyone" ON public.barbershop_settings
  FOR SELECT USING (
    barbershop_id IN (SELECT id FROM public.barbershops WHERE active = true)
  );
DROP POLICY IF EXISTS "Owners can update their own settings" ON public.barbershop_settings;
CREATE POLICY "Owners can update their own settings" ON public.barbershop_settings
  FOR UPDATE TO authenticated
  USING (
    barbershop_id IN (
      SELECT barbershop_id FROM public.barbershop_users 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- 3. Table: barbershop_users (Membership)
ALTER TABLE public.barbershop_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see their own memberships" ON public.barbershop_users;
CREATE POLICY "Users can see their own memberships" ON public.barbershop_users
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 4. Table: appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for appointments" ON public.appointments;
CREATE POLICY "Tenant isolation for appointments" ON public.appointments
  FOR ALL TO authenticated
  USING (
    barbershop_id IN (SELECT barbershop_id FROM public.barbershop_users WHERE user_id = auth.uid())
  )
  WITH CHECK (
    barbershop_id IN (SELECT barbershop_id FROM public.barbershop_users WHERE user_id = auth.uid())
  );

-- 5. Table: customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for customers" ON public.customers;
CREATE POLICY "Tenant isolation for customers" ON public.customers
  FOR ALL TO authenticated
  USING (
    barbershop_id IN (SELECT barbershop_id FROM public.barbershop_users WHERE user_id = auth.uid())
  )
  WITH CHECK (
    barbershop_id IN (SELECT barbershop_id FROM public.barbershop_users WHERE user_id = auth.uid())
  );

-- 6. Table: services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for services" ON public.services;
CREATE POLICY "Tenant isolation for services" ON public.services
  FOR ALL TO authenticated
  USING (
    barbershop_id IN (SELECT barbershop_id FROM public.barbershop_users WHERE user_id = auth.uid())
  )
  WITH CHECK (
    barbershop_id IN (SELECT barbershop_id FROM public.barbershop_users WHERE user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Public services access" ON public.services;
CREATE POLICY "Public services access" ON public.services
  FOR SELECT TO anon
  USING (
    barbershop_id IN (SELECT id FROM public.barbershops WHERE active = true)
  );

-- 7. Table: professionals
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for professionals" ON public.professionals;
CREATE POLICY "Tenant isolation for professionals" ON public.professionals
  FOR ALL TO authenticated
  USING (
    barbershop_id IN (SELECT barbershop_id FROM public.barbershop_users WHERE user_id = auth.uid())
  )
  WITH CHECK (
    barbershop_id IN (SELECT barbershop_id FROM public.barbershop_users WHERE user_id = auth.uid())
  );
DROP POLICY IF EXISTS "Public professionals access" ON public.professionals;
CREATE POLICY "Public professionals access" ON public.professionals
  FOR SELECT TO anon
  USING (
    barbershop_id IN (SELECT id FROM public.barbershops WHERE active = true)
  );

-- 8. Table: financial_transactions
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for transactions" ON public.financial_transactions;
CREATE POLICY "Tenant isolation for transactions" ON public.financial_transactions
  FOR ALL TO authenticated
  USING (
    barbershop_id IN (SELECT barbershop_id FROM public.barbershop_users WHERE user_id = auth.uid())
  )
  WITH CHECK (
    barbershop_id IN (SELECT barbershop_id FROM public.barbershop_users WHERE user_id = auth.uid())
  );

-- 9. Table: cash_sessions
ALTER TABLE public.cash_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tenant isolation for cash_sessions" ON public.cash_sessions;
CREATE POLICY "Tenant isolation for cash_sessions" ON public.cash_sessions
  FOR ALL TO authenticated
  USING (
    barbershop_id IN (SELECT barbershop_id FROM public.barbershop_users WHERE user_id = auth.uid())
  )
  WITH CHECK (
    barbershop_id IN (SELECT barbershop_id FROM public.barbershop_users WHERE user_id = auth.uid())
  );

-- 10. Table: business_hours
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public business hours access" ON public.business_hours;
CREATE POLICY "Public business hours access" ON public.business_hours
  FOR SELECT TO anon, authenticated
  USING (
    barbershop_id IN (SELECT id FROM public.barbershops WHERE active = true)
  );
DROP POLICY IF EXISTS "Tenant update business hours" ON public.business_hours;
CREATE POLICY "Tenant update business hours" ON public.business_hours
  FOR UPDATE TO authenticated
  USING (
    barbershop_id IN (SELECT barbershop_id FROM public.barbershop_users WHERE user_id = auth.uid())
  );

-- 11. Table: business_breaks
ALTER TABLE public.business_breaks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public business breaks access" ON public.business_breaks;
CREATE POLICY "Public business breaks access" ON public.business_breaks
  FOR SELECT TO anon, authenticated
  USING (
    barbershop_id IN (SELECT id FROM public.barbershops WHERE active = true)
  );
DROP POLICY IF EXISTS "Tenant management for business_breaks" ON public.business_breaks;
CREATE POLICY "Tenant management for business_breaks" ON public.business_breaks
  FOR ALL TO authenticated
  USING (
    barbershop_id IN (SELECT barbershop_id FROM public.barbershop_users WHERE user_id = auth.uid())
  )
  WITH CHECK (
    barbershop_id IN (SELECT barbershop_id FROM public.barbershop_users WHERE user_id = auth.uid())
  );
