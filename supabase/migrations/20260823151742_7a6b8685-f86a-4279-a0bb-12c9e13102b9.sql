
-- 1. Remover a constraint antiga baseada apenas no telefone
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_phone_normalized_key;

-- 2. Adicionar a nova constraint composta (barbershop_id, phone_normalized)
-- Como já verifiquei que não há duplicatas (barbershop_id, phone_normalized), isso deve ser seguro.
ALTER TABLE public.customers ADD CONSTRAINT customers_barbershop_phone_unique UNIQUE (barbershop_id, phone_normalized);

-- 3. Grants necessários (garantir que anon e authenticated possam ver/inserir clientes via RPC)
GRANT SELECT, INSERT, UPDATE ON public.customers TO anon, authenticated;
GRANT ALL ON public.customers TO service_role;
