-- 1. Harden overlap trigger: advisory lock per professional + tenant scope
CREATE OR REPLACE FUNCTION public.check_appointment_overlap()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    IF NEW.status IN ('scheduled', 'confirmed') THEN
        -- Serialize concurrent bookings for the same professional within this transaction
        PERFORM pg_advisory_xact_lock(hashtextextended(NEW.professional_id::text, 0));

        IF EXISTS (
            SELECT 1 FROM public.appointments
            WHERE professional_id = NEW.professional_id
              AND (NEW.barbershop_id IS NULL OR barbershop_id = NEW.barbershop_id)
              AND status IN ('scheduled', 'confirmed')
              AND id <> NEW.id
              AND NEW.start_at < end_at
              AND NEW.end_at > start_at
        ) THEN
            RAISE EXCEPTION 'SLOT_TAKEN: Este horário acabou de ser reservado.'
              USING ERRCODE = '23505';
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;

-- 2. Public, privacy-safe busy intervals for availability calculation
CREATE OR REPLACE FUNCTION public.get_public_busy_slots(
    p_barbershop_id uuid,
    p_professional_id uuid,
    p_start timestamptz,
    p_end timestamptz
)
RETURNS TABLE (
    id uuid,
    professional_id uuid,
    start_at timestamptz,
    end_at timestamptz,
    status text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
    SELECT a.id, a.professional_id, a.start_at, a.end_at, a.status
    FROM public.appointments a
    WHERE a.barbershop_id = p_barbershop_id
      AND a.professional_id = p_professional_id
      AND a.status IN ('scheduled', 'confirmed')
      AND a.start_at < p_end
      AND a.end_at > p_start;
$function$;

REVOKE ALL ON FUNCTION public.get_public_busy_slots(uuid, uuid, timestamptz, timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_busy_slots(uuid, uuid, timestamptz, timestamptz) TO anon, authenticated;