
-- 1. Drop existing versions to avoid conflicts
DROP FUNCTION IF EXISTS public.create_public_appointment(uuid, uuid, timestamptz, text, text, text);
DROP FUNCTION IF EXISTS public.create_public_appointment(uuid, uuid, timestamptz, text, text, text, uuid);

-- 2. Create the unified RPC with the correct 7 parameters
CREATE OR REPLACE FUNCTION public.create_public_appointment(
  p_service_id UUID,
  p_professional_id UUID,
  p_start_at TIMESTAMPTZ,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_notes TEXT DEFAULT NULL,
  p_barbershop_id UUID DEFAULT NULL
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
  v_barbershop_exists BOOLEAN;
BEGIN
  -- 0. Validate Barbershop
  IF p_barbershop_id IS NULL THEN
    RAISE EXCEPTION 'ID da barbearia é obrigatório.';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.barbershops WHERE id = p_barbershop_id AND active = TRUE)
  INTO v_barbershop_exists;

  IF NOT v_barbershop_exists THEN
    RAISE EXCEPTION 'Barbearia não encontrada ou inativa.';
  END IF;

  -- 1. Check if online booking is enabled for this barbershop
  SELECT booking_enabled INTO v_booking_enabled 
  FROM public.barbershop_settings 
  WHERE barbershop_id = p_barbershop_id;

  IF v_booking_enabled IS NOT TRUE THEN
    RAISE EXCEPTION 'Agendamento online temporariamente indisponível para esta unidade.';
  END IF;

  -- 2. Validate Service (must belong to barbershop)
  SELECT name, price, duration_minutes, active 
  INTO v_service_name, v_service_price, v_service_duration, v_service_active
  FROM public.services 
  WHERE id = p_service_id AND barbershop_id = p_barbershop_id;
  
  IF v_service_name IS NULL THEN
    RAISE EXCEPTION 'Serviço não encontrado nesta barbearia.';
  END IF;

  IF NOT v_service_active THEN
    RAISE EXCEPTION 'Serviço indisponível no momento.';
  END IF;

  -- 3. Validate Professional (must belong to barbershop)
  SELECT active INTO v_professional_active 
  FROM public.professionals 
  WHERE id = p_professional_id AND barbershop_id = p_barbershop_id;
  
  IF v_professional_active IS NULL THEN
    RAISE EXCEPTION 'Profissional não encontrado nesta barbearia.';
  END IF;

  IF NOT v_professional_active THEN
    RAISE EXCEPTION 'Profissional indisponível no momento.';
  END IF;

  -- 4. Validate Service-Professional link
  SELECT EXISTS (
    SELECT 1 FROM public.professional_services 
    WHERE professional_id = p_professional_id AND service_id = p_service_id
  ) INTO v_professional_linked;

  IF NOT v_professional_linked THEN
    RAISE EXCEPTION 'Este profissional não executa o serviço selecionado.';
  END IF;

  -- 5. Calculate end time
  v_end_at := p_start_at + (v_service_duration || ' minutes')::INTERVAL;

  -- 6. Re-validate availability (Double check for race conditions, scoped to professional)
  SELECT EXISTS (
    SELECT 1 FROM public.appointments
    WHERE professional_id = p_professional_id
    AND status IN ('scheduled', 'confirmed', 'completed')
    AND start_at < v_end_at
    AND end_at > p_start_at
  ) INTO v_overlap_exists;

  IF v_overlap_exists THEN
    RAISE EXCEPTION 'Este horário acabou de ser reservado. Por favor, escolha outro horário.';
  END IF;

  -- 7. Resolve/Create Customer (Scoped to barbershop_id)
  v_phone_normalized := regexp_replace(p_customer_phone, '\D', '', 'g');
  IF length(v_phone_normalized) <= 11 THEN
    v_phone_normalized := '55' || v_phone_normalized;
  END IF;

  SELECT id INTO v_customer_id 
  FROM public.customers 
  WHERE phone_normalized = v_phone_normalized 
    AND barbershop_id = p_barbershop_id;
  
  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (name, phone, phone_normalized, barbershop_id)
    VALUES (p_customer_name, p_customer_phone, v_phone_normalized, p_barbershop_id)
    RETURNING id INTO v_customer_id;
  END IF;

  -- 8. Create Appointment
  INSERT INTO public.appointments (
    barbershop_id,
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
    p_barbershop_id,
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

-- 3. Grant permissions
GRANT EXECUTE ON FUNCTION public.create_public_appointment TO anon, authenticated;

-- 4. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
