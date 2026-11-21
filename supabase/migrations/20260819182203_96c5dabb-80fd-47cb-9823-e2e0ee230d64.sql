
-- Fix security linter warnings: revoke public execution from functions that should be private/internal
REVOKE EXECUTE ON FUNCTION public.generate_confirmation_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tr_appointments_confirmation_code() FROM PUBLIC, anon, authenticated;

-- create_public_appointment SHOULD remain callable by PUBLIC/anon/authenticated as it's the booking endpoint.
-- The linter will still flag it, but it's intentional for this feature.
