CREATE OR REPLACE FUNCTION public.create_barbershop_onboarding(p_name text, p_slug text, p_logo_url text, p_user_id uuid, p_instagram text DEFAULT NULL::text, p_whatsapp text DEFAULT NULL::text, p_city text DEFAULT NULL::text, p_state text DEFAULT NULL::text, p_address text DEFAULT NULL::text, p_timezone text DEFAULT 'America/Bahia'::text, p_business_hours jsonb DEFAULT '[]'::jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'storage'
AS $function$
DECLARE
    v_barbershop_id uuid;
    v_existing_barbershop_id uuid;
    v_logo_path text;
    v_dest_path text;
    v_final_logo_url text;
    v_final_slug text;
    v_counter integer := 1;
    v_hour jsonb;
BEGIN
    PERFORM pg_advisory_xact_lock(hashtextextended(lower(trim(p_slug)), 0));

    SELECT bu.barbershop_id
      INTO v_existing_barbershop_id
      FROM public.barbershop_users bu
     WHERE bu.user_id = p_user_id
       AND bu.role = 'owner'
       AND bu.active = true
     ORDER BY bu.created_at NULLS LAST
     LIMIT 1;

    IF v_existing_barbershop_id IS NOT NULL THEN
        INSERT INTO public.barbershop_settings (
            barbershop_id, name, slug, business_name, instagram, whatsapp,
            city, state, address, timezone, logo_url
        )
        SELECT v_existing_barbershop_id, p_name, b.slug, p_name, p_instagram, p_whatsapp,
               p_city, p_state, p_address, p_timezone, p_logo_url
          FROM public.barbershops b
         WHERE b.id = v_existing_barbershop_id
           AND NOT EXISTS (
            SELECT 1 FROM public.barbershop_settings s
             WHERE s.barbershop_id = v_existing_barbershop_id
        );

        RETURN v_existing_barbershop_id;
    END IF;

    v_final_slug := lower(trim(p_slug));
    WHILE EXISTS (SELECT 1 FROM public.barbershops WHERE lower(slug) = v_final_slug) LOOP
        v_counter := v_counter + 1;
        v_final_slug := left(lower(trim(p_slug)), 240) || '-' || v_counter::text;
    END LOOP;

    INSERT INTO public.barbershops (name, slug, logo_url)
    VALUES (p_name, v_final_slug, p_logo_url)
    RETURNING id INTO v_barbershop_id;

    INSERT INTO public.barbershop_users (barbershop_id, user_id, role)
    VALUES (v_barbershop_id, p_user_id, 'owner');

    INSERT INTO public.barbershop_settings (
        barbershop_id, name, slug, business_name, instagram, whatsapp,
        city, state, address, timezone, logo_url
    )
    VALUES (
        v_barbershop_id, p_name, v_final_slug, p_name, p_instagram, p_whatsapp,
        p_city, p_state, p_address, p_timezone, p_logo_url
    );

    FOR v_hour IN SELECT value FROM jsonb_array_elements(p_business_hours)
    LOOP
        INSERT INTO public.business_hours (
            barbershop_id, weekday, open_time, close_time, active
        )
        VALUES (
            v_barbershop_id,
            (v_hour->>'weekday')::int,
            (v_hour->>'open_time')::time,
            (v_hour->>'close_time')::time,
            (v_hour->>'active')::boolean
        );
    END LOOP;

    IF p_logo_url LIKE 'onboarding/%' THEN
        v_logo_path := p_logo_url;
        v_dest_path := 'barbershops/' || v_barbershop_id::text || '/logos/' || split_part(v_logo_path, '/', 4);

        UPDATE storage.objects
           SET name = v_dest_path,
               bucket_id = 'barbershop-assets'
         WHERE bucket_id = 'barbershop-logos'
           AND name = v_logo_path;

        v_final_logo_url := v_dest_path;
        UPDATE public.barbershops SET logo_url = v_final_logo_url WHERE id = v_barbershop_id;
        UPDATE public.barbershop_settings SET logo_url = v_final_logo_url WHERE barbershop_id = v_barbershop_id;
    END IF;

    RETURN v_barbershop_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_barbershop_onboarding(text, text, text, uuid, text, text, text, text, text, text, jsonb) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_barbershop_onboarding(text, text, text, uuid, text, text, text, text, text, text, jsonb) TO authenticated, service_role;