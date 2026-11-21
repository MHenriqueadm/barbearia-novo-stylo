-- barbershops: consolidate public reads
DROP POLICY IF EXISTS "Public read barbershops" ON public.barbershops;
DROP POLICY IF EXISTS "Barbershops are viewable by everyone" ON public.barbershops;

-- barbershop_settings
DROP POLICY IF EXISTS "Anyone can read barbershop_settings" ON public.barbershop_settings;
DROP POLICY IF EXISTS "Public read settings" ON public.barbershop_settings;
DROP POLICY IF EXISTS "Authenticated users can create settings" ON public.barbershop_settings;
DROP POLICY IF EXISTS "Owners can update their own settings" ON public.barbershop_settings;

-- business_hours
DROP POLICY IF EXISTS "Admin write business_hours" ON public.business_hours;
DROP POLICY IF EXISTS "Authenticated can manage business_hours" ON public.business_hours;
DROP POLICY IF EXISTS "Authenticated users can create business hours" ON public.business_hours;
DROP POLICY IF EXISTS "Anyone can read business_hours" ON public.business_hours;
DROP POLICY IF EXISTS "Public read business_hours" ON public.business_hours;
DROP POLICY IF EXISTS "Tenant update business hours" ON public.business_hours;
CREATE POLICY "Tenant manage business_hours" ON public.business_hours FOR ALL TO authenticated
  USING (public.check_is_barbershop_member(barbershop_id))
  WITH CHECK (public.check_is_barbershop_member(barbershop_id));

-- professionals
DROP POLICY IF EXISTS "Admin write professionals" ON public.professionals;
DROP POLICY IF EXISTS "Authenticated can manage professionals" ON public.professionals;
DROP POLICY IF EXISTS "Anyone can read professionals" ON public.professionals;
DROP POLICY IF EXISTS "Public read professionals" ON public.professionals;
DROP POLICY IF EXISTS "Public professionals access" ON public.professionals;

-- services
DROP POLICY IF EXISTS "Admin write services" ON public.services;
DROP POLICY IF EXISTS "Authenticated can manage services" ON public.services;
DROP POLICY IF EXISTS "Anyone can read services" ON public.services;
DROP POLICY IF EXISTS "Public read services" ON public.services;
DROP POLICY IF EXISTS "Public services access" ON public.services;

-- professional_services
DROP POLICY IF EXISTS "Admin write professional_services" ON public.professional_services;
DROP POLICY IF EXISTS "Authenticated can manage professional_services" ON public.professional_services;
DROP POLICY IF EXISTS "Authenticated users can manage professional_services" ON public.professional_services;
DROP POLICY IF EXISTS "Anyone can read professional_services" ON public.professional_services;
DROP POLICY IF EXISTS "Public select professional_services" ON public.professional_services;
CREATE POLICY "Tenant manage professional_services" ON public.professional_services FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = professional_id AND public.check_is_barbershop_member(p.barbershop_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = professional_id AND public.check_is_barbershop_member(p.barbershop_id)));

-- professional_schedules
DROP POLICY IF EXISTS "Admin write professional_schedules" ON public.professional_schedules;
DROP POLICY IF EXISTS "Authenticated can manage professional_schedules" ON public.professional_schedules;
DROP POLICY IF EXISTS "Anyone can read professional_schedules" ON public.professional_schedules;
DROP POLICY IF EXISTS "Public read schedules" ON public.professional_schedules;
CREATE POLICY "Tenant manage professional_schedules" ON public.professional_schedules FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = professional_id AND public.check_is_barbershop_member(p.barbershop_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = professional_id AND public.check_is_barbershop_member(p.barbershop_id)));

-- professional_breaks
DROP POLICY IF EXISTS "Admin write professional_breaks" ON public.professional_breaks;
DROP POLICY IF EXISTS "Authenticated can manage professional_breaks" ON public.professional_breaks;
DROP POLICY IF EXISTS "Anyone can read professional_breaks" ON public.professional_breaks;
DROP POLICY IF EXISTS "Public read breaks" ON public.professional_breaks;
CREATE POLICY "Tenant manage professional_breaks" ON public.professional_breaks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = professional_id AND public.check_is_barbershop_member(p.barbershop_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = professional_id AND public.check_is_barbershop_member(p.barbershop_id)));

-- professional_blocks
DROP POLICY IF EXISTS "Admin write professional_blocks" ON public.professional_blocks;
DROP POLICY IF EXISTS "Authenticated can manage professional_blocks" ON public.professional_blocks;
DROP POLICY IF EXISTS "Anyone can read professional_blocks" ON public.professional_blocks;
CREATE POLICY "Tenant manage professional_blocks" ON public.professional_blocks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = professional_id AND public.check_is_barbershop_member(p.barbershop_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.professionals p WHERE p.id = professional_id AND public.check_is_barbershop_member(p.barbershop_id)));

-- profiles: only own profile visible
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;