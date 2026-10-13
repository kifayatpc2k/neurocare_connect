-- Role helpers: only answer for the calling user, so a signed-in user cannot probe other accounts' roles.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select _user_id is not null and _user_id = auth.uid()
     and exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
CREATE OR REPLACE FUNCTION public.is_research_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select _user_id is not null and _user_id = auth.uid()
     and exists (select 1 from public.user_roles where user_id = _user_id and role in ('researcher','admin'))
$$;

-- Visit check only needs the caller's own access to the participant row: drop elevated privileges.
CREATE OR REPLACE FUNCTION public.study_visit_available(p_id uuid, p_visit public.study_milestone)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
 SELECT CASE p_visit
   WHEN 'baseline' THEN p.enrolment_confirmed AND p.baseline_completed_at IS NULL
   WHEN 'day_15' THEN p.randomized_at IS NOT NULL AND p.day_15_opened_at IS NOT NULL AND p.day_15_completed_at IS NULL
   WHEN 'day_30' THEN p.day_15_completed_at IS NOT NULL AND p.day_30_completed_at IS NULL
   ELSE false END
 FROM public.participants p WHERE p.id = p_id
$$;

-- Trigger-only helpers never need to be callable directly.
REVOKE EXECUTE ON FUNCTION public.enforce_participant_enrolment_rules() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_study_record() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_study_stage() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.lock_completed_assessment() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_allocation_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_randomization_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.score_dn4(jsonb) FROM anon;
REVOKE EXECUTE ON FUNCTION public.score_nepiqol(jsonb) FROM anon;