REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_research_staff(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.study_visit_available(uuid, public.study_milestone) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.allocate_study_participant(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_research_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.study_visit_available(uuid, public.study_milestone) TO authenticated;
GRANT EXECUTE ON FUNCTION public.allocate_study_participant(uuid) TO authenticated;