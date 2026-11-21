-- 1. Cleanup existing duplicates for specific user
WITH duplicates AS (
    SELECT id, row_number() OVER (PARTITION BY user_id ORDER BY created_at ASC) as rn
    FROM public.barbershop_users
    WHERE user_id = '8bb107c0-9a0a-42ec-931c-e591d54a0cbc'
      AND active = TRUE
      AND role = 'owner'
)
UPDATE public.barbershop_users
SET active = FALSE
WHERE id IN (SELECT id FROM duplicates WHERE rn > 1);

-- 2. Create unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_owner_per_user 
ON public.barbershop_users (user_id) 
WHERE (active = true AND role = 'owner');

-- 3. Update create_barbershop_onboarding RPC
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
BEGIN
    SELECT barbershop_id INTO v_existing_barbershop_id
    FROM public.barbershop_users
    WHERE user_id = p_user_id AND role = 'owner' AND active = TRUE
    LIMIT 1;

    IF v_existing_barbershop_id IS NOT NULL THEN
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

    IF EXISTS (SELECT 1 FROM public.barbershops WHERE slug = p_slug) THEN
        p_slug := p_slug || '-' || floor(random() * 1000)::text;
    END IF;

    INSERT INTO public.barbershops (name, slug, logo_url, active)
    VALUES (p_name, p_slug, p_logo_url, TRUE)
    RETURNING id INTO v_barbershop_id;

    INSERT INTO public.barbershop_settings (
        barbershop_id, name, slug, logo_url, instagram, whatsapp, city, state, address, timezone
    )
    VALUES (
        v_barbershop_id, p_name, p_slug, p_logo_url, p_instagram, p_whatsapp, p_city, p_state, p_address, p_timezone
    );

    INSERT INTO public.barbershop_users (barbershop_id, user_id, role, active)
    VALUES (v_barbershop_id, p_user_id, 'owner', TRUE);

    FOR v_hour IN SELECT * FROM jsonb_to_recordset(p_business_hours) AS x(weekday INT, open_time TEXT, close_time TEXT, active BOOLEAN)
    LOOP
        INSERT INTO public.business_hours (barbershop_id, weekday, open_time, close_time, active)
        VALUES (v_barbershop_id, v_hour.weekday, v_hour.open_time, v_hour.close_time, v_hour.active);
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
