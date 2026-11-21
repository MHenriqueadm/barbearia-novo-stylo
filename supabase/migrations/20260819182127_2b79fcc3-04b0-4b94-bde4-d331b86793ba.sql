
-- Function to create a confirmation code
CREATE OR REPLACE FUNCTION public.generate_confirmation_code() 
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- Omit confusing chars like I, O, 0, 1
  code TEXT := 'RST-';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..5 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Add confirmation_code column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'confirmation_code') THEN
    ALTER TABLE public.appointments ADD COLUMN confirmation_code TEXT UNIQUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'source') THEN
    ALTER TABLE public.appointments ADD COLUMN source TEXT DEFAULT 'admin' CHECK (source IN ('admin', 'public'));
  END IF;
END $$;

-- Trigger to auto-generate confirmation code on insert if not provided
CREATE OR REPLACE FUNCTION public.tr_appointments_confirmation_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.confirmation_code IS NULL THEN
    NEW.confirmation_code := generate_confirmation_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_appointments_confirmation_code_trigger ON public.appointments;
CREATE TRIGGER tr_appointments_confirmation_code_trigger
BEFORE INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.tr_appointments_confirmation_code();

-- Security: Create a secure function for public booking to prevent race conditions and enforce rules
CREATE OR REPLACE FUNCTION public.create_public_appointment(
  p_service_id UUID,
  p_professional_id UUID,
  p_start_at TIMESTAMPTZ,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service_name TEXT;
  v_service_price DECIMAL;
  v_service_duration INTEGER;
  v_service_active BOOLEAN;
  v_professional_active BOOLEAN;
  v_professional_linked BOOLEAN;
  v_end_at TIMESTAMPTZ;
  v_customer_id UUID;
  v_phone_normalized TEXT;
  v_booking_enabled BOOLEAN;
  v_overlap_exists BOOLEAN;
  v_appointment_id UUID;
  v_result JSONB;
BEGIN
  -- 1. Check if online booking is enabled
  SELECT booking_enabled INTO v_booking_enabled FROM public.barbershop_settings LIMIT 1;
  IF NOT v_booking_enabled THEN
    RAISE EXCEPTION 'Agendamento online temporariamente indisponível.';
  END IF;

  -- 2. Validate Service
  SELECT name, price, duration_minutes, active 
  INTO v_service_name, v_service_price, v_service_duration, v_service_active
  FROM public.services WHERE id = p_service_id;
  
  IF NOT v_service_active THEN
    RAISE EXCEPTION 'Serviço indisponível.';
  END IF;

  -- 3. Validate Professional
  SELECT active INTO v_professional_active 
  FROM public.professionals WHERE id = p_professional_id;
  
  IF NOT v_professional_active THEN
    RAISE EXCEPTION 'Profissional indisponível.';
  END IF;

  -- 4. Validate Service-Professional link
  SELECT EXISTS (
    SELECT 1 FROM public.professional_services 
    WHERE professional_id = p_professional_id AND service_id = p_service_id
  ) INTO v_professional_linked;

  IF NOT v_professional_linked THEN
    RAISE EXCEPTION 'Profissional não executa este serviço.';
  END IF;

  -- 5. Calculate end time
  v_end_at := p_start_at + (v_service_duration || ' minutes')::INTERVAL;

  -- 6. Re-validate availability (Double check for race conditions)
  SELECT EXISTS (
    SELECT 1 FROM public.appointments
    WHERE professional_id = p_professional_id
    AND status IN ('scheduled', 'confirmed', 'completed')
    AND start_at < v_end_at
    AND end_at > p_start_at
  ) INTO v_overlap_exists;

  IF v_overlap_exists THEN
    RAISE EXCEPTION 'Este horário acabou de ser reservado. Escolha outro horário.';
  END IF;

  -- 7. Resolve/Create Customer
  v_phone_normalized := regexp_replace(p_customer_phone, '\D', '', 'g');
  IF length(v_phone_normalized) <= 11 THEN
    v_phone_normalized := '55' || v_phone_normalized;
  END IF;

  SELECT id INTO v_customer_id FROM public.customers WHERE phone_normalized = v_phone_normalized;
  
  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (name, phone, phone_normalized)
    VALUES (p_customer_name, p_customer_phone, v_phone_normalized)
    RETURNING id INTO v_customer_id;
  END IF;

  -- 8. Create Appointment
  INSERT INTO public.appointments (
    service_id,
    professional_id,
    customer_id,
    customer_name,
    customer_phone,
    start_at,
    end_at,
    status,
    service_name_snapshot,
    service_price_snapshot,
    service_duration_snapshot,
    notes,
    source
  )
  VALUES (
    p_service_id,
    p_professional_id,
    v_customer_id,
    p_customer_name,
    p_customer_phone,
    p_start_at,
    v_end_at,
    'scheduled',
    v_service_name,
    v_service_price,
    v_service_duration,
    p_notes,
    'public'
  )
  RETURNING id INTO v_appointment_id;

  -- 9. Prepare result
  SELECT jsonb_build_object(
    'id', a.id,
    'confirmation_code', a.confirmation_code,
    'start_at', a.start_at,
    'service_name', a.service_name_snapshot,
    'professional_name', p.name,
    'status', a.status
  ) INTO v_result
  FROM public.appointments a
  JOIN public.professionals p ON p.id = a.professional_id
  WHERE a.id = v_appointment_id;

  RETURN v_result;
END;
$$;

-- Grant execution to all (publicly callable via RPC)
GRANT EXECUTE ON FUNCTION public.create_public_appointment TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_confirmation_code TO authenticated, service_role;

-- Ensure public can read necessary basic data for booking
GRANT SELECT ON public.barbershop_settings TO anon, authenticated;
GRANT SELECT ON public.business_hours TO anon, authenticated;
GRANT SELECT ON public.services TO anon, authenticated;
GRANT SELECT ON public.professionals TO anon, authenticated;
GRANT SELECT ON public.professional_services TO anon, authenticated;
GRANT SELECT ON public.professional_schedules TO anon, authenticated;
GRANT SELECT ON public.professional_breaks TO anon, authenticated;
GRANT SELECT ON public.professional_blocks TO anon, authenticated;
GRANT SELECT ON public.appointments TO anon, authenticated;
GRANT SELECT ON public.customers TO authenticated;
GRANT ALL ON public.appointments TO service_role;
GRANT ALL ON public.customers TO service_role;
