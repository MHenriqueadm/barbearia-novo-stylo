
-- Fix security linter warnings for recently added functions
ALTER FUNCTION public.generate_confirmation_code() SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.tr_appointments_confirmation_code() SECURITY DEFINER SET search_path = public;
ALTER FUNCTION public.create_public_appointment(UUID, UUID, TIMESTAMPTZ, TEXT, TEXT, TEXT) SECURITY DEFINER SET search_path = public;

-- Note: create_public_appointment is INTENDED to be callable by anon/authenticated 
-- because it's a public booking endpoint. The search_path fix is the primary security requirement.
