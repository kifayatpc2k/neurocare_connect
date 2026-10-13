-- Lifecycle tracking fields for the participant workflow
ALTER TABLE public.participants
  ADD COLUMN IF NOT EXISTS lifecycle_stage text NOT NULL DEFAULT 'screening',
  ADD COLUMN IF NOT EXISTS screening_date date,
  ADD COLUMN IF NOT EXISTS eligibility_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS inclusion_criteria_met boolean,
  ADD COLUMN IF NOT EXISTS exclusion_criteria_present boolean,
  ADD COLUMN IF NOT EXISTS screening_notes text,
  ADD COLUMN IF NOT EXISTS consent_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS consent_date date,
  ADD COLUMN IF NOT EXISTS consent_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_notes text,
  ADD COLUMN IF NOT EXISTS enrolment_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS enrolment_notes text,
  ADD COLUMN IF NOT EXISTS baseline_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS randomized_at timestamptz,
  ADD COLUMN IF NOT EXISTS day_15_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS day_30_completed_at timestamptz;

CREATE INDEX IF NOT EXISTS participants_lifecycle_stage_idx ON public.participants (lifecycle_stage);
