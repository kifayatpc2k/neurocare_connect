CREATE OR REPLACE FUNCTION public.enforce_study_record()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_participant public.participants%ROWTYPE;
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
   IF NEW.instrument IN ('DN4','NEPIQoL') AND NEW.status = 'completed' THEN RAISE EXCEPTION 'The approved questionnaire content must be configured before completion.'; END IF;
 END IF;
 IF TG_TABLE_NAME = 'dn4_assessments' THEN
   IF NEW.total_score IS NOT NULL THEN RAISE EXCEPTION 'Approved DN4 scoring content must be configured first.'; END IF;
 END IF;
 IF TG_TABLE_NAME IN ('drps','drug_interactions','counselling_sessions','follow_ups') THEN
   IF NEW.milestone IS NOT NULL AND NOT public.study_visit_available(NEW.participant_id, NEW.milestone) THEN RAISE EXCEPTION 'This visit is not open for documentation.'; END IF;
 END IF;
 RETURN NEW;
END;
$$;