-- Completed assessments stay undeletable, except inside the operator-only QA cleanup below,
-- and then only for synthetic (is_test_record) participants.
CREATE OR REPLACE FUNCTION public.lock_completed_assessment()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF TG_OP = 'DELETE'
    AND coalesce(current_setting('app.qa_cleanup_batch', true), '') <> ''
    AND EXISTS (SELECT 1 FROM public.participants WHERE id = OLD.participant_id AND is_test_record) THEN
   RETURN OLD;
 END IF;
 IF OLD.status='completed' THEN RAISE EXCEPTION 'Completed visit assessments cannot be altered or deleted.'; END IF;
 IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.qa_cleanup_synthetic_batch(p_batch text, p_execute boolean DEFAULT false, p_confirm text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE ids uuid[]; n int; counts jsonb; expected text;
BEGIN
 IF p_batch IS NULL OR p_batch !~ '^NCC-QA-[A-Z0-9-]+$' THEN RAISE EXCEPTION 'Invalid QA batch identifier.'; END IF;
 SELECT coalesce(array_agg(id), '{}') INTO ids FROM public.participants
  WHERE is_test_record = true AND notes LIKE '%SYNTHETIC_QA | batch ' || p_batch || '%';
 n := cardinality(ids);
 counts := jsonb_build_object(
  'participants', n,
  'demographics', (SELECT count(*) FROM demographics WHERE participant_id = ANY(ids)),
  'clinical_data', (SELECT count(*) FROM clinical_data WHERE participant_id = ANY(ids)),
  'medications', (SELECT count(*) FROM medications WHERE participant_id = ANY(ids)),
  'laboratory_investigations', (SELECT count(*) FROM laboratory_investigations WHERE participant_id = ANY(ids)),
  'drug_interactions', (SELECT count(*) FROM drug_interactions WHERE participant_id = ANY(ids)),
  'drps', (SELECT count(*) FROM drps WHERE participant_id = ANY(ids)),
  'drp_visit_outcomes', (SELECT count(*) FROM drp_visit_outcomes WHERE participant_id = ANY(ids)),
  'physician_recommendations', (SELECT count(*) FROM physician_recommendations WHERE participant_id = ANY(ids)),
  'counselling_sessions', (SELECT count(*) FROM counselling_sessions WHERE participant_id = ANY(ids)),
  'adr_reports', (SELECT count(*) FROM adr_reports WHERE participant_id = ANY(ids)),
  'medication_changes', (SELECT count(*) FROM medication_changes WHERE participant_id = ANY(ids)),
  'follow_ups', (SELECT count(*) FROM follow_ups WHERE participant_id = ANY(ids)),
  'assessments', (SELECT count(*) FROM assessments WHERE participant_id = ANY(ids)),
  'dn4_assessments', (SELECT count(*) FROM dn4_assessments WHERE participant_id = ANY(ids)),
  'participant_milestones', (SELECT count(*) FROM participant_milestones WHERE participant_id = ANY(ids)),
  'randomizations', (SELECT count(*) FROM randomizations WHERE participant_id = ANY(ids)),
  'allocation_overrides', (SELECT count(*) FROM allocation_overrides WHERE participant_id = ANY(ids)));
 expected := 'DELETE ' || p_batch || ' (' || n || ' participants)';
 IF NOT p_execute THEN
   RETURN jsonb_build_object('mode','dry_run','batch',p_batch,'confirmation_required',expected,'counts',counts);
 END IF;
 IF p_confirm IS DISTINCT FROM expected THEN RAISE EXCEPTION 'Confirmation text does not match. Expected: %', expected; END IF;
 IF (counts->>'allocation_overrides')::int > 0 THEN RAISE EXCEPTION 'Batch has immutable allocation overrides; cleanup refused.'; END IF;
 PERFORM set_config('app.qa_cleanup_batch', p_batch, true);
 DELETE FROM public.participants WHERE id = ANY(ids) AND is_test_record = true;
 INSERT INTO public.audit_events(actor_id, entity_type, entity_id, action, metadata)
 VALUES (NULL, 'qa_batch', NULL, 'synthetic_qa_cleanup', jsonb_build_object('batch', p_batch, 'deleted', counts));
 RETURN jsonb_build_object('mode','executed','batch',p_batch,'counts',counts);
END; $$;

REVOKE ALL ON FUNCTION public.qa_cleanup_synthetic_batch(text, boolean, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.qa_cleanup_synthetic_batch(text, boolean, text) TO service_role;