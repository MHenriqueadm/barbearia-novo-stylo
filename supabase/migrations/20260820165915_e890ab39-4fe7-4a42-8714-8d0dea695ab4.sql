-- Remove the temporary anon insert policy
DROP POLICY IF EXISTS "Allow anon to insert breaks" ON public.business_breaks;

-- Revoke anon insert grant
REVOKE INSERT ON public.business_breaks FROM anon;

-- Ensure authenticated still has it (it was re-added in the previous migration)
GRANT ALL ON public.business_breaks TO authenticated;
GRANT SELECT ON public.business_breaks TO anon;
GRANT ALL ON public.business_breaks TO service_role;
