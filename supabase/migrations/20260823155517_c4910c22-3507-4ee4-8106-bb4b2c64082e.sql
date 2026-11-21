-- Harden storage policies for multi-tenant isolation

-- 1. barbershop-assets bucket: used for logos, service photos, and professional avatars
-- We want paths like: barbershops/{barbershop_id}/logos/...
--                   barbershops/{barbershop_id}/services/{service_id}/...
--                   barbershops/{barbershop_id}/professionals/{professional_id}/...

-- Drop existing loose policies if any
DROP POLICY IF EXISTS "Authenticated Manage Own Assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Assets" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update barbershop assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete barbershop assets" ON storage.objects;
DROP POLICY IF EXISTS "Tenant Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Tenant Delete Access" ON storage.objects;
DROP POLICY IF EXISTS "Tenant DELETE Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Assets" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Assets" ON storage.objects;
DROP POLICY IF EXISTS "Tenants can upload assets" ON storage.objects;
DROP POLICY IF EXISTS "Tenants can update assets" ON storage.objects;
DROP POLICY IF EXISTS "Tenants can delete assets" ON storage.objects;
DROP POLICY IF EXISTS "Public select assets" ON storage.objects;

-- Policy for INSERT: Must be authenticated and part of the barbershop in the path
CREATE POLICY "Tenants can upload assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'barbershop-assets' AND
    (storage.foldername(name))[1] = 'barbershops' AND
    public.check_is_barbershop_member(((storage.foldername(name))[2])::uuid)
);

-- Policy for UPDATE: Must be authenticated and part of the barbershop in the path
CREATE POLICY "Tenants can update assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
    bucket_id = 'barbershop-assets' AND
    (storage.foldername(name))[1] = 'barbershops' AND
    public.check_is_barbershop_member(((storage.foldername(name))[2])::uuid)
);

-- Policy for DELETE: Must be authenticated and part of the barbershop in the path
CREATE POLICY "Tenants can delete assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
    bucket_id = 'barbershop-assets' AND
    (storage.foldername(name))[1] = 'barbershops' AND
    public.check_is_barbershop_member(((storage.foldername(name))[2])::uuid)
);

-- Policy for SELECT: Public access to barbershop assets (logos, etc.)
CREATE POLICY "Public select assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'barbershop-assets');

-- 2. barbershop-logos (used for onboarding)
DROP POLICY IF EXISTS "Onboarding upload logos" ON storage.objects;
DROP POLICY IF EXISTS "Onboarding manage own logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated manage logos" ON storage.objects;
DROP POLICY IF EXISTS "Public Read for Logos" ON storage.objects;

CREATE POLICY "Onboarding upload logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'barbershop-logos' AND
    (storage.foldername(name))[1] = 'onboarding' AND
    (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Onboarding manage own logos"
ON storage.objects
FOR ALL
TO authenticated
USING (
    bucket_id = 'barbershop-logos' AND
    (storage.foldername(name))[1] = 'onboarding' AND
    (storage.foldername(name))[2] = auth.uid()::text
);
