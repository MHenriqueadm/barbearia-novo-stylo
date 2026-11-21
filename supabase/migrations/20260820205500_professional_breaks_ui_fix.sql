-- Ensure professional_breaks has RLS and correct structure
ALTER TABLE public.professional_breaks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid duplicates)
DO $$
BEGIN
    DROP POLICY IF EXISTS "Barbershop owners can manage their professional breaks" ON public.professional_breaks;
    DROP POLICY IF EXISTS "Professionals can view their own breaks" ON public.professional_breaks;
END
$$;

-- Multi-tenant policy: only authenticated users who have access to the barbershop
CREATE POLICY "Barbershop owners can manage their professional breaks"
ON public.professional_breaks
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.barbershop_users
        WHERE barbershop_users.barbershop_id = professional_breaks.barbershop_id
        AND barbershop_users.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.barbershop_users
        WHERE barbershop_users.barbershop_id = professional_breaks.barbershop_id
        AND barbershop_users.user_id = auth.uid()
    )
);

-- Grant permissions
GRANT ALL ON public.professional_breaks TO authenticated;
GRANT ALL ON public.professional_breaks TO service_role;
