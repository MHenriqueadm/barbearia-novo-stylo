-- Revoke execute on security definer functions from public roles
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- If has_role exists, protect it too (it should only be used in policies)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_role') THEN
        REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
        REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated;
    END IF;
END $$;
