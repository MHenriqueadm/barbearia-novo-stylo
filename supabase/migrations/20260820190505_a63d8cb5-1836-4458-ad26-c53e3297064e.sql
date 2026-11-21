
-- Storage hardening for 'barbershop-assets' bucket
-- Allow public read access to all objects in the bucket
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'barbershop-assets');

-- Allow authenticated users to upload/manage objects
CREATE POLICY "Authenticated Manage Access"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'barbershop-assets')
WITH CHECK (bucket_id = 'barbershop-assets');

-- Professional helper tables for availability
ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read professional_services" ON public.professional_services FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin write professional_services" ON public.professional_services FOR ALL TO authenticated USING (true);

ALTER TABLE public.professional_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read professional_schedules" ON public.professional_schedules FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin write professional_schedules" ON public.professional_schedules FOR ALL TO authenticated USING (true);

ALTER TABLE public.professional_breaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read professional_breaks" ON public.professional_breaks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin write professional_breaks" ON public.professional_breaks FOR ALL TO authenticated USING (true);

ALTER TABLE public.professional_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read professional_blocks" ON public.professional_blocks FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin write professional_blocks" ON public.professional_blocks FOR ALL TO authenticated USING (true);

ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read business_hours" ON public.business_hours FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admin write business_hours" ON public.business_hours FOR ALL TO authenticated USING (true);

-- Ensure grants for anonymous users on public reading tables
GRANT SELECT ON public.services TO anon;
GRANT SELECT ON public.professionals TO anon;
GRANT SELECT ON public.professional_services TO anon;
GRANT SELECT ON public.professional_schedules TO anon;
GRANT SELECT ON public.business_hours TO anon;
GRANT SELECT ON public.business_breaks TO anon;
GRANT SELECT ON public.barbershop_settings TO anon;
