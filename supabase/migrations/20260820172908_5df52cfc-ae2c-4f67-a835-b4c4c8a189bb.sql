-- Policy to allow anyone to select/view assets
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'barbershop-assets');

-- Policy to allow anonymous uploads
CREATE POLICY "Allow Anonymous Uploads"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'barbershop-assets');

-- Policy to allow anonymous updates/overwrites
CREATE POLICY "Allow Anonymous Updates"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'barbershop-assets');

-- Policy to allow anonymous deletions
CREATE POLICY "Allow Anonymous Deletions"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'barbershop-assets');
