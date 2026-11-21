-- 1. Grant execute permission to authenticated users for the RPC
GRANT EXECUTE ON FUNCTION public.register_appointment_payment(uuid, numeric, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_appointment_payment(uuid, numeric, text, text, text) TO service_role;

-- 2. Test Call 1
SELECT public.register_appointment_payment('c43b4e44-6d3d-48bd-9878-9325d52e2a28', 30.00, 'pix', 'paid', 'Teste automatizado');

-- 3. Test Call 2 (Idempotency)
SELECT public.register_appointment_payment('c43b4e44-6d3d-48bd-9878-9325d52e2a28', 30.00, 'pix', 'paid', 'Teste automatizado repetido');

-- 4. Audit results
SELECT appointment_id, COUNT(*) as payment_count FROM public.payments WHERE appointment_id = 'c43b4e44-6d3d-48bd-9878-9325d52e2a28' GROUP BY appointment_id;
SELECT payment_id, COUNT(*) as transaction_count FROM public.financial_transactions WHERE payment_id IN (SELECT id FROM public.payments WHERE appointment_id = 'c43b4e44-6d3d-48bd-9878-9325d52e2a28') GROUP BY payment_id;
