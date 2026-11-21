-- Remove slug unique constraint from settings
ALTER TABLE public.barbershop_settings DROP CONSTRAINT IF EXISTS barbershop_settings_slug_key;

-- Ensure barbershop_id uniqueness in settings
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'barbershop_settings_barbershop_id_key' 
        AND conrelid = 'public.barbershop_settings'::regclass
    ) THEN
        ALTER TABLE public.barbershop_settings ADD CONSTRAINT barbershop_settings_barbershop_id_key UNIQUE (barbershop_id);
    END IF;
END $$;

-- Update the RPC
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
    v_existing_barbershop_id UUID;
    v_result JSONB;
    v_hour RECORD;
    v_final_slug TEXT;
    v_counter INTEGER := 0;
BEGIN
    SELECT barbershop_id INTO v_existing_barbershop_id
    FROM public.barbershop_users
    WHERE user_id = p_user_id AND role = 'owner' AND active = TRUE
    LIMIT 1;

    IF v_existing_barbershop_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.barbershop_settings WHERE barbershop_id = v_existing_barbershop_id) THEN
            INSERT INTO public.barbershop_settings (
                barbershop_id, name, slug, logo_url, instagram, whatsapp, city, state, address, timezone
            )
            SELECT id, name, slug, logo_url, p_instagram, p_whatsapp, p_city, p_state, p_address, p_timezone
            FROM public.barbershops WHERE id = v_existing_barbershop_id;
        END IF;

        SELECT jsonb_build_object(
            'id', id,
            'name', name,
            'slug', slug,
            'message', 'Usuário já possui uma barbearia ativa.'
        ) INTO v_result
        FROM public.barbershops
        WHERE id = v_existing_barbershop_id;
        
        RETURN v_result;
    END IF;

    v_final_slug := p_slug;
    WHILE EXISTS (SELECT 1 FROM public.barbershops WHERE slug = v_final_slug) LOOP
        v_counter := v_counter + 1;
        v_final_slug := p_slug || '-' || v_counter::text;
    END LOOP;

    INSERT INTO public.barbershops (name, slug, logo_url, active)
    VALUES (p_name, v_final_slug, p_logo_url, TRUE)
    RETURNING id INTO v_barbershop_id;

    INSERT INTO public.barbershop_settings (
        barbershop_id, name, slug, logo_url, instagram, whatsapp, city, state, address, timezone
    )
    VALUES (
        v_barbershop_id, p_name, v_final_slug, p_logo_url, p_instagram, p_whatsapp, p_city, p_state, p_address, p_timezone
    )
    ON CONFLICT (barbershop_id) DO UPDATE SET
        name = EXCLUDED.name,
        slug = EXCLUDED.slug,
        logo_url = EXCLUDED.logo_url,
        instagram = EXCLUDED.instagram,
        whatsapp = EXCLUDED.whatsapp,
        city = EXCLUDED.city,
        state = EXCLUDED.state,
        address = EXCLUDED.address,
        timezone = EXCLUDED.timezone;

    INSERT INTO public.barbershop_users (barbershop_id, user_id, role, active)
    VALUES (v_barbershop_id, p_user_id, 'owner', TRUE);

    FOR v_hour IN SELECT * FROM jsonb_to_recordset(p_business_hours) AS x(weekday INT, open_time TEXT, close_time TEXT, active BOOLEAN)
    LOOP
        INSERT INTO public.business_hours (barbershop_id, weekday, open_time, close_time, active)
        VALUES (v_barbershop_id, v_hour.weekday, v_hour.open_time::TIME, v_hour.close_time::TIME, v_hour.active)
        ON CONFLICT (barbershop_id, weekday) DO UPDATE SET
            open_time = EXCLUDED.open_time,
            close_time = EXCLUDED.close_time,
            active = EXCLUDED.active;
    END LOOP;

    v_result := jsonb_build_object(
        'id', v_barbershop_id,
        'name', p_name,
        'slug', v_final_slug
    );

    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create barbershop onboarding: %', SQLERRM;
END;
$$;
