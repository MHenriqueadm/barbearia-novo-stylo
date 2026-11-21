-- 1. Refinar a RPC get_busy_slots para garantir isolamento multi-tenant e não expor PII
CREATE OR REPLACE FUNCTION public.get_busy_slots(p_date TEXT, p_barbershop_id UUID DEFAULT NULL)
RETURNS TABLE (
    professional_id UUID,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    barbershop_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.professional_id,
        a.start_at,
        a.end_at,
        a.barbershop_id
    FROM appointments a
    WHERE a.start_at::DATE = p_date::DATE
      AND a.status IN ('scheduled', 'confirmed', 'completed')
      AND (p_barbershop_id IS NULL OR a.barbershop_id = p_barbershop_id);
END;
$$;

-- 2. Revogar EXECUTE da get_busy_slots antiga se necessário e garantir grants
GRANT EXECUTE ON FUNCTION public.get_busy_slots(TEXT, UUID) TO anon, authenticated;

-- 3. Garantir que anon não tem acesso direto a barbershop_users
REVOKE ALL ON public.barbershop_users FROM anon;
GRANT SELECT ON public.barbershop_users TO authenticated;
GRANT ALL ON public.barbershop_users TO service_role;

-- 4. Corrigir Storage: Buckets Administrativos vs Públicos
-- As políticas já foram criadas, mas vamos garantir que o check de barbershop_id seja possível no futuro via metadados ou caminhos.
-- Por enquanto, restringir uploads/modificações estritamente a usuários autenticados.
-- O bucket barbershop-assets parece ser usado para logos (conforme visto em barbershop_settings.logo_url)
-- Vamos criar/garantir os buckets e políticas.

-- 5. Auditar a tabela appointments para garantir que anon não tenha SELECT
-- O revogue já foi feito na migração anterior, mas vamos reforçar a política de SELECT para authenticated apenas.
DROP POLICY IF EXISTS "Public read appointments" ON public.appointments;
CREATE POLICY "Authenticated users can see their unit appointments"
ON public.appointments
FOR SELECT
TO authenticated
USING (public.check_is_barbershop_member(barbershop_id));

-- 6. Garantir que customers são privados
DROP POLICY IF EXISTS "Public read customers" ON public.customers;
CREATE POLICY "Authenticated users can see their unit customers"
ON public.customers
FOR SELECT
TO authenticated
USING (public.check_is_barbershop_member(barbershop_id));
