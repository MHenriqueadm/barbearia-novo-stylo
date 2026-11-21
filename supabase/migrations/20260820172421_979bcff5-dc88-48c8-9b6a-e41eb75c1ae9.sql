-- Reset permissions for business_breaks to ensure anon has full access
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_breaks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_breaks TO authenticated;
GRANT ALL ON public.business_breaks TO service_role;

-- Ensure RLS is enabled
ALTER TABLE public.business_breaks ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Allow public read business_breaks" ON public.business_breaks;
DROP POLICY IF EXISTS "Allow authenticated insert business_breaks" ON public.business_breaks;
DROP POLICY IF EXISTS "Allow authenticated update business_breaks" ON public.business_breaks;
DROP POLICY IF EXISTS "Allow authenticated delete business_breaks" ON public.business_breaks;
DROP POLICY IF EXISTS "Allow all access to business_breaks for anon and authenticated" ON public.business_breaks;

-- New unified policy for 'anon' and 'authenticated'
CREATE POLICY "Allow all access to business_breaks for everyone"
ON public.business_breaks
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);
