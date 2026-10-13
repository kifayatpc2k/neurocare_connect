-- Database-level guard for the screening -> consent -> enrolment sequence.
-- Mirrors the application rules so no client or server path can bypass them.
create or replace function public.enforce_participant_enrolment_rules()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  -- Allowed vocabularies
  if new.eligibility_status not in ('pending','eligible','not_eligible') then
    raise exception 'Invalid eligibility status: %', new.eligibility_status;
  end if;
  if new.consent_status not in ('pending','obtained','not_obtained') then
    raise exception 'Invalid consent status: %', new.consent_status;
  end if;

  -- Consent may only be recorded for eligible participants
  if new.consent_status <> 'pending' and new.eligibility_status <> 'eligible' then
    raise exception 'Consent can only be recorded for an eligible participant.';
  end if;

  -- Obtained consent requires confirmation and a date
  if new.consent_status = 'obtained' then
    if not new.consent_confirmed then
      raise exception 'Consent cannot be marked obtained without the consent confirmation.';
    end if;
    if new.consent_date is null then
      raise exception 'Consent cannot be marked obtained without a consent date.';
    end if;
  end if;

  -- Enrolment prerequisites
  if new.enrolment_confirmed then
    if new.eligibility_status <> 'eligible' then
      raise exception 'Enrollment blocked: participant is not eligible.';
    end if;
    if new.consent_status <> 'obtained' then
      raise exception 'Enrollment blocked: informed consent has not been obtained.';
    end if;
    if not new.consent_confirmed then
      raise exception 'Enrollment blocked: consent confirmation is required.';
    end if;
    if new.enrolled_at is null then
      raise exception 'Enrollment blocked: an enrollment date is required.';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    -- Enrolment is permanent once confirmed
    if old.enrolment_confirmed and not new.enrolment_confirmed then
      raise exception 'Enrollment cannot be undone once confirmed.';
    end if;
    -- Later stages require enrolment
    if new.baseline_completed_at is not null and not new.enrolment_confirmed then
      raise exception 'Baseline cannot be completed before enrollment.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists participants_enforce_enrolment on public.participants;
create trigger participants_enforce_enrolment
before insert or update on public.participants
for each row execute function public.enforce_participant_enrolment_rules();