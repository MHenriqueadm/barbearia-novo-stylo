-- Revoke public access and keep only authenticated/service_role
REVOKE EXECUTE ON FUNCTION public.register_appointment_payment(uuid, numeric, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.register_appointment_payment(uuid, numeric, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_appointment_payment(uuid, numeric, text, text, text) TO service_role;

-- Ensure RLS allows reading these tables for authenticated users
-- (Using existing pattern if any, or standard grants)
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.financial_transactions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.cash_sessions TO authenticated;

GRANT ALL ON public.payments TO service_role;
GRANT ALL ON public.financial_transactions TO service_role;
GRANT ALL ON public.cash_sessions TO service_role;
