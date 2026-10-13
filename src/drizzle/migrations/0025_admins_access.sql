CREATE TABLE public.admin_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempted_at timestamptz NOT NULL DEFAULT now(),
  success boolean NOT NULL
);
GRANT ALL ON public.admin_login_attempts TO service_role;
ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;
CREATE INDEX admin_login_attempts_at_idx ON public.admin_login_attempts (attempted_at DESC);

CREATE OR REPLACE FUNCTION public.admin_correct_participant_allocation(
  p_id uuid, p_expected_group study_group, p_new_group study_group, p_reason text, p_actor uuid, p_admin_login text)
RETURNS allocation_overrides
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE p public.participants%ROWTYPE; r public.randomizations%ROWTYPE; o public.allocation_overrides%ROWTYPE; v_reason text := btrim(coalesce(p_reason, ''));
BEGIN
 IF p_actor IS NULL OR NOT public.is_research_staff(p_actor) THEN RAISE EXCEPTION 'Research staff session required.'; END IF;
 IF v_reason = '' THEN RAISE EXCEPTION 'A reason for the allocation change is required.'; END IF;
 IF p_new_group IS NULL THEN RAISE EXCEPTION 'Select the new allocation.'; END IF;
 SELECT * INTO p FROM public.participants WHERE id = p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Participant not found.'; END IF;
 IF p_expected_group IS NULL OR p.study_group IS DISTINCT FROM p_expected_group THEN
   RAISE EXCEPTION 'The allocation has changed since you reviewed it. Reload and review again.';
 END IF;
 SELECT * INTO r FROM public.randomizations WHERE participant_id = p_id;
 IF NOT FOUND OR p.randomized_at IS NULL OR p.study_group IS NULL THEN RAISE EXCEPTION 'This participant has not been randomised.'; END IF;
 IF p.study_group = p_new_group THEN RAISE EXCEPTION 'The new allocation must differ from the current allocation.'; END IF;
 IF p.status = 'withdrawn' THEN RAISE EXCEPTION 'Allocation cannot be changed for a withdrawn participant.'; END IF;

 INSERT INTO public.allocation_overrides (participant_id, randomization_id, previous_group, new_group, reason, overridden_by)
 VALUES (p_id, r.id, p.study_group, p_new_group, v_reason, p_actor) RETURNING * INTO o;

 UPDATE public.participants SET study_group = p_new_group,
   lifecycle_stage = CASE WHEN lifecycle_stage IN ('randomized_control','randomized_intervention')
     THEN CASE WHEN p_new_group = 'control' THEN 'randomized_control' ELSE 'randomized_intervention' END ELSE lifecycle_stage END
 WHERE id = p_id;

 INSERT INTO public.audit_events (actor_id, entity_type, entity_id, action, metadata)
 VALUES (p_actor, 'participant', p_id, 'randomisation_override', jsonb_build_object(
   'override_id', o.id, 'randomization_id', r.id, 'participant_code', p.participant_code,
   'original_allocation', r.study_group, 'previous_allocation', o.previous_group,
   'new_allocation', o.new_group, 'reason', o.reason, 'overridden_at', o.overridden_at,
   'via', 'admins_access', 'admin_login', p_admin_login, 'protocol_reviewed', true));
 RETURN o;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_correct_participant_allocation(uuid, study_group, study_group, text, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_correct_participant_allocation(uuid, study_group, study_group, text, uuid, text) TO service_role;