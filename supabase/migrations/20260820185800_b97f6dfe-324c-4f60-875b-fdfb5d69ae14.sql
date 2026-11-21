-- Internal helpers and triggers should not be publicly executable
REVOKE EXECUTE ON FUNCTION public.tr_appointments_confirmation_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_confirmation_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- register_appointment_payment should only be for staff
REVOKE EXECUTE ON FUNCTION public.register_appointment_payment(uuid, numeric, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_appointment_payment(uuid, numeric, text, text, text) TO authenticated;

-- create_public_appointment and get_busy_slots are intended for public use
GRANT EXECUTE ON FUNCTION public.create_public_appointment(uuid, uuid, timestamptz, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_busy_slots(date) TO anon, authenticated;
