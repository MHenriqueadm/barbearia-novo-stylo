
-- Revoke all execute permissions from public and roles for internal functions
REVOKE ALL ON FUNCTION public.handle_new_user() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_confirmation_code() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.register_appointment_payment(uuid, numeric, text, text, text) FROM public, anon, authenticated;

-- Grant to authenticated only where needed
GRANT EXECUTE ON FUNCTION public.register_appointment_payment(uuid, numeric, text, text, text) TO authenticated;

-- get_busy_slots needs to be public for the booking flow
REVOKE ALL ON FUNCTION public.get_busy_slots(date) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_busy_slots(date) TO anon, authenticated;
