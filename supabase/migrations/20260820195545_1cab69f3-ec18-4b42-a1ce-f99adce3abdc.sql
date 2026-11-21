-- RESTYLE SAAS MULTI-TENANT MIGRATION - PARTE 1
-- 1. Create barbershops table
CREATE TABLE public.barbershops (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text UNIQUE NOT NULL,
    logo_url text,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

GRANT SELECT ON public.barbershops TO anon;
GRANT SELECT, INSERT, UPDATE ON public.barbershops TO authenticated;
GRANT ALL ON public.barbershops TO service_role;

ALTER TABLE public.barbershops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for barbershops" ON public.barbershops
    FOR SELECT TO anon, authenticated USING (active = true);

-- 2. Create barbershop_users (membership) table
CREATE TABLE public.barbershop_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    barbershop_id uuid NOT NULL REFERENCES public.barbershops(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('owner', 'admin', 'professional', 'receptionist')),
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    UNIQUE(barbershop_id, user_id)
);

GRANT SELECT ON public.barbershop_users TO authenticated;
GRANT ALL ON public.barbershop_users TO service_role;

ALTER TABLE public.barbershop_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own memberships" ON public.barbershop_users
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 3. Create initial barbershop for Otávio (Preserve current data)
DO $$
DECLARE
    v_barbershop_id uuid := '7a4b8c9e-1d2f-4a3b-8c9d-5e6f7a8b9c0d';
    v_owner_id uuid := 'fefd15b6-6551-485a-9148-ca63dd07622b';
BEGIN
    -- Insert barbershop
    INSERT INTO public.barbershops (id, name, slug)
    VALUES (v_barbershop_id, 'Barbearia Carneiro', 'barbearia-carneiro')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

    -- Link Otávio as owner
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = v_owner_id) THEN
        INSERT INTO public.barbershop_users (barbershop_id, user_id, role)
        VALUES (v_barbershop_id, v_owner_id, 'owner')
        ON CONFLICT (barbershop_id, user_id) DO NOTHING;
    END IF;

    -- 4. Add barbershop_id to business tables and migrate data
    -- barbershop_settings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'barbershop_settings' AND column_name = 'barbershop_id') THEN
        ALTER TABLE public.barbershop_settings ADD COLUMN barbershop_id uuid REFERENCES public.barbershops(id);
        UPDATE public.barbershop_settings SET barbershop_id = v_barbershop_id WHERE barbershop_id IS NULL;
    END IF;

    -- services
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'barbershop_id') THEN
        ALTER TABLE public.services ADD COLUMN barbershop_id uuid REFERENCES public.barbershops(id);
        UPDATE public.services SET barbershop_id = v_barbershop_id WHERE barbershop_id IS NULL;
    END IF;

    -- professionals
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professionals' AND column_name = 'barbershop_id') THEN
        ALTER TABLE public.professionals ADD COLUMN barbershop_id uuid REFERENCES public.barbershops(id);
        UPDATE public.professionals SET barbershop_id = v_barbershop_id WHERE barbershop_id IS NULL;
    END IF;

    -- customers
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'barbershop_id') THEN
        ALTER TABLE public.customers ADD COLUMN barbershop_id uuid REFERENCES public.barbershops(id);
        UPDATE public.customers SET barbershop_id = v_barbershop_id WHERE barbershop_id IS NULL;
    END IF;

    -- appointments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'barbershop_id') THEN
        ALTER TABLE public.appointments ADD COLUMN barbershop_id uuid REFERENCES public.barbershops(id);
        UPDATE public.appointments SET barbershop_id = v_barbershop_id WHERE barbershop_id IS NULL;
    END IF;

    -- business_hours
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_hours' AND column_name = 'barbershop_id') THEN
        ALTER TABLE public.business_hours ADD COLUMN barbershop_id uuid REFERENCES public.barbershops(id);
        UPDATE public.business_hours SET barbershop_id = v_barbershop_id WHERE barbershop_id IS NULL;
    END IF;

    -- business_breaks
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_breaks' AND column_name = 'barbershop_id') THEN
        ALTER TABLE public.business_breaks ADD COLUMN barbershop_id uuid REFERENCES public.barbershops(id);
        UPDATE public.business_breaks SET barbershop_id = v_barbershop_id WHERE barbershop_id IS NULL;
    END IF;

    -- professional_schedules
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professional_schedules' AND column_name = 'barbershop_id') THEN
        ALTER TABLE public.professional_schedules ADD COLUMN barbershop_id uuid REFERENCES public.barbershops(id);
        UPDATE public.professional_schedules SET barbershop_id = v_barbershop_id WHERE barbershop_id IS NULL;
    END IF;

    -- professional_breaks
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professional_breaks' AND column_name = 'barbershop_id') THEN
        ALTER TABLE public.professional_breaks ADD COLUMN barbershop_id uuid REFERENCES public.barbershops(id);
        UPDATE public.professional_breaks SET barbershop_id = v_barbershop_id WHERE barbershop_id IS NULL;
    END IF;

    -- professional_blocks
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professional_blocks' AND column_name = 'barbershop_id') THEN
        ALTER TABLE public.professional_blocks ADD COLUMN barbershop_id uuid REFERENCES public.barbershops(id);
        UPDATE public.professional_blocks SET barbershop_id = v_barbershop_id WHERE barbershop_id IS NULL;
    END IF;

    -- payments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'barbershop_id') THEN
        ALTER TABLE public.payments ADD COLUMN barbershop_id uuid REFERENCES public.barbershops(id);
        UPDATE public.payments SET barbershop_id = v_barbershop_id WHERE barbershop_id IS NULL;
    END IF;

    -- financial_transactions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_transactions' AND column_name = 'barbershop_id') THEN
        ALTER TABLE public.financial_transactions ADD COLUMN barbershop_id uuid REFERENCES public.barbershops(id);
        UPDATE public.financial_transactions SET barbershop_id = v_barbershop_id WHERE barbershop_id IS NULL;
    END IF;

    -- cash_sessions
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cash_sessions' AND column_name = 'barbershop_id') THEN
        ALTER TABLE public.cash_sessions ADD COLUMN barbershop_id uuid REFERENCES public.barbershops(id);
        UPDATE public.cash_sessions SET barbershop_id = v_barbershop_id WHERE barbershop_id IS NULL;
    END IF;
