CREATE TABLE public.business_breaks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    weekday integer NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
    start_time time NOT NULL,
    end_time time NOT NULL,
    label text,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CHECK (end_time > start_time)
);

-- RLS
ALTER TABLE public.business_breaks ENABLE ROW LEVEL SECURITY;

-- Permissions
GRANT SELECT ON public.business_breaks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_breaks TO authenticated;
GRANT ALL ON public.business_breaks TO service_role;

-- Policies
CREATE POLICY "Public read business_breaks" ON public.business_breaks
    FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated manage business_breaks" ON public.business_breaks
    FOR ALL TO authenticated USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_business_breaks_updated
    BEFORE UPDATE ON public.business_breaks
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
