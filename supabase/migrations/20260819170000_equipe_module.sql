CREATE TABLE public.professionals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    phone text,
    whatsapp text,
    instagram text,
    avatar_url text,
    bio text,
    active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professionals TO anon, authenticated;
GRANT ALL ON public.professionals TO service_role;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access to professionals" ON public.professionals FOR ALL TO anon, authenticated USING (true);

CREATE TABLE public.professional_services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(professional_id, service_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_services TO anon, authenticated;
GRANT ALL ON public.professional_services TO service_role;
ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access to professional services" ON public.professional_services FOR ALL TO anon, authenticated USING (true);

CREATE TABLE public.professional_schedules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    weekday integer NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
    active boolean DEFAULT true,
    start_time time NOT NULL,
    end_time time NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_schedules TO anon, authenticated;
GRANT ALL ON public.professional_schedules TO service_role;
ALTER TABLE public.professional_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access to professional schedules" ON public.professional_schedules FOR ALL TO anon, authenticated USING (true);

CREATE TABLE public.professional_breaks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    weekday integer NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
    start_time time NOT NULL,
    end_time time NOT NULL,
    label text,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_breaks TO anon, authenticated;
GRANT ALL ON public.professional_breaks TO service_role;
ALTER TABLE public.professional_breaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access to professional breaks" ON public.professional_breaks FOR ALL TO anon, authenticated USING (true);

CREATE TABLE public.professional_blocks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    start_at timestamptz NOT NULL,
    end_at timestamptz NOT NULL,
    reason text,
    all_day boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_blocks TO anon, authenticated;
GRANT ALL ON public.professional_blocks TO service_role;
ALTER TABLE public.professional_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access to professional blocks" ON public.professional_blocks FOR ALL TO anon, authenticated USING (true);

INSERT INTO public.professionals (name, instagram, active) 
VALUES ('Otávio Carneiro', '@_otavio_carneiro', true);