END $$;

-- 5. Helper function for RLS
CREATE OR REPLACE FUNCTION public.user_has_barbershop_access(_barbershop_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.barbershop_users
    WHERE user_id = auth.uid()
      AND barbershop_id = _barbershop_id
      AND active = true
  )
$$;

-- 6. Replace RLS with tenant isolation
-- Appointments
DROP POLICY IF EXISTS "Tenant isolation for appointments" ON public.appointments;
CREATE POLICY "Tenant isolation for appointments" ON public.appointments
    FOR ALL TO authenticated USING (public.user_has_barbershop_access(barbershop_id));

-- Customers
DROP POLICY IF EXISTS "Tenant isolation for customers" ON public.customers;
CREATE POLICY "Tenant isolation for customers" ON public.customers
    FOR ALL TO authenticated USING (public.user_has_barbershop_access(barbershop_id));

-- Finance
DROP POLICY IF EXISTS "Tenant isolation for payments" ON public.payments;
CREATE POLICY "Tenant isolation for payments" ON public.payments
    FOR ALL TO authenticated USING (public.user_has_barbershop_access(barbershop_id));

DROP POLICY IF EXISTS "Tenant isolation for transactions" ON public.financial_transactions;
CREATE POLICY "Tenant isolation for transactions" ON public.financial_transactions
    FOR ALL TO authenticated USING (public.user_has_barbershop_access(barbershop_id));

-- Services & Professionals (Public for booking)
DROP POLICY IF EXISTS "Public read for services" ON public.services;
CREATE POLICY "Public read for services" ON public.services
    FOR SELECT TO anon, authenticated USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE active = true));

DROP POLICY IF EXISTS "Public read for professionals" ON public.professionals;
CREATE POLICY "Public read for professionals" ON public.professionals
    FOR SELECT TO anon, authenticated USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE active = true));
