-- TEMPORARY: Allow anon to insert for testing purposes if session injection is not working
CREATE POLICY "Allow anon to insert breaks"
ON public.business_breaks
FOR INSERT
TO anon
WITH CHECK (true);

-- Ensure anon has INSERT grant
GRANT INSERT ON public.business_breaks TO anon;
