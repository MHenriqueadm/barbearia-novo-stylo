-- 1. business_breaks: consolidate policies (anon read-only, tenant-scoped writes)
DROP POLICY IF EXISTS "Allow authenticated to delete breaks" ON public.business_breaks;
DROP POLICY IF EXISTS "Allow authenticated to insert breaks" ON public.business_breaks;
DROP POLICY IF EXISTS "Allow authenticated to update breaks" ON public.business_breaks;
DROP POLICY IF EXISTS "Admin write business_breaks" ON public.business_breaks;
DROP POLICY IF EXISTS "Authenticated manage business_breaks" ON public.business_breaks;
DROP POLICY IF EXISTS "Tenant management for business_breaks" ON public.business_breaks;
DROP POLICY IF EXISTS "Anyone can read business_breaks" ON public.business_breaks;
DROP POLICY IF EXISTS "Public business breaks access" ON public.business_breaks;
DROP POLICY IF EXISTS "Public read business_breaks" ON public.business_breaks;
DROP POLICY IF EXISTS "Allow all access to business_breaks for everyone" ON public.business_breaks;

REVOKE ALL ON public.business_breaks FROM anon;
GRANT SELECT ON public.business_breaks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_breaks TO authenticated;
GRANT ALL ON public.business_breaks TO service_role;

CREATE POLICY "Public can read business breaks"
  ON public.business_breaks FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Members manage their barbershop business breaks"
  ON public.business_breaks FOR ALL TO authenticated
  USING (public.check_is_barbershop_member(barbershop_id))
  WITH CHECK (public.check_is_barbershop_member(barbershop_id));

-- 2. Remove duplicate storage policies on barbershop-assets (writes stay authenticated-only)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Manage Access" ON storage.objects;

-- 3. Revoke anon EXECUTE on internal SECURITY DEFINER helpers (not needed by public booking)
REVOKE EXECUTE ON FUNCTION public.check_user_membership(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.user_has_barbershop_access(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_is_barbershop_member(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.generate_confirmation_code() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_barbershop_onboarding(text,text,text,uuid,text,text,text,text,text,text,jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.register_appointment_payment(uuid,numeric,text,text,text) FROM anon;

NOTIFY pgrst, 'reload schema';