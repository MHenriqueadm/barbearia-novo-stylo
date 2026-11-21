
-- 1. Ensure identity in barbershops reflects settings
UPDATE public.barbershops b
SET 
  name = COALESCE(b.name, s.name),
  slug = COALESCE(b.slug, s.slug),
  logo_url = CASE 
    WHEN b.logo_url IS NULL OR b.logo_url = '' THEN s.logo_url 
    ELSE b.logo_url 
  END
FROM public.barbershop_settings s
WHERE b.id = s.barbershop_id;

-- 2. Fix RLS for update
DROP POLICY IF EXISTS "Authenticated can manage barbershop_settings" ON public.barbershop_settings;
CREATE POLICY "Authenticated can manage barbershop_settings"
ON public.barbershop_settings
FOR ALL
TO authenticated
USING (public.check_is_barbershop_member(barbershop_id))
WITH CHECK (public.check_is_barbershop_member(barbershop_id));

DROP POLICY IF EXISTS "Owners can update their own barbershop" ON public.barbershops;
CREATE POLICY "Owners can update their own barbershop"
ON public.barbershops
FOR UPDATE
TO authenticated
USING (public.check_is_barbershop_member(id));

GRANT UPDATE ON public.barbershops TO authenticated;
GRANT UPDATE ON public.barbershop_settings TO authenticated;
