-- Existing assessments carry one row per instrument and visit.
ALTER TABLE public.drug_interactions ADD COLUMN IF NOT EXISTS documented_by uuid REFERENCES public.profiles(id);
ALTER TABLE public.drug_interactions ADD COLUMN IF NOT EXISTS documentation_notes text;
ALTER TABLE public.drug_interactions ADD COLUMN IF NOT EXISTS milestone public.study_milestone;
ALTER TABLE public.drps ADD COLUMN IF NOT EXISTS resolution_notes text;
ALTER TABLE public.drps ADD COLUMN IF NOT EXISTS resolved_by uuid REFERENCES public.profiles(id);
ALTER TABLE public.counselling_sessions ADD COLUMN IF NOT EXISTS checklist jsonb NOT NULL DEFAULT '{}'::jsonb;
CREATE SEQUENCE IF NOT EXISTS public.study_allocation_sequence;
GRANT USAGE ON SEQUENCE public.study_allocation_sequence TO service_role;

-- Validate a visit against persisted study state; use the same guard for every visit-owned row.
CREATE OR REPLACE FUNCTION public.study_visit_available(p_id uuid, p_visit public.study_milestone)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT CASE p_visit
   WHEN 'baseline' THEN p.enrolment_confirmed AND p.baseline_completed_at IS NULL
   WHEN 'day_15' THEN p.randomized_at IS NOT NULL AND p.day_15_opened_at IS NOT NULL AND p.day_15_completed_at IS NULL
   WHEN 'day_30' THEN p.day_15_completed_at IS NOT NULL AND p.day_30_completed_at IS NULL
   ELSE false END
 FROM public.participants p WHERE p.id = p_id
$$;

CREATE OR REPLACE FUNCTION public.enforce_study_record()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v_participant public.participants%ROWTYPE;
BEGIN
 SELECT * INTO v_participant FROM public.participants WHERE id = NEW.participant_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Participant not found.'; END IF;
 IF NOT v_participant.enrolment_confirmed THEN RAISE EXCEPTION 'Enroll the participant before recording study data.'; END IF;
 IF TG_TABLE_NAME IN ('counselling_sessions','physician_recommendations') AND v_participant.study_group IS DISTINCT FROM 'intervention' THEN
   RAISE EXCEPTION 'Intervention records are only permitted for intervention participants.';
 END IF;
 IF TG_TABLE_NAME = 'assessments' THEN
   IF NEW.instrument NOT IN ('NRS','NEPIQoL','DN4') THEN RAISE EXCEPTION 'Unrecognised instrument.'; END IF;
   IF NOT public.study_visit_available(NEW.participant_id, NEW.milestone) THEN RAISE EXCEPTION 'This visit is not open for assessment.'; END IF;
   IF NEW.instrument = 'NRS' AND (NEW.responses->>'score' IS NULL OR (NEW.responses->>'score') !~ '^(10|[0-9])$') THEN
     RAISE EXCEPTION 'NRS must be a whole number from 0 to 10.';
   END IF;
   IF NEW.instrument IN ('DN4','NEPIQoL') AND NEW.status = 'completed' THEN
     RAISE EXCEPTION 'The approved questionnaire content must be configured before completion.';
   END IF;
 END IF;
 IF TG_TABLE_NAME = 'drps' AND NEW.milestone IS NOT NULL AND NOT public.study_visit_available(NEW.participant_id, NEW.milestone) THEN
   RAISE EXCEPTION 'This visit is not open for DRP documentation.';
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER assessments_study_guard BEFORE INSERT OR UPDATE ON public.assessments FOR EACH ROW EXECUTE FUNCTION public.enforce_study_record();
CREATE TRIGGER demographics_study_guard BEFORE INSERT OR UPDATE ON public.demographics FOR EACH ROW EXECUTE FUNCTION public.enforce_study_record();
CREATE TRIGGER clinical_data_study_guard BEFORE INSERT OR UPDATE ON public.clinical_data FOR EACH ROW EXECUTE FUNCTION public.enforce_study_record();
CREATE TRIGGER medications_study_guard BEFORE INSERT OR UPDATE ON public.medications FOR EACH ROW EXECUTE FUNCTION public.enforce_study_record();
CREATE TRIGGER interactions_study_guard BEFORE INSERT OR UPDATE ON public.drug_interactions FOR EACH ROW EXECUTE FUNCTION public.enforce_study_record();
CREATE TRIGGER drps_study_guard BEFORE INSERT OR UPDATE ON public.drps FOR EACH ROW EXECUTE FUNCTION public.enforce_study_record();
CREATE TRIGGER counselling_study_guard BEFORE INSERT OR UPDATE ON public.counselling_sessions FOR EACH ROW EXECUTE FUNCTION public.enforce_study_record();
CREATE TRIGGER recommendations_study_guard BEFORE INSERT OR UPDATE ON public.physician_recommendations FOR EACH ROW EXECUTE FUNCTION public.enforce_study_record();

