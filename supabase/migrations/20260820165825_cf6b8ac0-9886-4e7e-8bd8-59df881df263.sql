-- Drop existing policies if they are too restrictive
DROP POLICY IF EXISTS "Allow authenticated to manage breaks" ON public.business_breaks;
DROP POLICY IF EXISTS "Allow public read of business breaks" ON public.business_breaks;

-- Re-create policies properly
CREATE POLICY "Allow authenticated to insert breaks"
ON public.business_breaks
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated to update breaks"
ON public.business_breaks
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated to delete breaks"
ON public.business_breaks
FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Allow public read of business breaks"
ON public.business_breaks
FOR SELECT
TO public
USING (true);

-- Ensure GRANTS are correct
GRANT ALL ON public.business_breaks TO authenticated;
GRANT SELECT ON public.business_breaks TO anon;
GRANT ALL ON public.business_breaks TO service_role;
