-- Revoke default PUBLIC execute so anon truly loses access to internal helpers
REVOKE EXECUTE ON FUNCTION public.check_user_membership(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_user_membership(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.user_has_barbershop_access(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_has_barbershop_access(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.check_is_barbershop_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_is_barbershop_member(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.generate_confirmation_code() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.create_barbershop_onboarding(text,text,text,uuid,text,text,text,text,text,text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_barbershop_onboarding(text,text,text,uuid,text,text,text,text,text,text,jsonb) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.register_appointment_payment(uuid,numeric,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_appointment_payment(uuid,numeric,text,text,text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_busy_slots(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_busy_slots(date) TO authenticated, service_role;

-- Public booking surface stays intentionally callable by visitors
GRANT EXECUTE ON FUNCTION public.get_busy_slots(text, uuid) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_public_appointment(uuid,uuid,timestamptz,text,text,text,uuid) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';