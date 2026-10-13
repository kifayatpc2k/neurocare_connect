CREATE OR REPLACE FUNCTION public.lock_test_record_flag()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  -- A record may be reclassified from test to normal, never the reverse.
  IF NEW.is_test_record IS DISTINCT FROM OLD.is_test_record
     AND NOT (OLD.is_test_record = true AND NEW.is_test_record = false) THEN
    RAISE EXCEPTION 'The test-record marker can only be cleared, not set after registration.';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.lock_test_record_flag() FROM PUBLIC, anon, authenticated;