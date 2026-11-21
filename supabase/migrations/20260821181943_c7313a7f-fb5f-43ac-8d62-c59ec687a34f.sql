-- Proteger as RPCs SECURITY DEFINER baseando-se nas assinaturas reais

-- 1. register_appointment_payment
REVOKE EXECUTE ON FUNCTION public.register_appointment_payment(uuid, numeric, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_appointment_payment(uuid, numeric, text, text, text) TO authenticated;

-- 2. create_barbershop_onboarding
-- Note: ela tem uma lista longa de argumentos sem defaults
REVOKE EXECUTE ON FUNCTION public.create_barbershop_onboarding(text, text, text, uuid, text, text, text, text, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_barbershop_onboarding(text, text, text, uuid, text, text, text, text, text, text, jsonb) TO authenticated;

-- 3. get_busy_slots(date) - a versão antiga
REVOKE EXECUTE ON FUNCTION public.get_busy_slots(date) FROM PUBLIC, anon;

-- 4. Criar Storage Buckets e Políticas (Garantir que os nomes batam com o que o app usa)
-- O app usa: barbershop-logos, professional-avatars, service-photos
-- (Já criados na migração anterior, mas vamos garantir as políticas de leitura pública e escrita autenticada)

-- Política para leitura pública de qualquer objeto nos buckets de assets
CREATE POLICY "Public Read Assets" 
ON storage.objects FOR SELECT 
TO public 
USING (bucket_id IN ('barbershop-logos', 'professional-avatars', 'service-photos'));

-- Política para profissionais da barbearia fazerem upload
CREATE POLICY "Authenticated Upload Assets" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id IN ('barbershop-logos', 'professional-avatars', 'service-photos'));

-- Política para deletar
CREATE POLICY "Authenticated Delete Assets" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (bucket_id IN ('barbershop-logos', 'professional-avatars', 'service-photos'));
