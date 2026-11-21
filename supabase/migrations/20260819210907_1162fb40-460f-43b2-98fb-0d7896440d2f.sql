DO $$
DECLARE
    v_prof_id UUID;
    v_service_id UUID;
BEGIN
    SELECT id INTO v_prof_id FROM public.professionals WHERE name = 'Otávio Carneiro' LIMIT 1;
    
    FOR v_service_id IN SELECT id FROM public.services WHERE active = true
    LOOP
        INSERT INTO public.professional_services (professional_id, service_id, active)
        VALUES (v_prof_id, v_service_id, true)
        ON CONFLICT (professional_id, service_id) DO NOTHING;
    END LOOP;
END $$;