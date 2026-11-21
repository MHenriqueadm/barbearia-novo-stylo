DO $$
BEGIN
    -- Remover políticas antigas para evitar conflitos
    DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
    DROP POLICY IF EXISTS "Barbershop Member Insert" ON storage.objects;
    DROP POLICY IF EXISTS "Barbershop Member Update" ON storage.objects;
    DROP POLICY IF EXISTS "Barbershop Member Delete" ON storage.objects;
    DROP POLICY IF EXISTS "Public Read for Logos" ON storage.objects;
    DROP POLICY IF EXISTS "Public Read for Service Photos" ON storage.objects;
    DROP POLICY IF EXISTS "Public Read for Avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated manage logos" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated manage photos" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated manage avatars" ON storage.objects;
    DROP POLICY IF EXISTS "Tenant Insert Access" ON storage.objects;
    DROP POLICY IF EXISTS "Tenant Update Access" ON storage.objects;
    DROP POLICY IF EXISTS "Tenant DELETE Access" ON storage.objects;
    DROP POLICY IF EXISTS "Tenants can update assets" ON storage.objects;
    DROP POLICY IF EXISTS "Tenants can delete assets" ON storage.objects;
    DROP POLICY IF EXISTS "Public access to barbershop-assets" ON storage.objects;
END $$;

-- Política de Leitura Pública para todos os buckets de assets
CREATE POLICY "Public Read Access" ON storage.objects
FOR SELECT TO public
USING (bucket_id IN ('barbershop-assets', 'barbershop-logos', 'service-photos', 'professional-avatars'));

-- Políticas de Escrita baseadas em membership (isolation)
-- O path esperado é 'barbershops/{barbershop_id}/...'
-- Usamos a versão da função que aceita apenas 1 argumento (o UUID da barbearia)
CREATE POLICY "Barbershop Member Insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
    bucket_id IN ('barbershop-assets', 'barbershop-logos', 'service-photos', 'professional-avatars') AND
    (storage.foldername(name))[1] = 'barbershops' AND
    public.check_is_barbershop_member(((storage.foldername(name))[2])::uuid)
);

CREATE POLICY "Barbershop Member Update" ON storage.objects
FOR UPDATE TO authenticated
USING (
    bucket_id IN ('barbershop-assets', 'barbershop-logos', 'service-photos', 'professional-avatars') AND
    (storage.foldername(name))[1] = 'barbershops' AND
    public.check_is_barbershop_member(((storage.foldername(name))[2])::uuid)
);

CREATE POLICY "Barbershop Member Delete" ON storage.objects
FOR DELETE TO authenticated
USING (
    bucket_id IN ('barbershop-assets', 'barbershop-logos', 'service-photos', 'professional-avatars') AND
    (storage.foldername(name))[1] = 'barbershops' AND
    public.check_is_barbershop_member(((storage.foldername(name))[2])::uuid)
);
