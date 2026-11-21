-- Create policies for new tables
CREATE POLICY "Enable all for authenticated users" ON public.payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.financial_transactions FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all for authenticated users" ON public.cash_sessions FOR ALL TO authenticated USING (true);

-- Fix SECURITY DEFINER warnings
REVOKE EXECUTE ON FUNCTION public.register_appointment_payment(uuid, numeric, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.register_appointment_payment(uuid, numeric, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.register_appointment_payment(uuid, numeric, text, text, text) TO authenticated;

-- Also check for create_public_appointment from previous part and fix it if needed
-- REVOKE EXECUTE ON FUNCTION public.create_public_appointment(...) FROM public;
