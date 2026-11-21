DROP POLICY IF EXISTS "Public read professional_blocks" ON public.professional_blocks;
CREATE POLICY "Public read professional_blocks" ON public.professional_blocks FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.professionals p JOIN public.barbershops b ON b.id = p.barbershop_id WHERE p.id = professional_blocks.professional_id AND b.active = true));

DROP POLICY IF EXISTS "Public read professional_breaks" ON public.professional_breaks;
CREATE POLICY "Public read professional_breaks" ON public.professional_breaks FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.professionals p JOIN public.barbershops b ON b.id = p.barbershop_id WHERE p.id = professional_breaks.professional_id AND b.active = true));

DROP POLICY IF EXISTS "Public read professional_schedules" ON public.professional_schedules;
CREATE POLICY "Public read professional_schedules" ON public.professional_schedules FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.professionals p JOIN public.barbershops b ON b.id = p.barbershop_id WHERE p.id = professional_schedules.professional_id AND b.active = true));

DROP POLICY IF EXISTS "Public read professional_services" ON public.professional_services;
CREATE POLICY "Public read professional_services" ON public.professional_services FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.professionals p JOIN public.barbershops b ON b.id = p.barbershop_id WHERE p.id = professional_services.professional_id AND b.active = true));

DROP POLICY IF EXISTS "Public can read business breaks" ON public.business_breaks;
CREATE POLICY "Public can read business breaks" ON public.business_breaks FOR SELECT TO anon, authenticated
USING (barbershop_id IN (SELECT id FROM public.barbershops WHERE active = true));

DROP POLICY IF EXISTS "Authenticated users can create barbershops" ON public.barbershops;

DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
CREATE POLICY "Barbershop Member Select" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = ANY (ARRAY['barbershop-assets','barbershop-logos','service-photos','professional-avatars'])
  AND (storage.foldername(name))[1] = 'barbershops'
  AND public.check_is_barbershop_member(((storage.foldername(name))[2])::uuid));