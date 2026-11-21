
CREATE OR REPLACE FUNCTION public.create_public_appointment(
    p_service_id uuid, 
    p_professional_id uuid, 
    p_start_at timestamp with time zone, 
    p_customer_name text, 
    p_customer_phone text, 
    p_notes text DEFAULT ''::text, 
    p_barbershop_id uuid DEFAULT NULL::uuid, 
    p_whatsapp_consent boolean DEFAULT false, 
    p_whatsapp_consent_at timestamp with time zone DEFAULT NULL::timestamp with time zone
)
RETURNS public.appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_appointment public.appointments;
    v_customer_id uuid;
    v_duration_minutes integer;
    v_end_at timestamp with time zone;
    v_barbershop_id uuid;
    v_phone_normalized text;
BEGIN
    -- 1. Identify barbershop_id if not provided
    IF p_barbershop_id IS NULL THEN
        SELECT barbershop_id INTO v_barbershop_id 
        FROM public.services 
        WHERE id = p_service_id;
    ELSE
        v_barbershop_id := p_barbershop_id;
    END IF;

    -- 2. Validate tenant existence
    IF NOT EXISTS (SELECT 1 FROM public.barbershops WHERE id = v_barbershop_id) THEN
        RAISE EXCEPTION 'Barbershop not found';
    END IF;

    -- 3. Calculate end time
    SELECT duration_minutes INTO v_duration_minutes FROM public.services WHERE id = p_service_id;
    v_end_at := p_start_at + (v_duration_minutes || ' minutes')::interval;

    -- 4. Check for double booking
    IF EXISTS (
        SELECT 1 FROM public.appointments 
        WHERE professional_id = p_professional_id
          AND status IN ('scheduled', 'confirmed')
          AND (
            (start_at, end_at) OVERLAPS (p_start_at, v_end_at)
          )
    ) THEN
        RAISE EXCEPTION 'Horário já ocupado por outro cliente.';
    END IF;

    -- 5. Normalize phone (simple version)
    v_phone_normalized := regexp_replace(p_customer_phone, '\D', '', 'g');

    -- 6. Upsert customer with consent
    INSERT INTO public.customers (
        barbershop_id, 
        name, 
        phone, 
        phone_normalized,
        whatsapp_consent,
        whatsapp_consent_at
    )
    VALUES (
        v_barbershop_id, 
        p_customer_name, 
        p_customer_phone, 
        v_phone_normalized,
        p_whatsapp_consent,
        p_whatsapp_consent_at
    )
    ON CONFLICT (barbershop_id, phone_normalized) 
    DO UPDATE SET 
        name = EXCLUDED.name,
        whatsapp_consent = EXCLUDED.whatsapp_consent,
        whatsapp_consent_at = EXCLUDED.whatsapp_consent_at
    RETURNING id INTO v_customer_id;

    -- 7. Create appointment with consent
    INSERT INTO public.appointments (
        barbershop_id,
        customer_id,
        service_id,
        professional_id,
        start_at,
        end_at,
        notes,
        status,
        whatsapp_consent,
        whatsapp_consent_at
    )
    VALUES (
        v_barbershop_id,
        v_customer_id,
        p_service_id,
        p_professional_id,
        p_start_at,
        v_end_at,
        p_notes,
        'scheduled',
        p_whatsapp_consent,
        p_whatsapp_consent_at
    )
    RETURNING * INTO v_appointment;

    RETURN v_appointment;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.create_public_appointment TO anon, authenticated;
