
-- Fix business_hours constraints and nullability for multi-tenant
ALTER TABLE public.business_hours DROP CONSTRAINT IF EXISTS business_hours_weekday_key;
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'business_hours_barbershop_weekday_key') THEN
        ALTER TABLE public.business_hours ADD CONSTRAINT business_hours_barbershop_weekday_key UNIQUE (barbershop_id, weekday);
    END IF;
END $$;

-- Allow NULL for open/close times on closed days
ALTER TABLE public.business_hours ALTER COLUMN open_time DROP NOT NULL;
ALTER TABLE public.business_hours ALTER COLUMN close_time DROP NOT NULL;
ALTER TABLE public.business_hours ALTER COLUMN open_time SET DEFAULT NULL;
ALTER TABLE public.business_hours ALTER COLUMN close_time SET DEFAULT NULL;

-- Update the RPC with correct casts and validations
CREATE OR REPLACE FUNCTION public.create_barbershop_onboarding(
    p_name TEXT,
    p_slug TEXT,
    p_logo_url TEXT,
    p_user_id UUID,
    p_instagram TEXT,
    p_whatsapp TEXT,
    p_city TEXT,
    p_state TEXT,
    p_address TEXT,
    p_timezone TEXT,
    p_business_hours JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_barbershop_id UUID;
    v_result JSONB;
    v_hour RECORD;
    v_open_time TIME;
    v_close_time TIME;
BEGIN
    -- Check if slug already exists and append suffix if needed
    IF EXISTS (SELECT 1 FROM public.barbershops WHERE slug = p_slug) THEN
        p_slug := p_slug || '-' || floor(random() * 1000)::text;
    END IF;

    -- 1. Create Barbershop
    INSERT INTO public.barbershops (name, slug, logo_url, active)
    VALUES (p_name, p_slug, p_logo_url, TRUE)
    RETURNING id INTO v_barbershop_id;

    -- 2. Create Barbershop Settings
    INSERT INTO public.barbershop_settings (
        barbershop_id, name, slug, logo_url, instagram, whatsapp, city, state, address, timezone
    )
    VALUES (
        v_barbershop_id, p_name, p_slug, p_logo_url, p_instagram, p_whatsapp, p_city, p_state, p_address, p_timezone
    );

    -- 3. Create Membership (Owner)
    INSERT INTO public.barbershop_users (barbershop_id, user_id, role, active)
    VALUES (v_barbershop_id, p_user_id, 'owner', TRUE);

    -- 4. Create Business Hours
    FOR v_hour IN SELECT * FROM jsonb_to_recordset(p_business_hours) AS x(weekday INT, open_time TEXT, close_time TEXT, active BOOLEAN)
    LOOP
        IF v_hour.active THEN
            -- Explicit cast using NULLIF to handle potential empty strings
            v_open_time := NULLIF(v_hour.open_time, '')::TIME;
            v_close_time := NULLIF(v_hour.close_time, '')::TIME;
            
            IF v_open_time IS NULL OR v_close_time IS NULL THEN
                RAISE EXCEPTION 'Horários de abertura e fechamento são obrigatórios para dias ativos.';
            END IF;
            
            IF v_open_time >= v_close_time THEN
                RAISE EXCEPTION 'Horário de abertura deve ser menor que o de fechamento.';
            END IF;
        ELSE
            v_open_time := NULL;
            v_close_time := NULL;
        END IF;

        INSERT INTO public.business_hours (barbershop_id, weekday, open_time, close_time, active)
        VALUES (v_barbershop_id, v_hour.weekday, v_open_time, v_close_time, v_hour.active);
    END LOOP;

    v_result := jsonb_build_object(
        'id', v_barbershop_id,
        'name', p_name,
        'slug', p_slug
    );

    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create barbershop onboarding: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_barbershop_onboarding TO authenticated;
