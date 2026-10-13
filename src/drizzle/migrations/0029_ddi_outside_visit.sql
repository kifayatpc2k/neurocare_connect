CREATE OR REPLACE FUNCTION public.enforce_study_record()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
     NEW.responses := jsonb_build_object('version','DN4 India/English 07 Jul 14','items',NEW.responses->'items','total',public.score_dn4(NEW.responses->'items'));
   END IF;
   IF NEW.instrument = 'NEPIQoL' THEN
     v_score := public.score_nepiqol(NEW.responses->'items');
     NEW.responses := jsonb_build_object('version','NePIQoL 42-item','items',NEW.responses->'items') || v_score;
   END IF;
 END IF;
 -- Drug interactions are researcher documentation: allowed at any time. A NULL milestone means
 -- "outside scheduled visit"; on update the visit link may not be changed silently.
 IF TG_TABLE_NAME = 'drug_interactions' THEN
   IF TG_OP = 'UPDATE' AND NEW.milestone IS DISTINCT FROM OLD.milestone THEN RAISE EXCEPTION 'An interaction keeps its original visit context when edited.'; END IF;
   IF TG_OP = 'UPDATE' AND NEW.participant_id IS DISTINCT FROM OLD.participant_id THEN RAISE EXCEPTION 'An interaction cannot be moved to another participant.'; END IF;
   IF TG_OP = 'INSERT' AND NEW.milestone IS NOT NULL AND NOT public.study_visit_available(NEW.participant_id, NEW.milestone) THEN RAISE EXCEPTION 'This visit is not open for documentation.'; END IF;
 END IF;
 IF TG_TABLE_NAME IN ('drps','counselling_sessions','follow_ups') THEN
   IF NEW.milestone IS NOT NULL AND NOT public.study_visit_available(NEW.participant_id, NEW.milestone) THEN RAISE EXCEPTION 'This visit is not open for documentation.'; END IF;
 END IF;
 RETURN NEW;
END;
$function$;
COMMENT ON COLUMN public.drug_interactions.milestone IS 'Visit the interaction was documented at; NULL = outside scheduled visit (not assigned to Baseline, Day 15 or Day 30).';