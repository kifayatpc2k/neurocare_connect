CREATE OR REPLACE FUNCTION public.validate_drp_pcne_codes()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.pcne_problem_code IS NOT NULL AND NOT (NEW.pcne_problem_code = ANY(ARRAY['P1.1','P1.2','P1.3','P2.1','P3.1','P3.2'])) THEN RAISE EXCEPTION 'Invalid PCNE V9.1 problem code: %', NEW.pcne_problem_code; END IF;
  IF NEW.pcne_cause_codes IS NOT NULL AND NOT (NEW.pcne_cause_codes <@ ARRAY['C1.1','C1.2','C1.3','C1.4','C1.5','C1.6','C2.1','C3.1','C3.2','C3.3','C3.4','C3.5','C4.1','C4.2','C5.1','C5.2','C5.3','C5.4','C6.1','C6.2','C6.3','C6.4','C6.5','C6.6','C7.1','C7.2','C7.3','C7.4','C7.5','C7.6','C7.7','C7.8','C7.9','C7.10','C8.1','C9.1','C9.2','C9.3']) THEN RAISE EXCEPTION 'Invalid PCNE V9.1 cause code'; END IF;
  IF NEW.pcne_intervention_codes IS NOT NULL AND NOT (NEW.pcne_intervention_codes <@ ARRAY['I0.1','I1.1','I1.2','I1.3','I1.4','I2.1','I2.2','I2.3','I2.4','I3.1','I3.2','I3.3','I3.4','I3.5','I3.6','I4.1','I4.2']) THEN RAISE EXCEPTION 'Invalid PCNE V9.1 intervention code'; END IF;
  IF NEW.pcne_acceptance_code IS NOT NULL AND NOT (NEW.pcne_acceptance_code = ANY(ARRAY['A1.1','A1.2','A1.3','A1.4','A2.1','A2.2','A2.3','A2.4','A3.1','A3.2'])) THEN RAISE EXCEPTION 'Invalid PCNE V9.1 acceptance code: %', NEW.pcne_acceptance_code; END IF;
  IF NEW.pcne_outcome_code IS NOT NULL AND NOT (NEW.pcne_outcome_code = ANY(ARRAY['O0.1','O1.1','O2.1','O3.1','O3.2','O3.3','O3.4'])) THEN RAISE EXCEPTION 'Invalid PCNE V9.1 outcome code: %', NEW.pcne_outcome_code; END IF;
  RETURN NEW;
END $$;
REVOKE EXECUTE ON FUNCTION public.validate_drp_pcne_codes() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS validate_drp_pcne_codes ON public.drps;
CREATE TRIGGER validate_drp_pcne_codes BEFORE INSERT OR UPDATE ON public.drps FOR EACH ROW EXECUTE FUNCTION public.validate_drp_pcne_codes();