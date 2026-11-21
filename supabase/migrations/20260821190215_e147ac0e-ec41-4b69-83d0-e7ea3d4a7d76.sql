DO $$
BEGIN
    -- 1. Public READ access for all objects in barbershop-assets
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Public Read Access' AND tablename = 'objects' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Public Read Access"
        ON storage.objects FOR SELECT
        TO public
        USING (bucket_id = 'barbershop-assets');
    END IF;

    -- 2. Tenant INSERT access
    -- check_is_barbershop_member(uuid) uses auth.uid() internally.
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Tenant Insert Access' AND tablename = 'objects' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Tenant Insert Access"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (
            bucket_id = 'barbershop-assets' AND
            (storage.foldername(name))[1] = 'barbershops' AND
            public.check_is_barbershop_member(((storage.foldername(name))[2])::uuid)
        );
    END IF;

    -- 3. Tenant UPDATE access
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Tenant Update Access' AND tablename = 'objects' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Tenant Update Access"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (
            bucket_id = 'barbershop-assets' AND
            (storage.foldername(name))[1] = 'barbershops' AND
            public.check_is_barbershop_member(((storage.foldername(name))[2])::uuid)
        );
    END IF;

    -- 4. Tenant DELETE access
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Tenant DELETE Access' AND tablename = 'objects' AND schemaname = 'storage'
    ) THEN
        CREATE POLICY "Tenant DELETE Access"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (
            bucket_id = 'barbershop-assets' AND
            (storage.foldername(name))[1] = 'barbershops' AND
            public.check_is_barbershop_member(((storage.foldername(name))[2])::uuid)
        );
    END IF;
END
$$;