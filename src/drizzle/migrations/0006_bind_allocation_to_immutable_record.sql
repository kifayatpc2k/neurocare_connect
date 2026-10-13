CREATE OR REPLACE FUNCTION public.enforce_study_stage()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE v text;
BEGIN
 IF OLD.study_group IS NULL AND NEW.study_group IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.randomizations r WHERE r.participant_id=OLD.id AND r.study_group=NEW.study_group AND r.assigned_at=NEW.randomized_at) THEN RAISE EXCEPTION 'Group allocation must match the permanent randomisation record.'; END IF;
 IF OLD.baseline_completed_at IS NOT NULL AND NEW.baseline_completed_at IS DISTINCT FROM OLD.baseline_completed_at THEN RAISE EXCEPTION 'Baseline completion is permanent.'; END IF;
 IF OLD.day_15_opened_at IS NOT NULL AND NEW.day_15_opened_at IS DISTINCT FROM OLD.day_15_opened_at THEN RAISE EXCEPTION 'Day 15 opening is permanent.'; END IF;
 IF OLD.day_15_completed_at IS NOT NULL AND NEW.day_15_completed_at IS DISTINCT FROM OLD.day_15_completed_at THEN RAISE EXCEPTION 'Day 15 completion is permanent.'; END IF;
 IF OLD.day_30_completed_at IS NOT NULL AND NEW.day_30_completed_at IS DISTINCT FROM OLD.day_30_completed_at THEN RAISE EXCEPTION 'Day 30 completion is permanent.'; END IF;
 IF OLD.baseline_completed_at IS NULL AND NEW.baseline_completed_at IS NOT NULL THEN
   IF NOT OLD.enrolment_confirmed THEN RAISE EXCEPTION 'Enroll the participant before baseline.'; END IF;
   FOREACH v IN ARRAY ARRAY['NRS','DN4','NEPIQoL'] LOOP
     IF NOT EXISTS (SELECT 1 FROM public.assessments a WHERE a.participant_id=OLD.id AND a.milestone='baseline' AND a.instrument=v AND a.status='completed') THEN RAISE EXCEPTION 'Baseline requires a completed % assessment.', v; END IF;
   END LOOP;
   IF NOT EXISTS (SELECT 1 FROM public.demographics WHERE participant_id=OLD.id) OR NOT EXISTS (SELECT 1 FROM public.clinical_data WHERE participant_id=OLD.id) THEN RAISE EXCEPTION 'Baseline requires saved demographics and clinical data.'; END IF;
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
CREATE OR REPLACE FUNCTION public.allocate_study_participant(p_id uuid)
RETURNS public.participants LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p public.participants%ROWTYPE; arm public.study_group; seq bigint; assigned_time timestamptz;
BEGIN
 IF NOT public.is_research_staff(auth.uid()) THEN RAISE EXCEPTION 'Research staff access required.'; END IF;
 SELECT * INTO p FROM public.participants WHERE id=p_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Participant not found.'; END IF;
 IF p.eligibility_status <> 'eligible' OR p.consent_status <> 'obtained' OR NOT p.consent_confirmed OR NOT p.enrolment_confirmed OR p.baseline_completed_at IS NULL THEN RAISE EXCEPTION 'Complete eligibility, consent, enrolment and baseline before randomisation.'; END IF;
 IF p.study_group IS NOT NULL OR p.randomized_at IS NOT NULL OR EXISTS (SELECT 1 FROM public.randomizations WHERE participant_id=p_id) THEN RAISE EXCEPTION 'This participant is already permanently allocated.'; END IF;
 arm := CASE WHEN (get_byte(decode(substr(replace(gen_random_uuid()::text,'-',''),1,2),'hex'),0) % 2)=0 THEN 'control'::public.study_group ELSE 'intervention'::public.study_group END;
 seq := nextval('public.study_allocation_sequence'); assigned_time := clock_timestamp();
 INSERT INTO public.randomizations(participant_id,study_group,method,allocation_seq,assigned_by,assigned_at) VALUES (p_id,arm,'simple random 1:1 (computer-generated, CSPRNG)',seq,auth.uid(),assigned_time);
 UPDATE public.participants SET study_group=arm, randomized_at=assigned_time, lifecycle_stage=CASE WHEN arm='control' THEN 'randomized_control' ELSE 'randomized_intervention' END WHERE id=p_id RETURNING * INTO p;
 RETURN p;
END;
$$;