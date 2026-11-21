
-- Harden storage policies for barbershop-assets to ensure tenant isolation for mutations
-- (Assuming name is path[2] based on filePath = barbershops/{barbershop_id}/logos/{fileName})

DROP POLICY IF EXISTS "Authenticated can upload barbershop assets" ON storage.objects;
CREATE POLICY "Authenticated can upload barbershop assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'barbershop-assets' AND
  (storage.foldername(name))[1] = 'barbershops' AND
  public.check_is_barbershop_member((storage.foldername(name))[2]::uuid)
);

DROP POLICY IF EXISTS "Authenticated can update barbershop assets" ON storage.objects;
CREATE POLICY "Authenticated can update barbershop assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'barbershop-assets' AND
  (storage.foldername(name))[1] = 'barbershops' AND
  public.check_is_barbershop_member((storage.foldername(name))[2]::uuid)
);

DROP POLICY IF EXISTS "Authenticated can delete barbershop assets" ON storage.objects;
CREATE POLICY "Authenticated can delete barbershop assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'barbershop-assets' AND
  (storage.foldername(name))[1] = 'barbershops' AND
  public.check_is_barbershop_member((storage.foldername(name))[2]::uuid)
);
