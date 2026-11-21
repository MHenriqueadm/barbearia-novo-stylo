-- Transação atômica para criar ou obter cliente
CREATE OR REPLACE FUNCTION public.get_or_create_customer(
    p_name text,
    p_phone text,
    p_phone_normalized text,
    p_barbershop_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_customer_id uuid;
BEGIN
    -- 1. Tenta encontrar por telefone normalizado E barbearia
    SELECT id INTO v_customer_id
    FROM public.customers
    WHERE phone_normalized = p_phone_normalized
      AND barbershop_id = p_barbershop_id
    LIMIT 1;

    -- 2. Se não encontrou, tenta por telefone global (devido a constraint atual)
    IF v_customer_id IS NULL THEN
        SELECT id INTO v_customer_id
        FROM public.customers
        WHERE phone_normalized = p_phone_normalized
        LIMIT 1;
    END IF;

    -- 3. Se ainda não encontrou, cria
    IF v_customer_id IS NULL THEN
        INSERT INTO public.customers (name, phone, phone_normalized, barbershop_id)
        VALUES (p_name, p_phone, p_phone_normalized, p_barbershop_id)
        RETURNING id INTO v_customer_id;
    END IF;

    RETURN v_customer_id;
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION public.get_or_create_customer(text, text, text, uuid) TO authenticated;

-- RPC para criação atômica de agendamento (Admin)
CREATE OR REPLACE FUNCTION public.create_admin_appointment(
    p_professional_id uuid,
    p_service_id uuid,
    p_customer_name text,
    p_customer_phone text,
    p_customer_phone_normalized text,
    p_start_at timestamptz,
    p_end_at timestamptz,
    p_notes text,
    p_barbershop_id uuid,
    p_service_name_snapshot text,
    p_service_price_snapshot numeric,
    p_service_duration_snapshot integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_customer_id uuid;
    v_appointment_id uuid;
BEGIN
    -- 1. Verificar se o chamador é membro da barbearia
    IF NOT public.check_is_barbershop_member(p_barbershop_id) THEN
        RAISE EXCEPTION 'Não autorizado' USING ERRCODE = '42501';
    END IF;

    -- 2. Obter ou criar cliente
    v_customer_id := public.get_or_create_customer(
        p_customer_name,
        p_customer_phone,
        p_customer_phone_normalized,
        p_barbershop_id
    );

    -- 3. Inserir agendamento
    INSERT INTO public.appointments (
        professional_id,
        service_id,
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
        source,
        barbershop_id
    )
    VALUES (
        p_professional_id,
        p_service_id,
        v_customer_id,
        p_customer_name,
        p_customer_phone,
        p_start_at,
        p_end_at,
        'scheduled',
        p_service_name_snapshot,
        p_service_price_snapshot,
        p_service_duration_snapshot,
        p_notes,
        'admin',
        p_barbershop_id
    )
    RETURNING id INTO v_appointment_id;

    RETURN v_appointment_id;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.create_admin_appointment(uuid, uuid, text, text, text, timestamptz, timestamptz, text, uuid, text, numeric, integer) TO authenticated;
