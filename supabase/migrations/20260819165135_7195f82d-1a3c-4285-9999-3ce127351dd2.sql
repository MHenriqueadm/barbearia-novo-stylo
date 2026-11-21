-- Tabela de Configurações da Barbearia
CREATE TABLE public.barbershop_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    phone text,
    whatsapp text,
    instagram text,
    address text,
    city text,
    state text,
    timezone text DEFAULT 'America/Bahia',
    business_name text,
    logo_url text,
    booking_enabled boolean DEFAULT true,
    slot_interval integer DEFAULT 30,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.barbershop_settings TO anon, authenticated;
GRANT ALL ON public.barbershop_settings TO service_role;
ALTER TABLE public.barbershop_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access to barbershop settings" ON public.barbershop_settings FOR ALL TO anon, authenticated USING (true);

-- Tabela de Horários de Funcionamento
CREATE TABLE public.business_hours (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    weekday integer NOT NULL CHECK (weekday >= 0 AND weekday <= 6),
    active boolean DEFAULT true,
    open_time time NOT NULL DEFAULT '08:00',
    close_time time NOT NULL DEFAULT '18:00',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(weekday)
);

GRANT SELECT, INSERT, UPDATE ON public.business_hours TO anon, authenticated;
GRANT ALL ON public.business_hours TO service_role;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access to business hours" ON public.business_hours FOR ALL TO anon, authenticated USING (true);

-- Tabela de Serviços
CREATE TABLE public.services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    duration_minutes integer NOT NULL,
    active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO anon, authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access to services" ON public.services FOR ALL TO anon, authenticated USING (true);

-- Dados Iniciais (Seed)
INSERT INTO public.barbershop_settings (name, slug, instagram, whatsapp, phone, city, state, address, timezone, booking_enabled)
VALUES ('Barbearia RESTYLE', 'restyle', '@restylebarber_', '+55 77 98822-7549', '+55 77 98822-7549', 'Tanque Novo', 'BA', 'Rua João Alves Carneiro', 'America/Bahia', true);

INSERT INTO public.business_hours (weekday, active, open_time, close_time) VALUES
(0, false, '08:00', '18:00'),
(1, true, '08:00', '18:00'),
(2, true, '08:00', '18:00'),
(3, true, '08:00', '18:00'),
(4, true, '08:00', '18:00'),
(5, true, '08:00', '18:00'),
(6, true, '08:00', '18:00');
