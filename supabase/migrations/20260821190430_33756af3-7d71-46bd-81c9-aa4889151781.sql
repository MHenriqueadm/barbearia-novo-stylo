-- target: storage
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Tenant Insert Access" ON storage.objects;
DROP POLICY IF EXISTS "Tenant Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Tenant Delete Access" ON storage.objects;

CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'barbershop-assets');

CREATE POLICY "Tenant Insert Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'barbershop-assets' AND
    (storage.foldername(name))[1] = 'barbershops' AND
    public.check_is_barbershop_member(((storage.foldername(name))[2])::uuid)
);

CREATE POLICY "Tenant Update Access"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'barbershop-assets' AND
    (storage.foldername(name))[1] = 'barbershops' AND
    public.check_is_barbershop_member(((storage.foldername(name))[2])::uuid)
);

CREATE POLICY "Tenant Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'barbershop-assets' AND
    (storage.foldername(name))[1] = 'barbershops' AND
    public.check_is_barbershop_member(((storage.foldername(name))[2])::uuid)
);