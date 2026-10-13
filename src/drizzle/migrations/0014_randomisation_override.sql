-- Fine-grained permissions, kept separate from roles. Granted only by administrators via the backend.
CREATE TABLE public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  permission text NOT NULL CHECK (permission IN ('randomisation_override')),
  granted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, permission)
);
GRANT SELECT ON public.user_permissions TO authenticated;
GRANT ALL ON public.user_permissions TO service_role;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_permissions_select_own" ON public.user_permissions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Answers only for the calling user, like has_role.
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select _user_id is not null and _user_id = auth.uid()
     and exists (select 1 from public.user_permissions where user_id = _user_id and permission = _permission)
$$;
REVOKE EXECUTE ON FUNCTION public.has_permission(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated;

-- Immutable allocation override history. The original randomisation row is never touched.
CREATE TABLE public.allocation_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES public.participants(id) ON DELETE RESTRICT,
  randomization_id uuid NOT NULL REFERENCES public.randomizations(id) ON DELETE RESTRICT,
  previous_group public.study_group NOT NULL,
  new_group public.study_group NOT NULL,
  reason text NOT NULL CHECK (length(btrim(reason)) > 0),
  overridden_by uuid NOT NULL,
  overridden_at timestamptz NOT NULL DEFAULT now(),
  CHECK (previous_group <> new_group)
);
CREATE INDEX allocation_overrides_participant_idx ON public.allocation_overrides (participant_id, overridden_at);
GRANT SELECT ON public.allocation_overrides TO authenticated;
GRANT ALL ON public.allocation_overrides TO service_role;
ALTER TABLE public.allocation_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allocation_overrides_staff_select" ON public.allocation_overrides FOR SELECT TO authenticated USING (public.is_research_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.prevent_override_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  RAISE EXCEPTION 'Allocation override history is permanent and cannot be modified.';
END;
$$;
REVOKE EXECUTE ON FUNCTION public.prevent_override_change() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER allocation_overrides_immutable BEFORE UPDATE OR DELETE ON public.allocation_overrides
  FOR EACH ROW EXECUTE FUNCTION public.prevent_override_change();

-- Allocation lock: a group change is only allowed when a matching override row
-- was written in the same transaction (only possible through override_participant_allocation).
CREATE OR REPLACE FUNCTION public.prevent_allocation_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
begin
  if old.study_group is not null and new.study_group is distinct from old.study_group then
    if not exists (
      select 1 from public.allocation_overrides o
      where o.participant_id = old.id and o.previous_group = old.study_group
        and o.new_group = new.study_group and o.overridden_at = now()
    ) then
      raise exception 'Study group allocation is permanent and cannot be changed.';
    end if;
  end if;
  if old.randomized_at is not null and new.randomized_at is distinct from old.randomized_at then
    raise exception 'Randomisation timestamp cannot be changed.';
  end if;
  return new;
end;
$$;

CREATE OR REPLACE FUNCTION public.override_participant_allocation(p_id uuid, p_new_group public.study_group, p_reason text)
RETURNS public.allocation_overrides LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.participants%ROWTYPE; r public.randomizations%ROWTYPE; o public.allocation_overrides%ROWTYPE; v_reason text := btrim(coalesce(p_reason, ''));
BEGIN
 IF NOT public.is_research_staff(auth.uid()) OR NOT public.has_permission(auth.uid(), 'randomisation_override') THEN
   RAISE EXCEPTION 'Randomisation override permission required.';
 END IF;
 IF v_reason = '' THEN RAISE EXCEPTION 'A reason for the allocation change is required.'; END IF;
 IF p_new_group IS NULL THEN RAISE EXCEPTION 'Select the new allocation.'; END IF;
 SELECT * INTO p FROM public.participants WHERE id = p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Participant not found.'; END IF;
 SELECT * INTO r FROM public.randomizations WHERE participant_id = p_id;
 IF NOT FOUND OR p.randomized_at IS NULL OR p.study_group IS NULL THEN RAISE EXCEPTION 'This participant has not been randomised.'; END IF;
 IF p.study_group = p_new_group THEN RAISE EXCEPTION 'The new allocation must differ from the current allocation.'; END IF;
 IF p.status = 'withdrawn' THEN RAISE EXCEPTION 'Allocation cannot be changed for a withdrawn participant.'; END IF;

 INSERT INTO public.allocation_overrides (participant_id, randomization_id, previous_group, new_group, reason, overridden_by)
 VALUES (p_id, r.id, p.study_group, p_new_group, v_reason, auth.uid())
 RETURNING * INTO o;

 UPDATE public.participants
 SET study_group = p_new_group,
     lifecycle_stage = CASE WHEN lifecycle_stage IN ('randomized_control','randomized_intervention')
                            THEN CASE WHEN p_new_group = 'control' THEN 'randomized_control' ELSE 'randomized_intervention' END
                            ELSE lifecycle_stage END
 WHERE id = p_id;

 INSERT INTO public.audit_events (actor_id, entity_type, entity_id, action, metadata)
 VALUES (auth.uid(), 'participant', p_id, 'randomisation_override', jsonb_build_object(
   'override_id', o.id, 'randomization_id', r.id, 'participant_code', p.participant_code,
   'original_allocation', r.study_group, 'previous_allocation', o.previous_group,
   'new_allocation', o.new_group, 'reason', o.reason, 'overridden_at', o.overridden_at));

 RETURN o;
END;
$$;
REVOKE ALL ON FUNCTION public.override_participant_allocation(uuid, public.study_group, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.override_participant_allocation(uuid, public.study_group, text) TO authenticated;