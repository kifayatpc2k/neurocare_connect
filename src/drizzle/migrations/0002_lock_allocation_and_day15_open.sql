ALTER TABLE public.participants ADD COLUMN IF NOT EXISTS day_15_opened_at timestamptz;

UPDATE public.participants SET day_15_opened_at = day_15_completed_at
  WHERE day_15_completed_at IS NOT NULL AND day_15_opened_at IS NULL;

CREATE OR REPLACE FUNCTION public.prevent_allocation_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
begin
  if old.study_group is not null and new.study_group is distinct from old.study_group then
    raise exception 'Study group allocation is permanent and cannot be changed.';
  end if;
  if old.randomized_at is not null and new.randomized_at is distinct from old.randomized_at then
    raise exception 'Randomisation timestamp cannot be changed.';
  end if;
  return new;
end;
$$;

DROP TRIGGER IF EXISTS participants_lock_allocation ON public.participants;
CREATE TRIGGER participants_lock_allocation BEFORE UPDATE ON public.participants
  FOR EACH ROW EXECUTE FUNCTION public.prevent_allocation_change();

CREATE OR REPLACE FUNCTION public.prevent_randomization_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
begin
  raise exception 'Randomisation records are permanent and cannot be modified.';
end;
$$;

DROP TRIGGER IF EXISTS randomizations_immutable ON public.randomizations;
CREATE TRIGGER randomizations_immutable BEFORE UPDATE ON public.randomizations
  FOR EACH ROW EXECUTE FUNCTION public.prevent_randomization_change();
