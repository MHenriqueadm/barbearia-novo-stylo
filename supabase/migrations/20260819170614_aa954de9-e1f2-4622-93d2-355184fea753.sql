-- Create appointments table
CREATE TABLE public.appointments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    customer_name text NOT NULL,
    customer_phone text NOT NULL,
    start_at timestamptz NOT NULL,
    end_at timestamptz NOT NULL,
    status text NOT NULL DEFAULT 'scheduled',
    service_name_snapshot text,
    service_price_snapshot numeric,
    service_duration_snapshot integer,
    notes text,
    source text DEFAULT 'admin',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT valid_status CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'))
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
GRANT SELECT ON public.appointments TO anon;

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow all for authenticated users on appointments"
ON public.appointments FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Allow anon select on appointments"
ON public.appointments FOR SELECT
TO anon
USING (true);

-- Function to check for appointment overlaps
CREATE OR REPLACE FUNCTION public.check_appointment_overlap()
RETURNS TRIGGER AS $$
BEGIN
    -- Only check for active statuses
    IF NEW.status IN ('scheduled', 'confirmed') THEN
        IF EXISTS (
            SELECT 1 FROM public.appointments
            WHERE professional_id = NEW.professional_id
              AND status IN ('scheduled', 'confirmed')
              AND id <> NEW.id
              AND (
                (NEW.start_at < end_at AND NEW.end_at > start_at)
              )
        ) THEN
            RAISE EXCEPTION 'Conflito de horário: O profissional já possui um agendamento neste período.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for overlap protection
CREATE TRIGGER tr_check_appointment_overlap
BEFORE INSERT OR UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.check_appointment_overlap();
