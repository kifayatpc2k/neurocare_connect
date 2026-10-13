REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.allocation_overrides FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.user_permissions FROM anon, authenticated;
REVOKE ALL ON public.allocation_overrides FROM anon;
REVOKE ALL ON public.user_permissions FROM anon;