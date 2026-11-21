-- Revoke public execution of register_appointment_payment to address linter warnings
REVOKE EXECUTE ON FUNCTION public.register_appointment_payment(uuid, numeric, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.register_appointment_payment(uuid, numeric, text, text, text) FROM anon;

-- Grant execution only to authenticated users and service_role
GRANT EXECUTE ON FUNCTION public.register_appointment_payment(uuid, numeric, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.register_appointment_payment(uuid, numeric, text, text, text) TO service_role;
