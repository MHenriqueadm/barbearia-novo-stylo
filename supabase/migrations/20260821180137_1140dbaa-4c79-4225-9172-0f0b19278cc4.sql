
-- 1. Add barbershop_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'professional_services' 
    AND column_name = 'barbershop_id'
  ) THEN
    ALTER TABLE public.professional_services ADD COLUMN barbershop_id UUID REFERENCES public.barbershops(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Grant permissions
GRANT ALL ON public.professional_services TO authenticated, service_role;
GRANT SELECT ON public.professional_services TO anon;

-- 3. Enable RLS and add policy
ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public select professional_services"
ON public.professional_services
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Authenticated users can manage professional_services"
ON public.professional_services
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Test Insert (using the "corte" service found earlier)
INSERT INTO public.professional_services (professional_id, service_id, barbershop_id)
VALUES ('95851b29-9388-4300-9d66-3d3f9dad450b', '11e36358-7398-4aab-9cc9-61839d259452', '7a4b8c9e-1d2f-4a3b-8c9d-5e6f7a8b9c0d')
ON CONFLICT DO NOTHING;
