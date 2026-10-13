-- Single DN4 source of truth: assessments table.
COMMENT ON TABLE public.dn4_assessments IS 'DEPRECATED: DN4 now lives in public.assessments';

-- PCNE V9.1 structure on DRPs (multiple causes/interventions permitted).
COMMENT ON COLUMN public.drps.pcne_cause_code IS 'DEPRECATED: replaced by pcne_cause_codes';
COMMENT ON COLUMN public.drps.pcne_intervention_code IS 'DEPRECATED: replaced by pcne_intervention_codes';
ALTER TABLE public.drps ADD COLUMN pcne_version text NOT NULL DEFAULT 'V9.1';
ALTER TABLE public.drps ADD COLUMN problem_type text CHECK (problem_type IN ('potential','manifest'));
ALTER TABLE public.drps ADD COLUMN pcne_cause_codes text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.drps ADD COLUMN pcne_intervention_codes text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.drps ADD COLUMN pcne_acceptance_code text;

-- Server-side scoring. DN4 India/English 07 Jul 14: YES=1, NO=0, total 0-10.
CREATE OR REPLACE FUNCTION public.score_dn4(p_items jsonb)
RETURNS integer LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE i int; v jsonb; total int := 0;
BEGIN
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) <> 10 THEN RAISE EXCEPTION 'DN4 requires exactly 10 answered items.'; END IF;
  FOR i IN 0..9 LOOP
    v := p_items->i;
    IF jsonb_typeof(v) <> 'boolean' THEN RAISE EXCEPTION 'DN4 item % must be answered Yes or No.', i+1; END IF;
    IF v = 'true'::jsonb THEN total := total + 1; END IF;
  END LOOP;
  RETURN total;
END;
$$;

-- NePIQoL: items stored as selected option position 1..5 (1 = first listed option).
-- Normal scoring 5..1 (first option = 5); items 12, 15, 33, 34 reverse scored.
CREATE OR REPLACE FUNCTION public.score_nepiqol(p_items jsonb)
RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE i int; pos int; s int; scores int[] := '{}'; total int := 0;
  rev int[] := ARRAY[12,15,33,34];
  sub jsonb := '{"symptoms":[1,2,3,5,6,7,8,38],"relationships":[10,11,12,13,24],"psychological":[4,28,29,30,32,33,34,35],"social_activity":[14,15,16,23,25,26,27,31],"physical":[9,17,18,19,20,21,22],"personal":[36,37,39,40,41,42]}';
  k text; arr jsonb; n jsonb; acc int; result jsonb := '{}';
BEGIN
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) <> 42 THEN RAISE EXCEPTION 'NePIQoL requires exactly 42 answered items.'; END IF;
  FOR i IN 1..42 LOOP
    IF jsonb_typeof(p_items->(i-1)) <> 'number' OR (p_items->>(i-1)) !~ '^[1-5]$' THEN RAISE EXCEPTION 'NePIQoL item % must have one response selected.', i; END IF;
    pos := (p_items->>(i-1))::int;
    s := CASE WHEN i = ANY(rev) THEN pos ELSE 6 - pos END;
    scores := scores || s; total := total + s;
  END LOOP;
  FOR k, arr IN SELECT * FROM jsonb_each(sub) LOOP
    acc := 0;
    FOR n IN SELECT * FROM jsonb_array_elements(arr) LOOP acc := acc + scores[(n#>>'{}')::int]; END LOOP;
    result := result || jsonb_build_object(k, acc);
  END LOOP;
  RETURN jsonb_build_object('total', total, 'subscales', result, 'item_scores', to_jsonb(scores));
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_study_record()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_participant public.participants%ROWTYPE; v_score jsonb;
BEGIN
 SELECT * INTO v_participant FROM public.participants WHERE id = NEW.participant_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Participant not found.'; END IF;
 IF NOT v_participant.enrolment_confirmed THEN RAISE EXCEPTION 'Enroll the participant before recording study data.'; END IF;
 IF TG_TABLE_NAME IN ('counselling_sessions','physician_recommendations') AND v_participant.study_group IS DISTINCT FROM 'intervention' THEN RAISE EXCEPTION 'Intervention records are only permitted for intervention participants.'; END IF;
 IF TG_TABLE_NAME = 'physician_recommendations' THEN
   IF NOT EXISTS (SELECT 1 FROM public.drps WHERE id=NEW.drp_id AND participant_id=NEW.participant_id) THEN RAISE EXCEPTION 'The recommendation must refer to this participant’s DRP.'; END IF;
 END IF;
 IF TG_TABLE_NAME = 'assessments' THEN
   IF NEW.instrument NOT IN ('NRS','NEPIQoL','DN4') THEN RAISE EXCEPTION 'Unrecognised instrument.'; END IF;
   IF NOT public.study_visit_available(NEW.participant_id, NEW.milestone) THEN RAISE EXCEPTION 'This visit is not open for assessment.'; END IF;
   IF NEW.instrument = 'NRS' AND (NEW.responses->>'score' IS NULL OR (NEW.responses->>'score') !~ '^(10|[0-9])$') THEN RAISE EXCEPTION 'NRS must be a whole number from 0 to 10.'; END IF;
   IF NEW.instrument = 'DN4' THEN
     IF NEW.milestone <> 'baseline' THEN RAISE EXCEPTION 'DN4 is recorded at baseline only.'; END IF;
     NEW.responses := jsonb_build_object('version','DN4 India/English 07 Jul 14','items',NEW.responses->'items','total',public.score_dn4(NEW.responses->'items'));
   END IF;
   IF NEW.instrument = 'NEPIQoL' THEN
     v_score := public.score_nepiqol(NEW.responses->'items');
     NEW.responses := jsonb_build_object('version','NePIQoL 42-item','items',NEW.responses->'items') || v_score;
   END IF;
 END IF;
 IF TG_TABLE_NAME IN ('drps','drug_interactions','counselling_sessions','follow_ups') THEN
   IF NEW.milestone IS NOT NULL AND NOT public.study_visit_available(NEW.participant_id, NEW.milestone) THEN RAISE EXCEPTION 'This visit is not open for documentation.'; END IF;
 END IF;
 RETURN NEW;
END;
$$;