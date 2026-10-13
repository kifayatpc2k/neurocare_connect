CREATE OR REPLACE FUNCTION public.correct_participant_allocation(p_id uuid, p_expected_group public.study_group, p_new_group public.study_group, p_reason text)
RETURNS public.allocation_overrides
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE cur public.study_group;
BEGIN
  IF NOT public.is_research_staff(auth.uid()) OR NOT public.has_permission(auth.uid(), 'randomisation_override') THEN
    RAISE EXCEPTION 'Randomisation override permission required.';
  END IF;
  SELECT study_group INTO cur FROM public.participants WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Participant not found.'; END IF;
  IF p_expected_group IS NULL OR cur IS DISTINCT FROM p_expected_group THEN
    RAISE EXCEPTION 'The allocation has changed since you reviewed it. Reload and review again.';
  END IF;
  RETURN public.override_participant_allocation(p_id, p_new_group, p_reason);
END;
$$;
REVOKE ALL ON FUNCTION public.correct_participant_allocation(uuid, public.study_group, public.study_group, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.correct_participant_allocation(uuid, public.study_group, public.study_group, text) TO authenticated;