-- Freeze milestones once complete; the approved instruments are prerequisites for baseline/follow-ups.
CREATE OR REPLACE FUNCTION public.enforce_study_stage()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v text;
BEGIN
 IF OLD.baseline_completed_at IS NOT NULL AND NEW.baseline_completed_at IS DISTINCT FROM OLD.baseline_completed_at THEN RAISE EXCEPTION 'Baseline completion is permanent.'; END IF;
 IF OLD.day_15_opened_at IS NOT NULL AND NEW.day_15_opened_at IS DISTINCT FROM OLD.day_15_opened_at THEN RAISE EXCEPTION 'Day 15 opening is permanent.'; END IF;
 IF OLD.day_15_completed_at IS NOT NULL AND NEW.day_15_completed_at IS DISTINCT FROM OLD.day_15_completed_at THEN RAISE EXCEPTION 'Day 15 completion is permanent.'; END IF;
 IF OLD.day_30_completed_at IS NOT NULL AND NEW.day_30_completed_at IS DISTINCT FROM OLD.day_30_completed_at THEN RAISE EXCEPTION 'Day 30 completion is permanent.'; END IF;
 IF OLD.baseline_completed_at IS NULL AND NEW.baseline_completed_at IS NOT NULL THEN
   IF NOT OLD.enrolment_confirmed THEN RAISE EXCEPTION 'Enroll the participant before baseline.'; END IF;
   FOREACH v IN ARRAY ARRAY['NRS','DN4','NEPIQoL'] LOOP
     IF NOT EXISTS (SELECT 1 FROM public.assessments a WHERE a.participant_id=OLD.id AND a.milestone='baseline' AND a.instrument=v AND a.status='completed') THEN
       RAISE EXCEPTION 'Baseline requires a completed % assessment.', v;
     END IF;
   END LOOP;
   IF NOT EXISTS (SELECT 1 FROM public.demographics WHERE participant_id=OLD.id) OR NOT EXISTS (SELECT 1 FROM public.clinical_data WHERE participant_id=OLD.id) THEN
     RAISE EXCEPTION 'Baseline requires saved demographics and clinical data.';
   END IF;
 END IF;
 IF OLD.day_15_opened_at IS NULL AND NEW.day_15_opened_at IS NOT NULL AND OLD.randomized_at IS NULL THEN RAISE EXCEPTION 'Randomise before opening Day 15.'; END IF;
 IF OLD.day_15_completed_at IS NULL AND NEW.day_15_completed_at IS NOT NULL THEN
   IF OLD.day_15_opened_at IS NULL THEN RAISE EXCEPTION 'Open Day 15 before completing it.'; END IF;
   FOREACH v IN ARRAY ARRAY['NRS','NEPIQoL'] LOOP
     IF NOT EXISTS (SELECT 1 FROM public.assessments a WHERE a.participant_id=OLD.id AND a.milestone='day_15' AND a.instrument=v AND a.status='completed') THEN RAISE EXCEPTION 'Day 15 requires a completed % assessment.', v; END IF;
   END LOOP;
 END IF;
 IF OLD.day_30_completed_at IS NULL AND NEW.day_30_completed_at IS NOT NULL THEN
   IF OLD.day_15_completed_at IS NULL THEN RAISE EXCEPTION 'Complete Day 15 before Day 30.'; END IF;
   FOREACH v IN ARRAY ARRAY['NRS','NEPIQoL'] LOOP
     IF NOT EXISTS (SELECT 1 FROM public.assessments a WHERE a.participant_id=OLD.id AND a.milestone='day_30' AND a.instrument=v AND a.status='completed') THEN RAISE EXCEPTION 'Day 30 requires a completed % assessment.', v; END IF;
   END LOOP;
 END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER participants_study_stage BEFORE UPDATE ON public.participants FOR EACH ROW EXECUTE FUNCTION public.enforce_study_stage();

-- Only this locked, server-validated operation may assign an arm.
CREATE OR REPLACE FUNCTION public.allocate_study_participant(p_id uuid)
RETURNS public.participants LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.participants%ROWTYPE; arm public.study_group; seq bigint;
BEGIN
 IF NOT public.is_research_staff(auth.uid()) THEN RAISE EXCEPTION 'Research staff access required.'; END IF;
 SELECT * INTO p FROM public.participants WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Participant not found.'; END IF;
 IF p.eligibility_status <> 'eligible' OR p.consent_status <> 'obtained' OR NOT p.consent_confirmed OR NOT p.enrolment_confirmed OR p.baseline_completed_at IS NULL THEN
   RAISE EXCEPTION 'Complete eligibility, consent, enrolment and baseline before randomisation.';
 END IF;
 IF p.study_group IS NOT NULL OR p.randomized_at IS NOT NULL OR EXISTS (SELECT 1 FROM public.randomizations WHERE participant_id=p_id) THEN
   RAISE EXCEPTION 'This participant is already permanently allocated.';
 END IF;
 arm := CASE WHEN (get_byte(decode(substr(replace(gen_random_uuid()::text,'-',''),1,2),'hex'),0) % 2)=0 THEN 'control'::public.study_group ELSE 'intervention'::public.study_group END;
 seq := nextval('public.study_allocation_sequence');
 INSERT INTO public.randomizations(participant_id,study_group,method,allocation_seq,assigned_by,assigned_at)
 VALUES (p_id,arm,'simple random 1:1 (computer-generated, CSPRNG)',seq,auth.uid(),now());
 UPDATE public.participants SET study_group=arm, randomized_at=now(), lifecycle_stage=CASE WHEN arm='control' THEN 'randomized_control' ELSE 'randomized_intervention' END WHERE id=p_id RETURNING * INTO p;
 RETURN p;
END;
$$;
REVOKE ALL ON FUNCTION public.allocate_study_participant(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.allocate_study_participant(uuid) TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.randomizations FROM authenticated;
