ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS is_test_record boolean NOT NULL DEFAULT false;
COMMENT ON COLUMN public.participants.is_test_record IS 'TEST DATA — NOT A REAL PARTICIPANT. Set only at registration; excluded from analytics and the study export.';
CREATE INDEX IF NOT EXISTS participants_is_test_record_idx ON public.participants (is_test_record);

CREATE OR REPLACE FUNCTION public.lock_test_record_flag()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.is_test_record IS DISTINCT FROM OLD.is_test_record THEN
    RAISE EXCEPTION 'The test-record marker is set at registration and cannot be changed.';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.lock_test_record_flag() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS participants_lock_test_flag ON public.participants;
CREATE TRIGGER participants_lock_test_flag BEFORE UPDATE ON public.participants
  FOR EACH ROW EXECUTE FUNCTION public.lock_test_record_flag();