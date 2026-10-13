ALTER TABLE public.medication_changes
  ADD COLUMN IF NOT EXISTS previous_regimen text,
  ADD COLUMN IF NOT EXISTS new_regimen text,
  ADD COLUMN IF NOT EXISTS frequency_change text,
  ADD COLUMN IF NOT EXISTS route_change text,
  ADD COLUMN IF NOT EXISTS modification_details text,
  ADD COLUMN IF NOT EXISTS change_period text,
  ADD COLUMN IF NOT EXISTS researcher_notes text,
  ADD COLUMN IF NOT EXISTS additional_details text;